// Fusion-X Audio – Hauptprozess
// Fenster, Tray-Symbol, Tastenkürzel, Autostart, Einstellungen und die Brücke zum Windows-Audio.

const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, nativeImage, protocol, net, shell, session, dialog, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const { RemoteServer } = require('./backend/remote');
const { installVbCable } = require('./backend/vbcable');
const { ObsClient } = require('./backend/obs');
const eqapo = require('./backend/eqapo');
const obs = new ObsClient();
// Community: Discord-Einladung und Webhook für „Problem melden“ (in package.json unter "fusionx")
const COMMUNITY = (() => { try { return require('./package.json').fusionx || {}; } catch (_) { return {}; } })();
let lastReportAt = 0;
async function sendReport(r) {
  const now = Date.now();
  if (now - lastReportAt < 60000) return { ok: false, error: 'Bitte warte eine Minute bis zur nächsten Meldung.' };
  const kinds = { bug: '🐞 Bug', question: '❓ Frage', idea: '💡 Idee' };
  const title = String(r.title || '').trim().slice(0, 80) || 'Ohne Titel';
  const body = [
    String(r.text || '').trim().slice(0, 1500) || '(keine Beschreibung)',
    '',
    '**Version:** ' + app.getVersion() + ' · ' + process.platform + ' ' + require('os').release(),
    r.contact ? '**Kontakt:** ' + String(r.contact).slice(0, 100) : '**Kontakt:** keiner angegeben'
  ].join('\n');
  const hook = COMMUNITY.reportWebhook;
  if (!hook) {
    // Ohne Discord-Webhook: E-Mail-Programm mit vorbereiteter Nachricht öffnen
    const mail = 'mailto:maxilama67@gmail.com?subject=' + encodeURIComponent('[Fusion-X ' + app.getVersion() + '] ' + (kinds[r.kind] || '') + ': ' + title) + '&body=' + encodeURIComponent(body.replace(/\*\*/g, '') + (r.diag ? '\n\n--- Technische Infos ---\n' + String(r.diag).slice(0, 1500) : ''));
    shell.openExternal(mail);
    return { ok: true, via: 'mail' };
  }
  try {
    const fd = new FormData();
    fd.append('payload_json', JSON.stringify({ thread_name: ((kinds[r.kind] || '') + ': ' + title).slice(0, 100), content: body.slice(0, 1990), username: 'Fusion-X Meldungen', allowed_mentions: { parse: [] } }));
    if (r.diag) fd.append('files[0]', new Blob([String(r.diag).slice(0, 200000)], { type: 'text/plain' }), 'diagnose.txt');
    const res = await fetch(hook + (hook.includes('?') ? '&' : '?') + 'wait=true', { method: 'POST', body: fd });
    if (!res.ok) { logLine('Meldung: HTTP ' + res.status); return { ok: false, error: 'Discord hat die Meldung abgelehnt (' + res.status + ').' }; }
    lastReportAt = now;
    return { ok: true, via: 'discord' };
  } catch (e) { return { ok: false, error: 'Keine Verbindung zu Discord: ' + e.message }; }
}
const helperLog = [];
const logLine = (m) => { helperLog.push(new Date().toISOString().slice(11, 19) + '  ' + String(m).trim()); if (helperLog.length > 60) helperLog.shift(); };

const IS_WIN = process.platform === 'win32';
const START_HIDDEN = process.argv.includes('--hidden');

// Renderer über ein eigenes, sicheres Protokoll laden (nötig für AudioWorklets und WebAssembly)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

// ------------------------------------------------------------------ Einstellungen
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
let settings = {};
function loadSettings() {
  try { settings = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch (_) { settings = {}; }
}
let saveTimer = null;
function saveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
      fs.writeFileSync(settingsFile() + '.tmp', JSON.stringify(settings, null, 2));
      fs.renameSync(settingsFile() + '.tmp', settingsFile());
    } catch (e) { console.error('Einstellungen nicht gespeichert:', e.message); }
  }, 250);
}

// ------------------------------------------------------------------ Audio-Backend
let backend = null;          // { call(cmd, args) }
let backendInfo = null;
let backendError = null;
let backendExe = null;

async function startBackend() {
  if (IS_WIN) {
    const { AudioHelper } = require('./backend/helper');
    const helper = new AudioHelper({
      appPath: app.getAppPath(),
      userDataPath: app.getPath('userData'),
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath
    });
    helper.on('log', (m) => { console.log('[helper]', m); logLine(m); });
    helper.on('key', (m) => send('fx:key', { vk: m.vk, down: !!m.down }));
    helper.on('restarted', () => send('fx:backend', { ok: true, info: helper.info }));
    helper.on('exit', () => send('fx:backend', { ok: false, error: 'Audio-Helfer wird neu gestartet …' }));
    try {
      backendInfo = await helper.start();
      backend = { call: (cmd, args) => helper.call(cmd, args), stop: () => helper.stop() };
      backendExe = helper.exe;
    } catch (e) {
      backendError = e.message;
      logLine('Start fehlgeschlagen: ' + e.message);
    }
  } else {
    const { MockAudio } = require('./renderer/mock.js');
    const mock = new MockAudio();
    backend = { call: async (cmd, args) => mock.call(cmd, args), stop() {} };
    backendInfo = mock.call('hello');
  }
}

// ------------------------------------------------------------------ Fenster
let win = null;
let tray = null;
let quitting = false;
let trayState = { muted: false, profile: null, profiles: [], ducking: false };
const remote = new RemoteServer();

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

// Windows 11 (ab 22H2): echtes Acryl-Glas hinter dem Fenster
function useAcrylic() {
  if (!IS_WIN || settings.windowGlass === false) return false;
  const build = +(require('os').release().split('.')[2] || 0);
  return build >= 22621;
}

function createWindow() {
  const acrylic = useAcrylic();
  win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 680,
    show: false,
    backgroundColor: acrylic ? '#00000000' : '#050911',
    backgroundMaterial: acrylic ? 'acrylic' : undefined,
    title: 'Fusion-X Audio',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: IS_WIN ? { color: acrylic ? 'rgba(0,0,0,0)' : '#050911', symbolColor: '#c8d6e4', height: 44 } : false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false   // Mikrofon-Bearbeitung läuft weiter, wenn das Fenster im Tray ist
    }
  });
  win.removeMenu();
  win.loadURL('app://fusionx/index.html');
  winVisible = !(START_HIDDEN || settings.startMinimized);
  win.once('ready-to-show', () => { if (winVisible) win.show(); });
  // Sichtbarkeit an die Oberfläche melden: im Tray wird nichts gezeichnet und seltener abgefragt
  const vis = () => { winVisible = win.isVisible() && !win.isMinimized(); send('fx:visible', winVisible); };
  ['show', 'hide', 'minimize', 'restore'].forEach((ev) => win.on(ev, vis));
  win.on('close', (e) => {
    if (!quitting && settings.closeToTray !== false) { e.preventDefault(); win.hide(); return; }
    quitting = true;
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

// ------------------------------------------------------------------ Bildschirm-Anzeige (über Spielen und Apps)
let osdWin = null, osdTimer = null, osdIdle = null;
let winVisible = true;
// Die Anzeige ist ein eigenes kleines Fenster. Nach 20 s ohne Einblendung wird es geschlossen, damit es keinen Speicher belegt.
function osdIdleClose() {
  clearTimeout(osdIdle);
  osdIdle = setTimeout(() => { if (osdWin && !osdWin.isDestroyed() && !osdWin.isVisible()) { osdWin.destroy(); osdWin = null; } }, 20000);
}
function ensureOsd() {
  if (osdWin && !osdWin.isDestroyed()) return osdWin;
  osdWin = new BrowserWindow({
    width: 420, height: 96, show: false, frame: false, transparent: true, resizable: false, movable: false,
    focusable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false, backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true }
  });
  osdWin.setAlwaysOnTop(true, 'screen-saver');
  osdWin.setIgnoreMouseEvents(true);
  osdWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  osdWin.loadURL('app://fusionx/osd.html');
  return osdWin;
}
function showOsd(data) {
  const w = ensureOsd();
  const { screen } = require('electron');
  const area = screen.getPrimaryDisplay().workArea;
  const pos = data.position === 'top' ? area.y + 24 : area.y + area.height - 96 - 40;
  w.setBounds({ x: Math.round(area.x + (area.width - 420) / 2), y: Math.round(pos), width: 420, height: 96 });
  const go = () => { w.webContents.send('fx:osd', data); w.showInactive(); };
  if (w.webContents.isLoading()) w.webContents.once('did-finish-load', go); else go();
  clearTimeout(osdTimer);
  clearTimeout(osdIdle);
  if (!data.sticky) osdTimer = setTimeout(hideOsd, data.ms || 1600);
}
function hideOsd() { clearTimeout(osdTimer); if (osdWin && !osdWin.isDestroyed()) { osdWin.webContents.send('fx:osd', { hide: true }); setTimeout(() => { if (osdWin && !osdWin.isDestroyed()) { osdWin.hide(); osdIdleClose(); } }, 260); } }

// ------------------------------------------------------------------ Tray
function trayIcon() {
  const file = trayState.muted ? 'tray-muted.png' : 'tray.png';
  return nativeImage.createFromPath(path.join(__dirname, 'assets', file));
}

// Kleine Übersetzung für Tray und Meldungen des Hauptprozesses
const MAIN_EN = {
  'Mikrofon stumm': 'Microphone muted', 'Fusion-X Audio öffnen': 'Open Fusion-X Audio', 'Mikrofon einschalten': 'Unmute microphone', 'Mikrofon stummschalten': 'Mute microphone',
  'Beim Sprechen leiser': 'Lower while talking', 'Profil': 'Profile', 'Keine Profile': 'No profiles', 'Beenden': 'Quit', 'Problem melden': 'Report a problem',
  'Gaming': 'Gaming', 'Streaming': 'Streaming', 'Meeting': 'Meeting', 'Musik & Filme': 'Music & movies',
  'Der Windows-Audio-Teil konnte nicht starten.': 'The Windows audio part couldn’t start.',
  'Mikrofon-Effekte funktionieren trotzdem. App-Lautstärken und Geräte lassen sich erst nach einem Neustart von Fusion-X steuern. Falls dein Virenscanner FusionAudioHelper.exe blockiert, erlaube die Datei bitte.': 'Microphone effects still work. App volumes and devices can only be controlled after restarting Fusion-X. If your antivirus blocks FusionAudioHelper.exe, please allow the file.'
};
function isEn() { const l = settings.lang; if (l === 'en') return true; if (l === 'de') return false; return !/^de/i.test(app.getLocale() || 'de'); }
const L = (s) => (isEn() && MAIN_EN[s]) || s;

function updateTray() {
  if (!tray) return;
  tray.setImage(trayIcon());
  tray.setToolTip('Fusion-X Audio' + (trayState.muted ? ' – ' + L('Mikrofon stumm') : '') + (trayState.profile ? ' – ' + L(trayState.profile) : ''));
  const profiles = (trayState.profiles || []).map((p) => ({
    label: L(p.name), type: 'radio', checked: p.name === trayState.profile,
    click: () => send('fx:tray', { action: 'profile', id: p.id })
  }));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: L('Fusion-X Audio öffnen'), click: showWindow },
    { type: 'separator' },
    { label: L(trayState.muted ? 'Mikrofon einschalten' : 'Mikrofon stummschalten'), click: () => send('fx:tray', { action: 'toggleMute' }) },
    { label: L('Beim Sprechen leiser'), type: 'checkbox', checked: !!trayState.ducking, click: () => send('fx:tray', { action: 'toggleDucking' }) },
    { label: L('Profil'), submenu: profiles.length ? profiles : [{ label: L('Keine Profile'), enabled: false }] },
    { label: L('Problem melden'), click: () => { showWindow(); send('fx:tray', { action: 'report' }); } },
    { type: 'separator' },
    { label: L('Beenden'), click: () => { quitting = true; app.quit(); } }
  ]));
}

// ------------------------------------------------------------------ Tastenkürzel
function registerHotkeys(map) {
  globalShortcut.unregisterAll();
  const failed = [];
  for (const [action, accel] of Object.entries(map || {})) {
    if (!accel) continue;
    try {
      const ok = globalShortcut.register(accel, () => send('fx:hotkey', action));
      if (!ok) failed.push(action);
    } catch (_) { failed.push(action); }
  }
  return failed;
}

// ------------------------------------------------------------------ Abfrage-Schleifen
let polling = false;
let lastDevices = '';
function startPolling() {
  if (polling) return;
  polling = true;
  const pollState = async () => {
    if (backend) {
      try { send('fx:state', await backend.call('poll', {})); } catch (_) {}
    }
    // Sichtbar: 10× pro Sekunde für flüssige Pegel. Im Tray reichen 2× pro Sekunde (Ducking, Profile, Stream Deck).
    setTimeout(pollState, winVisible ? 100 : 500);
  };
  const pollDevices = async () => {
    if (backend) {
      try {
        const list = await backend.call('devices', {});
        const sig = JSON.stringify(list);
        if (sig !== lastDevices) { lastDevices = sig; send('fx:devices', list); }
      } catch (_) {}
    }
    setTimeout(pollDevices, 2500);
  };
  pollState();
  pollDevices();
}

// ------------------------------------------------------------------ IPC
function setupIpc() {
  ipcMain.handle('fx:init', async () => ({
    platform: process.platform,
    version: app.getVersion(),
    backend: backend ? { ok: true, info: backendInfo } : { ok: false, error: backendError || 'Kein Audio-Backend' },
    settings,
    acrylic: useAcrylic(),
    visible: winVisible,
    community: { invite: COMMUNITY.discordInvite || '', discord: !!COMMUNITY.reportWebhook },
    autostart: app.getLoginItemSettings().openAtLogin
  }));
  ipcMain.handle('fx:call', async (_e, cmd, args) => {
    if (!backend) throw new Error(backendError || 'Audio-Helfer nicht verfügbar');
    return backend.call(cmd, args || {});
  });
  ipcMain.handle('fx:devices', async () => {
    if (!backend) return [];
    const list = await backend.call('devices', {});
    lastDevices = JSON.stringify(list);
    return list;
  });
  ipcMain.handle('fx:settings:set', (_e, patch) => {
    settings = { ...settings, ...patch };
    saveSettings();
    if (patch && 'lang' in patch) updateTray();
    return true;
  });
  ipcMain.handle('fx:autostart', (_e, on) => {
    if (IS_WIN || process.platform === 'darwin') {
      app.setLoginItemSettings({ openAtLogin: !!on, args: ['--hidden'] });
    }
    return app.getLoginItemSettings().openAtLogin;
  });
  ipcMain.handle('fx:hotkeys', (_e, map) => registerHotkeys(map));
  ipcMain.handle('fx:tray', (_e, state) => { trayState = { ...trayState, ...state }; updateTray(); return true; });
  ipcMain.handle('fx:open', (_e, url) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return true; });
  ipcMain.handle('fx:remote:state', (_e, data) => { remote.setState(data); return true; });
  ipcMain.handle('fx:remote:info', () => ({ clients: remote.count(), error: remote.error }));
  ipcMain.handle('fx:streamdeck:install', async () => {
    const base = app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked') : __dirname;
    const file = path.join(base, 'streamdeck', 'Fusion-X.streamDeckPlugin');
    if (!fs.existsSync(file)) return { ok: false, error: 'Plugin-Datei fehlt' };
    const err = await shell.openPath(file);
    return err ? { ok: false, error: 'Stream-Deck-Software nicht gefunden. Installiere sie von elgato.com und versuche es erneut.' } : { ok: true };
  });
  ipcMain.handle('fx:osd', (_e, data) => { if (data && data.hide) hideOsd(); else showOsd(data || {}); return true; });
  ipcMain.handle('fx:copy', (_e, text) => { clipboard.writeText(String(text || '')); return true; });
  ipcMain.handle('fx:diag', () => ({
    platform: process.platform + ' ' + process.arch,
    os: require('os').release(),
    version: app.getVersion(),
    electron: process.versions.electron,
    backend: backend ? 'verbunden' : 'nicht verbunden',
    backendError,
    backendInfo,
    helperExe: backendExe,
    remote: { clients: remote.count(), error: remote.error },
    log: helperLog.slice()
  }));
  ipcMain.handle('fx:vbcable:install', async () => {
    try {
      await installVbCable({ workDir: path.join(app.getPath('temp'), 'fusionx-vbcable'), onProgress: (p) => send('fx:vbcable', p) });
      // Warten, bis Windows die neuen Geräte meldet
      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const list = await backend.call('devices', {});
          if (list.some((d) => /cable (in|out)put/i.test(d.name))) { lastDevices = ''; return { ok: true, found: true }; }
        } catch (_) {}
      }
      return { ok: true, found: false };
    } catch (e) {
      logLine('VB-CABLE: ' + e.message);
      return { ok: false, error: e.message };
    }
  });
  // ---- Stream-Mix über OBS
  ipcMain.handle('fx:obs:config', (_e, cfg) => obs.configure(cfg));
  ipcMain.handle('fx:obs:status', () => obs.status());
  ipcMain.handle('fx:obs:request', (_e, type, data) => obs.request(type, data));
  ipcMain.handle('fx:obs:batch', (_e, list) => obs.batch(list || []));
  // ---- PC-Equalizer über Equalizer APO
  ipcMain.handle('fx:eq', async (_e, op, text) => {
    try {
      if (op === 'status') return await eqapo.status();
      if (op === 'apply') { await eqapo.apply(text); return { ok: true }; }
      if (op === 'restore') return { ok: await eqapo.restore() };
      if (op === 'devices') { const st = await eqapo.status(); if (st.selector) { const r = await shell.openPath(st.selector); return { ok: !r, error: r }; } return { ok: false, error: 'Geräte-Auswahl von Equalizer APO nicht gefunden' }; }
      if (op === 'download') { shell.openExternal(eqapo.DOWNLOAD_URL); return { ok: true }; }
    } catch (e) { logLine('EQ: ' + e.message); return { ok: false, error: e.message }; }
    return { ok: false };
  });
  // ---- Updates
  ipcMain.handle('fx:update', (_e, op, val) => updaterOp(op, val));
  ipcMain.handle('fx:report', (_e, r) => sendReport(r || {}));
  ipcMain.handle('fx:window', (_e, action) => {
    if (action === 'hide') win.hide();
    if (action === 'quit') { quitting = true; app.quit(); }
    return true;
  });
}

// ------------------------------------------------------------------ Automatische Updates (GitHub Releases)
let updater = null;
let updateState = { state: 'idle', enabled: false };
let updateTimer = null;
function updaterConfigured() {
  // Erst aktiv, wenn in package.json unter build.publish ein echter GitHub-Name steht
  try {
    const yml = fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8');
    return !/DEIN-GITHUB-NAME/.test(yml);
  } catch (_) { return false; }
}
function setUpdate(patch) { updateState = { ...updateState, ...patch }; send('fx:update', updateState); }
function setupUpdater() {
  if (!app.isPackaged) { updateState = { state: 'dev', enabled: false }; return; }
  if (!updaterConfigured()) { updateState = { state: 'unconfigured', enabled: false }; return; }
  try { updater = require('electron-updater').autoUpdater; } catch (e) { updateState = { state: 'error', error: e.message }; return; }
  updater.autoDownload = settings.autoUpdate !== false;
  updater.autoInstallOnAppQuit = true;
  updater.on('checking-for-update', () => setUpdate({ state: 'checking', error: '' }));
  updater.on('update-available', (i) => setUpdate({ state: updater.autoDownload ? 'downloading' : 'available', version: i.version, notes: typeof i.releaseNotes === 'string' ? i.releaseNotes.replace(/<[^>]+>/g, '').slice(0, 600) : '', percent: 0 }));
  updater.on('update-not-available', () => setUpdate({ state: 'current', checkedAt: Date.now() }));
  updater.on('download-progress', (p) => setUpdate({ state: 'downloading', percent: Math.round(p.percent || 0) }));
  updater.on('update-downloaded', (i) => { setUpdate({ state: 'ready', version: i.version }); });
  updater.on('error', (e) => setUpdate({ state: 'error', error: String(e && e.message || e).split('\n')[0].slice(0, 200) }));
  updateState = { state: 'idle', enabled: true };
  const check = () => { if (settings.autoUpdate !== false) updater.checkForUpdates().catch(() => {}); };
  setTimeout(check, 15000);
  updateTimer = setInterval(check, 6 * 3600 * 1000);
}
async function updaterOp(op, val) {
  if (op === 'status') return { ...updateState, current: app.getVersion() };
  if (!updater) return { ...updateState, current: app.getVersion() };
  if (op === 'check') { try { await updater.checkForUpdates(); } catch (e) { setUpdate({ state: 'error', error: e.message }); } }
  if (op === 'download') { try { await updater.downloadUpdate(); } catch (e) { setUpdate({ state: 'error', error: e.message }); } }
  if (op === 'auto') { settings.autoUpdate = !!val; updater.autoDownload = !!val; saveSettings(); }
  if (op === 'install') { quitting = true; setImmediate(() => updater.quitAndInstall(false, true)); }
  return { ...updateState, current: app.getVersion() };
}

// ------------------------------------------------------------------ Start
app.on('second-instance', showWindow);

app.whenReady().then(async () => {
  loadSettings();

  protocol.handle('app', (req) => {
    const url = new URL(req.url);
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(__dirname, 'renderer', rel));
    if (!file.startsWith(path.join(__dirname, 'renderer'))) return new Response('Nicht erlaubt', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });

  // Mikrofonzugriff und Ausgabegeräte-Auswahl für die eigene Oberfläche erlauben
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, permission, cb) => cb(['media', 'speaker-selection', 'audioCapture'].includes(permission)));
  ses.setPermissionCheckHandler((wc, permission) => ['media', 'speaker-selection', 'audioCapture'].includes(permission));

  await startBackend();
  setupIpc();
  createWindow();

  tray = new Tray(trayIcon());
  tray.on('click', showWindow);
  updateTray();

  registerHotkeys(settings.hotkeys || { toggleMute: 'Ctrl+Alt+M', toggleDucking: 'Ctrl+Alt+D' });
  remote.on('action', (msg) => send('fx:remote', msg));
  remote.on('clients', (n) => send('fx:remoteClients', { clients: n, error: remote.error }));
  remote.start();
  startPolling();
  obs.on('status', (st) => send('fx:obs', { status: st }));
  obs.on('event', (ev) => send('fx:obs', { event: ev }));
  setupUpdater();

  if (!backend && IS_WIN) {
    dialog.showMessageBox({
      type: 'warning',
      title: 'Fusion-X Audio',
      message: L('Der Windows-Audio-Teil konnte nicht starten.'),
      detail: (backendError || '') + '\n\n' + L('Mikrofon-Effekte funktionieren trotzdem. App-Lautstärken und Geräte lassen sich erst nach einem Neustart von Fusion-X steuern. Falls dein Virenscanner FusionAudioHelper.exe blockiert, erlaube die Datei bitte.')
    });
  }
});

app.on('before-quit', async (e) => {
  quitting = true;
  // Ursprüngliches Windows-Mikrofon wiederherstellen, damit andere Apps nicht stumm bleiben
  if (backend && settings.restoreMicOnExit !== false && settings.originalMic && settings.virtualMicActive && !app._restored) {
    e.preventDefault();
    app._restored = true;
    try { await backend.call('setDefault', { device: settings.originalMic, roles: 'all' }); } catch (_) {}
    settings.virtualMicActive = false;
    try { fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch (_) {}
    app.quit();
    return;
  }
  if (backend && Array.isArray(settings.hardMuted) && settings.hardMuted.length && !app._unmuted) {
    e.preventDefault();
    app._unmuted = true;
    for (const id of settings.hardMuted) { try { await backend.call('setDeviceMute', { device: id, muted: false }); } catch (_) {} }
    settings.hardMuted = [];
    try { fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch (_) {}
    app.quit();
    return;
  }
  if (backend && backend.stop) backend.stop();
  remote.stop();
  obs.disconnect(true);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin' && quitting) app.quit(); });
