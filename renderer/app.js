// Fusion-X Audio – Oberfläche und Logik
(function () {
  'use strict';

  var C = window.FxClassify, E = window.FxEngine;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var fmtDb = function (v, sign) { var s = (Math.round(v * 10) / 10).toFixed(1).replace('.', ','); return (sign && v > 0 ? '+' : '') + s.replace('-', '−') + ' dB'; };
  var pct = function (v) { return Math.round(v * 100) + ' %'; };
  var dbFrac = function (db) { return clamp((db + 60) / 60, 0, 1); };
  var linFrac = function (v) { return dbFrac(20 * Math.log10(Math.max(v, 1e-6))); };

  // ------------------------------------------------------------------ Icons
  var P = {
    mixer: '<path d="M6 4v7M6 15v5M12 4v2M12 10v10M18 4v9M18 17v3"/><circle cx="6" cy="13" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="18" cy="15" r="2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
    micOff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7M3 3l18 18"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    speakerOff: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
    devices: '<rect x="3" y="3" width="9" height="18" rx="2.2"/><circle cx="7.5" cy="14" r="2.6"/><circle cx="7.5" cy="7.5" r=".9"/><path d="M15.5 8h5M15.5 12h5M15.5 16h3.5"/>',
    profiles: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12.5l9 5 9-5M3 17l9 5 9-5"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6"/>',
    iface: '<rect x="2" y="7" width="20" height="10" rx="2.6"/><circle cx="7" cy="12" r="2.3"/><circle cx="12.6" cy="12" r="2.3"/><path d="M17.3 10.4v3.2M19.6 10.4v3.2"/>',
    bluetooth: '<path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9"/>',
    screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    cable: '<path d="M4 12h4M16 12h4M8 8.5h8v7H8z"/><path d="M10 8.5V6M14 8.5V6"/>',
    webcam: '<circle cx="12" cy="10" r="6"/><circle cx="12" cy="10" r="2"/><path d="M8 20h8M12 16v4"/>',
    duck: '<path d="M3 9.5v5h3.2l4.3 3.6V5.9L6.2 9.5H3z"/><path d="M17.5 5.5v10M14 12.5l3.5 3.5 3.5-3.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    warn: '<path d="M12 3.5l9.5 17h-19L12 3.5z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7L19 15z"/>',
    gate: '<path d="M3 12h3l2-5 3 10 3-7 2 4h5"/><path d="M3 19h18" stroke-dasharray="2 3"/>',
    eq: '<path d="M3 16c3 0 4-8 7-8s4 7 7 7c2 0 3-2 4-3"/>',
    comp: '<path d="M4 7h16M6.5 12h11M9 17h6"/>',
    deess: '<path d="M15 7.5c-.8-1.5-2.3-2.5-4-2.5-2.2 0-4 1.3-4 3.3 0 4.4 9 2.5 9 7.2 0 2-1.8 3.5-4.3 3.5-2 0-3.7-1-4.5-2.7"/><path d="M19.5 4L4.5 20"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    rec: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none"/>',
    play: '<path d="M7 5l12 7-12 7V5z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.2"/>',
    game: '<path d="M6.5 8.5h11a4.5 4.5 0 0 1 4.3 5.6l-.6 2.4a2.5 2.5 0 0 1-4.3 1L15 15.5H9L7.1 17.5a2.5 2.5 0 0 1-4.3-1l-.6-2.4a4.5 4.5 0 0 1 4.3-5.6z"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01"/>',
    stream: '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
    call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    wand: '<path d="M4 20L15 9"/><path d="M15 3v3M20 8h-3M18.5 4.5l-2 2M11 4.5l1 1.5M19.5 12l-1.5-1"/>',
    route: '<path d="M4 7h7a4 4 0 0 1 4 4v6"/><path d="M11.5 13.5L15 17l3.5-3.5"/><path d="M4 17h4"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z"/>',
    ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.6"/><path d="M10 9a2 2 0 0 1 4 0"/>',
    deck: '<rect x="2.5" y="4" width="19" height="16" rx="3"/><rect x="5.5" y="7" width="3.6" height="3.6" rx=".8"/><rect x="10.2" y="7" width="3.6" height="3.6" rx=".8"/><rect x="14.9" y="7" width="3.6" height="3.6" rx=".8"/><rect x="5.5" y="13.2" width="3.6" height="3.6" rx=".8"/><rect x="10.2" y="13.2" width="3.6" height="3.6" rx=".8"/><rect x="14.9" y="13.2" width="3.6" height="3.6" rx=".8"/>',
    dial: '<circle cx="12" cy="12" r="8"/><path d="M12 7v4"/><path d="M5 19.5l1.5-1.5M19 19.5L17.5 18"/>',
    pads: '<rect x="3" y="3" width="8" height="8" rx="2.2"/><rect x="13" y="3" width="8" height="8" rx="2.2"/><rect x="3" y="13" width="8" height="8" rx="2.2"/><path d="M15 15.2v4.4l3.8-2.2L15 15.2z"/>',
    key: '<rect x="2.5" y="6" width="19" height="12" rx="3"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
    pin: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" fill="currentColor"/>'
  };
  var ic = function (n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>'; };

  // ------------------------------------------------------------------ Brücke (Electron oder Demo)
  var fx = window.fx || createDemoBridge();

  function createDemoBridge() {
    var load = function () { try { return JSON.parse(localStorage.getItem('fx.settings')) || {}; } catch (_) { return {}; } };
    var stored = load();
    var mock = new window.MockAudio(stored.demoScenario || 'interface'), subs = { state: [], devices: [] };
    setInterval(function () { var s = mock.call('poll', {}); subs.state.forEach(function (f) { f(s); }); }, 70);
    var noop = function () { return function () {}; };
    var obsSubs = [], OBS = { scenes: { 'Szene': [{ sourceName: 'Webcam', inputKind: 'dshow_input' }], 'Pause': [] }, inputs: {}, mutes: { 'Desktop-Audio': false } };
    function fakeObs(type, d) {
      switch (type) {
        case 'GetInputKindList': return { inputKinds: ['wasapi_input_capture', 'wasapi_output_capture', 'wasapi_process_output_capture'] };
        case 'GetSceneList': return { scenes: Object.keys(OBS.scenes).map(function (n) { return { sceneName: n }; }) };
        case 'CreateScene': OBS.scenes[d.sceneName] = []; return {};
        case 'GetSceneItemList': return { sceneItems: (OBS.scenes[d.sceneName] || []).map(function (x, i) { return { sceneItemId: i + 1, sourceName: x.sourceName, inputKind: x.inputKind }; }) };
        case 'CreateSceneItem': (OBS.scenes[d.sceneName] = OBS.scenes[d.sceneName] || []).push({ sourceName: d.sourceName, inputKind: null }); return { sceneItemId: OBS.scenes[d.sceneName].length };
        case 'CreateInput': if (OBS.inputs[d.inputName]) { var er = new Error('exists'); er.code = 601; throw er; } OBS.inputs[d.inputName] = { kind: d.inputKind, settings: d.inputSettings }; OBS.scenes[d.sceneName].push({ sourceName: d.inputName, inputKind: d.inputKind }); return {};
        case 'GetInputSettings': return { inputSettings: (OBS.inputs[d.inputName] || {}).settings || {} };
        case 'GetSpecialInputs': return { desktop1: 'Desktop-Audio' };
        case 'GetInputMute': return { inputMuted: !!OBS.mutes[d.inputName] };
        case 'SetInputMute': OBS.mutes[d.inputName] = d.inputMuted; return {};
        case 'RemoveScene': delete OBS.scenes[d.sceneName]; return {};
        case 'RemoveInput': delete OBS.inputs[d.inputName]; return {};
        default: return {};
      }
    }
    return {
      isDemo: true,
      init: function () { return Promise.resolve({ platform: 'demo', version: '1.1.0', backend: { ok: true, info: mock.call('hello') }, settings: stored, autostart: false }); },
      call: function (c, a) { try { return Promise.resolve(mock.call(c, a)); } catch (e) { return Promise.reject(e); } },
      devices: function () { return Promise.resolve(mock.call('devices')); },
      saveSettings: function (p) { Object.assign(stored, p); try { localStorage.setItem('fx.settings', JSON.stringify(stored)); } catch (_) {} return Promise.resolve(true); },
      setAutostart: function (v) { return Promise.resolve(v); },
      setHotkeys: function () { return Promise.resolve([]); },
      setTray: function () { return Promise.resolve(true); },
      openExternal: function () { return Promise.resolve(true); },
      window: function () { return Promise.resolve(true); },
      onState: function (cb) { subs.state.push(cb); return function () {}; },
      onDevices: function (cb) { subs.devices.push(cb); return function () {}; },
      onHotkey: noop, onTray: noop, onBackend: noop, onRemote: noop, onRemoteClients: noop,
      remoteState: function () { return Promise.resolve(true); },
      installStreamDeck: function () { return Promise.resolve({ ok: false, error: 'In der Vorschau nicht verfügbar' }); },
      // Nachgebautes OBS für die Vorschau
      obsConfig: function (cfg) {
        var st = cfg.enabled ? { state: 'connecting', error: '' } : { state: 'off', error: '' };
        if (cfg.enabled) setTimeout(function () { obsSubs.forEach(function (f) { f({ status: { state: 'ok', error: '', version: { obs: '31.1.2', ws: '5.6.1', platform: 'windows' } } }); }); }, 700);
        return Promise.resolve(st);
      },
      obsRequest: function (type, d) { return Promise.resolve(fakeObs(type, d || {})); },
      obsBatch: function (list) { return Promise.resolve(list.map(function (r) { try { return { requestStatus: { result: true }, responseData: fakeObs(r[0], r[1] || {}) }; } catch (e) { return { requestStatus: { result: false, comment: e.message } }; } })); },
      onObs: function (cb) { obsSubs.push(cb); return function () {}; },
      eq: function (op) { return Promise.resolve(op === 'status' ? { installed: true, writable: true, included: true, configPath: 'C:\\Program Files\\EqualizerAPO\\config', selector: 'DeviceSelector.exe', demo: true } : { ok: true }); },
      update: function (op) { return Promise.resolve({ state: 'current', enabled: true, current: '1.1.0', checkedAt: Date.now() }); },
      onUpdate: noop,
      scenario: function () { return mock.scenario; },
      setScenario: function (sc) { mock = new window.MockAudio(sc); stored.demoScenario = sc; try { localStorage.setItem('fx.settings', JSON.stringify(stored)); } catch (_) {} }
    };
  }

  // ------------------------------------------------------------------ Zustand
  var PROFILES = [
    { id: 'gaming', name: 'Gaming', icon: 'game', preset: 'gaming', ducking: { enabled: true, amount: 55 }, levels: { voice: 1, game: 0.7, music: 0.3, web: 0.5 }, autoApps: [], autoCat: 'game', builtin: true },
    { id: 'stream', name: 'Streaming', icon: 'stream', preset: 'broadcast', ducking: { enabled: true, amount: 40 }, levels: { voice: 0.85, game: 0.6, music: 0.25 }, autoApps: ['obs64.exe', 'streamlabs obs.exe', 'streamlabs desktop.exe'], autoCat: null, builtin: true },
    { id: 'meeting', name: 'Meeting', icon: 'call', preset: 'clear', ducking: { enabled: true, amount: 80 }, levels: { voice: 1, music: 0.15, game: 0.2, web: 0.4 }, autoApps: ['ms-teams.exe', 'teams.exe', 'zoom.exe'], autoCat: null, builtin: true },
    { id: 'music', name: 'Musik & Filme', icon: 'music', preset: 'natural', ducking: { enabled: false, amount: 50 }, levels: { music: 0.8, video: 0.8, web: 0.7 }, autoApps: [], autoCat: null, builtin: true }
  ];

  var DEFAULTS = {
    onboarded: false,
    proMode: false,
    useCase: null,
    mic: E.applyPreset(E.DEFAULT_MIC, 'clear'),
    micEnabled: true,
    virtualOut: '',
    originalMic: '',
    virtualMicActive: false,
    virtualMicWanted: false,
    restoreMicOnExit: true,
    ducking: { enabled: true, amount: 60, release: 900, cats: { game: true, music: true, web: true, video: true, launcher: false, stream: false, other: false, system: true, voice: false }, apps: {} },
    profiles: PROFILES,
    activeProfile: null,
    autoProfiles: true,
    hotkeys: { toggleMute: 'Ctrl+Alt+M', toggleDucking: 'Ctrl+Alt+D', profile1: '', profile2: '', profile3: '', profile4: '', masterUp: '', masterDown: '', masterMute: '', nextOutput: '', denoiseCycle: '', monitorToggle: '', gameUp: '', gameDown: '', musicUp: '', musicDown: '', chatUp: '', chatDown: '', stopSounds: '' },
    closeToTray: true,
    startMinimized: false,
    onlyActive: false,
    ptt: { mode: 'off', vk: 0, label: '', release: 180, beep: true },
    osd: { enabled: true, position: 'bottom', remind: true },
    cues: true,
    rememberVolumes: true,
    appVolumes: {},
    preferred: { render: [], capture: [] },
    autoDefault: true,
    sb: { micVol: 0.8, selfVol: 0.7, hearSelf: true },
    streamMix: { enabled: false, obs: { host: '127.0.0.1', port: 4455, password: '' }, master: 1, apps: {}, voice: { on: false, vol: 1 }, muteDesktop: true, desktopPrev: null, addToScenes: true, newAppsOn: true },
    eq: { enabled: false, preset: 'flat', bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    lang: 'auto',
    autoUpdate: true
  };

  function deepMerge(def, src) {
    if (src === undefined || src === null) return clone(def);
    if (Array.isArray(def)) return Array.isArray(src) ? clone(src) : clone(def);
    if (typeof def !== 'object' || def === null) return typeof src === typeof def ? src : def;
    var o = {};
    for (var k in def) o[k] = deepMerge(def[k], src[k]);
    for (var k2 in src) if (!(k2 in def)) o[k2] = src[k2];
    return o;
  }

  var S = {
    demo: !!fx.isDemo,
    platform: 'win32',
    version: '',
    backend: { ok: false },
    settings: null,
    devices: [],
    asio: [],
    sessions: [],
    peaks: {},
    groups: new Map(),
    captureApps: [],
    page: 'mixer',
    engine: new E.VoiceEngine(),
    browserDevs: [],
    meters: null,
    log: [],
    icons: {},
    duck: { active: false, releaseAt: 0 }
  };

  var saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () { fx.saveSettings(clone(S.settings)); }, 250);
  }
  function log(msg) {
    var t = new Date();
    S.log.push(String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + ':' + String(t.getSeconds()).padStart(2, '0') + '  ' + msg);
    if (S.log.length > 80) S.log.shift();
  }
  var toastT;
  function toast(msg, err) {
    var t = $('#toast');
    t.textContent = msg; t.classList.toggle('err', !!err); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, err ? 6000 : 3000);
  }

  // ------------------------------------------------------------------ Geräte
  var GENERIC_DESC = /^(lautsprecher|speakers?|mikrofon|microphone|kopfhörer|headphones?|line( in| out)?|eingang|ausgang|digital(e)? audio.*|headset( earphone| microphone)?|kopfhörermikrofon|mikrofonarray|microphone array)$/i;
  var cleanName = function (s) { return String(s || '').replace(/\((R|TM)\)/gi, '').replace(/\s{2,}/g, ' ').trim(); };
  function devTitle(d) { return !d.desc || GENERIC_DESC.test(d.desc) ? cleanName(d.adapter || d.name) : cleanName(d.desc); }
  function devSub(d) { return !d.desc || GENERIC_DESC.test(d.desc) ? d.desc : cleanName(d.adapter); }
  function devFormat(d) { return d.format && d.format.rate ? (String(d.format.rate / 1000).replace('.', ',') + ' kHz · ' + d.format.bits + ' Bit') : ''; }
  function devIcon(d) {
    var k = d.cls.kind;
    return k === 'interface' ? 'iface' : k === 'bluetooth' ? 'bluetooth' : k === 'virtual' ? 'cable' : k === 'hdmi' ? 'screen' : k === 'webcam' ? 'webcam' : k === 'headset' ? 'headphones' : d.flow === 'capture' ? 'mic' : /kopfh|headph/i.test(d.name) ? 'headphones' : 'speaker';
  }
  var renders = function () { return S.devices.filter(function (d) { return d.flow === 'render'; }); };
  var captures = function () { return S.devices.filter(function (d) { return d.flow === 'capture'; }); };
  var physicalRenders = function () { return renders().filter(function (d) { return !d.cls.virtual; }); };
  var physicalCaptures = function () { return captures().filter(function (d) { return !d.cls.virtual; }); };
  var devById = function (id) { return S.devices.filter(function (d) { return d.id === id; })[0]; };
  var defaultRender = function () { return renders().filter(function (d) { return d.isDefault; })[0]; };
  var defaultCapture = function () { return captures().filter(function (d) { return d.isDefault; })[0]; };
  function virtualPair() {
    var out = renders().filter(function (d) { return /cable input|voicemeeter (aux )?input|virtual audio cable|line 1 \(virtual/i.test(d.name); })[0];
    var inp = captures().filter(function (d) { return /cable output|voicemeeter (aux )?output|line 1 \(virtual/i.test(d.name); })[0];
    return out && inp ? { out: out, inp: inp } : null;
  }

  function setDevices(list) {
    S.devices = (list || []).map(function (d) { d.cls = C.classifyDevice(d, S.asio); return d; });
    S.interfaces = C.detectInterfaces(S.devices, S.asio);
    ensureMicInput();
    var sig = S.devices.map(function (d) { return d.id; }).sort().join('|');
    if (sig !== S.deviceSig) { S.deviceSig = sig; setTimeout(enforcePreferred, 300); }
  }
  // Lieblingsgeräte: nach Neustart oder Einstecken automatisch wieder als Standard setzen
  var preferBusy = false;
  async function enforcePreferred() {
    if (!S.settings || !S.settings.autoDefault || preferBusy || !S.backend.ok) return;
    preferBusy = true;
    try {
      for (var flow of ['render', 'capture']) {
        if (flow === 'capture' && S.settings.virtualMicActive) continue;
        var list = S.settings.preferred[flow] || [];
        var want = list.map(devById).filter(Boolean)[0];
        if (!want || (want.isDefault && want.isDefaultComms)) continue;
        await fx.call('setDefault', { device: want.id, roles: 'all' });
        log('Lieblingsgerät wieder Standard: ' + devTitle(want));
        toast((flow === 'render' ? 'Ton' : 'Mikrofon') + ' wieder über ' + devTitle(want));
        osd({ icon: flow === 'render' ? (/kopfh|headph|headset/i.test(want.name) ? 'headphones' : 'speaker') : 'mic', tone: 'ok', title: devTitle(want), sub: flow === 'render' ? 'Wieder als Ausgabe gesetzt' : 'Wieder als Mikrofon gesetzt' });
      }
      var fresh = await fx.devices();
      S.devices = fresh.map(function (d) { d.cls = C.classifyDevice(d, S.asio); return d; });
      if (S.page === 'devices' || S.page === 'mixer') renderPage();
    } catch (e) { log('Lieblingsgerät: ' + e.message); }
    preferBusy = false;
  }
  function preferDevice(d, top) {
    var list = S.settings.preferred[d.flow] = (S.settings.preferred[d.flow] || []).filter(function (x) { return x !== d.id; });
    if (top) list.unshift(d.id); else list.push(d.id);
    save();
  }

  function ensureMicInput() {
    var mic = S.settings.mic, cur = devById(mic.inputId);
    if (cur && !cur.cls.virtual) return;
    var caps = physicalCaptures();
    var rank = { interface: 0, usbmic: 1, usb: 2, headset: 3, onboard: 4, builtin: 5, other: 6, webcam: 7, bluetooth: 9 };
    var pick = caps.slice().sort(function (a, b) {
      var ra = (rank[a.cls.kind] != null ? rank[a.cls.kind] : 6) - (a.isDefault ? 0.5 : 0), rb = (rank[b.cls.kind] != null ? rank[b.cls.kind] : 6) - (b.isDefault ? 0.5 : 0);
      return ra - rb;
    })[0];
    if (pick) { mic.inputId = pick.id; save(); }
  }

  async function refreshBrowserDevices() {
    try { S.browserDevs = await navigator.mediaDevices.enumerateDevices(); } catch (_) { S.browserDevs = []; }
  }
  function browserIdFor(win, kind) {
    if (!win) return null;
    var list = S.browserDevs.filter(function (d) { return d.kind === kind && d.deviceId !== 'default' && d.deviceId !== 'communications' && d.label; });
    var m = list.filter(function (d) { return d.label === win.name; })[0]
      || list.filter(function (d) { return win.adapter && d.label.indexOf(win.adapter) >= 0 && d.label.indexOf(win.desc) >= 0; })[0]
      || list.filter(function (d) { return win.adapter && d.label.indexOf(win.adapter) >= 0; })[0];
    return m ? m.deviceId : null;
  }

  // ------------------------------------------------------------------ Mikrofon-Engine
  var engineBusy = false;
  async function startEngine() {
    if (engineBusy) return;
    engineBusy = true;
    try {
      var mic = S.settings.mic, inDev = devById(mic.inputId);
      await refreshBrowserDevices();
      var inId = browserIdFor(inDev, 'audioinput');
      if (!inId) {
        // Vor der ersten Freigabe kennt der Browser keine Gerätenamen: kurz freigeben lassen, dann zuordnen
        try { var tmp = await navigator.mediaDevices.getUserMedia({ audio: true }); tmp.getTracks().forEach(function (t) { t.stop(); }); } catch (_) {}
        await refreshBrowserDevices();
        inId = browserIdFor(inDev, 'audioinput');
      }
      var outDev = S.settings.virtualMicActive ? devById(S.settings.virtualOut) : null;
      var outId = outDev ? browserIdFor(outDev, 'audiooutput') : null;
      if (!inId && S.settings.virtualMicActive && !S.demo) {
        // Niemals das Standard-Mikro öffnen, solange das virtuelle Mikro Standard ist (Rückkopplung)
        S.engine.state = 'error';
        S.engine.error = 'Fusion-X findet dein Mikrofon „' + (inDev ? devTitle(inDev) : 'unbekannt') + '“ nicht. Ist es angeschlossen? Wähle sonst unten ein anderes Mikrofon.';
        S.engine.emit();
      } else {
        await S.engine.start(mic, { inputBrowserId: inId, outputSinkId: outId, monitorSinkId: monitorSink() });
        if (S.engine.state === 'on') {
          log('Mikrofon aktiv: ' + (S.engine.trackLabel || 'Standard'));
          if (outDev && !outId) { log('Virtuelles Mikro nicht erreichbar'); toast('Das virtuelle Mikrofon ist gerade nicht erreichbar. Andere Apps hören dich nicht. Prüfe die Geräte-Seite.', true); }
        } else if (S.engine.error) log('Mikrofon-Fehler: ' + S.engine.error);
      }
      if (S.demo && S.engine.state === 'error') { S.demoMicError = S.engine.error; S.engine.state = 'off'; S.engine.error = null; }
    } finally { engineBusy = false; }
    renderTop(); if (S.page === 'mic') renderPage();
  }
  async function stopEngine() { await S.engine.stop(); renderTop(); if (S.page === 'mic') renderPage(); }
  function monitorSink() { var d = devById(S.settings.mic.monitor.device); return d ? browserIdFor(d, 'audiooutput') : ''; }
  function micChanged(restart) {
    save();
    if (restart) { if (S.settings.micEnabled) startEngine(); return; }
    S.engine.update(S.settings.mic, { monitorSinkId: monitorSink() });
  }
  function setMute(on) {
    S.settings.mic.muted = !!on;
    micChanged();
    if (S.engine.state !== 'on') {
      var d = devById(S.settings.mic.inputId);
      if (d) fx.call('setDeviceMute', { device: d.id, muted: !!on }).catch(function () {});
    }
    updateMicButton();
    fx.setTray({ muted: !!on });
    toast(on ? 'Mikrofon stumm' : 'Mikrofon an');
    cue(on ? 'mute' : 'unmute');
    osd(on ? { icon: 'micOff', tone: 'bad', title: 'Mikrofon stumm', sub: S.settings.hotkeys.toggleMute ? prettyKey(S.settings.hotkeys.toggleMute) + ' zum Einschalten' : '' } : { icon: 'mic', tone: 'voice', title: 'Mikrofon an' });
  }

  // Bildschirm-Anzeige über Spielen (nur wenn Fusion-X gerade nicht im Vordergrund ist)
  function osd(d) {
    if (!S.settings.osd.enabled || !fx.osd) return;
    if (document.hasFocus() && !d.force) return;
    if (window.FxI18n) d = Object.assign({}, d, { title: FxI18n.tr(d.title), sub: FxI18n.tr(d.sub) });
    fx.osd(Object.assign({ position: S.settings.osd.position }, d));
  }
  function osdHide() { if (fx.osd) fx.osd({ hide: true }); }

  // Kurze Signaltöne (nur für dich, gehen nicht ins Mikro)
  var cueCtx = null;
  function cue(kind, force) {
    if (!S.settings.cues && !force) return;
    try {
      if (!cueCtx) { cueCtx = new AudioContext(); var ms = monitorSink(); if (ms && cueCtx.setSinkId) cueCtx.setSinkId(ms).catch(function () {}); }
      var c = cueCtx, t = c.currentTime + 0.01;
      var notes = { mute: [660, 440], unmute: [440, 660], talk: [880], release: [600], sound: [740] }[kind] || [600];
      notes.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain(), at = t + i * 0.09;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.12, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, at + 0.11);
        o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + 0.13);
      });
    } catch (_) {}
  }

  // ------------------------------------------------------------------ Sprechtaste (Push-to-Talk)
  var VK_NAMES = { 4: 'Mittlere Maustaste', 5: 'Maustaste 4 (zurück)', 6: 'Maustaste 5 (vor)', 8: 'Rücktaste', 9: 'Tab', 13: 'Enter', 19: 'Pause', 20: 'Feststelltaste', 27: 'Esc', 32: 'Leertaste', 33: 'Bild hoch', 34: 'Bild runter', 35: 'Ende', 36: 'Pos1', 45: 'Einfg', 46: 'Entf', 144: 'Num-Taste', 145: 'Rollen', 160: 'Umschalt links', 161: 'Umschalt rechts', 162: 'Strg links', 163: 'Strg rechts', 164: 'Alt links', 165: 'Alt Gr', 192: 'Zirkumflex (^)' };
  var CODE_VK = { ShiftLeft: 160, ShiftRight: 161, ControlLeft: 162, ControlRight: 163, AltLeft: 164, AltRight: 165 };
  function vkName(vk, fallback) {
    if (VK_NAMES[vk]) return VK_NAMES[vk];
    if (vk >= 112 && vk <= 135) return 'F' + (vk - 111);
    if (vk >= 96 && vk <= 105) return 'Num ' + (vk - 96);
    if ((vk >= 48 && vk <= 57) || (vk >= 65 && vk <= 90)) return String.fromCharCode(vk);
    return fallback || ('Taste ' + vk);
  }
  function pttWatch() {
    var p = S.settings.ptt;
    fx.call('watchKeys', { keys: p.mode !== 'off' && p.vk ? [p.vk] : [] }).catch(function () {});
    S.pttHeld = false;
    applyPtt(true);
  }
  function pttKey(vk, down) {
    var p = S.settings.ptt;
    if (p.mode === 'off' || vk !== p.vk || S.pttHeld === down) return;
    S.pttHeld = down;
    clearTimeout(S.pttReleaseT);
    if (!down && p.mode === 'ptt' && p.release > 0) S.pttReleaseT = setTimeout(function () { applyPtt(); }, p.release);
    else applyPtt();
  }
  function applyPtt(silent) {
    var p = S.settings.ptt, held = !!S.pttHeld;
    var muted = p.mode === 'ptt' ? !held : p.mode === 'ptm' ? held : false;
    if (S.pttMutedNow === muted && !silent) return;
    var was = S.pttMutedNow;
    S.pttMutedNow = muted;
    S.engine.setPttMuted(muted);
    if (S.engine.state !== 'on' && p.mode !== 'off') {
      var d = devById(S.settings.mic.inputId);
      if (d) fx.call('setDeviceMute', { device: d.id, muted: muted || !!S.settings.mic.muted }).catch(function () {});
    }
    updateMicButton();
    if (silent || was === undefined) return;
    if (p.beep) cue(muted ? 'release' : 'talk');
    if (p.mode === 'ptt') { if (!muted) osd({ icon: 'mic', tone: 'voice', title: 'Du sprichst', sub: p.label + ' gedrückt', sticky: true }); else osdHide(); }
    if (p.mode === 'ptm') { if (muted) osd({ icon: 'micOff', tone: 'bad', title: 'Stumm, solange du drückst', sub: p.label, sticky: true }); else osdHide(); }
  }

  // Virtuelles Mikrofon: bearbeitete Stimme an alle Apps
  async function activateVirtualMic(quiet) {
    var vp = virtualPair();
    if (!vp) { toast('Kein virtuelles Mikrofon gefunden. Installiere zuerst VB-CABLE.', true); return; }
    var def = defaultCapture();
    if (def && !def.cls.virtual) S.settings.originalMic = def.id;
    if (!S.settings.originalMic) { var pc = physicalCaptures()[0]; if (pc) S.settings.originalMic = pc.id; }
    if (!devById(S.settings.mic.inputId) || devById(S.settings.mic.inputId).cls.virtual) S.settings.mic.inputId = S.settings.originalMic;
    try {
      await fx.call('setDefault', { device: vp.inp.id, roles: 'all' });
      S.settings.virtualOut = vp.out.id;
      S.settings.virtualMicActive = true;
      S.settings.virtualMicWanted = true;
      save();
      fx.saveSettings({ originalMic: S.settings.originalMic, virtualMicActive: true });
      setDevices(await fx.devices());
      await startEngine();
      if (!quiet) toast('Fertig: Alle Apps bekommen jetzt deine bearbeitete Stimme.');
      log('Virtuelles Mikro aktiviert (' + vp.inp.name + ')');
    } catch (e) { toast('Windows hat das Standard-Mikrofon nicht übernommen: ' + e.message, true); }
    renderPage(); renderTop();
  }
  async function deactivateVirtualMic() {
    try { if (S.settings.originalMic) await fx.call('setDefault', { device: S.settings.originalMic, roles: 'all' }); } catch (_) {}
    S.settings.virtualMicActive = false; S.settings.virtualMicWanted = false; save();
    setDevices(await fx.devices());
    await startEngine();
    renderPage(); renderTop();
    toast('Apps nutzen wieder dein Mikrofon direkt, ohne Effekte.');
  }

  // ------------------------------------------------------------------ Apps (Sessions)
  function onState(st) {
    if (!st) return;
    S.peaks = st.peaks || {};
    S.sessions = st.sessions || [];
    var seen = {}, structural = false, caps = {};
    S.sessions.forEach(function (s) {
      if (s.flow === 'capture') {
        if (s.system) return;
        var ck = (s.exe || '').toLowerCase();
        caps[ck] = caps[ck] || { key: ck, info: C.appInfo(s), path: s.path, devices: {} };
        caps[ck].devices[s.device] = true;
        return;
      }
      var key = s.system ? 'system' : (s.exe || '').toLowerCase();
      var g = S.groups.get(key);
      if (!g) {
        var info = C.appInfo(s);
        g = { key: key, name: info.name, cat: info.cat, color: info.color, path: s.path, system: s.system, pids: [], peak: 0, disp: 0, volume: s.volume, userVol: s.volume, muted: s.muted, active: false, output: undefined, devs: {} };
        S.groups.set(key, g);
        structural = true;
        loadIcon(g);
        applyProfileLevel(g);
      }
      if (!seen[key]) { seen[key] = true; g.pids = []; g.peak = 0; g.active = false; g.devs = {}; g.volume = s.volume; g.muted = g.smMuted ? true : s.muted; if (s.muted && !g.smMuted && smHandles(g)) setTimeout(function () { setAppMute(g, true); }, 0); }
      if (g.pids.indexOf(s.pid) < 0) g.pids.push(s.pid);
      g.peak = Math.max(g.peak, s.peak || 0);
      g.active = g.active || s.active;
      g.devs[s.device] = true;
    });
    S.groups.forEach(function (g, key) {
      if (!seen[key]) { S.groups.delete(key); structural = true; return; }
      if (!g.ducked && !g.dragging && !g.smMuted && !(smHandles(g) && g.userVol < SM_FLOOR * 2) && Math.abs(g.volume - g.userVol) > 0.004 && !g.pendingSet) g.userVol = g.volume;
      if (g.output === undefined && fx && S.backend.info && S.backend.info.appOutput && g.pids.length && !g.system) {
        g.output = null;
        fx.call('getAppOutput', { pid: g.pids[0] }).then(function (id) { g.output = id || null; if (S.page === 'mixer') syncStrip(g); }).catch(function () {});
      }
    });
    S.captureApps = Object.keys(caps).map(function (k) { return caps[k]; });
    if (structural) { autoProfileCheck(); if (S.page === 'mixer') renderStrips(); if (S.page === 'mic') renderCaptureApps(); }
  }

  function loadIcon(g) {
    if (!g.path || S.icons[g.key] !== undefined) return;
    S.icons[g.key] = null;
    fx.call('icon', { path: g.path }).then(function (data) { if (data) { S.icons[g.key] = data; $$('[data-icon="' + cssKey(g.key) + '"]').forEach(function (el) { el.innerHTML = '<img alt="" src="' + data + '">'; el.classList.add('ic'); }); } }).catch(function () {});
  }
  var cssKey = function (k) { return String(k).replace(/["\\]/g, ''); };
  function appIconHtml(g, extra) {
    var data = S.icons[g.key];
    if (g.system) return '<div class="appicon ic ' + (extra || '') + '">' + ic('speaker', 'lg') + '</div>';
    if (data) return '<div class="appicon ic ' + (extra || '') + '" data-icon="' + esc(cssKey(g.key)) + '"><img alt="" src="' + data + '"></div>';
    return '<div class="appicon ' + (extra || '') + '" data-icon="' + esc(cssKey(g.key)) + '" style="background:' + g.color + '">' + esc((g.name || '?').trim().charAt(0).toUpperCase()) + '</div>';
  }

  function setAppVolume(g, v) {
    g.userVol = v;
    if (S.settings.rememberVolumes && !g.system) { S.settings.appVolumes[g.key] = Math.round(v * 100) / 100; save(); }
    if (g.smMuted) return; // nur für dich stumm (Stream-Mix): bleibt leise, bis du die Stummschaltung aufhebst
    var actual = g.ducked ? v * duckFactor() : v;
    if (smHandles(g)) actual = Math.max(actual, SM_FLOOR); // ganz auf 0 würde auch den Stream stumm machen
    g.volume = actual;
    g.pendingSet = true;
    fx.call('setAppVolume', { pids: g.pids, system: g.system, value: actual }).catch(function () {}).then(function () { setTimeout(function () { g.pendingSet = false; }, 250); });
  }
  function setAppMute(g, m) {
    if (smHandles(g) || (g.smMuted && !m)) {
      // Stream-Mix: nur für dich stumm, OBS bekommt die App weiter
      g.smMuted = m; g.muted = m;
      fx.call('setAppMute', { pids: g.pids, system: g.system, muted: false }).catch(function () {});
      fx.call('setAppVolume', { pids: g.pids, system: g.system, value: m ? SM_FLOOR : Math.max(g.ducked ? g.userVol * duckFactor() : g.userVol, smHandles(g) ? SM_FLOOR : 0) }).catch(function () {});
      g.volume = m ? SM_FLOOR : g.userVol;
      return;
    }
    g.smMuted = false;
    g.muted = m;
    fx.call('setAppMute', { pids: g.pids, system: g.system, muted: m }).catch(function () {});
  }

  // ------------------------------------------------------------------ Ducking (andere Apps leiser, wenn du sprichst)
  var duckFactor = function () { return 1 - S.settings.ducking.amount / 100; };
  function isDuckTarget(g) {
    var d = S.settings.ducking, o = d.apps[g.key];
    if (o === true || o === false) return o;
    return !!d.cats[g.cat];
  }
  function duckTick(speaking, now) {
    var d = S.settings.ducking;
    var want = d.enabled && speaking && S.engine.state === 'on';
    if (want) { S.duck.releaseAt = now + d.release; if (!S.duck.active) setDuck(true); }
    else if (S.duck.active && now > S.duck.releaseAt) setDuck(false);
  }
  function setDuck(on) {
    S.duck.active = on;
    S.groups.forEach(function (g) {
      if (on && isDuckTarget(g) && !g.muted && !g.smMuted) {
        g.ducked = true;
        ramp(g, g.userVol, g.userVol * duckFactor(), 140);
      } else if (!on && g.ducked) {
        ramp(g, g.userVol * duckFactor(), g.userVol, 450, function () { g.ducked = false; });
      }
      if (S.page === 'mixer') syncStrip(g);
    });
  }
  function ramp(g, from, to, ms, done) {
    var steps = Math.max(2, Math.round(ms / 45)), i = 0;
    clearInterval(g.rampT);
    g.rampT = setInterval(function () {
      i++;
      var v = from + (to - from) * (i / steps);
      fx.call('setAppVolume', { pids: g.pids, system: g.system, value: clamp(smHandles(g) ? Math.max(v, SM_FLOOR) : v, 0, 1) }).catch(function () {});
      if (i >= steps) { clearInterval(g.rampT); if (done) done(); }
    }, ms / steps);
  }
  window.addEventListener('beforeunload', function () {
    S.groups.forEach(function (g) {
      if (g.ducked) fx.call('setAppVolume', { pids: g.pids, system: g.system, value: g.userVol });
      if (g.smMuted) { fx.call('setAppVolume', { pids: g.pids, system: g.system, value: g.userVol }); fx.call('setAppMute', { pids: g.pids, system: g.system, muted: true }); }
    });
  });

  // ------------------------------------------------------------------ Profile
  function profileById(id) { return S.settings.profiles.filter(function (p) { return p.id === id; })[0]; }
  function applyProfile(id, auto) {
    var p = profileById(id);
    if (!p) return;
    var mic = S.settings.mic;
    var keep = { inputId: mic.inputId, channel: mic.channel, gainDb: mic.gainDb, gate: mic.gate, monitor: mic.monitor, muted: mic.muted, outGainDb: mic.outGainDb };
    var next = p.mic ? clone(p.mic) : E.applyPreset(mic, p.preset);
    Object.assign(next, keep);
    if (p.mic) next.gate = Object.assign({}, keep.gate, { on: p.mic.gate.on });
    S.settings.mic = next;
    S.settings.ducking.enabled = p.ducking.enabled;
    S.settings.ducking.amount = p.ducking.amount;
    if (p.eq) { S.settings.eq = deepMerge(DEFAULTS.eq, p.eq); peqApply(true); }
    S.settings.activeProfile = id;
    if (!auto) { S.autoPrev = null; var cm = currentAutoMatch(); S.manualSig = cm ? cm.id : null; }
    S.groups.forEach(function (g) { applyProfileLevel(g, true); });
    micChanged();
    save();
    fx.setTray({ profile: p.name, ducking: S.settings.ducking.enabled });
    log('Profil aktiv: ' + p.name + (auto ? ' (automatisch)' : ''));
    toast((auto ? 'Automatisch gewechselt: ' : 'Profil aktiv: ') + p.name);
    renderTop(); renderPage();
    osd({ icon: 'layers', tone: 'accent', title: 'Profil: ' + p.name, sub: auto ? 'Automatisch gewechselt' : '' });
  }
  function applyProfileLevel(g, force) {
    // Gemerkte Lautstärke hat Vorrang, wenn eine App neu startet (Windows setzt sie sonst gern zurück)
    var mem = S.settings.rememberVolumes && !force ? S.settings.appVolumes[g.key] : null;
    if (mem != null && !g.system && !g.profiled) { g.profiled = true; if (Math.abs(mem - g.userVol) > 0.01) setAppVolume(g, mem); return; }
    var p = profileById(S.settings.activeProfile);
    if (!p || !p.levels || g.system) return;
    var lv = p.levels[g.cat];
    if (lv == null) return;
    if (force || !g.profiled) { g.profiled = true; setAppVolume(g, lv); }
  }
  function currentAutoMatch() {
    var groups = Array.from(S.groups.values()), match = null;
    S.settings.profiles.forEach(function (p) {
      if (match) return;
      var hit = groups.some(function (g) { return (p.autoApps || []).indexOf(g.key) >= 0; }) || (p.autoCat && groups.some(function (g) { return g.cat === p.autoCat; }));
      if (hit) match = p;
    });
    return match;
  }
  function autoProfileCheck() {
    if (!S.settings.autoProfiles) return;
    var match = currentAutoMatch(), mid = match ? match.id : null;
    if (S.manualSig !== undefined) { if (mid === S.manualSig) return; S.manualSig = undefined; }
    if (match && match.id !== S.settings.activeProfile) {
      if (!S.autoPrev) S.autoPrev = S.settings.activeProfile || '__none';
      applyProfile(match.id, true);
    } else if (!match && S.autoPrev) {
      var back = S.autoPrev; S.autoPrev = null;
      if (back !== '__none') applyProfile(back, true);
    }
  }

  // ------------------------------------------------------------------ Bedienelemente
  function vfader(opts) {
    var f = document.createElement('div');
    f.className = 'vfader'; f.tabIndex = 0; f.setAttribute('role', 'slider'); f.setAttribute('aria-label', opts.label || 'Lautstärke');
    if (opts.color) f.style.setProperty('--c', opts.color);
    if (opts.color2) f.style.setProperty('--c2', opts.color2);
    f.innerHTML = '<div class="slot"></div><div class="cap"></div>';
    var cur = 0;
    function set(v, emit) {
      cur = clamp(v, 0, 1);
      f.style.setProperty('--p', cur);
      f.setAttribute('aria-valuenow', Math.round(cur * 100));
      if (emit && opts.onInput) opts.onInput(cur);
    }
    set(opts.value);
    var pos = function (y) { var r = f.getBoundingClientRect(); return 1 - (y - r.top - 10) / (r.height - 20); };
    var off = null;
    f.addEventListener('pointerdown', function (e) {
      f.setPointerCapture(e.pointerId); f.focus(); e.preventDefault(); f.dragging = true;
      if (opts.onDrag) opts.onDrag(true);
      if (e.target.classList.contains('cap')) off = pos(e.clientY) - cur; else { off = 0; set(pos(e.clientY), true); }
    });
    f.addEventListener('pointermove', function (e) { if (f.hasPointerCapture(e.pointerId)) set(pos(e.clientY) - off, true); });
    var end = function () { if (f.dragging) { f.dragging = false; if (opts.onDrag) opts.onDrag(false); if (opts.onCommit) opts.onCommit(cur); } };
    f.addEventListener('pointerup', end); f.addEventListener('pointercancel', end);
    f.addEventListener('wheel', function (e) { e.preventDefault(); set(cur + (e.deltaY < 0 ? 0.02 : -0.02), true); if (opts.onCommit) opts.onCommit(cur); }, { passive: false });
    f.addEventListener('dblclick', function () { set(opts.reset != null ? opts.reset : 1, true); if (opts.onCommit) opts.onCommit(cur); });
    f.addEventListener('keydown', function (e) {
      var m = { ArrowUp: 0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowLeft: -0.02, PageUp: 0.1, PageDown: -0.1 }[e.key];
      if (m) { e.preventDefault(); set(cur + m, true); if (opts.onCommit) opts.onCommit(cur); }
    });
    f.set = function (v) { if (!f.dragging) set(v); };
    return f;
  }
  function paintRange(r) {
    var min = +r.min, max = +r.max, v = +r.value;
    r.style.setProperty('--p', ((v - min) / (max - min)) * 100 + '%');
  }
  var sw = function (checked, attrs, cls) { return '<button class="switch ' + (cls || '') + '" role="switch" aria-checked="' + !!checked + '" ' + (attrs || '') + '></button>'; };
  var seg = function (name, opts, val, cls) {
    return '<div class="seg ' + (cls || '') + '" role="group">' + opts.map(function (o) {
      return '<button data-seg="' + name + '" data-val="' + esc(o[0]) + '" aria-pressed="' + (String(o[0]) === String(val)) + '">' + (o[2] ? ic(o[2], 'sm') : '') + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  };
  var slider = function (id, label, min, max, step, val, out, cls) {
    return '<label class="slider"><span>' + esc(label) + '</span><input type="range" class="' + (cls || '') + '" id="' + id + '" data-range="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output id="' + id + '-out">' + esc(out) + '</output></label>';
  };
  function deviceOptions(list, selected, extraFirst) {
    return (extraFirst || '') + list.map(function (d) {
      return '<option value="' + esc(d.id) + '"' + (d.id === selected ? ' selected' : '') + '>' + esc(devTitle(d)) + (devSub(d) ? ' · ' + esc(devSub(d)) : '') + '</option>';
    }).join('');
  }

  // ------------------------------------------------------------------ Gerüst
  var NAV = [
    ['mixer', 'Mixer', 'mixer'],
    ['mic', 'Mikrofon', 'mic'],
    ['sounds', 'Soundboard', 'pads'],
    ['eq', 'Equalizer', 'eq'],
    ['devices', 'Geräte', 'devices'],
    ['profiles', 'Profile', 'profiles'],
    ['deck', 'Stream Deck', 'deck'],
    ['settings', 'Einstellungen', 'settings']
  ];
  var TITLES = {
    mixer: ['Mixer', 'Jede App einzeln regeln'],
    mic: ['Mikrofon', 'So klingst du für andere'],
    sounds: ['Soundboard', 'Sounds für dich und deine Zuhörer'],
    eq: ['Equalizer', 'Besserer Klang für alles, was du hörst'],
    devices: ['Geräte', 'Lautsprecher, Kopfhörer, Mikrofone und Interfaces'],
    profiles: ['Profile', 'Ein Klick für Gaming, Stream oder Meeting'],
    deck: ['Stream Deck', 'Fusion-X per Taste und Drehregler steuern'],
    settings: ['Einstellungen', 'Tastenkürzel, Start und mehr']
  };

  function renderNav() {
    $('#nav').innerHTML = NAV.map(function (n) {
      var dot = (n[0] === 'mic' && micNeedsAttention()) || (n[0] === 'settings' && S.update && S.update.state === 'ready') ? '<span class="dot" title="Braucht deine Aufmerksamkeit"></span>' : '';
      return '<button class="nav" data-nav="' + n[0] + '"' + (S.page === n[0] ? ' aria-current="page"' : '') + '>' + ic(n[2], 'lg') + n[1] + dot + '</button>';
    }).join('');
  }
  function micNeedsAttention() { return S.engine.state === 'error' || (S.settings && S.settings.micEnabled && !S.settings.virtualMicActive); }

  function renderTop() {
    renderNav();
    var t = TITLES[S.page];
    $('#pageTitle').textContent = t[0];
    $('#pageSub').textContent = t[1];
    var st = voiceStatus();
    var profs = S.settings.profiles;
    $('#topRight').innerHTML =
      '<button class="badge ' + st.cls + '" data-nav="mic" title="' + esc(st.tip) + '" style="cursor:pointer;background-clip:padding-box">' + ic(st.icon, 'sm') + esc(st.text) + '</button>' +
      '<select class="select" id="topProfile" aria-label="Profil" style="width:auto">' +
        '<option value="">Kein Profil</option>' + profs.map(function (p) { return '<option value="' + p.id + '"' + (p.id === S.settings.activeProfile ? ' selected' : '') + '>Profil: ' + esc(p.name) + '</option>'; }).join('') +
      '</select>' +
      seg('proMode', [['0', 'Einfach'], ['1', 'Profi']], S.settings.proMode ? '1' : '0');
    updateMicButton();
  }
  function voiceStatus() {
    var e = S.engine;
    if (!S.settings.micEnabled) return { cls: '', icon: 'mic', text: 'Stimm-Effekte aus', tip: 'Apps bekommen dein Mikro ohne Bearbeitung' };
    if (e.state === 'error') return { cls: 'bad', icon: 'warn', text: 'Mikrofon-Problem', tip: e.error || '' };
    if (e.state === 'starting') return { cls: '', icon: 'mic', text: 'Startet …', tip: '' };
    if (S.settings.virtualMicActive && e.state === 'on') return { cls: 'ok', icon: 'check', text: 'Stimme geht an alle Apps', tip: 'Discord, OBS & Co. hören deine bearbeitete Stimme' };
    if (S.demo) return { cls: 'amber', icon: 'info', text: 'Browser-Vorschau', tip: 'Beispiel-Geräte und -Apps. Zum echten Steuern die installierte Windows-App starten.' };
    return { cls: 'warn', icon: 'info', text: 'Apps hören dich ohne Effekte', tip: 'Klicken zum Einrichten: Damit Discord & Co. deine bearbeitete Stimme bekommen, braucht es das virtuelle Mikrofon.' };
  }
  function updateMicButton() {
    var m = !!S.settings.mic.muted, b = $('#micBtn');
    b.setAttribute('aria-pressed', m);
    b.setAttribute('aria-label', m ? 'Mikrofon einschalten' : 'Mikrofon stummschalten');
    var p = S.settings.ptt, ptt = p && p.mode !== 'off' && p.vk;
    $('#micIco').innerHTML = ic(m || (ptt && S.pttMutedNow) ? 'micOff' : 'mic', 'lg');
    $('#micLbl').textContent = m ? 'Stumm' : ptt ? (S.pttMutedNow ? (p.mode === 'ptt' ? 'Taste halten' : 'Stumm') : 'Du sprichst') : 'Mikro an';
    b.classList.toggle('pttidle', !m && !!ptt && !!S.pttMutedNow);
  }

  function go(page) {
    S.page = page;
    renderTop();
    renderPage();
    $('#content').scrollTop = 0;
  }
  function renderPage() {
    var v = $('#view');
    refs = {};
    ({ mixer: renderMixer, mic: renderMic, sounds: renderSounds, eq: renderEq, devices: renderDevices, profiles: renderProfiles, deck: renderDeck, settings: renderSettings })[S.page](v);
    $$('input[type=range]', v).forEach(paintRange);
  }
  var refs = {};

  // ------------------------------------------------------------------ Seite: Mixer
  function renderMixer(v) {
    var def = defaultRender();
    var helperDown = !S.backend.ok;
    v.innerHTML =
      (S.demo ? '<div class="notice info">' + ic('info') + '<div><b>Das ist die Browser-Vorschau</b>Hier siehst du Beispiel-Geräte und -Apps, damit du die Oberfläche ausprobieren kannst. Steuern lässt sich dein echter PC nur mit der installierten Windows-App (Fusion-X Audio Setup).</div></div>' : '') +
      (helperDown ? '<div class="notice bad">' + ic('warn') + '<div><b>Windows-Audio nicht verbunden</b>' + esc(S.backend.error || '') + ' App-Lautstärken lassen sich gerade nicht steuern. Starte Fusion-X neu. Falls dein Virenscanner FusionAudioHelper.exe blockiert, erlaube die Datei.</div></div>' : '') +
      '<div class="mixbar">' +
        '<div class="row">' +
          '<label class="row small muted" style="gap:8px">Ausgabe über <select class="select" id="mixOut" style="width:auto;max-width:300px">' + deviceOptions(physicalRenders(), def && def.id) + '</select></label>' +
        '</div>' +
        '<div class="row">' +
          '<span class="row small" style="gap:8px">' + sw(S.settings.ducking.enabled, 'id="duckSw" aria-label="Beim Sprechen leiser"', 'amber') + '<span>Beim Sprechen andere Apps leiser <span class="muted mono">−' + S.settings.ducking.amount + ' %</span></span></span>' +
          '<span class="row small" style="gap:8px">' + sw(S.settings.onlyActive, 'id="activeSw" aria-label="Nur aktive Apps"') + '<span>Nur Apps mit Ton</span></span>' +
          '<span class="row small" style="gap:8px">' + sw(smOn(), 'id="smSw" aria-label="Stream-Mix"', 'violet') + '<span>Stream-Mix</span></span>' +
        '</div>' +
      '</div>' +
      '<div id="smBar"></div>' +
      (smOn() ? '<div class="smlegend"><span><i class="me"></i>Linker Regler: das hörst du</span><span><i class="st"></i>Rechter Regler: das hört dein Stream</span></div>' : '') +
      '<div class="strips' + (smOn() ? ' dual' : '') + '" id="strips"></div>' +
      '<p class="small muted" style="margin:0">Fader ziehen, Mausrad drehen oder Pfeiltasten nutzen. Doppelklick setzt auf 100 %. Über das Feld unter einer App legst du fest, ob sie über Kopfhörer oder Lautsprecher spielt.</p>';
    renderStrips();
    smRenderBar();
  }

  function renderStrips() {
    var box = $('#strips');
    if (!box) return;
    if ($$('.vfader', box).some(function (f) { return f.dragging; })) { setTimeout(renderStrips, 300); return; }
    box.innerHTML = '';
    refs.strips = {};
    // Mausrad über dem Mixer (nicht auf einem Fader) scrollt quer durch die Kanäle
    if (!box.wheelBound) {
      box.wheelBound = true;
      box.addEventListener('wheel', function (e) {
        if (e.target.closest('.vfader') || box.scrollWidth <= box.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        var atStart = box.scrollLeft <= 0 && e.deltaY < 0, atEnd = box.scrollLeft + box.clientWidth >= box.scrollWidth - 1 && e.deltaY > 0;
        if (atStart || atEnd) return;
        e.preventDefault(); box.scrollLeft += e.deltaY;
      }, { passive: false });
    }
    var def = defaultRender();
    // Hauptausgang
    if (def) {
      var m = document.createElement('div');
      m.className = 'strip master' + (smOn() ? ' sm' : '');
      m.innerHTML = '<div class="appicon ic">' + ic(devIcon(def), 'lg') + '</div><div class="nm">Ausgabe</div><div class="cat">' + esc(devTitle(def)) + '</div>' +
        '<div class="fz' + (smOn() ? ' dual' : '') + '"><div class="fs"></div><div class="vmeter" data-meter="master"><div class="cover"></div><div class="pk"></div></div>' + (smOn() ? '<div class="fs2"></div>' : '') + '</div>' +
        (smOn() ? '<div class="vals"><span><small>Ich</small><b class="val" data-val="master">' + pct(def.volume) + '</b></span><span class="s"><small>Stream</small><b class="sval" data-sval="master">' + pct(S.settings.streamMix.master) + '</b></span></div>' : '<div class="val" data-val="master">' + pct(def.volume) + '</div>') +
        '<div class="btns"><button class="iconbtn mute solo" data-act="masterMute" aria-pressed="' + !!def.muted + '" aria-label="Ausgabe stumm">' + ic(def.muted ? 'speakerOff' : 'speaker', 'sm') + '</button></div>';
      var mf = vfader({ value: def.volume, label: 'Gesamtlautstärke', onInput: function (val) { def.volume = val; $('[data-val="master"]').textContent = pct(val); fx.call('setDeviceVolume', { device: def.id, value: val }).catch(function () {}); } });
      $('.fs', m).replaceWith(mf);
      if (smOn()) $('.fs2', m).replaceWith(smFader('Stream gesamt', function () { return S.settings.streamMix.master; }, function (val) { S.settings.streamMix.master = val; $('[data-sval="master"]').textContent = pct(val); }));
      refs.master = { fader: mf, dev: def };
      box.appendChild(m);
    }
    // Deine Stimme
    var mic = S.settings.mic;
    var vs = document.createElement('div');
    vs.className = 'strip voice' + (smOn() ? ' sm' + (S.settings.streamMix.voice.on ? '' : ' offstream') : '');
    var preset = E.PRESETS[mic.preset];
    vs.innerHTML = '<div class="appicon ic" style="color:var(--amber)">' + ic('mic', 'lg') + '</div><div class="nm">Deine Stimme</div><div class="cat">' + esc(preset ? preset.name : 'Eigene Einstellung') + '</div>' +
      '<div class="fz' + (smOn() ? ' dual' : '') + '"><div class="fs"></div><div class="vmeter amber" data-meter="voice"><div class="cover"></div><div class="pk"></div></div>' + (smOn() ? '<div class="fs2"></div>' : '') + '</div>' +
      (smOn() ? '<div class="vals"><span><small>Ich</small><b class="val" data-val="voice">' + fmtDb(mic.gainDb, true) + '</b></span><span class="s"><small>Stream</small><b class="sval" data-sval="voice">' + (S.settings.streamMix.voice.on ? pct(S.settings.streamMix.voice.vol) : 'Aus') + '</b></span></div>' : '<div class="val" data-val="voice">' + fmtDb(mic.gainDb, true) + '</div>') +
      '<div class="btns' + (smOn() ? ' three' : '') + '"><button class="iconbtn mute" data-act="voiceMute" aria-pressed="' + !!mic.muted + '" aria-label="Mikrofon stumm">' + ic(mic.muted ? 'micOff' : 'mic', 'sm') + '</button>' +
      (smOn() ? '<button class="iconbtn smon" data-act="voiceStream" aria-pressed="' + !!S.settings.streamMix.voice.on + '" title="Stimme im Stream-Mix" aria-label="Stimme im Stream-Mix">' + ic('stream', 'sm') + '</button>' : '') +
      '<button class="iconbtn" data-nav="mic" aria-label="Mikrofon-Einstellungen">' + ic('settings', 'sm') + '</button></div>';
    var vf = vfader({ value: (mic.gainDb + 12) / 42, color: '#9bb9ff', color2: '#4a6dff', label: 'Mikrofon-Lautstärke', reset: 12 / 42,
      onInput: function (val) { mic.gainDb = Math.round((val * 42 - 12) * 2) / 2; $('[data-val="voice"]').textContent = fmtDb(mic.gainDb, true); S.engine.update(mic); },
      onCommit: function () { save(); } });
    $('.fs', vs).replaceWith(vf);
    if (smOn()) $('.fs2', vs).replaceWith(smFader('Stimme im Stream', function () { return S.settings.streamMix.voice.vol; }, function (val) { S.settings.streamMix.voice.vol = val; if (S.settings.streamMix.voice.on) $('[data-sval="voice"]').textContent = pct(val); }));
    box.appendChild(vs);
    var div = document.createElement('div'); div.className = 'stripdiv'; box.appendChild(div);

    var groups = Array.from(S.groups.values()).filter(function (g) { return !S.settings.onlyActive || g.active || g.system === false && g.peak > 0.001; });
    groups.sort(function (a, b) {
      var o = { voice: 0, game: 1, music: 2, video: 3, web: 4, stream: 5, launcher: 6, other: 7, system: 9 };
      return (o[a.cat] - o[b.cat]) || a.name.localeCompare(b.name);
    });
    if (!groups.length) {
      var em = document.createElement('div'); em.className = 'empty';
      em.innerHTML = ic('speaker', 'lg') + '<b>Noch keine App spielt Ton ab</b><span>Starte Musik, ein Spiel oder einen Call. Die App erscheint dann automatisch hier.</span>';
      box.appendChild(em);
    }
    groups.forEach(function (g) { box.appendChild(buildStrip(g)); });
  }

  function buildStrip(g) {
    var s = document.createElement('div');
    var dual = smOn(), en = smEntry(g);
    s.className = 'strip' + (dual ? ' sm' + (en.on && !g.system ? '' : ' offstream') : '');
    s.dataset.key = g.key;
    s.style.setProperty('--tint', g.color);
    var outs = physicalRenders();
    var canRoute = S.backend.info && S.backend.info.appOutput && !g.system;
    var playing = Object.keys(g.devs).map(devById).filter(Boolean)[0];
    s.innerHTML = '<span class="duckflag" title="Gerade leiser, weil du sprichst">' + ic('duck', 'sm') + '</span>' + appIconHtml(g) +
      '<div class="nm" title="' + esc(g.name) + '">' + esc(g.name) + '</div><div class="cat">' + esc(C.CATEGORIES[g.cat] || 'App') + '</div>' +
      '<div class="fz' + (dual ? ' dual' : '') + '"><div class="fs"></div><div class="vmeter"><div class="cover"></div><div class="pk"></div></div>' + (dual ? (g.system ? '<div class="fsna" title="Systemsounds lassen sich nicht einzeln in OBS aufnehmen"></div>' : '<div class="fs2"></div>') : '') + '</div>' +
      (dual ? '<div class="vals"><span><small>Ich</small><b class="val">' + pct(g.userVol) + '</b></span><span class="s"><small>Stream</small><b class="sval">' + (g.system ? '–' : en.on ? pct(en.vol) : 'Aus') + '</b></span></div>' : '<div class="val">' + pct(g.userVol) + '</div>') +
      '<div class="btns' + (dual && !g.system ? ' three' : '') + '"><button class="iconbtn mute" data-act="appMute" aria-pressed="' + !!g.muted + '" aria-label="' + esc(g.name) + (dual ? ' für dich stumm' : ' stumm') + '"' + (dual && !g.system ? ' title="Nur für dich stumm, im Stream weiter hörbar"' : '') + '>' + ic(g.muted ? 'speakerOff' : 'speaker', 'sm') + '</button>' +
      (dual && !g.system ? '<button class="iconbtn smon" data-act="appStream" aria-pressed="' + !!en.on + '" title="Im Stream hörbar" aria-label="' + esc(g.name) + ' im Stream">' + ic('stream', 'sm') + '</button>' : '') +
      '<button class="iconbtn duck" data-act="appDuck" aria-pressed="' + isDuckTarget(g) + '" title="Leiser, wenn du sprichst" aria-label="' + esc(g.name) + ' leiser beim Sprechen">' + ic('duck', 'sm') + '</button></div>' +
      (canRoute ? '<select class="select outsel" data-act="appOut" aria-label="Ausgabegerät für ' + esc(g.name) + '" title="Wo soll ' + esc(g.name) + ' zu hören sein?">' +
        deviceOptions(outs, g.output || '', '<option value="">Standard</option>') + '</select>'
        : '<div class="cat" style="margin-top:0">' + esc(playing ? devTitle(playing) : '') + '</div>');
    var f = vfader({ value: g.userVol, label: g.name + ' Lautstärke',
      onDrag: function (on) { g.dragging = on; },
      onInput: function (val) { $('.val', s).textContent = pct(val); setAppVolume(g, val); } });
    $('.fs', s).replaceWith(f);
    var sf = null;
    if (dual && !g.system) { sf = smFader(g.name + ' im Stream', function () { return smEntry(g).vol; }, function (val) { smSetEntry(g, { vol: val }); if (smEntry(g).on) $('.sval', s).textContent = pct(val); }); $('.fs2', s).replaceWith(sf); }
    refs.strips[g.key] = { el: s, fader: f, sfader: sf, cover: $('.vmeter .cover', s), pk: $('.vmeter .pk', s), val: $('.val', s), g: g };
    syncStrip(g);
    return s;
  }
  function syncStrip(g) {
    var r = refs.strips && refs.strips[g.key];
    if (!r) return;
    r.fader.set(g.userVol);
    if (!r.fader.dragging) r.val.textContent = pct(g.userVol);
    var mb = $('[data-act="appMute"]', r.el);
    mb.setAttribute('aria-pressed', !!g.muted); mb.innerHTML = ic(g.muted ? 'speakerOff' : 'speaker', 'sm');
    $('[data-act="appDuck"]', r.el).setAttribute('aria-pressed', isDuckTarget(g));
    r.el.classList.toggle('ducked', !!g.ducked);
    r.el.classList.toggle('idle', !g.active && g.peak < 0.001);
    var sel = $('[data-act="appOut"]', r.el);
    if (sel && document.activeElement !== sel) sel.value = g.output || '';
    if (r.sfader) {
      var en = smEntry(g);
      r.sfader.set(en.vol);
      $('.sval', r.el).textContent = en.on ? pct(en.vol) : 'Aus';
      var sb = $('[data-act="appStream"]', r.el); if (sb) sb.setAttribute('aria-pressed', !!en.on);
      r.el.classList.toggle('offstream', !en.on);
    }
  }
  function smFader(label, get, set) {
    return vfader({ value: get(), label: label, color: '#c4a6ff', color2: '#7c5cff', onInput: set, onCommit: function () { save(); smTick(); } });
  }

  // ------------------------------------------------------------------ Seite: Mikrofon
  function renderMic(v) {
    var st = S.settings, mic = st.mic, pro = st.proMode, eng = S.engine;
    var inDev = devById(mic.inputId);
    var isIf = inDev && inDev.cls.interface;
    var preset = mic.preset;
    var stereo = (eng.channels >= 2) || isIf;
    var errHtml = eng.state === 'error' ? '<div class="notice bad">' + ic('warn') + '<div><b>Mikrofon läuft nicht</b>' + esc(eng.error) + '<div class="act"><button class="btn sm" data-act="engineRetry">' + ic('refresh', 'sm') + 'Erneut versuchen</button></div></div></div>' : '';
    var demoHint = S.demo && eng.state !== 'on' ? '<div class="notice info">' + ic('info') + '<div><b>Vorschau mit simulierten Geräten</b>Hier gibt es keinen echten Mikrofonzugriff. In der installierten Windows-App arbeitet diese Seite mit deinem echten Mikro.</div></div>' : '';

    v.innerHTML =
      errHtml + demoHint +
      '<div class="split">' +
      '<div class="stack">' +
        '<section class="card voicehero">' +
          '<div class="chead"><div><h2>' + ic('mic') + 'Deine Stimme</h2><p class="lead">Wähle dein Mikrofon und stell die Lautstärke so ein, dass der Balken beim normalen Sprechen im markierten Bereich landet.</p></div>' +
            '<div class="row">' + sw(st.micEnabled, 'id="micEnabled" aria-label="Stimm-Effekte"', 'amber') + '<span class="small">Effekte</span></div></div>' +
          '<div class="row" style="align-items:flex-end;gap:14px">' +
            '<label style="display:grid;gap:6px;flex:1 1 280px;min-width:0"><span class="eyebrow">Mikrofon</span><select class="select" id="micInput">' + deviceOptions(physicalCaptures(), mic.inputId) + '</select></label>' +
            (stereo ? '<div style="display:grid;gap:6px"><span class="eyebrow">Eingang ' + (mic.channel === 'auto' && eng.effectiveChannel ? '<span class="muted" style="letter-spacing:0;text-transform:none">· erkannt: ' + chanName(eng.effectiveChannel) + '</span>' : '') + '</span>' +
              seg('channel', [['auto', 'Automatisch', 'wand'], ['left', 'Eingang 1'], ['right', 'Eingang 2'], ['mix', 'Beide']], mic.channel, 'amber') + '</div>' : '') +
          '</div>' +
          '<div class="meters">' +
            '<div class="meterline"><span>Eingang</span><div class="hmeter big" id="mInWrap"><div class="zone" style="left:' + dbFrac(-18) * 100 + '%;width:' + (dbFrac(-6) - dbFrac(-18)) * 100 + '%"></div><div class="fill" id="mIn"></div><div class="pk" id="mInPk"></div><div class="seg-mask"></div></div><output id="mInVal">−∞</output></div>' +
            '<div class="meterline"><span>So hören dich andere</span><div class="hmeter" id="mOutWrap"><div class="fill" id="mOut"></div><div class="pk" id="mOutPk"></div><div class="seg-mask"></div></div><output id="mOutVal">−∞</output></div>' +
            '<div class="meterline"><span></span><div class="scale"><span>−60</span><span>−48</span><span>−36</span><span>−24</span><span>−12</span><span>0 dB</span></div><span></span></div>' +
          '</div>' +
          '<div class="small" id="levelHint" style="min-height:20px"></div>' +
          slider('gainDb', 'Mikro-Lautstärke', -12, 30, 0.5, mic.gainDb, fmtDb(mic.gainDb, true), 'amber') +
          (inDev ? slider('winLevel', 'Windows-Pegel', 0, 1, 0.01, inDev.volume, pct(inDev.volume), 'amber') : '') +
          (pro ? slider('outGainDb', 'Ausgangspegel', -12, 12, 0.5, mic.outGainDb, fmtDb(mic.outGainDb, true), 'amber') : '') +
          '<div class="row">' +
            '<button class="btn amber" data-act="micCheck">' + ic('wand', 'sm') + 'Mikro-Check starten</button>' +
            '<button class="btn" data-act="testRec">' + ic('rec', 'sm') + 'Testaufnahme vorher/nachher</button>' +
            (pro && eng.state === 'on' ? '<span class="small muted mono" id="latency"></span>' : '') +
          '</div>' +
        '</section>' +
        '<section class="card"><div class="chead"><div><h2>' + ic('star') + 'Klang-Vorlagen</h2><p class="lead">Ein Klick stellt alle Effekte passend ein. Danach kannst du alles feinjustieren.</p></div></div>' +
          '<div class="presetrow">' + Object.keys(E.PRESETS).map(function (k) { var p = E.PRESETS[k]; return '<button class="preset" data-preset="' + k + '" aria-pressed="' + (preset === k) + '"><b>' + esc(p.name) + '</b><span>' + esc(p.desc) + '</span></button>'; }).join('') + '</div>' +
        '</section>' +
        '<div class="grid cols2">' + fxCards(mic, pro, isIf) + '</div>' +
      '</div>' +
      '<div class="stack">' + virtualCard() + pttCard() + micTipCard(inDev) +
        '<section class="card"><h2>' + ic('ear') + 'Wer hört gerade zu?</h2><p class="lead">Apps, die gerade ein Mikrofon benutzen.</p><div class="applist" id="captureApps" style="margin-top:10px"></div></section>' +
      '</div>' +
      '</div>';
    $$('input[type=range]', v).forEach(function (r) { r.classList.add('amber'); });
    refs.mic = { in: $('#mIn'), inPk: $('#mInPk'), inVal: $('#mInVal'), out: $('#mOut'), outPk: $('#mOutPk'), outVal: $('#mOutVal'), hint: $('#levelHint'), gate: $('#gateLive'), gr: $('#compGr'), deess: $('#deessGr'), lat: $('#latency') };
    refs.micPk = { in: -100, out: -100 };
    renderCaptureApps();
    if (pro) setupEqCanvas();
  }
  function chanName(c) { return { left: 'Eingang 1', right: 'Eingang 2', mix: 'beide', mono: 'Mono' }[c] || c; }

  var DENOISE_TXT = {
    off: 'Keine Rauschunterdrückung.',
    light: 'Entfernt gleichmäßiges Rauschen wie Lüfter oder Brummen. Braucht kaum Leistung.',
    ai: 'KI filtert Tastatur, Lüfter und Straßenlärm. Für die meisten die beste Wahl.',
    studio: 'Stärkstes KI-Modell. Holt auch Hunde, Kinder und laute Klicks raus, braucht mehr Rechenleistung.'
  };

  function fxCards(mic, pro, isIf) {
    var gateSens = Math.round((mic.gate.open + 70) / 40 * 100);
    var cards = [];
    cards.push(fxCard('denoise', 'sparkle', 'Rauschunterdrückung', DENOISE_TXT[mic.denoise], true, null,
      seg('denoise', [['off', 'Aus'], ['light', 'Leicht'], ['ai', 'KI'], ['studio', 'KI Studio']], mic.denoise, 'amber')));
    cards.push(fxCard('gate', 'gate', 'Störgeräusch-Sperre', 'Schaltet dein Mikro in Sprechpausen stumm, damit Atmen und Tippen nicht durchkommen.', mic.gate.on, 'gate.on',
      '<div class="row between"><span class="livepill" id="gateLive"><i></i><span>Geschlossen</span></span><button class="btn sm ghost" data-act="gateAuto">' + ic('wand', 'sm') + 'Automatisch einstellen</button></div>' +
      slider('gateSens', 'Schwelle', 0, 100, 1, gateSens, fmtDb(mic.gate.open)) +
      (pro ? slider('gateRelease', 'Schließzeit', 40, 600, 10, mic.gate.releaseMs, mic.gate.releaseMs + ' ms') + slider('gateHold', 'Haltezeit', 20, 600, 10, mic.gate.holdMs, mic.gate.holdMs + ' ms') + slider('gateFloor', 'Absenkung', -80, -6, 1, mic.gate.floorDb, fmtDb(mic.gate.floorDb)) : '')));
    cards.push(fxCard('eq', 'eq', 'Klang', pro ? 'Punkte in der Kurve ziehen. Mausrad auf einem Mittenpunkt ändert die Breite.' : 'Mehr Bass für Wärme, mehr Stimme für Verständlichkeit, mehr Glanz für Klarheit.', mic.eq.on, 'eq.on',
      pro ? '<canvas class="eqcanvas" id="eqCanvas"></canvas>' + slider('hpfFreq', 'Trittschall-Filter', 20, 300, 5, mic.hpf.on ? mic.hpf.freq : 20, mic.hpf.on ? mic.hpf.freq + ' Hz' : 'Aus')
        : slider('eqLow', 'Bass', -12, 12, 0.5, mic.eq.low.g, fmtDb(mic.eq.low.g, true)) + slider('eqMid', 'Stimme', -12, 12, 0.5, mic.eq.mid2.g, fmtDb(mic.eq.mid2.g, true)) + slider('eqHigh', 'Glanz', -12, 12, 0.5, mic.eq.high.g, fmtDb(mic.eq.high.g, true))));
    cards.push(fxCard('comp', 'comp', 'Gleichmäßige Lautstärke', 'Leise Stellen lauter, laute Stellen sanfter. Niemand muss am Regler drehen, wenn du lachst oder flüsterst.', mic.comp.on, 'comp.on',
      slider('compAmount', 'Stärke', 0, 100, 1, mic.comp.amount, mic.comp.amount + ' %') +
      (pro ? slider('compThr', 'Schwelle', -50, 0, 1, mic.comp.thr, fmtDb(mic.comp.thr)) + slider('compRatio', 'Verhältnis', 1, 12, 0.1, mic.comp.ratio, String(mic.comp.ratio).replace('.', ',') + ' : 1') +
        slider('compAtt', 'Ansprechzeit', 1, 80, 1, mic.comp.att, mic.comp.att + ' ms') + slider('compRel', 'Rückkehr', 30, 800, 10, mic.comp.rel, mic.comp.rel + ' ms') + slider('compMakeup', 'Aufholen', 0, 18, 0.5, mic.comp.makeup, fmtDb(mic.comp.makeup, true)) : '') +
      '<div class="row small muted" style="gap:10px"><span style="min-width:96px">Arbeitet gerade</span><div class="grbar" style="flex:1"><i id="compGr"></i></div></div>'));
    cards.push(fxCard('deess', 'deess', 'Zischlaute zähmen', 'Macht scharfe S- und Sch-Laute weicher. Hilft besonders bei hellen Mikrofonen.', mic.deess.on, 'deess.on',
      slider('deessAmount', 'Stärke', 0, 100, 1, mic.deess.amount, mic.deess.amount + ' %') +
      (pro ? slider('deessFreq', 'Frequenz', 3500, 10000, 100, mic.deess.freq, (mic.deess.freq / 1000).toFixed(1).replace('.', ',') + ' kHz') : '') +
      '<div class="row small muted" style="gap:10px"><span style="min-width:96px">Arbeitet gerade</span><div class="grbar" style="flex:1"><i id="deessGr"></i></div></div>'));
    cards.push(fxCard('limiter', 'shield', 'Übersteuerungsschutz', 'Verhindert Verzerrungen, wenn du plötzlich laut wirst oder schreist.', mic.limiter.on, 'limiter.on', ''));
    var mons = physicalRenders();
    cards.push(fxCard('monitor', 'headphones', 'Mithören', isIf ? 'Hör dich selbst mit allen Effekten. Für Mithören ohne jede Verzögerung nutze die Direct-Monitor-Funktion an deinem Interface.' : 'Hör dich selbst mit allen Effekten, um den Klang zu beurteilen. Leichte Verzögerung ist normal.', mic.monitor.on, 'monitor.on',
      '<label class="slider"><span>Abspielen über</span><select class="select" id="monDev">' + deviceOptions(mons, mic.monitor.device, '<option value="">Standard-Ausgabe</option>') + '</select><span></span></label>' +
      slider('monVol', 'Lautstärke', 0, 1, 0.01, mic.monitor.volume, pct(mic.monitor.volume), 'amber')));
    return cards.join('');
  }
  function fxCard(id, icon, title, desc, on, togglePath, body) {
    return '<section class="card fx' + (on ? '' : ' off') + '" data-fx="' + id + '"><div class="fxhead"><div class="ico">' + ic(icon) + '</div><div><h3>' + esc(title) + '</h3><p>' + esc(desc) + '</p></div>' +
      (togglePath ? sw(on, 'data-toggle="' + togglePath + '" aria-label="' + esc(title) + '"', 'amber') : '') + '</div>' + (body ? '<div class="fxbody">' + body + '</div>' : '') + '</section>';
  }

  function virtualCard() {
    var vp = virtualPair(), st = S.settings;
    var head = '<section class="card"><h2>' + ic('route') + 'Wohin geht deine Stimme?</h2>';
    if (st.virtualMicActive && vp) {
      return head + '<div class="notice ok" style="margin-top:12px">' + ic('check') + '<div><b>Alle Apps hören deine bearbeitete Stimme</b>Windows nutzt jetzt „' + esc(devTitle(vp.inp)) + '“ als Mikrofon. In Discord, OBS, Teams und Spielen das Eingabegerät einfach auf <b style="display:inline">Standard</b> lassen.</div></div>' +
        '<div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="vmOff">Ausschalten</button></div></section>';
    }
    if (vp) {
      return head + '<p class="lead">Gerade hören andere Apps dein Mikro noch ohne Effekte. Mit einem Klick bekommen alle Apps deine bearbeitete Stimme.</p>' +
        '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="vmOn">' + ic('check', 'sm') + 'Für alle Apps aktivieren</button></div>' +
        '<p class="small muted" style="margin:10px 0 0">Beim Beenden stellt Fusion-X dein ursprüngliches Mikrofon automatisch wieder ein.</p></section>';
    }
    return head + '<p class="lead">Damit Discord, OBS und Co. deine verbesserte Stimme hören, braucht Windows einen virtuellen Mikrofon-Eingang. Fusion-X installiert ihn für dich, das dauert etwa eine Minute.</p>' +
      '<div class="cablebox" style="margin-top:14px">' + cableBoxInner() + '</div></section>';
  }

  var MIC_TIPS = {
    usbmic: { badge: 'USB-Mikrofon erkannt', icon: 'mic', tips: [
      'Sprich aus 10 bis 15 cm Abstand. Viele USB-Mikros nehmen von vorne auf, nicht von oben – ein Blick ins Handbuch lohnt sich.',
      'Hat dein Mikro einen eigenen Gain-Regler, stell ihn so ein, dass „Mikro-Check“ nicht vor Übersteuerung warnt.',
      'Ein Popschutz oder Schaumstoff-Windschutz nimmt harte P- und B-Laute raus.'] },
    headset: { badge: 'Headset-Mikro erkannt', icon: 'headphones', tips: [
      'Den Mikrofon-Arm etwa zwei Finger breit neben den Mundwinkel stellen, nicht direkt davor. So kommen keine Atemgeräusche durch.',
      'Headset-Mikros nehmen viel Tastatur auf. „KI Studio“ bei der Rauschunterdrückung holt das raus.',
      'Viele Headset-Programme (z. B. für HyperX, Razer, SteelSeries) haben eigene Mikro-Effekte. Schalte sie dort aus, damit nichts doppelt bearbeitet wird.'] },
    builtin: { badge: 'Eingebautes Mikro', icon: 'mic', tips: [
      'Laptop-Mikros hören Tastatur und Lüfter besonders laut. „KI Studio“ und die Störgeräusch-Sperre machen hier den größten Unterschied.',
      'Fusion-X hebt den Windows-Mikrofonpegel beim Mikro-Check an, falls er zu niedrig steht.',
      'Windows-eigene Audioverbesserungen (Einstellungen → Sound → Mikrofon) können mit Fusion-X doppelt arbeiten. Klingt es komisch, schalte sie dort aus.'] },
    onboard: { badge: 'Mikro an der Klinke', icon: 'mic', tips: [
      'Klinken-Mikros am PC sind oft sehr leise. Fusion-X stellt den Windows-Pegel beim Mikro-Check auf 100 %.',
      'Reicht das nicht: Systemsteuerung → Sound → Aufnahme → Mikrofon → Eigenschaften → Pegel → „Mikrofonverstärkung“ auf +10 dB.',
      'Brummt es? Das kommt oft von der Front-Buchse. Die Buchse hinten am Mainboard ist meist sauberer.'] },
    webcam: { badge: 'Webcam-Mikro', icon: 'webcam', tips: [
      'Webcam-Mikros sind weit weg vom Mund. Rauschunterdrückung auf „KI Studio“ und Mikro-Lautstärke etwas höher stellen.',
      'Hast du ein Headset oder Mikro? Das klingt fast immer deutlich besser als die Webcam.'] },
    bluetooth: { badge: 'Bluetooth-Mikro', icon: 'bluetooth', warn: true, tips: [
      'Solange das Mikro eines Bluetooth-Headsets an ist, schaltet Windows den Ton auf Telefonqualität – auch für Musik und Spiele.',
      'Besser: Bluetooth-Kopfhörer nur zum Hören nutzen und das eingebaute Mikro oder ein USB-Mikro zum Sprechen auswählen. Fusion-X macht daraus trotzdem eine klare Stimme.'] },
    usb: { badge: 'USB-Audiogerät', icon: 'mic', tips: ['Starte den Mikro-Check, um Lautstärke und Effekte passend einzustellen.'] }
  };
  function micTipCard(dev) {
    if (!dev) return '';
    if (!dev.cls.interface) {
      var t = MIC_TIPS[dev.cls.kind] || MIC_TIPS.usb;
      return '<section class="card"><div class="ifcard"><div class="ifbadge">' + ic(t.icon, 'lg') + '</div><div><span class="badge ' + (t.warn ? 'warn' : 'amber') + '">' + esc(t.badge) + '</span><h2 style="margin-top:8px">' + esc(devTitle(dev)) + '</h2>' +
        '<p class="lead">' + esc([devSub(dev), devFormat(dev)].filter(Boolean).join(' · ')) + '</p></div></div><ul class="tips">' + t.tips.map(function (x) { return '<li>' + ic(t.warn ? 'warn' : 'info', 'sm') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
        '<p class="small muted" style="margin:12px 0 0">Ein Audio-Interface brauchst du nicht. Alle Effekte funktionieren mit jedem Mikrofon.</p></section>';
    }
    return interfaceTipCard(dev);
  }
  function pttCard() {
    var p = S.settings.ptt;
    return '<section class="card"><h2>' + ic('key') + 'Sprechtaste</h2><p class="lead">Dein Mikro ist nur offen, solange du eine Taste hältst. Gilt für alle Spiele und Apps gleichzeitig, auch mit den Seitentasten deiner Maus.</p>' +
      '<div style="margin-top:12px">' + seg('pttMode', [['off', 'Aus'], ['ptt', 'Halten = sprechen'], ['ptm', 'Halten = stumm']], p.mode) + '</div>' +
      (p.mode !== 'off' ? '<div style="margin-top:6px">' +
        srow('Taste', 'Klicken, dann Taste oder Maustaste drücken', '<button class="keycap" id="pttKey">' + esc(p.vk ? p.label : 'Festlegen') + '</button>') +
        slider('pttRelease', 'Nachlauf', 0, 600, 10, p.release, p.release + ' ms') +
        srow('Signalton', 'Kurzer Ton beim Drücken und Loslassen, nur für dich', sw(p.beep, 'id="pttBeep"')) +
        '<p class="small muted" style="margin:8px 0 0">Läuft ein Spiel mit Administratorrechten, starte Fusion-X ebenfalls als Administrator, damit die Taste dort ankommt.</p></div>' : '') +
      '</section>';
  }
  function recordPttKey(btn) {
    btn.classList.add('rec'); btn.textContent = 'Taste drücken …';
    var done = function (vk, label) {
      document.removeEventListener('keydown', onKey, true); document.removeEventListener('mousedown', onMouse, true);
      btn.classList.remove('rec');
      if (vk) { S.settings.ptt.vk = vk; S.settings.ptt.label = label; save(); pttWatch(); toast('Sprechtaste: ' + label); }
      btn.textContent = S.settings.ptt.vk ? S.settings.ptt.label : 'Festlegen';
      updateMicButton();
    };
    var onKey = function (e) {
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Escape') { done(0); return; }
      var vk = CODE_VK[e.code] || e.keyCode;
      done(vk, vkName(vk, e.key.length === 1 ? e.key.toUpperCase() : e.key));
    };
    var onMouse = function (e) {
      if (e.button === 0 || e.button === 2) return;
      e.preventDefault(); e.stopPropagation();
      var vk = e.button === 1 ? 4 : e.button === 3 ? 5 : e.button === 4 ? 6 : 0;
      if (vk) done(vk, vkName(vk));
    };
    setTimeout(function () { document.addEventListener('keydown', onKey, true); document.addEventListener('mousedown', onMouse, true); }, 50);
  }

  // Automatische Installation von VB-CABLE
  var CABLE_NOTE = '<p class="small muted" style="margin:10px 0 0">VB-CABLE ist Donationware von VB-Audio. Fusion-X lädt es direkt von der offiziellen Seite und prüft die digitale Signatur. Windows fragt einmal nach deiner Erlaubnis. Wer VB-CABLE unterstützen möchte: <a href="https://vb-audio.com/Cable/" target="_blank" rel="noopener" style="color:var(--accent)">vb-audio.com</a></p>';
  function cableBoxInner() {
    var c = S.cable;
    var bar = function (p) { return '<div class="progress" style="margin:10px 0 6px"><i style="width:' + Math.round((p || 0) * 100) + '%;background:var(--accent)"></i></div>'; };
    if (!c) return '<div class="row"><button class="btn primary" data-act="cableInstall">' + ic('plus', 'sm') + 'Automatisch installieren</button><a class="btn ghost" href="https://vb-audio.com/Cable/" target="_blank" rel="noopener">' + ic('ext', 'sm') + 'Selbst herunterladen</a><button class="btn ghost" data-act="recheck">' + ic('refresh', 'sm') + 'Erneut prüfen</button></div>' + CABLE_NOTE;
    if (c.phase === 'download' || c.phase === 'start') return '<b>VB-CABLE wird heruntergeladen …</b>' + bar(c.pct) + '<span class="small muted">' + (c.pct ? Math.round(c.pct * 100) + ' %' : 'Verbinde mit vb-audio.com') + '</span>';
    if (c.phase === 'extract' || c.phase === 'verify') return '<b>Prüfe die Signatur von VB-Audio …</b>' + bar(1);
    if (c.phase === 'install') return '<div class="notice info">' + ic('info') + '<div><b>Bitte die Windows-Abfragen bestätigen</b>Windows fragt jetzt, ob die Installation Änderungen vornehmen darf, und danach, ob der Treiber installiert werden soll. Beides mit „Ja“ bzw. „Installieren“ bestätigen.</div></div>';
    if (c.phase === 'done') return '<div class="notice ok">' + ic('check') + '<div><b>VB-CABLE ist installiert</b>Deine bearbeitete Stimme geht jetzt an alle Apps.</div></div>';
    if (c.phase === 'reboot') return '<div class="notice warn">' + ic('info') + '<div><b>Fast fertig: einmal neu starten</b>Der Treiber ist installiert, Windows zeigt das neue Gerät aber erst nach einem Neustart an. Danach schaltet Fusion-X dein virtuelles Mikro automatisch ein.<div class="act"><button class="btn sm" data-act="recheck">' + ic('refresh', 'sm') + 'Jetzt prüfen</button></div></div></div>';
    if (c.phase === 'error') return '<div class="notice bad">' + ic('warn') + '<div><b>Das hat nicht geklappt</b>' + esc(c.error || '') + '<div class="act"><button class="btn sm" data-act="cableInstall">' + ic('refresh', 'sm') + 'Nochmal versuchen</button><a class="btn sm" href="https://vb-audio.com/Cable/" target="_blank" rel="noopener">' + ic('ext', 'sm') + 'Selbst herunterladen</a></div></div></div>';
    return '';
  }
  function renderCableState() { $$('.cablebox').forEach(function (el) { el.innerHTML = cableBoxInner(); }); }
  async function autoInstallCable() {
    if (S.demo || !fx.installVbCable) { toast('In der Vorschau nicht verfügbar. In der installierten Windows-App geht das mit einem Klick.', true); return; }
    if (S.cable && /download|extract|verify|install|start/.test(S.cable.phase)) return;
    S.cable = { phase: 'start', pct: 0 }; renderCableState();
    var off = fx.onVbCable(function (p) { S.cable = p; renderCableState(); });
    var r = await fx.installVbCable();
    if (off) off();
    log('VB-CABLE: ' + (r.ok ? (r.found ? 'installiert' : 'installiert, Neustart nötig') : r.error));
    if (r.ok && r.found) {
      S.cable = { phase: 'done' }; renderCableState();
      setDevices(await fx.devices());
      await activateVirtualMic();
    } else if (r.ok) {
      S.settings.virtualMicWanted = true; save();
      S.cable = { phase: 'reboot' }; renderCableState();
    } else {
      S.cable = { phase: 'error', error: r.error }; renderCableState();
    }
  }

  function interfaceTipCard(dev) {
    if (!dev || !dev.cls.interface) return '';
    var it = (S.interfaces || []).filter(function (i) { return i.name === (dev.adapter || dev.name); })[0];
    var tips = [
      ['Den Gain stellst du am ' + esc(dev.cls.brand) + '-Gerät ein. Beim lauten Sprechen sollte die Pegelanzeige am Gerät grün bleiben, nie rot.'],
      ['Liegt dein Mikro nur an Eingang 1? Fusion-X erkennt das automatisch und legt deine Stimme auf beide Seiten. In Discord hört man dich dann nicht mehr nur links.'],
      ['Kondensatormikrofon? Dann am Interface 48V (Phantomspeisung) einschalten.']
    ];
    if (it && it.asio) tips.push(['ASIO-Treiber gefunden: „' + esc(it.asio) + '“. In Musikprogrammen wie FL Studio oder Ableton auswählen. Solange eine DAW das Interface per ASIO exklusiv nutzt, kann Windows es eventuell nicht verwenden.']);
    return '<section class="card"><div class="ifcard"><div class="ifbadge">' + ic('iface', 'lg') + '</div><div><span class="badge accent">Audio-Interface erkannt</span><h2 style="margin-top:8px">' + esc(devTitle(dev)) + '</h2>' +
      '<p class="lead">' + esc(devFormat(dev)) + '</p></div></div><ul class="tips">' + tips.map(function (t) { return '<li>' + ic('info', 'sm') + '<span>' + t[0] + '</span></li>'; }).join('') + '</ul></section>';
  }

  function renderCaptureApps() {
    var box = $('#captureApps');
    if (!box) return;
    var vp = virtualPair();
    if (!S.captureApps.length) { box.innerHTML = '<p class="small muted" style="margin:0">Gerade nutzt keine andere App ein Mikrofon.</p>'; return; }
    box.innerHTML = S.captureApps.map(function (a) {
      var devs = Object.keys(a.devices).map(devById).filter(Boolean);
      var direct = S.settings.virtualMicActive && vp && devs.some(function (d) { return !d.cls.virtual; });
      var g = { key: a.key, name: a.info.name, color: a.info.color, system: false };
      return '<div class="appline">' + appIconHtml(g) + '<span>' + esc(a.info.name) + '<br><small class="muted">' + esc(devs.map(devTitle).join(', ')) + '</small></span>' +
        (direct ? '<span class="badge warn" title="Diese App nutzt dein Mikro direkt und bekommt keine Effekte. Stell in der App das Eingabegerät auf „Standard“.">ohne Effekte</span>' : (vp && devs.some(function (d) { return d.cls.virtual; }) ? '<span class="badge ok">mit Effekten</span>' : '')) + '</div>';
    }).join('');
  }

  // EQ-Kurve (Profi-Modus)
  var BANDS = { low: { n: 'Bass', c: '#6c9bff', t: 'lowshelf', r: [40, 400] }, mid1: { n: 'Wärme', c: '#f2d34a', t: 'peaking', r: [120, 1200] }, mid2: { n: 'Stimme', c: '#2ee6d6', t: 'peaking', r: [1000, 8000] }, high: { n: 'Glanz', c: '#b493ff', t: 'highshelf', r: [3000, 16000] } };
  function biquad(type, f, g, q) {
    var fs = 48000, A = Math.pow(10, g / 40), w = 2 * Math.PI * f / fs, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * (q || 0.707)), b0, b1, b2, a0, a1, a2;
    if (type === 'peaking') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
    else if (type === 'lowshelf') { var s = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) - (A - 1) * cs + s); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - s); a0 = (A + 1) + (A - 1) * cs + s; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - s; }
    else if (type === 'highshelf') { var s2 = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) + (A - 1) * cs + s2); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - s2); a0 = (A + 1) - (A - 1) * cs + s2; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - s2; }
    else { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  }
  function magDb(c, f) {
    var w = 2 * Math.PI * f / 48000, cw = Math.cos(w), sw2 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    var nr = c[0] + c[1] * cw + c[2] * c2, ni = -(c[1] * sw2 + c[2] * s2), dr = 1 + c[3] * cw + c[4] * c2, di = -(c[3] * sw2 + c[4] * s2);
    return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di));
  }
  var eqDrag = null;
  function eqGeom(cv) {
    var W = cv.clientWidth, H = cv.clientHeight, l0 = Math.log10(20), l1 = Math.log10(20000);
    return { W: W, H: H, x: function (f) { return (Math.log10(f) - l0) / (l1 - l0) * W; }, f: function (x) { return Math.pow(10, l0 + x / W * (l1 - l0)); }, y: function (g) { return H / 2 - g / 15 * (H / 2 - 14); }, g: function (y) { return (H / 2 - y) / (H / 2 - 14) * 15; } };
  }
  function setupEqCanvas() {
    var cv = $('#eqCanvas');
    if (!cv) return;
    var mic = S.settings.mic;
    cv.addEventListener('pointerdown', function (e) {
      var G = eqGeom(cv), r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, best = null, bd = 22;
      Object.keys(BANDS).forEach(function (k) { var b = mic.eq[k], d = Math.hypot(G.x(b.f) - mx, G.y(b.g) - my); if (d < bd) { bd = d; best = k; } });
      if (best) { eqDrag = best; cv.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    cv.addEventListener('pointermove', function (e) {
      if (!eqDrag) return;
      var G = eqGeom(cv), r = cv.getBoundingClientRect(), b = mic.eq[eqDrag], R = BANDS[eqDrag].r;
      var f = clamp(G.f(clamp(e.clientX - r.left, 0, G.W)), R[0], R[1]);
      b.f = f < 1000 ? Math.round(f / 5) * 5 : Math.round(f / 50) * 50;
      b.g = clamp(Math.round(G.g(e.clientY - r.top) * 2) / 2, -12, 12);
      mic.preset = null;
      S.engine.update(mic); drawEq();
    });
    var end = function () { if (eqDrag) { eqDrag = null; save(); drawEq(); } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', function (e) {
      var G = eqGeom(cv), r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      var k = ['mid1', 'mid2'].filter(function (k) { var b = mic.eq[k]; return Math.hypot(G.x(b.f) - mx, G.y(b.g) - my) < 26; })[0];
      if (!k) return;
      e.preventDefault();
      mic.eq[k].q = clamp(Math.round(mic.eq[k].q * (e.deltaY < 0 ? 1.12 : 0.89) * 10) / 10, 0.3, 6);
      S.engine.update(mic); drawEq(); save();
    }, { passive: false });
    drawEq();
  }
  function drawEq() {
    var cv = $('#eqCanvas');
    if (!cv) return;
    var dpr = window.devicePixelRatio || 1, G = eqGeom(cv), W = G.W, H = G.H, mic = S.settings.mic;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.font = '10px JBM, "JetBrains Mono", monospace';
    [50, 100, 200, 500, 1000, 2000, 5000, 10000].forEach(function (f) { var x = Math.round(G.x(f)) + 0.5; g.strokeStyle = '#122133'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); g.fillStyle = '#5b6672'; g.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), x + 3, H - 6); });
    [-12, -6, 0, 6, 12].forEach(function (d) { var y = Math.round(G.y(d)) + 0.5; g.strokeStyle = d === 0 ? '#23364d' : '#122133'; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.fillStyle = '#5b6672'; g.fillText((d > 0 ? '+' : '') + d, 4, y - 3); });
    var co = Object.keys(BANDS).map(function (k) { var b = mic.eq[k]; return biquad(BANDS[k].t, b.f, mic.eq.on ? b.g : 0, BANDS[k].t === 'peaking' ? b.q : 0.707); });
    if (mic.hpf.on) co.push(biquad('hp', mic.hpf.freq, 0, 0.707));
    g.beginPath();
    for (var x = 0; x <= W; x += 2) { var s = 0; co.forEach(function (c) { s += magDb(c, G.f(x)); }); var y = G.y(clamp(s, -15, 15)); if (x) g.lineTo(x, y); else g.moveTo(x, y); }
    g.lineWidth = 2.5; g.strokeStyle = mic.eq.on ? '#6c9bff' : '#5b6672'; g.stroke();
    g.lineTo(W, G.y(0)); g.lineTo(0, G.y(0)); g.closePath(); g.fillStyle = 'rgba(108,155,255,.09)'; g.fill();
    Object.keys(BANDS).forEach(function (k) { var b = mic.eq[k]; g.beginPath(); g.arc(G.x(b.f), G.y(b.g), eqDrag === k ? 9 : 7, 0, 7); g.fillStyle = BANDS[k].c; g.fill(); g.lineWidth = 2; g.strokeStyle = '#080a0d'; g.stroke(); });
  }

  // ------------------------------------------------------------------ Seite: Equalizer (ganzer PC-Sound über Equalizer APO)
  var PEQ_F = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  var PEQ_Q = 1.41;
  var PEQ_PRESETS = {
    flat: { name: 'Neutral', desc: 'Alles so, wie es aufgenommen wurde', b: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    bass: { name: 'Bass-Boost', desc: 'Mehr Druck für Musik und Explosionen', b: [6, 5.5, 4, 2, 0, 0, 0, 0, 0, 0] },
    steps: { name: 'Schritte hören', desc: 'Gegner früher hören, Explosionen leiser', b: [-4, -4, -3, -1, 0, 1, 3, 5, 4, 2] },
    voice: { name: 'Stimmen klar', desc: 'Discord, Calls und Podcasts verständlicher', b: [-3, -2, -1, 0, 1, 3, 4, 3, 1, 0] },
    music: { name: 'Musik', desc: 'Lebendig mit Bass und Glanz', b: [4, 3, 1, 0, -1, -1, 0, 2, 3, 3] },
    movie: { name: 'Filme & Serien', desc: 'Kino-Bass und klare Dialoge', b: [4, 3, 1, 0, 0, 1, 2.5, 1.5, 1, 0] },
    soft: { name: 'Sanfte Höhen', desc: 'Weniger scharf, angenehm für lange Sessions', b: [0, 0, 0, 0, 0, 0, -1, -3, -4, -4] },
    night: { name: 'Leise hören', desc: 'Bass und Höhen bleiben auch bei kleiner Lautstärke', b: [5, 4, 2, 0, 0, 0, 0, 1, 3, 3] }
  };
  var PEQ = { status: null, applyT: null, faders: [] };
  function peqCurveDb(bands, f) { var s = 0; for (var i = 0; i < 10; i++) if (bands[i]) s += magDb(biquad('peaking', PEQ_F[i], bands[i], PEQ_Q), f); return s; }
  function peqPreamp(bands) {
    var mx = 0;
    for (var x = 0; x <= 200; x++) mx = Math.max(mx, peqCurveDb(bands, 20 * Math.pow(1000, x / 200)));
    return mx > 0.05 ? -Math.ceil(mx * 2) / 2 : 0;
  }
  // Text für Equalizer APO (wird als fusionx.txt gespeichert)
  function peqConfig() {
    var e = S.settings.eq, lines = ['# Fusion-X Audio - Equalizer fuer den ganzen PC-Sound', '# Wird von Fusion-X geschrieben. Aenderungen bitte in Fusion-X machen.'];
    if (!e.enabled || e.bands.every(function (b) { return !b; })) { lines.push('# Equalizer aus'); return lines.join('\n') + '\n'; }
    var pre = peqPreamp(e.bands);
    lines.push('# Vorlage: ' + e.preset);
    lines.push('Preamp: ' + pre.toFixed(1) + ' dB');
    var n = 0;
    e.bands.forEach(function (g, i) { if (g) lines.push('Filter ' + (++n) + ': ON PK Fc ' + PEQ_F[i] + ' Hz Gain ' + g.toFixed(1) + ' dB Q ' + PEQ_Q.toFixed(2)); });
    return lines.join('\n') + '\n';
  }
  function peqApply(now) {
    clearTimeout(PEQ.applyT);
    var go = function () {
      if (!fx.eq || !(PEQ.status && PEQ.status.installed)) return;
      fx.eq('apply', peqConfig()).then(function (r) {
        if (r && !r.ok) { toast('Equalizer: ' + (r.error || 'konnte nicht gespeichert werden'), true); }
        else if (PEQ.status && !PEQ.status.included) { PEQ.status.included = true; }
      });
    };
    if (now) go(); else PEQ.applyT = setTimeout(go, 220);
  }
  async function peqRefresh() {
    if (!fx.eq) { PEQ.status = { installed: false, unsupported: true }; return PEQ.status; }
    try { PEQ.status = await fx.eq('status'); } catch (_) { PEQ.status = { installed: false }; }
    return PEQ.status;
  }
  function peqSetPreset(k) {
    var e = S.settings.eq, p = PEQ_PRESETS[k]; if (!p) return;
    e.preset = k; e.bands = p.b.slice();
    if (k !== 'flat') e.enabled = true;
    save(); peqApply(); if (S.page === 'eq') renderPage();
  }
  function renderEq(v) {
    var e = S.settings.eq, st = PEQ.status;
    if (!st) { v.innerHTML = '<section class="card"><p class="lead">Prüfe Equalizer APO …</p></section>'; peqRefresh().then(function () { if (S.page === 'eq') renderPage(); }); return; }
    var ready = st.installed;
    var setup = ready ? '' :
      '<section class="card eqsetup"><div class="chead"><div><h2>' + ic('eq') + 'Einmal einrichten, dann klingt alles besser</h2>' +
        '<p class="lead">Der Equalizer wirkt auf alles, was du hörst: Spiele, Musik, Discord, Browser. Dafür nutzt Fusion-X <b>Equalizer APO</b>, eine kostenlose Open-Source-Erweiterung für Windows. Sie arbeitet direkt im Windows-Audio, ohne Verzögerung.</p></div></div>' +
        '<ol class="steps">' +
          '<li><b>Herunterladen</b> und das Setup starten</li>' +
          '<li>Im Fenster <b>„Device Selector“</b> deinen Kopfhörer und deine Lautsprecher anhaken</li>' +
          '<li><b>PC neu starten</b>. Danach steuert Fusion-X den Equalizer</li>' +
        '</ol>' +
        '<div class="row"><button class="btn primary" data-act="eqDownload">' + ic('upload', 'sm') + 'Equalizer APO herunterladen</button><button class="btn" data-act="eqRecheck">' + ic('refresh', 'sm') + 'Erneut prüfen</button></div>' +
        (S.demo ? '' : '<p class="small muted" style="margin:12px 0 0">Du kannst Vorlagen und Regler schon jetzt einstellen. Sobald Equalizer APO installiert ist, übernimmt Fusion-X sie automatisch.</p>') +
      '</section>';
    v.innerHTML = setup +
      '<section class="card">' +
        '<div class="chead"><div><h2>' + ic('eq') + 'Equalizer</h2><p class="lead">' + (ready ? 'Wirkt sofort auf alle Geräte, die du in Equalizer APO ausgewählt hast.' : 'Wird aktiv, sobald Equalizer APO installiert ist.') + '</p></div>' +
          '<div class="row">' + (ready && st.selector ? '<button class="btn sm" data-act="eqDevices">' + ic('headphones', 'sm') + 'Geräte wählen</button>' : '') + sw(e.enabled, 'id="eqOn" aria-label="Equalizer an"') + '</div></div>' +
        '<div class="presetrow peqpre">' + Object.keys(PEQ_PRESETS).map(function (k) { var p = PEQ_PRESETS[k]; return '<button class="preset" data-peq="' + k + '" aria-pressed="' + (e.preset === k) + '"><b>' + esc(p.name) + '</b><span>' + esc(p.desc) + '</span></button>'; }).join('') + '</div>' +
        '<div class="peq' + (e.enabled ? '' : ' off') + '">' +
          '<canvas id="peqCanvas" aria-hidden="true"></canvas>' +
          '<div class="peqbands" id="peqBands"></div>' +
        '</div>' +
        '<div class="row between small muted" style="margin-top:10px"><span id="peqPre"></span><button class="btn sm ghost" data-act="eqReset">' + ic('refresh', 'sm') + 'Zurücksetzen</button></div>' +
      '</section>' +
      '<p class="small muted" style="margin:0">Tipp: Speichere den Equalizer in einem Profil, dann wechselt er automatisch mit, zum Beispiel „Schritte hören“ beim Zocken und „Musik“ danach.</p>';
    var box = $('#peqBands');
    PEQ.faders = PEQ_F.map(function (f, i) {
      var col = document.createElement('div'); col.className = 'peqband';
      col.style.left = ((Math.log10(f) - Math.log10(20)) / 3 * 100) + '%';
      var fd = vfader({ value: (e.bands[i] + 12) / 24, reset: 0.5, label: (f >= 1000 ? f / 1000 + ' kHz' : f + ' Hz'),
        onInput: function (val) { e.bands[i] = Math.round((val * 24 - 12) * 2) / 2; e.preset = 'custom'; $('.gv', col).textContent = (e.bands[i] > 0 ? '+' : '') + String(e.bands[i]).replace('.', ','); $$('[data-peq]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); drawPeq(); peqApply(); },
        onCommit: function () { save(); } });
      col.appendChild(fd);
      col.insertAdjacentHTML('beforeend', '<b class="gv">' + (e.bands[i] > 0 ? '+' : '') + String(e.bands[i]).replace('.', ',') + '</b><span>' + (f >= 1000 ? f / 1000 + 'k' : f) + '</span>');
      box.appendChild(col);
      return fd;
    });
    drawPeq();
  }
  function drawPeq() {
    var cv = $('#peqCanvas'); if (!cv) return;
    var e = S.settings.eq, dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // gleiche Skala wie die Regler darüber: ±12 dB zwischen 10 px oben und unten
    var l0 = Math.log10(20), l1 = Math.log10(20000), Y = function (d) { return 10 + (12 - d) / 24 * (H - 20); };
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
    [-12, -6, 0, 6, 12].forEach(function (d) { var y = Math.round(Y(d)) + 0.5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); });
    var pts = [];
    for (var x = 0; x <= W; x += 2) pts.push([x, Y(clamp(e.enabled ? peqCurveDb(e.bands, Math.pow(10, l0 + x / W * (l1 - l0))) : 0, -12.5, 12.5))]);
    var grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, '#2b8cff'); grad.addColorStop(1, '#2ee6d6');
    g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
    g.lineWidth = 3; g.strokeStyle = e.enabled ? grad : 'rgba(255,255,255,.25)'; g.shadowColor = 'rgba(46,230,214,.6)'; g.shadowBlur = e.enabled ? 12 : 0; g.stroke(); g.shadowBlur = 0;
    g.lineTo(W, Y(0)); g.lineTo(0, Y(0)); g.closePath();
    var fill = g.createLinearGradient(0, 0, 0, H); fill.addColorStop(0, 'rgba(46,230,214,.22)'); fill.addColorStop(0.5, 'rgba(43,140,255,.05)'); fill.addColorStop(1, 'rgba(46,230,214,.22)');
    g.fillStyle = fill; g.fill();
    var pre = $('#peqPre');
    if (pre) { var p = peqPreamp(e.bands); pre.textContent = e.enabled && p ? 'Vorverstärkung ' + fmtDb(p) + ' (automatisch, damit nichts verzerrt)' : 'Kein Ausgleich nötig'; }
  }

  // ------------------------------------------------------------------ Sprache
  function applyLang() { if (window.FxI18n) FxI18n.set(S.settings.lang); }

  // ------------------------------------------------------------------ Updates
  function updHtml() {
    var u = S.update || { state: 'idle' }, st = S.settings, cur = u.current || S.version;
    var line, btn = '';
    switch (u.state) {
      case 'unconfigured': line = 'Automatische Updates sind eingebaut. Sobald die Update-Adresse eingetragen ist, aktualisiert sich Fusion-X von selbst.'; break;
      case 'dev': line = 'In der Entwickler-Version gibt es keine automatischen Updates.'; break;
      case 'checking': line = 'Suche nach Updates …'; break;
      case 'available': line = 'Version ' + esc(u.version) + ' ist da.'; btn = '<button class="btn primary sm" data-act="updDownload">' + ic('upload', 'sm') + 'Herunterladen</button>'; break;
      case 'downloading': line = 'Lade Version ' + esc(u.version || '') + ' … ' + (u.percent || 0) + ' %<div class="updbar"><i style="width:' + (u.percent || 0) + '%"></i></div>'; break;
      case 'ready': line = '<b>Version ' + esc(u.version) + ' ist bereit.</b> Wird beim Beenden automatisch installiert.'; btn = '<button class="btn primary sm" data-act="updInstall">' + ic('refresh', 'sm') + 'Jetzt neu starten</button>'; break;
      case 'error': line = 'Update-Prüfung fehlgeschlagen: ' + esc(u.error || ''); btn = '<button class="btn sm" data-act="updCheck">' + ic('refresh', 'sm') + 'Erneut versuchen</button>'; break;
      default: line = 'Du hast die neueste Version.'; btn = u.enabled ? '<button class="btn sm" data-act="updCheck">' + ic('refresh', 'sm') + 'Jetzt prüfen</button>' : '';
    }
    return srow('Fusion-X ' + esc(cur || ''), line, btn) +
      (u.enabled || u.state === 'unconfigured' || S.demo ? srow('Automatisch aktualisieren', 'Lädt neue Versionen im Hintergrund und installiert sie beim nächsten Beenden.', sw(st.autoUpdate, 'id="updAuto"')) : '');
  }
  function onUpdate(u) {
    var was = S.update && S.update.state;
    S.update = Object.assign({}, S.update, u);
    var box = $('#updBox'); if (box) box.innerHTML = updHtml();
    if (u.state === 'ready' && was !== 'ready') { toast('Update auf Version ' + u.version + ' ist bereit. Es wird beim Beenden installiert.'); renderNav(); }
  }

  // ------------------------------------------------------------------ Seite: Geräte
  function renderDevices(v) {
    var ifs = S.interfaces || [], warns = deviceWarnings();
    v.innerHTML =
      (ifs.length ? ifs.map(function (it) {
        var out = it.outputs[0], inp = it.inputs[0];
        return '<section class="card"><div class="ifcard"><div class="ifbadge">' + ic('iface', 'lg') + '</div><div><span class="badge accent">Audio-Interface erkannt</span><h2 style="margin-top:8px">' + esc(cleanName(it.name)) + '</h2>' +
          '<p class="lead">' + esc(it.brand) + ' · ' + it.inputs.length + ' Eingang' + (it.inputs.length === 1 ? '' : 'e') + ' · ' + it.outputs.length + ' Ausgang' + (it.outputs.length === 1 ? '' : 'e') + (out && out.format ? ' · ' + esc(devFormat(out)) : '') + '</p>' +
          '<ul class="tips">' +
            '<li>' + ic('check', 'sm') + '<span>Fusion-X arbeitet mit deinem Interface zusammen. Hardware-Gain, 48V und Direct Monitor bleiben am Gerät, Klang und App-Lautstärken regelst du hier.</span></li>' +
            (it.asio ? '<li>' + ic('check', 'sm') + '<span>ASIO-Treiber installiert: „' + esc(it.asio) + '“. Für Musikprogramme mit niedriger Latenz.</span></li>' : '<li>' + ic('info', 'sm') + '<span>Kein Hersteller-ASIO-Treiber gefunden. Für Musikproduktion lohnt sich der Treiber von der ' + esc(it.brand) + '-Website.</span></li>') +
            (inp && out && inp.format && out.format && inp.format.rate !== out.format.rate ? '<li>' + ic('warn', 'sm') + '<span>Eingang und Ausgang laufen mit unterschiedlicher Abtastrate (' + esc(devFormat(inp)) + ' / ' + esc(devFormat(out)) + '). Das kann Knacksen verursachen. Stell beide in der Windows-Systemsteuerung unter Sound → Eigenschaften → Erweitert auf 48 kHz.</span></li>' : '') +
          '</ul></div></div></section>';
      }).join('') : '') +
      (warns.length ? '<div class="stack">' + warns.join('') + '</div>' : '') +
      '<section class="card"><div class="row between"><div><h2>' + ic('pin') + 'Lieblingsgeräte</h2><p class="lead">Windows springt nach einem Neustart oder beim Einstecken gern aufs falsche Gerät, zum Beispiel auf die Monitor-Lautsprecher. Markiere deine Lieblingsgeräte mit dem Stern: Fusion-X stellt sie automatisch wieder ein, sobald sie da sind.</p></div>' + sw(S.settings.autoDefault, 'data-setbool="autoDefault" aria-label="Lieblingsgeräte automatisch setzen"') + '</div></section>' +
      '<div class="grid cols2">' +
        '<section class="card"><div class="chead"><div><h2>' + ic('speaker') + 'Ausgabe</h2><p class="lead">Wo du Ton hörst. Das Standardgerät nutzen alle Apps, die nichts anderes eingestellt haben.</p></div></div>' + renders().map(devRow).join('') + '</section>' +
        '<section class="card"><div class="chead"><div><h2>' + ic('mic') + 'Eingabe</h2><p class="lead">Deine Mikrofone. Fusion-X nimmt das ausgewählte Mikro, bearbeitet es und gibt es als virtuelles Mikro an alle Apps weiter.</p></div></div>' + captures().map(devRow).join('') + '</section>' +
      '</div>';
    refs.devMeters = $$('[data-devmeter]', v).map(function (el) { return { el: el, id: el.dataset.devmeter, fill: $('.fill', el) }; });
  }
  function devRow(d) {
    var badges = [];
    if (d.isDefault) badges.push('<span class="badge accent">Standard</span>');
    if (d.isDefaultComms && !d.isDefault) badges.push('<span class="badge">Für Anrufe</span>');
    if (d.cls.kind !== 'other' && d.cls.kind !== 'onboard') badges.push('<span class="badge' + (d.cls.interface ? ' accent' : d.cls.virtual ? '' : '') + '">' + esc(d.cls.label) + (d.cls.brand ? ' · ' + esc(d.cls.brand) : '') + '</span>');
    if (d.flow === 'capture' && d.id === S.settings.mic.inputId) badges.push('<span class="badge amber">Fusion-X nutzt dieses Mikro</span>');
    var meta = [devSub(d), devFormat(d)].filter(Boolean).join(' · ');
    return '<div class="dev' + (d.isDefault ? ' def' : '') + '" data-dev="' + esc(d.id) + '"><div class="ico">' + ic(devIcon(d)) + '</div>' +
      '<div style="min-width:0"><div class="nm">' + esc(devTitle(d)) + badges.join('') + '</div><div class="meta">' + esc(meta) + '</div>' +
        '<div class="ctl"><button class="iconbtn mute" data-act="devMute" aria-pressed="' + !!d.muted + '" aria-label="Stumm">' + ic(d.muted ? (d.flow === 'capture' ? 'micOff' : 'speakerOff') : (d.flow === 'capture' ? 'mic' : 'speaker'), 'sm') + '</button>' +
        '<input type="range" min="0" max="1" step="0.01" value="' + d.volume + '" data-devvol aria-label="Lautstärke ' + esc(devTitle(d)) + '"><span class="mono small">' + pct(d.volume) + '</span></div>' +
        '<div class="hmeter" data-devmeter="' + esc(d.id) + '" style="height:5px;margin-top:8px;max-width:280px"><div class="fill"></div></div></div>' +
      '<div class="acts">' + (d.isDefault && d.isDefaultComms ? '' : '<button class="btn sm" data-act="devDefault">Als Standard</button>') +
        (d.cls.virtual ? '' : '<button class="btn sm ghost' + (prefRank(d) ? ' fav' : '') + '" data-act="devPrefer" title="Lieblingsgerät: wird automatisch wieder Standard">' + ic(prefRank(d) ? 'pin' : 'star', 'sm') + (prefRank(d) ? 'Liebling ' + prefRank(d) : 'Als Liebling') + '</button>') + '</div></div>';
  }
  function prefRank(d) { var l = (S.settings.preferred[d.flow] || []), i = l.indexOf(d.id); return i < 0 ? 0 : i + 1; }
  function deviceWarnings() {
    var w = [], dc = defaultCapture(), dr = defaultRender();
    if (dc && dc.cls.bluetooth) w.push('<div class="notice warn">' + ic('warn') + '<div><b>Bluetooth-Mikrofon ist Standard</b>Sobald das Mikro eines Bluetooth-Headsets aktiv ist, schaltet Windows den Ton auf Telefonqualität. Nutze lieber ein USB- oder Kabel-Mikrofon und lass das Headset nur für die Ausgabe.</div></div>');
    var diffs = [], ids = [];
    renders().concat(captures()).forEach(function (d) {
      if (d.isDefaultComms && !d.isDefault && !d.cls.virtual) {
        var main = d.flow === 'render' ? dr : dc;
        if (main && !main.cls.virtual) { diffs.push((d.flow === 'render' ? 'Ton: ' : 'Mikrofon: ') + '„' + devTitle(d) + '“ statt „' + devTitle(main) + '“'); ids.push(main.id); }
      }
    });
    if (diffs.length) w.push('<div class="notice info">' + ic('info') + '<div><b>Anrufe laufen über andere Geräte</b>Für Anrufe (Discord, Teams) nutzt Windows eigene Standardgeräte. ' + esc(diffs.join(' · ')) + '. Das sorgt oft für Verwirrung.<div class="act"><button class="btn sm" data-act="alignComms" data-id="' + esc(ids.join(',')) + '">Überall dieselben Geräte nutzen</button></div></div></div>');
    if (S.settings.virtualMicActive && S.engine.state !== 'on') w.push('<div class="notice bad">' + ic('warn') + '<div><b>Apps hören gerade nichts von dir</b>Windows nutzt das virtuelle Mikro, aber die Stimm-Bearbeitung läuft nicht. Starte sie auf der Mikrofon-Seite oder schalte das virtuelle Mikro aus.</div></div>');
    return w;
  }

  // ------------------------------------------------------------------ Seite: Profile
  function renderProfiles(v) {
    var st = S.settings, running = Array.from(S.groups.values()).filter(function (g) { return !g.system; });
    v.innerHTML =
      '<section class="card"><div class="row between"><div><h2>' + ic('wand') + 'Automatisch wechseln</h2><p class="lead">Startest du ein Spiel, OBS oder Teams, schaltet Fusion-X das passende Profil ein. Schließt du die App, kommt das vorherige zurück.</p></div>' + sw(st.autoProfiles, 'id="autoProf" aria-label="Automatisch wechseln"') + '</div></section>' +
      '<div class="grid cols3">' + st.profiles.map(function (p) {
        var active = p.id === st.activeProfile, preset = E.PRESETS[p.preset];
        var lv = Object.keys(p.levels || {}).map(function (k) { return (C.CATEGORIES[k] || k) + ' ' + Math.round(p.levels[k] * 100) + ' %'; }).join(' · ');
        var auto = (p.autoApps || []).map(function (a) { return '<span class="chip">' + esc(a) + '<button data-act="autoDel" data-p="' + p.id + '" data-app="' + esc(a) + '" aria-label="Entfernen">' + ic('x', 'sm') + '</button></span>'; });
        if (p.autoCat) auto.unshift('<span class="chip">Jedes Spiel<button data-act="autoCatDel" data-p="' + p.id + '" aria-label="Entfernen">' + ic('x', 'sm') + '</button></span>');
        return '<section class="card profile' + (active ? ' active' : '') + '"><div class="row between"><div class="row"><div class="pico">' + ic(p.icon || 'star', 'lg') + '</div><div><h2>' + esc(p.name) + '</h2>' + (active ? '<span class="badge accent">Aktiv</span>' : '') + '</div></div>' +
          (p.builtin ? '' : '<button class="btn sm ghost" data-act="profDel" data-p="' + p.id + '" aria-label="Profil löschen">' + ic('x', 'sm') + '</button>') + '</div>' +
          '<ul><li>' + ic('mic', 'sm') + ' Stimme: ' + esc(p.mic ? 'eigene Einstellung' : (preset ? preset.name : '–')) + '</li><li>' + ic('duck', 'sm') + ' Beim Sprechen leiser: ' + (p.ducking.enabled ? '−' + p.ducking.amount + ' %' : 'aus') + '</li>' + (lv ? '<li>' + ic('mixer', 'sm') + ' ' + esc(lv) + '</li>' : '') + '</ul>' +
          '<div><span class="eyebrow">Startet automatisch mit</span><div class="chips" style="margin-top:6px">' + (auto.join('') || '<span class="small muted">Nur von Hand</span>') + '</div>' +
          (running.length ? '<select class="select" data-act="autoAdd" data-p="' + p.id + '" style="margin-top:8px;font-size:12.5px"><option value="">+ Laufende App hinzufügen</option>' + running.map(function (g) { return '<option value="' + esc(g.key) + '">' + esc(g.name) + '</option>'; }).join('') + '</select>' : '') + '</div>' +
          '<div class="row"><button class="btn ' + (active ? '' : 'primary') + ' sm" data-act="profApply" data-p="' + p.id + '">' + (active ? 'Erneut anwenden' : 'Aktivieren') + '</button><button class="btn sm ghost" data-act="profCapture" data-p="' + p.id + '">Aktuelle Einstellungen übernehmen</button></div></section>';
      }).join('') +
      '<section class="card profile flat" style="border-style:dashed;place-content:center;justify-items:center;text-align:center;min-height:220px"><div class="pico">' + ic('plus', 'lg') + '</div><h2>Eigenes Profil</h2><p class="lead">Speichert deine jetzigen Mikro-Einstellungen und App-Lautstärken.</p><div class="row"><input class="input" id="newProfName" placeholder="Name, z. B. Valorant" maxlength="24"><button class="btn primary sm" data-act="profNew">Anlegen</button></div></section>' +
      '</div>';
  }
  function captureProfile(p) {
    p.mic = clone(S.settings.mic);
    var levels = {};
    S.groups.forEach(function (g) { if (!g.system) { levels[g.cat] = levels[g.cat] || []; levels[g.cat].push(g.userVol); } });
    p.levels = {};
    Object.keys(levels).forEach(function (k) { var a = levels[k]; p.levels[k] = Math.round(a.reduce(function (s, v) { return s + v; }, 0) / a.length * 100) / 100; });
    p.ducking = { enabled: S.settings.ducking.enabled, amount: S.settings.ducking.amount };
    p.eq = clone(S.settings.eq);
  }

  // ------------------------------------------------------------------ Seite: Einstellungen
  var HOTKEY_LABELS = { toggleMute: 'Mikrofon stumm an/aus', toggleDucking: 'Beim Sprechen leiser an/aus', profile1: 'Profil 1 aktivieren', profile2: 'Profil 2 aktivieren', profile3: 'Profil 3 aktivieren', profile4: 'Profil 4 aktivieren',
    masterUp: 'Gesamtlautstärke lauter', masterDown: 'Gesamtlautstärke leiser', masterMute: 'Gesamtlautstärke stumm', nextOutput: 'Nächstes Ausgabegerät (Kopfhörer ↔ Lautsprecher)', denoiseCycle: 'Rauschunterdrückung durchschalten', monitorToggle: 'Mithören an/aus',
    gameUp: 'Spiele lauter', gameDown: 'Spiele leiser', musicUp: 'Musik lauter', musicDown: 'Musik leiser', chatUp: 'Voice-Chat lauter', chatDown: 'Voice-Chat leiser', stopSounds: 'Alle Sounds stoppen' };
  var HOTKEY_ACTIONS = {
    toggleMute: { action: 'toggleMute' }, toggleDucking: { action: 'toggleDucking' },
    profile1: { action: 'profile', index: 1 }, profile2: { action: 'profile', index: 2 }, profile3: { action: 'profile', index: 3 }, profile4: { action: 'profile', index: 4 },
    masterUp: { action: 'volume', target: 'master', delta: 5 }, masterDown: { action: 'volume', target: 'master', delta: -5 }, masterMute: { action: 'mute', target: 'master' },
    nextOutput: { action: 'output', device: 'cycle' }, denoiseCycle: { action: 'denoise', mode: 'cycle' }, monitorToggle: { action: 'monitor' },
    gameUp: { action: 'volume', target: 'cat:game', delta: 10 }, gameDown: { action: 'volume', target: 'cat:game', delta: -10 },
    musicUp: { action: 'volume', target: 'cat:music', delta: 10 }, musicDown: { action: 'volume', target: 'cat:music', delta: -10 },
    chatUp: { action: 'volume', target: 'cat:voice', delta: 10 }, chatDown: { action: 'volume', target: 'cat:voice', delta: -10 },
    stopSounds: { action: 'stopSounds' }
  };
  function renderSettings(v) {
    var st = S.settings, d = st.ducking;
    var vps = renders().filter(function (x) { return x.cls.virtual; });
    var catList = [['game', 'Spiele'], ['music', 'Musik'], ['video', 'Videos'], ['web', 'Browser'], ['launcher', 'Launcher'], ['stream', 'Streaming-Tools'], ['system', 'Systemsounds'], ['other', 'Andere Apps']];
    v.innerHTML =
      '<div class="grid cols2">' +
      '<section class="card"><h2>' + ic('settings') + 'Allgemein</h2><div style="margin-top:6px">' +
        srow('Mit Windows starten', 'Fusion-X startet unsichtbar im Infobereich, damit deine Stimme sofort bearbeitet wird.', sw(S.autostart, 'id="setAutostart"')) +
        srow('Minimiert starten', 'Beim Öffnen direkt im Infobereich bleiben.', sw(st.startMinimized, 'data-setbool="startMinimized"')) +
        srow('Schließen = in den Infobereich', 'Das X versteckt das Fenster nur. Beenden über das Symbol unten rechts.', sw(st.closeToTray, 'data-setbool="closeToTray"')) +
        srow('Profi-Modus', 'Zeigt EQ-Kurve, Kompressor-Details, Latenz und alle Feineinstellungen.', sw(st.proMode, 'data-setbool="proMode"')) +
        srow('Durchsichtiges Fenster', 'Glas-Effekt mit Blick auf den Desktop (Windows 11). Wirkt nach einem Neustart von Fusion-X.', sw(st.windowGlass !== false, 'id="setGlass"')) +
        srow('Sprache', 'Language', seg('lang', [['auto', 'Automatisch'], ['de', 'Deutsch'], ['en', 'English']], st.lang)) +
      '</div></section>' +
      '<section class="card"><h2>' + ic('refresh') + 'Updates</h2><div id="updBox" style="margin-top:6px">' + updHtml() + '</div></section>' +
      '<section class="card"><h2>' + ic('bell') + 'Anzeige & Signaltöne</h2><p class="lead">Kleine Einblendung über Spielen und Apps, wenn du per Taste stummschaltest, das Profil wechselst oder die Lautstärke änderst.</p><div style="margin-top:6px">' +
        srow('Bildschirm-Anzeige', 'Funktioniert in Spielen im Fenster- oder randlosen Modus', sw(st.osd.enabled, 'id="osdOn"')) +
        srow('Position', '', seg('osdPos', [['top', 'Oben'], ['bottom', 'Unten']], st.osd.position)) +
        srow('Stumm-Erinnerung', 'Meldet sich, wenn du sprichst, dein Mikro aber stumm ist', sw(st.osd.remind, 'id="osdRemind"')) +
        srow('Signaltöne', 'Kurzer Ton beim Stummschalten und Einschalten, nur für dich', sw(st.cues, 'data-setbool="cues"')) +
        srow('App-Lautstärken merken', 'Windows setzt Lautstärken gern zurück. Fusion-X stellt sie beim nächsten Start der App wieder her.', sw(st.rememberVolumes, 'data-setbool="rememberVolumes"')) +
      '</div></section>' +
      '<section class="card"><h2>' + ic('duck') + 'Beim Sprechen leiser</h2><p class="lead">Sobald du sprichst, werden andere Apps automatisch leiser. Hört du auf, kommen sie sanft zurück. Voice-Chats wie Discord bleiben immer laut.</p><div style="margin-top:6px">' +
        srow('Eingeschaltet', '', sw(d.enabled, 'data-setduck="enabled"', 'amber')) +
        slider('duckAmount', 'Wie viel leiser', 10, 95, 5, d.amount, '−' + d.amount + ' %', 'amber') +
        slider('duckRelease', 'Rückkehr nach', 200, 3000, 100, d.release, (d.release / 1000).toFixed(1).replace('.', ',') + ' s', 'amber') +
        '<div style="margin-top:10px"><span class="eyebrow">Diese Apps werden leiser</span><div class="checks" style="margin-top:8px">' + catList.map(function (c) { return '<button class="check" data-duckcat="' + c[0] + '" aria-pressed="' + !!d.cats[c[0]] + '">' + esc(c[1]) + '</button>'; }).join('') + '</div><p class="small muted">Einzelne Apps schaltest du im Mixer mit dem Pfeil-Knopf um.</p></div>' +
      '</div></section>' +
      '<section class="card" style="grid-column:1/-1"><h2>' + ic('star') + 'Tastenkürzel</h2><p class="lead">Funktionieren überall, auch mitten im Spiel, und mit jeder Makro-Taste oder der Stream-Deck-Aktion „Hotkey“. Feld anklicken und die neue Kombination drücken. Entf löscht.</p>' +
        '<div class="grid cols3" style="margin-top:8px">' + [
          ['Stimme & Sounds', ['toggleMute', 'toggleDucking', 'denoiseCycle', 'monitorToggle', 'stopSounds']],
          ['Lautstärke', ['masterUp', 'masterDown', 'masterMute', 'gameUp', 'gameDown', 'musicUp', 'musicDown', 'chatUp', 'chatDown']],
          ['Geräte & Profile', ['nextOutput', 'profile1', 'profile2', 'profile3', 'profile4']]
        ].map(function (grp) {
          return '<div><span class="eyebrow">' + grp[0] + '</span><div>' + grp[1].map(function (k) {
            var label = HOTKEY_LABELS[k];
            if (/^profile\d/.test(k)) { var p = st.profiles[+k.slice(-1) - 1]; if (!p) return ''; label = 'Profil „' + p.name + '“'; }
            return srow(label, '', '<button class="keycap" data-hotkey="' + k + '">' + esc(prettyKey(st.hotkeys[k]) || 'Nicht belegt') + '</button>');
          }).join('') + '</div></div>';
        }).join('') + '</div></section>' +
      '<section class="card"><h2>' + ic('route') + 'Virtuelles Mikrofon</h2><p class="lead">Über dieses Gerät gibt Fusion-X deine bearbeitete Stimme an andere Apps weiter.</p><div style="margin-top:6px">' +
        (vps.length ? '<label class="slider"><span>Ausgabe an</span><select class="select" id="setVirtualOut">' + deviceOptions(vps, st.virtualOut || (virtualPair() && virtualPair().out.id)) + '</select><span></span></label>' : '<p class="small muted">Kein virtuelles Gerät installiert. Anleitung auf der Mikrofon-Seite.</p>') +
        srow('Beim Beenden zurückstellen', 'Stellt dein echtes Mikrofon wieder als Windows-Standard ein, damit andere Apps nicht stumm sind.', sw(st.restoreMicOnExit, 'data-setbool="restoreMicOnExit"')) +
      '</div></section>' +
      '<section class="card"><img src="brand/logo-full.jpg" alt="Fusion-X Audio" style="width:100%;max-width:420px;border-radius:12px;display:block;margin-bottom:14px"><h2>' + ic('info') + 'Info & Diagnose</h2><div style="margin-top:6px">' +
        srow('Version', '', '<span class="mono small">' + esc(S.version) + (S.demo ? ' · Vorschau' : '') + '</span>') +
        srow('Windows-Audio', S.backend.ok ? 'Verbunden' + (S.backend.info && S.backend.info.os ? ' · Windows ' + esc(S.backend.info.os) : '') : esc(S.backend.error || 'Nicht verbunden'), '<span class="badge ' + (S.backend.ok ? 'ok' : 'bad') + '">' + (S.backend.ok ? 'OK' : 'Fehler') + '</span>') +
        srow('Ausgabegerät pro App', 'Lässt Apps über unterschiedliche Geräte spielen.', '<span class="badge ' + (S.backend.info && S.backend.info.appOutput ? 'ok' : '') + '">' + (S.backend.info && S.backend.info.appOutput ? 'Verfügbar' : 'Nicht verfügbar') + '</span>') +
        srow('ASIO-Treiber', esc(S.asio.length ? S.asio.join(', ') : 'Keine gefunden'), '') +
        srow('Einrichtung', 'Den Einrichtungs-Assistenten noch einmal durchgehen.', '<button class="btn sm" data-act="wizard">Starten</button>') +
        srow('Problem melden', 'Kopiert alle technischen Infos, damit du sie weitergeben kannst.', '<button class="btn sm" data-act="diagCopy">Diagnose kopieren</button>') +
        '<div style="margin-top:10px"><span class="eyebrow">Ereignisse</span><pre class="log" id="logBox" style="margin-top:6px">' + esc(S.log.join('\n') || 'Noch nichts passiert.') + '</pre></div>' +
      '</div></section>' +
      '</div>';
  }
  var srow = function (t, small, ctl) { return '<div class="srow"><div class="t"><div>' + esc(t) + '</div>' + (small ? '<small>' + small + '</small>' : '') + '</div>' + ctl + '</div>'; };
  function prettyKey(a) { return a ? a.replace(/CommandOrControl|Ctrl/g, 'Strg').replace(/Shift/g, 'Umschalt').replace(/\+/g, ' + ') : ''; }
  function keyToAccel(e) {
    var k = e.key;
    if (['Control', 'Shift', 'Alt', 'Meta'].indexOf(k) >= 0) return null;
    var map = { ' ': 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Escape: 'Escape', Enter: 'Return' };
    k = map[k] || (k.length === 1 ? k.toUpperCase() : k);
    var mods = [];
    if (e.ctrlKey) mods.push('Ctrl'); if (e.altKey) mods.push('Alt'); if (e.shiftKey) mods.push('Shift'); if (e.metaKey) mods.push('Super');
    if (!mods.length && !/^F\d+$/.test(k)) return null;
    return mods.concat([k]).join('+');
  }

  // ------------------------------------------------------------------ Stream-Mix (über OBS)
  // Linker Regler = was du hörst (Windows-Lautstärke der App), rechter Regler = was dein Stream hört.
  // OBS nimmt jede App einzeln auf ("Anwendungsaudioaufnahme"). Diese Aufnahme enthält die
  // Windows-Lautstärke der App schon, deshalb gleicht Fusion-X das in OBS wieder aus.
  var SM_SCENE = 'Fusion-X Audio', SM_PREFIX = 'Fusion-X · ', SM_VOICE = 'Fusion-X · Stimme', SM_GAIN = 'Fusion-X Verstärkung';
  var SM_FLOOR = 0.0016; // −56 dB: für dich praktisch unhörbar, im Stream wieder voll da
  var SM = { status: { state: 'off' }, inputs: {}, sent: {}, creating: {}, failed: {}, gainMade: {}, ready: false, busy: false, error: '', scenes: 0 };
  var smOn = function () { return !!(S.settings && S.settings.streamMix.enabled); };
  function smEntry(g) { return S.settings.streamMix.apps[g.key] || { on: !g.system && g.cat !== 'stream' && S.settings.streamMix.newAppsOn !== false, vol: 1 }; } // OBS & Co. standardmäßig nicht in sich selbst aufnehmen (Echo)
  function smSetEntry(g, patch) { S.settings.streamMix.apps[g.key] = Object.assign({}, smEntry(g), patch); save(); }
  function smHandles(g) { return smOn() && !g.system && smEntry(g).on; }
  function obsReq(type, data) { return fx.obsRequest ? fx.obsRequest(type, data) : Promise.reject(new Error('OBS nicht verfügbar')); }
  function obsBatch(list) { return fx.obsBatch && list.length ? fx.obsBatch(list) : Promise.resolve([]); }
  function smConnect() {
    var c = S.settings.streamMix;
    if (!fx.obsConfig) return;
    fx.obsConfig({ enabled: !!c.enabled, host: c.obs.host || '127.0.0.1', port: +c.obs.port || 4455, password: c.obs.password || '' }).then(smOnStatus).catch(function () {});
  }
  function smOnStatus(st) {
    if (!st) return;
    var was = SM.status.state;
    SM.status = st;
    if (st.state === 'ok' && was !== 'ok') smSetup();
    if (st.state !== 'ok') { SM.ready = false; SM.inputs = {}; SM.sent = {}; SM.gainMade = {}; }
    smRenderBar();
  }
  var encWin = function (s) { return String(s || '').replace(/#/g, '#22').replace(/:/g, '#3A'); };
  var exeFromWin = function (w) { var p = String(w || '').split(':'); return (p[2] || '').replace(/#3A/g, ':').replace(/#22/g, '#').toLowerCase(); };

  async function smSetup() {
    if (SM.busy) return;
    SM.busy = true; SM.error = '';
    try {
      var kinds = await obsReq('GetInputKindList', { unversioned: true });
      if ((kinds.inputKinds || []).indexOf('wasapi_process_output_capture') < 0) throw new Error('Diese OBS-Version kann keine einzelnen Apps aufnehmen. Du brauchst OBS 28 oder neuer unter Windows.');
      var sl = await obsReq('GetSceneList');
      var scenes = (sl.scenes || []).map(function (x) { return x.sceneName; });
      if (scenes.indexOf(SM_SCENE) < 0) await obsReq('CreateScene', { sceneName: SM_SCENE });
      SM.scenes = 0;
      if (S.settings.streamMix.addToScenes) for (var i = 0; i < scenes.length; i++) if (scenes[i] !== SM_SCENE && await smEnsureInScene(scenes[i])) SM.scenes++;
      var items = await obsReq('GetSceneItemList', { sceneName: SM_SCENE });
      SM.inputs = {}; SM.sent = {}; SM.gainMade = {};
      var list = items.sceneItems || [];
      for (var j = 0; j < list.length; j++) {
        var it = list[j];
        if (it.sourceName === SM_VOICE) { SM.inputs.__voice = SM_VOICE; continue; }
        if (it.inputKind !== 'wasapi_process_output_capture') continue;
        try { var is = await obsReq('GetInputSettings', { inputName: it.sourceName }); var exe = exeFromWin(is.inputSettings && is.inputSettings.window); if (exe) SM.inputs[exe] = it.sourceName; } catch (_) {}
      }
      await smDesktopAudio(true);
      SM.ready = true;
      log('Stream-Mix mit OBS ' + ((SM.status.version || {}).obs || '') + ' verbunden');
      smTick();
    } catch (e) { SM.error = e.message; log('Stream-Mix: ' + e.message); }
    finally { SM.busy = false; smRenderBar(); }
  }
  // Fusion-X-Szene als Quelle in eine Szene legen (nur Ton, nichts zu sehen)
  async function smEnsureInScene(scene) {
    try {
      var r = await obsReq('GetSceneItemList', { sceneName: scene });
      if ((r.sceneItems || []).some(function (x) { return x.sourceName === SM_SCENE; })) return true;
      var c = await obsReq('CreateSceneItem', { sceneName: scene, sourceName: SM_SCENE, sceneItemEnabled: true });
      if (c && c.sceneItemId != null) obsReq('SetSceneItemLocked', { sceneName: scene, sceneItemId: c.sceneItemId, sceneItemLocked: true }).catch(function () {});
      return true;
    } catch (e) { log('Stream-Mix, Szene „' + scene + '“: ' + e.message); return false; }
  }
  // OBS-Desktop-Audio stummschalten, sonst wäre jede App doppelt im Stream
  async function smDesktopAudio(on) {
    var c = S.settings.streamMix;
    try {
      var sp = await obsReq('GetSpecialInputs');
      var names = [sp.desktop1, sp.desktop2].filter(Boolean);
      SM.desktop = names;
      if (on && c.muteDesktop) {
        c.desktopPrev = c.desktopPrev || {};
        for (var i = 0; i < names.length; i++) {
          var m = await obsReq('GetInputMute', { inputName: names[i] });
          if (!(names[i] in c.desktopPrev)) c.desktopPrev[names[i]] = !!m.inputMuted;
          if (!m.inputMuted) await obsReq('SetInputMute', { inputName: names[i], inputMuted: true });
        }
        save();
      } else if (!on && c.desktopPrev) {
        for (var k in c.desktopPrev) await obsReq('SetInputMute', { inputName: k, inputMuted: c.desktopPrev[k] }).catch(function () {});
        c.desktopPrev = null; save();
      }
    } catch (_) {}
  }

  function smLevel(g, en) {
    var c = S.settings.streamMix;
    if (!en.on || en.vol <= 0.0005 || c.master <= 0.0005) return { mute: true };
    if (g.muted && !g.smMuted) return { mute: true };
    var eff = g.smMuted ? SM_FLOOR : Math.max(g.volume, SM_FLOOR);
    return { mute: false, db: 20 * Math.log10(c.master * en.vol / eff) };
  }
  function smPush(reqs, name, want) {
    var last = SM.sent[name] || {};
    if (want.mute) {
      if (last.mute !== true) reqs.push(['SetInputMute', { inputName: name, inputMuted: true }]);
      SM.sent[name] = Object.assign({}, last, { mute: true });
      return;
    }
    // OBS erlaubt bis +26 dB Lautstärke, darüber hilft ein Verstärkungs-Filter (bis +30 dB)
    var db = clamp(want.db, -100, 56), vol = Math.min(db, 26), gain = clamp(db - 26, 0, 30);
    if (last.mute !== false) reqs.push(['SetInputMute', { inputName: name, inputMuted: false }]);
    if (last.vol == null || Math.abs(last.vol - vol) > 0.05) reqs.push(['SetInputVolume', { inputName: name, inputVolumeDb: Math.round(vol * 100) / 100 }]);
    if (gain > 0 || (last.gain || 0) > 0) {
      if (!SM.gainMade[name]) { SM.gainMade[name] = true; reqs.push(['CreateSourceFilter', { sourceName: name, filterName: SM_GAIN, filterKind: 'gain_filter', filterSettings: { db: 0 } }]); }
      if (last.gain == null || Math.abs(last.gain - gain) > 0.05) reqs.push(['SetSourceFilterSettings', { sourceName: name, filterName: SM_GAIN, filterSettings: { db: Math.round(gain * 100) / 100 } }]);
    }
    SM.sent[name] = { mute: false, vol: vol, gain: gain };
  }
  function smCreate(key, name, kind, settings) {
    if (SM.creating[key] || (SM.failed[key] && Date.now() - SM.failed[key] < 30000)) return;
    SM.creating[key] = true;
    obsReq('CreateInput', { sceneName: SM_SCENE, inputName: name, inputKind: kind, inputSettings: settings, sceneItemEnabled: true })
      .catch(function (e) { if (e && (e.code === 601 || /already exists|existiert/i.test(e.message))) return null; throw e; })
      .then(function () { SM.inputs[key] = name; delete SM.failed[key]; smRenderBar(); })
      .catch(function (e) { SM.failed[key] = Date.now(); log('Stream-Mix, ' + name + ': ' + e.message); })
      .then(function () { delete SM.creating[key]; });
  }
  function smVoiceDevice() {
    var vp = virtualPair();
    if (S.settings.virtualMicActive && vp) return vp.inp.id;
    return S.settings.mic.inputId || (defaultCapture() || {}).id || '';
  }
  function smTick() {
    if (!SM.ready || !smOn() || SM.busy) return;
    var c = S.settings.streamMix, reqs = [];
    S.groups.forEach(function (g) {
      if (g.system) return;
      var en = smEntry(g), name = SM.inputs[g.key];
      if (!name) { if (en.on) smCreate(g.key, SM_PREFIX + g.name, 'wasapi_process_output_capture', { window: '::' + encWin(g.key), priority: 2 }); return; }
      smPush(reqs, name, smLevel(g, en));
    });
    var v = c.voice, vn = SM.inputs.__voice, dev = smVoiceDevice();
    if (!vn) { if (v.on && dev) { SM.voiceDev = dev; smCreate('__voice', SM_VOICE, 'wasapi_input_capture', { device_id: dev }); } }
    else {
      if (v.on && dev && SM.voiceDev !== dev) { SM.voiceDev = dev; reqs.push(['SetInputSettings', { inputName: vn, inputSettings: { device_id: dev }, overlay: true }]); }
      smPush(reqs, vn, !v.on || v.vol <= 0.0005 || c.master <= 0.0005 ? { mute: true } : { mute: false, db: 20 * Math.log10(v.vol * c.master) });
    }
    if (reqs.length) obsBatch(reqs).catch(function () { SM.sent = {}; });
  }
  setInterval(smTick, 200);

  // Ein-/Ausschalten
  function smEnable() {
    var c = S.settings.streamMix;
    c.enabled = true; save();
    // Stummgeschaltete Apps: nur noch für dich stumm, im Stream weiter hörbar
    S.groups.forEach(function (g) { if (smHandles(g)) { if (g.muted) setAppMute(g, true); else if (g.userVol <= SM_FLOOR) setAppVolume(g, g.userVol); } });
    smConnect();
    renderPage();
  }
  async function smDisable() {
    var c = S.settings.streamMix;
    S.groups.forEach(function (g) { if (g.smMuted) { g.smMuted = false; fx.call('setAppVolume', { pids: g.pids, system: g.system, value: g.userVol }).catch(function () {}); fx.call('setAppMute', { pids: g.pids, system: g.system, muted: true }).catch(function () {}); g.muted = true; } });
    if (SM.status.state === 'ok') {
      var reqs = [];
      for (var k in SM.inputs) reqs.push(['SetInputMute', { inputName: SM.inputs[k], inputMuted: true }]);
      await obsBatch(reqs).catch(function () {});
      await smDesktopAudio(false);
    }
    c.enabled = false; save();
    SM.ready = false;
    if (fx.obsConfig) fx.obsConfig({ enabled: false }).then(smOnStatus).catch(function () {});
    renderPage();
  }
  async function smRemoveFromObs() {
    if (SM.status.state !== 'ok') { toast('Dafür muss OBS geöffnet und verbunden sein.', true); return; }
    var reqs = [];
    for (var k in SM.inputs) reqs.push(['RemoveInput', { inputName: SM.inputs[k] }]);
    reqs.push(['RemoveScene', { sceneName: SM_SCENE }]);
    await obsBatch(reqs).catch(function () {});
    await smDesktopAudio(false);
    SM.inputs = {}; SM.sent = {};
    await smDisable();
    toast('Fusion-X wurde aus OBS entfernt.');
  }
  function smOnObs(msg) {
    if (msg.status) { smOnStatus(msg.status); return; }
    var ev = msg.event; if (!ev) return;
    if (ev.type === 'SceneCreated' && !ev.data.isGroup && ev.data.sceneName !== SM_SCENE && SM.ready && S.settings.streamMix.addToScenes) smEnsureInScene(ev.data.sceneName).then(function (ok) { if (ok) { SM.scenes++; smRenderBar(); } });
    if (ev.type === 'InputRemoved') { for (var k in SM.inputs) if (SM.inputs[k] === ev.data.inputName) { delete SM.inputs[k]; delete SM.sent[ev.data.inputName]; SM.failed[k] = Date.now(); } }
    if (ev.type === 'InputNameChanged') { for (var k2 in SM.inputs) if (SM.inputs[k2] === ev.data.oldInputName) { SM.inputs[k2] = ev.data.inputName; delete SM.sent[ev.data.oldInputName]; } }
    if (ev.type === 'ExitStarted') smOnStatus({ state: 'error', error: 'OBS wurde geschlossen' });
  }

  // Anzeige im Mixer
  function smStatusText() {
    var st = SM.status.state;
    if (st === 'ok' && SM.ready) return { cls: 'ok', text: 'Mit OBS verbunden' };
    if (st === 'ok' || st === 'auth') return { cls: '', text: 'Richtet OBS ein …' };
    if (st === 'connecting') return { cls: '', text: 'Verbinde mit OBS …' };
    if (st === 'error') return { cls: 'bad', text: SM.status.error || 'Keine Verbindung' };
    return { cls: '', text: 'Nicht verbunden' };
  }
  function smRenderBar() {
    var box = $('#smBar');
    if (!box) return;
    if (!smOn()) { box.innerHTML = ''; return; }
    var c = S.settings.streamMix, st = smStatusText();
    if (SM.status.state === 'ok' && SM.ready) {
      var n = Object.keys(SM.inputs).length, ver = (SM.status.version || {}).obs;
      box.innerHTML = (SM.error ? '<div class="notice bad">' + ic('warn') + '<div><b>OBS meldet ein Problem</b>' + esc(SM.error) + '</div></div>' : '') +
        '<div class="smbar ok">' + ic('stream') + '<div><b>Stream-Mix läuft</b><span>OBS' + (ver ? ' ' + esc(ver) : '') + ' · ' + n + (n === 1 ? ' Quelle' : ' Quellen') + ' in der Szene „' + SM_SCENE + '“' + (c.muteDesktop && SM.desktop && SM.desktop.length ? ' · OBS-Desktop-Audio stumm' : '') + '</span></div>' +
        '<button class="btn sm" data-act="smSetup">' + ic('settings', 'sm') + 'Einrichtung</button></div>';
      return;
    }
    if (SM.error && SM.status.state === 'ok') {
      box.innerHTML = '<div class="notice bad">' + ic('warn') + '<div><b>Stream-Mix geht mit diesem OBS nicht</b>' + esc(SM.error) + '</div></div>';
      return;
    }
    box.innerHTML = '<section class="card smcard">' +
      '<div class="chead"><div><h2>' + ic('stream') + 'Stream-Mix mit OBS verbinden</h2><p class="lead">Damit dein Stream einen eigenen Mix bekommt, steuert Fusion-X OBS direkt. Kein Zusatz-Treiber nötig.</p></div>' +
        '<span class="badge ' + st.cls + '">' + esc(st.text) + '</span></div>' +
      '<ol class="steps">' +
        '<li><b>OBS öffnen</b> (Version 28 oder neuer)</li>' +
        '<li><b>Werkzeuge → WebSocket-Servereinstellungen</b>: „WebSocket-Server aktivieren“ anhaken</li>' +
        '<li>Dort auf <b>„Verbindungsinformationen anzeigen“</b> klicken und das Passwort hier einfügen</li>' +
      '</ol>' +
      '<div class="smform">' +
        '<label class="field"><span class="eyebrow">Passwort</span><input class="input" id="smPass" type="password" autocomplete="off" value="' + esc(c.obs.password) + '" placeholder="aus OBS kopieren"></label>' +
        '<label class="field"><span class="eyebrow">Port</span><input class="input mono" id="smPort" inputmode="numeric" value="' + esc(c.obs.port) + '"></label>' +
        '<button class="btn primary" data-act="smConnect">' + ic('route', 'sm') + 'Verbinden</button>' +
      '</div>' +
    '</section>';
  }
  function smSetupDialog() {
    var c = S.settings.streamMix;
    var dlg = modal('<h2>' + ic('stream') + 'Stream-Mix einrichten</h2>' +
      '<p class="lead">Fusion-X legt in OBS die Szene „' + SM_SCENE + '“ an. Darin steckt für jede App eine eigene Audioaufnahme. Die Szene liegt unsichtbar in deinen anderen Szenen, damit der Ton überall im Stream ist.</p>' +
      srow('In alle Szenen einfügen', 'Auch in neue Szenen, sobald du sie anlegst', sw(c.addToScenes, 'id="smScenes"')) +
      srow('OBS-Desktop-Audio stummschalten', 'Sonst wären deine Apps doppelt im Stream', sw(c.muteDesktop, 'id="smDesk"')) +
      srow('Deine Stimme im Stream-Mix', 'Nur einschalten, wenn dein Mikro noch nicht in OBS ist', sw(c.voice.on, 'id="smVoice"', 'amber')) +
      srow('Neue Apps automatisch in den Stream', 'Sonst musst du jede App einzeln freigeben', sw(c.newAppsOn, 'id="smNew"')) +
      '<div class="foot"><button class="btn danger" id="smRemove">' + ic('x', 'sm') + 'Aus OBS entfernen</button><div class="row"><button class="btn" id="smOff">Stream-Mix ausschalten</button><button class="btn primary" data-close>Fertig</button></div></div>');
    var bind = function (id, fn) { $('#' + id, dlg).onclick = function () { var v = fn(); this.setAttribute('aria-checked', !!v); save(); }; };
    bind('smScenes', function () { c.addToScenes = !c.addToScenes; if (c.addToScenes && SM.ready) smSetup(); return c.addToScenes; });
    bind('smDesk', function () { c.muteDesktop = !c.muteDesktop; if (SM.status.state === 'ok') smDesktopAudio(c.muteDesktop); return c.muteDesktop; });
    bind('smVoice', function () { c.voice.on = !c.voice.on; renderStripsIfMixer(); return c.voice.on; });
    bind('smNew', function () { c.newAppsOn = !c.newAppsOn; return c.newAppsOn; });
    $('[data-close]', dlg).onclick = function () { closeModal(); smRenderBar(); };
    $('#smOff', dlg).onclick = function () { closeModal(); smDisable(); };
    $('#smRemove', dlg).onclick = function () {
      var b = this;
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.innerHTML = ic('warn', 'sm') + 'Wirklich entfernen?'; return; }
      closeModal(); smRemoveFromObs();
    };
  }

  // ------------------------------------------------------------------ Ereignisse
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nav]');
    if (t) { go(t.dataset.nav); return; }
    var sg = e.target.closest('[data-seg]');
    if (sg) { onSeg(sg.dataset.seg, sg.dataset.val); return; }
    var tg = e.target.closest('[data-toggle]');
    if (tg) { toggleFx(tg.dataset.toggle, tg); return; }
    var pq = e.target.closest('[data-peq]');
    if (pq) { peqSetPreset(pq.dataset.peq); toast('Equalizer: ' + PEQ_PRESETS[pq.dataset.peq].name); return; }
    var pr = e.target.closest('[data-preset]');
    if (pr) { S.settings.mic = E.applyPreset(S.settings.mic, pr.dataset.preset); micChanged(); renderPage(); renderStripsIfMixer(); toast('Vorlage „' + E.PRESETS[pr.dataset.preset].name + '“ aktiv'); return; }
    var sb = e.target.closest('[data-setbool]');
    if (sb) { var k = sb.dataset.setbool; S.settings[k] = !S.settings[k]; save(); fx.saveSettings((function () { var o = {}; o[k] = S.settings[k]; return o; })()); if (k === 'proMode') { renderTop(); } renderPage(); return; }
    var sd = e.target.closest('[data-setduck]');
    if (sd) { S.settings.ducking.enabled = !S.settings.ducking.enabled; save(); fx.setTray({ ducking: S.settings.ducking.enabled }); renderPage(); return; }
    var dc = e.target.closest('[data-duckcat]');
    if (dc) { var c = dc.dataset.duckcat; S.settings.ducking.cats[c] = !S.settings.ducking.cats[c]; dc.setAttribute('aria-pressed', S.settings.ducking.cats[c]); save(); return; }
    var hk = e.target.closest('[data-hotkey]');
    if (hk) { recordHotkey(hk); return; }
    var a = e.target.closest('[data-act]');
    if (a && a.tagName !== 'SELECT') onAct(a.dataset.act, a, e);
  });

  function renderStripsIfMixer() { if (S.page === 'mixer') renderStrips(); }

  function onSeg(name, val) {
    var mic = S.settings.mic;
    if (name === 'proMode') { S.settings.proMode = val === '1'; save(); renderTop(); renderPage(); return; }
    if (name === 'channel') { mic.channel = val; micChanged(); renderPage(); return; }
    if (name === 'pttMode') { S.settings.ptt.mode = val; save(); pttWatch(); renderPage(); if (val !== 'off' && !S.settings.ptt.vk) { toast('Leg jetzt deine Sprechtaste fest.'); var kb = $('#pttKey'); if (kb) recordPttKey(kb); } return; }
    if (name === 'lang') { S.settings.lang = val; save(); fx.saveSettings({ lang: val }); applyLang(); renderTop(); renderPage(); return; }
    if (name === 'osdPos') { S.settings.osd.position = val; save(); renderPage(); if (fx.osd) fx.osd({ icon: 'mic', tone: 'voice', title: 'So sieht die Anzeige aus', sub: val === 'top' ? 'Oben am Bildschirm' : 'Unten am Bildschirm', position: val }); return; }
    if (name === 'denoise') { mic.denoise = val; mic.preset = null; micChanged(); renderPage(); return; }
  }

  function toggleFx(path, el) {
    var mic = S.settings.mic, parts = path.split('.');
    var o = mic[parts[0]];
    o[parts[1]] = !o[parts[1]];
    if (parts[0] !== 'monitor') mic.preset = null;
    el.setAttribute('aria-checked', o[parts[1]]);
    var card = el.closest('.fx'); if (card) card.classList.toggle('off', !o[parts[1]]);
    micChanged();
    if (path === 'eq.on') drawEq();
  }

  async function onAct(act, el, e) {
    var strip = el.closest('.strip'), g = strip && S.groups.get(strip.dataset.key), st = S.settings;
    switch (act) {
      case 'appMute': if (g) { setAppMute(g, !g.muted); syncStrip(g); } break;
      case 'appStream': if (g) { smSetEntry(g, { on: !smEntry(g).on }); if (smEntry(g).on && g.muted && !g.smMuted) setAppMute(g, true); else if (!smEntry(g).on && g.smMuted) { g.smMuted = false; setAppMute(g, true); } syncStrip(g); smTick(); } break;
      case 'voiceStream': { var vo = st.streamMix.voice; vo.on = !vo.on; save(); renderStrips(); smTick(); if (vo.on && !st.virtualMicActive) toast('Tipp: Aktiviere auf der Mikrofon-Seite „Für alle Apps“, dann hört dein Stream deine bearbeitete Stimme.'); break; }
      case 'smConnect': { var pw = $('#smPass'), po = $('#smPort'); st.streamMix.obs.password = pw ? pw.value : st.streamMix.obs.password; st.streamMix.obs.port = po ? (+po.value || 4455) : st.streamMix.obs.port; save(); smConnect(); break; }
      case 'smSetup': smSetupDialog(); break;
      case 'updCheck': if (fx.update) onUpdate(await fx.update('check')); break;
      case 'updDownload': if (fx.update) onUpdate(await fx.update('download')); break;
      case 'updInstall': if (fx.update) fx.update('install'); break;
      case 'eqDownload': if (fx.eq) { var dr = await fx.eq('download'); if (S.demo) toast('In der Windows-App öffnet sich jetzt der Download.'); else if (dr && dr.ok) toast('Download gestartet. Nach der Installation den PC neu starten.'); } break;
      case 'eqRecheck': await peqRefresh(); renderPage(); toast(PEQ.status.installed ? 'Equalizer APO gefunden. Der Equalizer ist bereit.' : 'Equalizer APO ist noch nicht installiert.', !PEQ.status.installed); if (PEQ.status.installed) peqApply(true); break;
      case 'eqDevices': { var rr = await fx.eq('devices'); if (rr && !rr.ok) toast(rr.error || 'Konnte nicht geöffnet werden', true); else toast('Hake deine Geräte an. Danach den PC neu starten.'); break; }
      case 'eqReset': peqSetPreset('flat'); break;
      case 'appDuck': if (g) { st.ducking.apps[g.key] = !isDuckTarget(g); save(); syncStrip(g); } break;
      case 'masterMute': { var d = refs.master && refs.master.dev; if (d) { d.muted = !d.muted; fx.call('setDeviceMute', { device: d.id, muted: d.muted }); el.setAttribute('aria-pressed', d.muted); el.innerHTML = ic(d.muted ? 'speakerOff' : 'speaker', 'sm'); } break; }
      case 'voiceMute': setMute(!st.mic.muted); el.setAttribute('aria-pressed', st.mic.muted); el.innerHTML = ic(st.mic.muted ? 'micOff' : 'mic', 'sm'); break;
      case 'micCheck': openMicCheck(); break;
      case 'testRec': openTestRec(); break;
      case 'engineRetry': startEngine(); break;
      case 'vmOn': activateVirtualMic(); break;
      case 'vmOff': deactivateVirtualMic(); break;
      case 'recheck': setDevices(await fx.devices()); if (virtualPair()) { S.cable = null; if (S.settings.virtualMicWanted || S.cable === null) await activateVirtualMic(); } renderPage(); toast(virtualPair() ? 'Virtuelles Mikrofon gefunden.' : 'Noch kein virtuelles Mikrofon gefunden. Nach der Installation den PC neu starten.', !virtualPair()); break;
      case 'cableInstall': autoInstallCable(); break;
      case 'diagCopy': copyDiagnose(); break;
      case 'gateAuto': autoGate(); break;
      case 'devDefault': { var row = el.closest('[data-dev]'); try { var dd = devById(row.dataset.dev); if (dd && S.settings.autoDefault && !dd.cls.virtual) preferDevice(dd, true); await fx.call('setDefault', { device: row.dataset.dev, roles: 'all' }); setDevices(await fx.devices()); renderPage(); toast('Standardgerät geändert'); } catch (err) { toast(err.message, true); } break; }
      case 'devPrefer': { var pd = devById(el.closest('[data-dev]').dataset.dev); if (pd) { if (prefRank(pd)) S.settings.preferred[pd.flow] = S.settings.preferred[pd.flow].filter(function (x) { return x !== pd.id; }); else preferDevice(pd, false); save(); renderPage(); if (prefRank(pd) === 1) enforcePreferred(); } break; }
      case 'sbAdd': $('#sbFile') && $('#sbFile').click(); break;
      case 'sbPlay': { var sp = el.closest('[data-sound]'); if (sp) sbPlay(sp.dataset.sound); break; }
      case 'sbEdit': { var se = el.closest('[data-sound]'); if (se) sbEdit(se.dataset.sound); break; }
      case 'sbStopAll': sbStopAll(); break;
      case 'devMute': { var r2 = el.closest('[data-dev]'), dv = devById(r2.dataset.dev); if (dv) { dv.muted = !dv.muted; fx.call('setDeviceMute', { device: dv.id, muted: dv.muted }); el.setAttribute('aria-pressed', dv.muted); el.innerHTML = ic(dv.muted ? (dv.flow === 'capture' ? 'micOff' : 'speakerOff') : (dv.flow === 'capture' ? 'mic' : 'speaker'), 'sm'); } break; }
      case 'alignComms': try { for (var ai = 0, al = el.dataset.id.split(','); ai < al.length; ai++) await fx.call('setDefault', { device: al[ai], roles: 'all' }); setDevices(await fx.devices()); renderPage(); toast('Erledigt: Alles läuft jetzt über dasselbe Gerät.'); } catch (err) { toast(err.message, true); } break;
      case 'profApply': applyProfile(el.dataset.p); break;
      case 'profCapture': { var p = profileById(el.dataset.p); captureProfile(p); save(); renderPage(); toast('„' + p.name + '“ übernimmt jetzt deine aktuellen Einstellungen.'); break; }
      case 'profDel': st.profiles = st.profiles.filter(function (x) { return x.id !== el.dataset.p; }); if (st.activeProfile === el.dataset.p) st.activeProfile = null; save(); renderPage(); renderTop(); syncTrayProfiles(); break;
      case 'profNew': {
        var name = ($('#newProfName').value || '').trim();
        if (!name) { toast('Gib dem Profil einen Namen.', true); break; }
        var np = { id: 'p' + Date.now().toString(36), name: name, icon: 'star', preset: st.mic.preset || 'clear', ducking: {}, levels: {}, autoApps: [], autoCat: null };
        captureProfile(np); st.profiles.push(np); save(); renderPage(); renderTop(); syncTrayProfiles(); toast('Profil „' + name + '“ angelegt');
        break;
      }
      case 'autoDel': { var p2 = profileById(el.dataset.p); p2.autoApps = p2.autoApps.filter(function (x) { return x !== el.dataset.app; }); save(); renderPage(); break; }
      case 'autoCatDel': { var p3 = profileById(el.dataset.p); p3.autoCat = null; save(); renderPage(); break; }
      case 'wizard': openWizard(); break;
      case 'sdInstall': { var res = await fx.installStreamDeck(); toast(res && res.ok ? 'Die Stream-Deck-Software installiert jetzt das Plugin. Bestätige dort kurz.' : (res && res.error) || 'Installation fehlgeschlagen', !(res && res.ok)); break; }
    }
  }

  document.addEventListener('change', async function (e) {
    var t = e.target, st = S.settings, mic = st.mic;
    if (t.id === 'mixOut') { var md = devById(t.value); if (md && S.settings.autoDefault) preferDevice(md, true); try { await fx.call('setDefault', { device: t.value, roles: 'all' }); setDevices(await fx.devices()); renderStrips(); toast('Ausgabe gewechselt'); } catch (err) { toast(err.message, true); } return; }
    if (t.id === 'micInput') { mic.inputId = t.value; micChanged(true); return; }
    if (t.id === 'monDev') { mic.monitor.device = t.value; micChanged(); return; }
    if (t.id === 'topProfile') { if (t.value) applyProfile(t.value); else { st.activeProfile = null; save(); fx.setTray({ profile: null }); } return; }
    if (t.id === 'setVirtualOut') { st.virtualOut = t.value; micChanged(true); return; }
    if (t.dataset.act === 'appOut') {
      var g = S.groups.get(t.closest('.strip').dataset.key);
      if (!g) return;
      try {
        await fx.call('setAppOutput', { pids: g.pids, device: t.value || '' });
        g.output = t.value || null;
        var d = devById(t.value);
        toast(g.name + ' spielt jetzt über ' + (d ? devTitle(d) : 'das Standardgerät') + '. Manche Apps übernehmen das erst nach einem Neustart.');
      } catch (err) { toast(err.message, true); }
      return;
    }
    if (t.dataset.act === 'autoAdd' && t.value) { var p = profileById(t.dataset.p); if (p.autoApps.indexOf(t.value) < 0) p.autoApps.push(t.value); save(); renderPage(); return; }
    if (t.id === 'setAutostart') return;
  });

  document.addEventListener('input', function (e) {
    var t = e.target, mic = S.settings.mic, v = +t.value, out = $('#' + t.id + '-out');
    if (t.type === 'range') paintRange(t);
    var txt = null, restart = false;
    switch (t.dataset.range) {
      case 'gainDb': mic.gainDb = v; txt = fmtDb(v, true); break;
      case 'outGainDb': mic.outGainDb = v; txt = fmtDb(v, true); break;
      case 'gateSens': mic.gate.open = Math.round(-70 + v / 100 * 40); mic.gate.close = mic.gate.open - 6; txt = fmtDb(mic.gate.open); break;
      case 'gateRelease': mic.gate.releaseMs = v; txt = v + ' ms'; break;
      case 'gateHold': mic.gate.holdMs = v; txt = v + ' ms'; break;
      case 'gateFloor': mic.gate.floorDb = v; txt = fmtDb(v); break;
      case 'eqLow': mic.eq.low.g = v; mic.preset = null; txt = fmtDb(v, true); break;
      case 'eqMid': mic.eq.mid2.g = v; mic.preset = null; txt = fmtDb(v, true); break;
      case 'eqHigh': mic.eq.high.g = v; mic.preset = null; txt = fmtDb(v, true); break;
      case 'hpfFreq': mic.hpf.on = v > 20; mic.hpf.freq = v; txt = v > 20 ? v + ' Hz' : 'Aus'; drawEq(); break;
      case 'compAmount': Object.assign(mic.comp, E.compFromAmount(v)); mic.preset = null; txt = v + ' %'; break;
      case 'compThr': mic.comp.thr = v; txt = fmtDb(v); break;
      case 'compRatio': mic.comp.ratio = v; txt = String(v).replace('.', ',') + ' : 1'; break;
      case 'compAtt': mic.comp.att = v; txt = v + ' ms'; break;
      case 'compRel': mic.comp.rel = v; txt = v + ' ms'; break;
      case 'compMakeup': mic.comp.makeup = v; txt = fmtDb(v, true); break;
      case 'deessAmount': mic.deess.amount = v; txt = v + ' %'; break;
      case 'deessFreq': mic.deess.freq = v; txt = (v / 1000).toFixed(1).replace('.', ',') + ' kHz'; break;
      case 'monVol': mic.monitor.volume = v; txt = pct(v); break;
      case 'pttRelease': S.settings.ptt.release = v; save(); if (out) out.textContent = v + ' ms'; return;
      case 'sbMic': S.settings.sb.micVol = v; save(); if (out) out.textContent = pct(v); return;
      case 'sbSelf': S.settings.sb.selfVol = v; save(); if (out) out.textContent = pct(v); return;
      case 'winLevel': { var wd = devById(mic.inputId); if (wd) { wd.volume = v; fx.call('setDeviceVolume', { device: wd.id, value: v }).catch(function () {}); } if (out) out.textContent = pct(v); return; }
      case 'duckAmount': S.settings.ducking.amount = v; txt = '−' + v + ' %'; save(); if (out) out.textContent = txt; return;
      case 'duckRelease': S.settings.ducking.release = v; txt = (v / 1000).toFixed(1).replace('.', ',') + ' s'; save(); if (out) out.textContent = txt; return;
      default:
        if (t.hasAttribute('data-devvol')) {
          var row = t.closest('[data-dev]'), d = devById(row.dataset.dev);
          if (d) { d.volume = v; t.nextElementSibling.textContent = pct(v); fx.call('setDeviceVolume', { device: d.id, value: v }).catch(function () {}); }
        }
        return;
    }
    if (out && txt != null) out.textContent = txt;
    S.engine.update(mic);
    save();
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.id === 'setAutostart') {
      var want = t.getAttribute('aria-checked') !== 'true';
      fx.setAutostart(want).then(function (on) { S.autostart = on; t.setAttribute('aria-checked', !!on); });
    }
    if (t.id === 'micEnabled') {
      S.settings.micEnabled = !S.settings.micEnabled; save();
      if (S.settings.micEnabled) startEngine(); else stopEngine();
    }
    if (t.id === 'duckSw') { S.settings.ducking.enabled = !S.settings.ducking.enabled; t.setAttribute('aria-checked', S.settings.ducking.enabled); save(); fx.setTray({ ducking: S.settings.ducking.enabled }); }
    if (t.id === 'updAuto') { S.settings.autoUpdate = !S.settings.autoUpdate; t.setAttribute('aria-checked', S.settings.autoUpdate); save(); if (fx.update) fx.update('auto', S.settings.autoUpdate); return; }
    if (t.id === 'eqOn') { S.settings.eq.enabled = !S.settings.eq.enabled; t.setAttribute('aria-checked', S.settings.eq.enabled); save(); peqApply(true); var pk = $('.peq'); if (pk) pk.classList.toggle('off', !S.settings.eq.enabled); drawPeq(); return; }
    if (t.id === 'smSw') { if (smOn()) smDisable(); else smEnable(); return; }
    if (t.id === 'activeSw') { S.settings.onlyActive = !S.settings.onlyActive; t.setAttribute('aria-checked', S.settings.onlyActive); save(); renderStrips(); }
    if (t.id === 'setGlass') { S.settings.windowGlass = S.settings.windowGlass === false; t.setAttribute('aria-checked', S.settings.windowGlass !== false); save(); toast('Wird beim nächsten Start von Fusion-X übernommen.'); }
    if (t.id === 'osdOn') { S.settings.osd.enabled = !S.settings.osd.enabled; t.setAttribute('aria-checked', S.settings.osd.enabled); save(); }
    if (t.id === 'osdRemind') { S.settings.osd.remind = !S.settings.osd.remind; t.setAttribute('aria-checked', S.settings.osd.remind); save(); }
    if (t.id === 'pttBeep') { S.settings.ptt.beep = !S.settings.ptt.beep; t.setAttribute('aria-checked', S.settings.ptt.beep); save(); }
    if (t.id === 'pttKey') recordPttKey(t);
    if (t.id === 'sbHear') { S.settings.sb.hearSelf = !S.settings.sb.hearSelf; t.setAttribute('aria-checked', S.settings.sb.hearSelf); save(); }
    if (t.id === 'autoProf') { S.settings.autoProfiles = !S.settings.autoProfiles; t.setAttribute('aria-checked', S.settings.autoProfiles); save(); }
    if (t.closest && t.closest('#micBtn')) setMute(!S.settings.mic.muted);
    if (t.closest && t.closest('a[href^="http"]') && !fx.isDemo) { e.preventDefault(); fx.openExternal(t.closest('a').href); }
  });

  function recordHotkey(btn) {
    var k = btn.dataset.hotkey;
    btn.classList.add('rec'); btn.textContent = 'Kombination drücken …';
    var handler = function (e) {
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Escape') { finish(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { S.settings.hotkeys[k] = ''; finish(); return; }
      var acc = keyToAccel(e);
      if (!acc) return;
      S.settings.hotkeys[k] = acc;
      finish();
    };
    function finish() {
      document.removeEventListener('keydown', handler, true);
      btn.classList.remove('rec');
      btn.textContent = prettyKey(S.settings.hotkeys[k]) || 'Nicht belegt';
      save();
      fx.setHotkeys(allHotkeys()).then(function (failed) {
        if (failed && failed.indexOf(k) >= 0) toast('Diese Kombination ist schon von einem anderen Programm belegt.', true);
      });
    }
    document.addEventListener('keydown', handler, true);
  }

  // ------------------------------------------------------------------ Automatik: Gate
  async function autoGate() {
    if (S.engine.state !== 'on') { toast('Das Mikrofon muss dafür laufen.', true); return; }
    toast('Bitte 3 Sekunden still sein …');
    var rows = await S.engine.sample(3000);
    var floor = median(rows.map(function (r) { return r.inRms; }));
    var mic = S.settings.mic;
    mic.gate.open = clamp(Math.round(floor + 10), -72, -30);
    mic.gate.close = mic.gate.open - 6;
    micChanged();
    renderPage();
    toast('Fertig: Schwelle auf ' + fmtDb(mic.gate.open) + ' gesetzt (Grundrauschen ' + fmtDb(floor) + ').');
  }
  function median(a) { if (!a.length) return -90; var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; }
  function percentile(a, p) { if (!a.length) return -90; var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; }

  // ------------------------------------------------------------------ Dialoge
  function modal(html, cls) {
    var m = $('#modal');
    m.innerHTML = '<div class="scrim"><div class="dialog ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
    return $('.dialog', m);
  }
  function closeModal() { $('#modal').innerHTML = ''; if (S.playCtx) { try { S.playCtx.close(); } catch (_) {} S.playCtx = null; } }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#modal').innerHTML && !S.checkRunning) closeModal(); });

  // Mikro-Check: Stille messen, Sprache messen, alles passend einstellen
  async function openMicCheck(inWizard, onDone) {
    var dlg = modal('<h2>Mikro-Check</h2><p class="lead">In 10 Sekunden stellt Fusion-X Lautstärke, Störgeräusch-Sperre, Rauschunterdrückung und den richtigen Eingang deines Interfaces ein.</p>' +
      '<div class="bigstate"><div class="orb calm" id="orb">' + ic('mic', 'lg') + '</div><h3 id="ckTitle">Bereit?</h3><p id="ckText">Setz dich so hin wie beim Spielen oder Streamen. Zuerst bitte kurz still sein, dann normal sprechen.</p></div>' +
      '<div class="progress"><i id="ckBar"></i></div><div id="ckResult"></div>' +
      '<div class="foot"><button class="btn ghost" data-close>' + (inWizard ? 'Überspringen' : 'Abbrechen') + '</button><button class="btn amber" id="ckGo">' + ic('play', 'sm') + 'Los geht\'s</button></div>');
    $('[data-close]', dlg).onclick = function () { S.checkRunning = false; closeModal(); if (onDone) onDone(false); };
    $('#ckGo').onclick = async function () {
      if (S.engine.state !== 'on') await startEngine();
      if (S.engine.state !== 'on') { $('#ckText').textContent = S.demo ? 'In der Vorschau gibt es keinen Mikrofonzugriff. In der installierten Windows-App misst der Mikro-Check deine echte Stimme.' : (S.engine.error || 'Das Mikrofon konnte nicht gestartet werden.'); return; }
      S.checkRunning = true;
      this.disabled = true;
      var orb = $('#orb'), bar = $('#ckBar'), mic = S.settings.mic;
      var ckDev = devById(mic.inputId);
      S.levelRaised = null;
      if (ckDev && !ckDev.cls.interface && !ckDev.cls.virtual && ckDev.volume < 0.7) {
        S.levelRaised = ckDev.volume;
        ckDev.volume = 1;
        try { await fx.call('setDeviceVolume', { device: ckDev.id, value: 1 }); } catch (_) { S.levelRaised = null; }
        await new Promise(function (r) { setTimeout(r, 300); });
      }
      var prevChan = mic.channel;
      mic.channel = 'mix'; S.engine.update(mic);
      $('#ckTitle').textContent = 'Psst … 3 Sekunden Stille';
      $('#ckText').textContent = 'Wir messen dein Grundrauschen: Lüfter, Raum, Straße.';
      var sil = await S.engine.sample(3000, function (p) { bar.style.width = p * 30 + '%'; });
      orb.classList.remove('calm');
      $('#ckTitle').textContent = 'Jetzt sprechen';
      $('#ckText').textContent = 'Erzähl einfach, was du heute vorhast, oder zähl langsam bis 20.';
      var spk = await S.engine.sample(7000, function (p, m) { bar.style.width = 30 + p * 70 + '%'; if (m) orb.style.transform = 'scale(' + (1 + dbFrac(m.input.peak) * 0.25) + ')'; });
      orb.style.transform = '';
      S.checkRunning = false;
      var res = analyzeCheck(sil, spk, prevChan);
      showCheckResult(dlg, res, inWizard, onDone);
    };
  }

  function analyzeCheck(sil, spk, prevChan) {
    var mic = S.settings.mic, eng = S.engine, dev = devById(mic.inputId);
    var floor = median(sil.map(function (r) { return r.inRms; }));
    var voiced = spk.filter(function (r) { return r.inRms > floor + 8; });
    var r = { ok: voiced.length >= 12, floor: floor, items: [] };
    if (!r.ok) return r;
    // Kanal: liegt Sprache nur auf einer Seite?
    var avgL = voiced.reduce(function (s, x) { return s + x.l; }, 0) / voiced.length, avgR = voiced.reduce(function (s, x) { return s + x.r; }, 0) / voiced.length;
    var chan = 'mix', boost = 0;
    if (eng.channels >= 2) {
      if (avgL - avgR > 15) { chan = 'left'; boost = 6; } else if (avgR - avgL > 15) { chan = 'right'; boost = 6; }
    }
    var p95 = percentile(voiced.map(function (x) { return x.inPeak; }), 0.95) + boost;
    var p20 = percentile(voiced.map(function (x) { return x.inRms; }), 0.2) + boost;
    var rawMax = Math.max.apply(null, spk.map(function (x) { return x.rawPeak; }));
    var gain = clamp(Math.round((mic.gainDb + (-9 - p95)) * 2) / 2, -12, 30);
    var delta = gain - mic.gainDb;
    var newFloor = floor + boost + delta;
    var gateOpen = clamp(Math.round(Math.min(newFloor + 10, p20 + delta - 6)), -72, -30);
    var denoise = newFloor < -66 ? 'light' : newFloor < -48 ? 'ai' : 'studio';
    r.apply = { gainDb: gain, channel: eng.channels >= 2 ? (chan === 'mix' ? 'auto' : chan) : prevChan, gateOpen: gateOpen, denoise: denoise };
    var hwLow = (p95 - mic.gainDb) < -40;
    var kind = dev ? dev.cls.kind : 'other';
    if (S.levelRaised != null) r.items.push({ t: 'Windows-Mikrofonpegel von ' + Math.round(S.levelRaised * 100) + ' % auf 100 % erhöht', s: 'Der Pegel stand sehr niedrig. So rauscht es weniger als bei reiner Verstärkung in Fusion-X.' });
    var lowTip = dev && dev.cls.interface ? 'Besser: Gain am ' + dev.cls.brand + '-Gerät aufdrehen, dann rauscht es weniger als bei digitaler Verstärkung.'
      : kind === 'usbmic' ? 'Hat dein Mikro einen Gain-Regler, dreh ihn etwas auf. Sonst einfach etwas näher ran.'
      : kind === 'onboard' ? 'Tipp: In der Systemsteuerung unter Sound → Aufnahme → Eigenschaften → Pegel die „Mikrofonverstärkung“ auf +10 dB stellen.'
      : kind === 'headset' ? 'Stell den Mikro-Arm etwas näher an den Mund.'
      : 'Etwas näher ans Mikro gehen hilft am meisten.';
    r.items.push(rawMax > -1
      ? { warn: true, t: 'Übersteuerung am Gerät', s: dev && (dev.cls.interface || kind === 'usbmic') ? 'Dein Signal ist schon vor Fusion-X zu laut. Dreh den Gain-Regler am ' + (dev.cls.brand || 'Mikro') + ' etwas zurück.' : 'Dein Signal ist schon vor Fusion-X zu laut. Fusion-X hat den Windows-Pegel etwas gesenkt.', lower: !(dev && (dev.cls.interface || kind === 'usbmic')) }
      : hwLow
        ? { warn: true, t: 'Lautstärke angepasst: ' + fmtDb(gain, true), s: 'Dein Mikro ist sehr leise. ' + lowTip }
        : { t: 'Lautstärke: ' + fmtDb(gain, true), s: 'Deine Stimme landet jetzt im idealen Bereich.' });
    r.items.push({ t: 'Grundrauschen ' + fmtDb(newFloor) + ' – ' + (newFloor < -66 ? 'sehr ruhig' : newFloor < -54 ? 'ruhig' : newFloor < -46 ? 'hörbar' : 'laut'), s: 'Rauschunterdrückung: ' + { light: 'Leicht', ai: 'KI', studio: 'KI Studio' }[denoise] + ' · Störgeräusch-Sperre bei ' + fmtDb(gateOpen) });
    if (eng.channels >= 2) r.items.push(chan === 'mix' ? { t: 'Eingänge: beide aktiv', s: 'Dein Signal kommt auf beiden Kanälen an.' } : { t: 'Mikro erkannt auf ' + chanName(chan), s: 'Deine Stimme wird jetzt auf beide Seiten gelegt. Ohne das würde man dich in Discord nur links hören.' });
    return r;
  }

  function showCheckResult(dlg, res, inWizard, onDone) {
    var box = $('#ckResult');
    if (!res.ok) {
      $('#ckTitle').textContent = 'Wir haben dich kaum gehört';
      $('#ckText').textContent = 'Prüf, ob das richtige Mikrofon ausgewählt ist, ob es stumm geschaltet ist oder ob der Gain am Gerät ganz unten steht.';
      $('#ckGo').disabled = false; $('#ckGo').innerHTML = ic('refresh', 'sm') + 'Nochmal';
      return;
    }
    $('#ckTitle').textContent = 'Fertig eingestellt';
    $('#ckText').textContent = 'Das haben wir für dich angepasst:';
    box.innerHTML = '<div class="results">' + res.items.map(function (it) { return '<div class="result' + (it.warn ? ' warn' : '') + '">' + ic(it.warn ? 'warn' : 'check', 'sm') + '<div>' + esc(it.t) + '<small>' + esc(it.s) + '</small></div><span></span></div>'; }).join('') + '</div>';
    var mic = S.settings.mic, a = res.apply;
    if (res.items.some(function (it) { return it.lower; })) { var ld = devById(mic.inputId); if (ld) { ld.volume = Math.max(0.3, ld.volume * 0.7); fx.call('setDeviceVolume', { device: ld.id, value: ld.volume }).catch(function () {}); } }
    mic.gainDb = a.gainDb; mic.channel = a.channel; mic.gate.on = true; mic.gate.open = a.gateOpen; mic.gate.close = a.gateOpen - 6; mic.denoise = a.denoise;
    micChanged();
    var go = $('#ckGo');
    go.disabled = false;
    go.innerHTML = inWizard ? 'Weiter' : ic('rec', 'sm') + 'Testaufnahme anhören';
    go.onclick = function () { if (inWizard) { closeModal(); onDone && onDone(true); } else { closeModal(); openTestRec(); } };
    $('[data-close]', dlg).textContent = 'Schließen';
    $('[data-close]', dlg).onclick = function () { closeModal(); if (S.page === 'mic') renderPage(); if (onDone) onDone(true); };
    if (S.page === 'mic') renderPage();
  }

  // Testaufnahme mit Vorher/Nachher
  function openTestRec() {
    var dlg = modal('<h2>Testaufnahme</h2><p class="lead">Sprich 6 Sekunden, gern mit Tastatur-Tippen oder Lüfter im Hintergrund. Danach hörst du dich ohne und mit Fusion-X.</p>' +
      '<div id="trBody"><div class="bigstate"><div class="orb" id="trOrb">' + ic('rec', 'lg') + '</div><h3 id="trTitle">Bereit zur Aufnahme</h3></div><div class="progress"><i id="trBar"></i></div></div>' +
      '<div class="foot"><button class="btn ghost" data-close>Schließen</button><button class="btn amber" id="trGo">' + ic('rec', 'sm') + 'Aufnahme starten</button></div>', 'wide');
    $('[data-close]', dlg).onclick = closeModal;
    $('#trGo').onclick = async function () {
      if (S.engine.state !== 'on') await startEngine();
      if (S.engine.state !== 'on') { $('#trTitle').textContent = S.demo ? 'In der Vorschau gibt es keinen Mikrofonzugriff. In der installierten App hörst du hier dich selbst vorher und nachher.' : (S.engine.error || 'Das Mikrofon konnte nicht gestartet werden.'); return; }
      this.disabled = true;
      $('#trTitle').textContent = 'Aufnahme läuft … sprich jetzt';
      var rec = await S.engine.record(6000, function (p) { $('#trBar').style.width = p * 100 + '%'; });
      showPlayback(dlg, rec);
    };
  }
  function showPlayback(dlg, rec) {
    $('#trBody').innerHTML =
      '<div class="ab"><button data-ab="raw" aria-pressed="false"><b>Original</b><span>So kommt dein Mikro an</span></button><button data-ab="proc" aria-pressed="true"><b>Mit Fusion-X</b><span>So hören dich andere</span></button></div>' +
      '<div style="display:grid;gap:8px"><span class="eyebrow">Original</span><canvas class="wave" id="wRaw"></canvas><span class="eyebrow">Mit Fusion-X</span><canvas class="wave" id="wProc"></canvas></div>';
    drawWave($('#wRaw'), rec.raw, '#8d98a4'); drawWave($('#wProc'), rec.proc, '#6c9bff');
    var go = $('#trGo'); go.disabled = false; go.innerHTML = ic('play', 'sm') + 'Abspielen';
    var which = 'proc', playing = null;
    $$('[data-ab]', dlg).forEach(function (b) { b.onclick = function () { which = b.dataset.ab; $$('[data-ab]', dlg).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if (playing) { playing.ga.gain.setTargetAtTime(which === 'raw' ? 1 : 0, playing.ctx.currentTime, 0.01); playing.gb.gain.setTargetAtTime(which === 'proc' ? 1 : 0, playing.ctx.currentTime, 0.01); } }; });
    go.onclick = async function () {
      if (playing) { try { playing.ctx.close(); } catch (_) {} playing = null; go.innerHTML = ic('play', 'sm') + 'Abspielen'; return; }
      var opts = {}; var ms = monitorSink(); if (ms) opts.sinkId = ms;
      var ctx; try { ctx = new AudioContext(opts); } catch (_) { ctx = new AudioContext(); }
      S.playCtx = ctx;
      var mk = function (data) { var b = ctx.createBuffer(1, data.length, rec.rate); b.copyToChannel(data, 0); var s = ctx.createBufferSource(); s.buffer = b; s.loop = true; return s; };
      var a = mk(rec.raw), b = mk(rec.proc), ga = ctx.createGain(), gb = ctx.createGain();
      ga.gain.value = which === 'raw' ? 1 : 0; gb.gain.value = which === 'proc' ? 1 : 0;
      a.connect(ga).connect(ctx.destination); b.connect(gb).connect(ctx.destination);
      var t = ctx.currentTime + 0.05; a.start(t); b.start(t);
      playing = { ctx: ctx, ga: ga, gb: gb };
      go.innerHTML = ic('stop', 'sm') + 'Stopp';
    };
  }
  function drawWave(cv, data, color) {
    var dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = color;
    var step = Math.max(1, Math.floor(data.length / W));
    for (var x = 0; x < W; x++) {
      var mx = 0; for (var i = x * step; i < (x + 1) * step && i < data.length; i++) { var v = Math.abs(data[i]); if (v > mx) mx = v; }
      var h = Math.max(1, Math.min(1, mx) * (H - 6)); g.fillRect(x, (H - h) / 2, 1, h);
    }
  }

  // Einrichtungs-Assistent beim ersten Start
  function openWizard() {
    var step = 0, use = S.settings.useCase || 'gaming';
    var USES = [['gaming', 'Gaming', 'Voice-Chat mit Freunden, Spiel und Musik im Griff', 'game', 'gaming'], ['stream', 'Streaming', 'Broadcast-Stimme, Spiel und Musik für den Stream', 'stream', 'stream'], ['meeting', 'Calls & Arbeit', 'Klar verständlich in Teams, Zoom und Discord', 'call', 'meeting'], ['music', 'Musik & Podcast', 'Natürlicher Klang, wenig Eingriff', 'music', 'music']];
    function render() {
      var bar = '<div class="steps">' + [0, 1, 2, 3].map(function (i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div>';
      var html = '';
      if (step === 0) {
        html = '<img src="brand/logo-full.jpg" alt="Fusion-X Audio" style="width:100%;border-radius:12px;display:block;aspect-ratio:1000/545;object-fit:cover">' + bar + '<h2>Willkommen bei Fusion-X Audio</h2><p class="lead">Alles, was mit Sound auf deinem PC zu tun hat, an einem Ort: jede App einzeln regeln, deine Stimme klar und rauschfrei, Kopfhörer und Lautsprecher mit einem Klick. Die Einrichtung dauert etwa eine Minute.</p>' +
          '<div class="foot"><span></span><button class="btn primary" data-w="next">Los geht\'s</button></div>';
      } else if (step === 1) {
        var ifs = S.interfaces || [], caps = physicalCaptures(), outs = physicalRenders();
        var line = function (d) { return '<div class="dev"><div class="ico">' + ic(devIcon(d)) + '</div><div style="min-width:0"><div class="nm">' + esc(devTitle(d)) + '<span class="badge' + (d.cls.interface ? ' accent' : '') + '">' + esc(d.cls.label) + '</span></div><div class="meta">' + esc([devSub(d), devFormat(d)].filter(Boolean).join(' · ')) + '</div></div><span></span></div>'; };
        html = bar + '<h2>Das haben wir gefunden</h2>' +
          (ifs.length ? '<div class="notice info">' + ic('iface') + '<div><b>Audio-Interface erkannt: ' + esc(cleanName(ifs[0].name)) + '</b>Perfekt. Gain und 48V stellst du weiter am Gerät ein, Fusion-X kümmert sich um Klang, Rauschen und App-Lautstärken. Auch wenn dein Mikro nur an Eingang 1 hängt.</div></div>' : wizardMicNote()) +
          '<div class="found"><span class="eyebrow">Mikrofone</span>' + caps.map(line).join('') + '<span class="eyebrow" style="margin-top:6px">Ausgabe</span>' + outs.slice(0, 4).map(line).join('') + '</div>' +
          '<div class="foot"><button class="btn ghost" data-w="back">Zurück</button><button class="btn primary" data-w="next">Weiter</button></div>';
      } else if (step === 2) {
        html = bar + '<h2>Wofür nutzt du Fusion-X am meisten?</h2><p class="lead">Danach richten wir Stimme, Lautstärken und das automatische Leiserstellen passend ein. Alles lässt sich später ändern.</p>' +
          '<div class="choice">' + USES.map(function (u) { return '<button data-use="' + u[0] + '" aria-pressed="' + (u[0] === use) + '">' + ic(u[3], 'lg') + '<b>' + u[1] + '</b><span>' + u[2] + '</span></button>'; }).join('') + '</div>' +
          '<div class="foot"><button class="btn ghost" data-w="back">Zurück</button><button class="btn primary" data-w="next">Weiter</button></div>';
      } else {
        var vp = virtualPair();
        html = bar + '<h2>Deine Stimme für alle Apps</h2>' +
          (vp ? '<p class="lead">Ein virtuelles Mikrofon ist installiert. Aktivierst du es, bekommen Discord, OBS, Teams und Spiele automatisch deine bearbeitete Stimme. Du musst in den Apps nichts umstellen.</p><div class="row"><button class="btn primary" data-w="vm">' + ic('check', 'sm') + 'Für alle Apps aktivieren</button></div>'
            : '<p class="lead">Damit Discord, OBS und Spiele deine bearbeitete Stimme hören, braucht Windows ein virtuelles Mikrofon. Fusion-X lädt und installiert es für dich. App-Lautstärken, Geräte und Profile funktionieren auch ohne.</p><div class="cablebox">' + cableBoxInner() + '</div>') +
          '<div class="foot"><button class="btn ghost" data-w="back">Zurück</button><button class="btn primary" data-w="done">Fertig</button></div>';
      }
      var dlg = modal(html);
      $$('[data-use]', dlg).forEach(function (b) { b.onclick = function () { use = b.dataset.use; render(); }; });
      $$('[data-w]', dlg).forEach(function (b) {
        b.onclick = async function () {
          var w = b.dataset.w;
          if (w === 'back') { step--; render(); }
          else if (w === 'next') {
            if (step === 2) {
              S.settings.useCase = use;
              var prof = USES.filter(function (u) { return u[0] === use; })[0][4];
              applyProfile(prof);
              step = 3;
              closeModal();
              openMicCheck(true, function () { render(); });
              return;
            }
            step++; render();
          } else if (w === 'vm') { await activateVirtualMic(); render(); }
          else if (w === 'done') { S.settings.onboarded = true; save(); closeModal(); go('mixer'); }
        };
      });
    }
    render();
  }

  function wizardMicNote() {
    var d = devById(S.settings.mic.inputId);
    if (!d) return '<div class="notice warn">' + ic('warn') + '<div><b>Kein Mikrofon gefunden</b>App-Lautstärken und Geräte funktionieren trotzdem. Steck ein Headset oder Mikro an, dann taucht es hier auf.</div></div>';
    var txt = {
      usbmic: 'USB-Mikrofon erkannt: ' + devTitle(d) + '. Fusion-X macht daraus Studio-Klang, ganz ohne Zusatzgeräte.',
      headset: 'Headset-Mikro erkannt: ' + devTitle(d) + '. Fusion-X filtert Tastatur und Lüfter raus und macht deine Stimme klarer.',
      builtin: 'Eingebautes Mikrofon erkannt. Fusion-X holt mit KI-Rauschunterdrückung das Beste raus, damit niemand deine Tastatur hört.',
      onboard: 'Mikro an der Klinke erkannt. Fusion-X stellt den Pegel passend ein und filtert Rauschen raus.',
      webcam: 'Webcam-Mikro erkannt. Fusion-X gleicht den großen Abstand zum Mund aus.',
      bluetooth: 'Bluetooth-Mikro erkannt. Tipp: Für besten Klang lieber ein anderes Mikro nehmen, sonst schaltet Windows auf Telefonqualität.'
    }[d.cls.kind] || ('Mikrofon erkannt: ' + devTitle(d) + '.');
    return '<div class="notice ' + (d.cls.kind === 'bluetooth' ? 'warn' : 'ok') + '">' + ic(d.cls.kind === 'bluetooth' ? 'warn' : 'check') + '<div><b>Kein Audio-Interface nötig</b>' + esc(txt) + '</div></div>';
  }

  function renderDemoBar() {
    var bar = $('.demo-bar') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'demo-bar' }));
    var cur = fx.scenario();
    bar.innerHTML = '<span>Vorschau-Setup</span>' + [['interface', 'Mit Interface'], ['headset', 'Gaming-Headset'], ['laptop', 'Nur Laptop']].map(function (o) {
      return '<button data-scenario="' + o[0] + '" aria-pressed="' + (o[0] === cur) + '">' + o[1] + '</button>';
    }).join('');
    $$('[data-scenario]', bar).forEach(function (b) {
      b.onclick = async function () {
        fx.setScenario(b.dataset.scenario);
        S.groups.clear(); S.icons = {};
        S.settings.mic.inputId = ''; S.settings.virtualMicActive = false; S.settings.originalMic = '';
        S.asio = (await fx.call('asio')) || [];
        setDevices(await fx.devices());
        renderDemoBar(); renderTop(); renderPage();
        toast('Vorschau zeigt jetzt: ' + b.textContent);
      };
    });
  }

  // ------------------------------------------------------------------ Aktionen (Stream Deck, Tastenkürzel, Tray)
  function toggleDucking(on) {
    var d = S.settings.ducking;
    d.enabled = on != null ? !!on : !d.enabled;
    if (!d.enabled && S.duck.active) setDuck(false);
    save(); fx.setTray({ ducking: d.enabled });
    toast('Beim Sprechen leiser: ' + (d.enabled ? 'an' : 'aus'));
    osd({ icon: 'duck', tone: d.enabled ? 'voice' : '', title: 'Beim Sprechen leiser: ' + (d.enabled ? 'an' : 'aus') });
    if (S.page === 'mixer' || S.page === 'settings') renderPage();
  }
  function targetGroups(target) {
    var all = Array.from(S.groups.values());
    if (/^cat:/.test(target)) { var c = target.slice(4); return all.filter(function (g) { return g.cat === c; }); }
    if (/^app:/.test(target)) { var k = target.slice(4); return all.filter(function (g) { return g.key === k; }); }
    return [];
  }
  // Stream-Mix-Lautstärke (Stream Deck, Tastenkürzel, WebSocket mit "mix":"stream")
  function adjustStreamVolume(target, delta, value) {
    var c = S.settings.streamMix, nv = function (cur) { return clamp(value != null ? value / 100 : cur + (delta || 0) / 100, 0, 1); };
    if (target === 'master') c.master = nv(c.master);
    else if (target === 'voice') c.voice.vol = nv(c.voice.vol);
    else targetGroups(target).forEach(function (g) { if (!g.system) smSetEntry(g, { vol: nv(smEntry(g).vol) }); });
    save(); smTick();
    if (S.page === 'mixer') renderStrips();
  }
  function toggleStreamMute(target, value) {
    var c = S.settings.streamMix;
    if (target === 'voice') c.voice.on = value != null ? !value : !c.voice.on;
    else if (target !== 'master') { var gs = targetGroups(target).filter(function (g) { return !g.system; }), on = value != null ? !value : !gs.some(function (g) { return smEntry(g).on; }); gs.forEach(function (g) { smSetEntry(g, { on: on }); }); }
    save(); smTick();
    if (S.page === 'mixer') renderStrips();
  }
  function adjustVolume(target, delta, value) {
    if (target === 'master') {
      var d = defaultRender(); if (!d) return;
      d.volume = clamp(value != null ? value / 100 : d.volume + (delta || 0) / 100, 0, 1);
      fx.call('setDeviceVolume', { device: d.id, value: d.volume }).catch(function () {});
      if (refs.master && refs.master.fader) { refs.master.fader.set(d.volume); var mv = $('[data-val="master"]'); if (mv) mv.textContent = pct(d.volume); }
      return;
    }
    if (target === 'voice') {
      var mic = S.settings.mic, cur = (mic.gainDb + 12) / 42 * 100;
      var p = clamp(value != null ? value : cur + (delta || 0), 0, 100);
      mic.gainDb = Math.round((p / 100 * 42 - 12) * 2) / 2;
      S.engine.update(mic); save();
      if (S.page === 'mixer') { var vv = $('[data-val="voice"]'); if (vv) vv.textContent = fmtDb(mic.gainDb, true); }
      return;
    }
    targetGroups(target).forEach(function (g) {
      setAppVolume(g, clamp(value != null ? value / 100 : g.userVol + (delta || 0) / 100, 0, 1));
      if (S.page === 'mixer') syncStrip(g);
    });
  }
  function volumeOsd(target) {
    var name, val, muted;
    if (target === 'master') { var d = defaultRender(); if (!d) return; name = devTitle(d); val = d.volume * 100; muted = d.muted; }
    else if (target === 'voice') { name = 'Deine Stimme'; val = (S.settings.mic.gainDb + 12) / 42 * 100; }
    else { var gs = targetGroups(target); if (!gs.length) return; name = /^cat:/.test(target) ? (C.CATEGORIES[target.slice(4)] || 'Apps') : gs[0].name; val = gs.reduce(function (s, g) { return s + g.userVol; }, 0) / gs.length * 100; }
    osd({ icon: target === 'voice' ? 'mic' : target === 'cat:music' ? 'music' : 'speaker', tone: 'accent', title: name, sub: muted ? 'Stumm' : Math.round(val) + ' %', value: val, ms: 1200 });
  }
  function toggleTargetMute(target, value) {
    if (target === 'master') {
      var d = defaultRender(); if (!d) return;
      d.muted = value != null ? !!value : !d.muted;
      fx.call('setDeviceMute', { device: d.id, muted: d.muted }).catch(function () {});
      if (S.page === 'mixer') renderStrips();
      return;
    }
    if (target === 'voice') { setMute(value != null ? !!value : !S.settings.mic.muted); return; }
    var gs = targetGroups(target);
    var m = value != null ? !!value : gs.some(function (g) { return !g.muted; });
    gs.forEach(function (g) { setAppMute(g, m); if (S.page === 'mixer') syncStrip(g); });
  }
  var DENOISE_NAMES = { off: 'Aus', light: 'Leicht', ai: 'KI', studio: 'KI Studio' };
  async function runAction(a) {
    if (!a || !a.action) return;
    var st = S.settings, mic = st.mic;
    switch (a.action) {
      case 'toggleMute': setMute(!mic.muted); break;
      case 'setMute': setMute(!!a.value); break;
      case 'toggleDucking': toggleDucking(a.value); break;
      case 'profile': {
        var p = a.id ? profileById(a.id) : st.profiles[(a.index || 1) - 1];
        if (p) applyProfile(p.id);
        break;
      }
      case 'nextProfile': {
        var i = st.profiles.findIndex(function (x) { return x.id === st.activeProfile; });
        applyProfile(st.profiles[(i + 1) % st.profiles.length].id);
        break;
      }
      case 'preset':
        if (E.PRESETS[a.key]) { st.mic = E.applyPreset(mic, a.key); micChanged(); toast('Vorlage „' + E.PRESETS[a.key].name + '“ aktiv'); if (S.page === 'mic') renderPage(); if (S.page === 'mixer') renderStrips(); }
        break;
      case 'denoise': {
        var modes = ['off', 'light', 'ai', 'studio'];
        var m = !a.mode || a.mode === 'cycle' ? modes[(modes.indexOf(mic.denoise) + 1) % modes.length] : a.mode;
        if (modes.indexOf(m) < 0) break;
        mic.denoise = m; mic.preset = null; micChanged();
        toast('Rauschunterdrückung: ' + DENOISE_NAMES[m]);
        osd({ icon: 'sparkle', tone: 'voice', title: 'Rauschunterdrückung: ' + DENOISE_NAMES[m] });
        if (S.page === 'mic') renderPage();
        break;
      }
      case 'monitor':
        mic.monitor.on = a.value != null ? !!a.value : !mic.monitor.on; micChanged();
        toast('Mithören ' + (mic.monitor.on ? 'an' : 'aus'));
        if (S.page === 'mic') renderPage();
        break;
      case 'effects':
        st.micEnabled = a.value != null ? !!a.value : !st.micEnabled; save();
        if (st.micEnabled) startEngine(); else stopEngine();
        toast('Stimm-Effekte ' + (st.micEnabled ? 'an' : 'aus'));
        break;
      case 'volume': if (a.mix === 'stream') { adjustStreamVolume(a.target, +a.delta || 0, a.value != null ? +a.value : null); break; } adjustVolume(a.target, +a.delta || 0, a.value != null ? +a.value : null); volumeOsd(a.target); break;
      case 'sound': if (a.id) sbPlay(a.id); break;
      case 'stopSounds': sbStopAll(); break;
      case 'mute': if (a.mix === 'stream') { toggleStreamMute(a.target, a.value); break; } toggleTargetMute(a.target, a.value); break;
      case 'output': {
        var outs = physicalRenders();
        if (!outs.length) break;
        var dev = a.device && a.device !== 'cycle' ? devById(a.device) : null;
        if (!dev) { var di = outs.findIndex(function (d) { return d.isDefault; }); dev = outs[(di + 1) % outs.length]; }
        try { await fx.call('setDefault', { device: dev.id, roles: 'all' }); setDevices(await fx.devices()); toast('Ausgabe: ' + devTitle(dev)); osd({ icon: /kopfh|headph|headset|buds/i.test(dev.name) ? 'headphones' : 'speaker', tone: 'accent', title: devTitle(dev), sub: 'Ausgabe gewechselt' }); if (S.page === 'mixer' || S.page === 'devices') renderPage(); } catch (e) { toast(e.message, true); }
        break;
      }
    }
    pushRemoteState(true);
  }

  // Zustand für Stream Deck & Co.
  function remoteState() {
    var st = S.settings, mic = st.mic, def = defaultRender(), cats = {};
    var apps = Array.from(S.groups.values()).filter(function (g) { return !g.system; }).map(function (g) {
      var c = cats[g.cat] || (cats[g.cat] = { sum: 0, n: 0, muted: true, name: C.CATEGORIES[g.cat] || g.cat });
      c.sum += g.userVol; c.n++; c.muted = c.muted && !!g.muted;
      var se = smEntry(g);
      return { key: g.key, name: g.name, cat: g.cat, volume: Math.round(g.userVol * 100), muted: !!g.muted, active: !!g.active, color: g.color, icon: S.icons[g.key] || null, stream: { on: !!se.on, volume: Math.round(se.vol * 100) } };
    });
    Object.keys(cats).forEach(function (k) { var c = cats[k]; cats[k] = { name: c.name, volume: Math.round(c.sum / c.n * 100), muted: c.muted, count: c.n }; });
    var prof = profileById(st.activeProfile);
    return {
      version: S.version,
      lang: window.FxI18n ? FxI18n.lang : 'de',
      mic: { muted: !!mic.muted, effects: !!st.micEnabled, gainDb: mic.gainDb, gain: Math.round((mic.gainDb + 12) / 42 * 100), denoise: mic.denoise, monitor: !!mic.monitor.on, preset: mic.preset || null, running: S.engine.state === 'on' },
      ducking: !!st.ducking.enabled,
      virtualMic: !!st.virtualMicActive,
      profile: prof ? { id: prof.id, name: prof.name } : null,
      profiles: st.profiles.map(function (p) { return { id: p.id, name: p.name, icon: p.icon }; }),
      presets: Object.keys(E.PRESETS).map(function (k) { return { key: k, name: E.PRESETS[k].name }; }),
      master: def ? { id: def.id, name: devTitle(def), volume: Math.round(def.volume * 100), muted: !!def.muted } : null,
      outputs: physicalRenders().map(function (d) { return { id: d.id, name: devTitle(d), isDefault: !!d.isDefault }; }),
      sounds: SB.sounds.map(function (x) { return { id: x.id, name: x.name, color: x.color, playing: !!SB.playing[x.id] }; }),
      ptt: { mode: st.ptt.mode, talking: !S.pttMutedNow },
      streamMix: { enabled: smOn(), connected: SM.ready, master: Math.round(st.streamMix.master * 100), voice: { on: !!st.streamMix.voice.on, volume: Math.round(st.streamMix.voice.vol * 100) } },
      eq: { enabled: !!st.eq.enabled, preset: st.eq.preset },
      apps: apps,
      categories: cats
    };
  }
  function pushRemoteState(force) {
    if (!fx.remoteState) return;
    var js = JSON.stringify(remoteState());
    if (!force && js === S.lastRemoteJson) return;
    S.lastRemoteJson = js;
    fx.remoteState(JSON.parse(js));
  }

  // ------------------------------------------------------------------ Seite: Stream Deck
  function keySvg(o) {
    var c = o.color || '#2ee6d6';
    var bar = o.frac != null ? '<rect x="18" y="112" width="108" height="8" rx="4" fill="#232a33"/><rect x="18" y="112" width="' + Math.round(108 * o.frac) + '" height="8" rx="4" fill="' + c + '"/>' : '';
    return '<svg viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg"><rect width="144" height="144" rx="20" fill="' + (o.bg || '#1f262e') + '"/>' +
      '<g transform="translate(48 ' + (o.frac != null ? 18 : 28) + ') scale(2)" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (P[o.icon] || '') + '</g>' +
      '<text x="72" y="' + (o.frac != null ? 92 : 108) + '" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="' + (o.big ? 24 : 18) + '" font-weight="600" fill="#e8edf2">' + esc(o.label) + '</text>' + bar + '</svg>';
  }
  var DECK_ACTIONS = [
    { name: 'Mikro stumm', desc: 'Ein Druck schaltet dein Mikrofon stumm. Die Taste wird rot, solange du stumm bist.', keys: [{ icon: 'mic', label: 'Mikro an', color: '#6c9bff' }, { icon: 'micOff', label: 'Stumm', color: '#ff5a5a', bg: '#2a1214' }] },
    { name: 'Lautstärke', desc: 'Für eine App, eine Kategorie (alle Spiele, Musik, Voice-Chat), die Gesamtlautstärke oder deine Stimme. Als Taste lauter, leiser oder stumm. Auf dem Stream Deck+ mit Drehregler und Live-Anzeige.', keys: [{ icon: 'game', label: 'Spiele 70 %', frac: 0.7 }, { icon: 'music', label: 'Musik 30 %', frac: 0.3, color: '#3ddc84' }] },
    { name: 'Profil', desc: 'Wechselt mit einem Druck zu Gaming, Streaming, Meeting oder deinem eigenen Profil. Das aktive Profil leuchtet.', keys: [{ icon: 'game', label: 'Gaming' }, { icon: 'stream', label: 'Streaming', color: '#8d98a4' }] },
    { name: 'Klang-Vorlage', desc: 'Schaltet deine Stimme auf Natürlich, Klar, Broadcast, Gaming, Podcast oder Funkgerät.', keys: [{ icon: 'star', label: 'Broadcast', color: '#6c9bff' }] },
    { name: 'Beim Sprechen leiser', desc: 'Automatisches Leiserstellen anderer Apps an oder aus.', keys: [{ icon: 'duck', label: 'Ducking an', color: '#6c9bff' }] },
    { name: 'Rauschunterdrückung', desc: 'Durchschalten oder eine feste Stufe wählen: Aus, Leicht, KI, KI Studio.', keys: [{ icon: 'sparkle', label: 'KI Studio', color: '#6c9bff' }] },
    { name: 'Ausgabegerät', desc: 'Wechselt zwischen Kopfhörer und Lautsprecher oder springt auf ein festes Gerät.', keys: [{ icon: 'headphones', label: 'Kopfhörer' }] },
    { name: 'Mithören', desc: 'Dich selbst über Kopfhörer hören, an oder aus.', keys: [{ icon: 'ear', label: 'Mithören', color: '#6c9bff' }] },
    { name: 'Sound abspielen', desc: 'Spielt einen Sound aus deinem Soundboard ab, für dich und deine Zuhörer. Die Taste leuchtet, solange er läuft.', keys: [{ icon: 'music', label: 'Applaus', color: '#3ddc97' }, { icon: 'music', label: 'Alle stoppen', color: '#ff5a6a' }] }
  ];
  function renderDeck(v) {
    var r = S.remote || {}, n = r.clients || 0;
    var status = S.demo ? '<span class="badge">In der Vorschau nicht verfügbar</span>'
      : r.error ? '<span class="badge bad">' + esc(r.error) + '</span>'
      : n ? '<span class="badge ok">' + ic('check', 'sm') + 'Stream Deck verbunden</span>' : '<span class="badge">Noch nicht verbunden</span>';
    var hk = S.settings.hotkeys;
    var keyImg = function (k) { return '<div style="width:80px;height:80px;flex:none;padding:4px;border-radius:14px;background:#050607;box-shadow:inset 0 0 0 1px #262d36">' + keySvg(k) + '</div>'; };
    v.innerHTML =
      '<section class="card"><div class="ifcard"><div class="ifbadge">' + ic('deck', 'lg') + '</div><div>' + status +
        '<h2 style="margin-top:8px">Fusion-X auf deinem Stream Deck</h2>' +
        '<p class="lead">Das Plugin bringt Fusion-X-Aktionen in die Stream-Deck-Software. Die Tasten zeigen live, was gerade passiert: rot bei stummem Mikro, Lautstärke als Balken, aktives Profil hervorgehoben. Läuft mit Stream Deck MK.2, XL, Mini, Neo, Stream Deck+ (Drehregler) und Stream Deck Mobile.</p>' +
        '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="sdInstall"' + (S.demo ? ' disabled' : '') + '>' + ic('plus', 'sm') + 'Plugin installieren</button>' +
        '<a class="btn" href="https://www.elgato.com/downloads" target="_blank" rel="noopener">' + ic('ext', 'sm') + 'Stream-Deck-Software</a></div>' +
        '<p class="small muted" style="margin:10px 0 0">Nach der Installation findest du rechts in der Stream-Deck-Software die Kategorie „Fusion-X Audio“. Aktion auf eine Taste ziehen, fertig. Voraussetzung: Stream-Deck-Software 6.4 oder neuer.</p>' +
      '</div></div></section>' +
      '<div class="grid cols2">' + DECK_ACTIONS.map(function (a) {
        return '<section class="card" style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:start"><div class="row" style="gap:8px;flex-wrap:nowrap">' + a.keys.map(keyImg).join('') + '</div><div><h2>' + esc(a.name) + '</h2><p class="lead">' + esc(a.desc) + '</p></div></section>';
      }).join('') + '</div>' +
      '<div class="grid cols2">' +
        '<section class="card"><h2>' + ic('star') + 'Ohne Plugin: Tastenkürzel</h2><p class="lead">Jedes Stream Deck, jede Makro-Tastatur und jede Maus mit Zusatztasten kann Tastenkürzel senden. In der Stream-Deck-Software dafür die Aktion „System → Hotkey“ nehmen und die Kombination eintragen.</p>' +
          '<div style="margin-top:6px">' + ['toggleMute', 'toggleDucking', 'masterUp', 'masterDown', 'nextOutput', 'denoiseCycle'].map(function (k) { return srow(HOTKEY_LABELS[k], '', '<span class="keycap">' + esc(prettyKey(hk[k]) || 'Nicht belegt') + '</span>'); }).join('') + '</div>' +
          '<div class="row" style="margin-top:12px"><button class="btn sm" data-nav="settings">Alle Tastenkürzel einstellen</button></div></section>' +
        '<section class="card"><h2>' + ic('route') + 'Für andere Steuer-Tools</h2><p class="lead">Touch Portal, Bitfocus Companion oder eigene Skripte können Fusion-X ebenfalls steuern. Fusion-X lauscht nur auf diesem PC (nicht im Netzwerk).</p>' +
          '<pre class="log" style="margin-top:12px">WebSocket: ws://127.0.0.1:39063\n\n→ {"type":"hello"}\n← {"type":"state","data":{ mic, apps, master, profile, … }}\n\n→ {"type":"action","action":"toggleMute"}\n→ {"type":"action","action":"volume","target":"cat:game","delta":-10}\n→ {"type":"action","action":"profile","id":"stream"}</pre></section>' +
      '</div>';
  }

  async function copyDiagnose() {
    var d = {};
    try { d = fx.diag ? await fx.diag() : { platform: 'Browser-Vorschau' }; } catch (e) { d = { fehler: e.message }; }
    var lines = [
      'Fusion-X Audio ' + (d.version || S.version) + ' · ' + (d.platform || '') + ' · Windows-Kernel ' + (d.os || '?') + ' · Electron ' + (d.electron || '?'),
      'Windows-Audio: ' + (d.backend || (S.backend.ok ? 'verbunden' : 'nicht verbunden')) + (d.backendError ? ' – ' + d.backendError : ''),
      'Helfer: ' + (d.helperExe || '-') + (d.backendInfo ? ' · Windows ' + d.backendInfo.os + ' · App-Ausgabe ' + (d.backendInfo.appOutput ? 'ja' : 'nein') : ''),
      'Mikrofon: ' + S.engine.state + (S.engine.error ? ' – ' + S.engine.error : '') + ' · Effekte ' + (S.settings.micEnabled ? 'an' : 'aus') + ' · virtuelles Mikro ' + (S.settings.virtualMicActive ? 'aktiv' : 'aus'),
      'Geräte: ' + S.devices.map(function (x) { return (x.flow === 'render' ? 'A ' : 'E ') + x.name + ' [' + x.cls.kind + (x.isDefault ? ', Standard' : '') + ']'; }).join(' | '),
      'Apps: ' + Array.from(S.groups.values()).map(function (g) { return g.name + ' ' + Math.round(g.userVol * 100) + '%'; }).join(', '),
      'Stream Deck: ' + (d.remote ? d.remote.clients + ' verbunden' + (d.remote.error ? ' – ' + d.remote.error : '') : '-'),
      '', 'Ereignisse:', S.log.join('\n'), '', 'Helfer-Log:', (d.log || []).join('\n')
    ];
    var text = lines.join('\n');
    try { if (fx.copyText) await fx.copyText(text); else await navigator.clipboard.writeText(text); toast('Diagnose kopiert. Füge sie einfach in deine Nachricht ein.'); }
    catch (_) { var box = $('#logBox'); if (box) { box.textContent = text; toast('Diagnose steht unten im Feld „Ereignisse“. Markieren und kopieren.'); } }
  }

  // ------------------------------------------------------------------ Soundboard
  var SB = { db: null, sounds: [], playing: {}, buf: {}, ctx: null, mem: true };
  var SB_COLORS = ['#2ee6d6', '#2b8cff', '#8b7bff', '#ff5ab4', '#ff7a45', '#ffcf3f', '#3ddc97', '#9aa8b8'];
  function sbDb() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('fusionx', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('sounds', { keyPath: 'id' }); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); };
      } catch (_) { res(null); }
    });
  }
  function sbTx(mode, fn) {
    if (!SB.db) return Promise.resolve(null);
    return new Promise(function (res) {
      try {
        var tx = SB.db.transaction('sounds', mode), req = fn(tx.objectStore('sounds'));
        tx.oncomplete = function () { res(req ? req.result : null); };
        tx.onerror = tx.onabort = function () { res(null); };
      } catch (_) { res(null); }
    });
  }
  async function sbLoad() {
    SB.db = await sbDb();
    var all = (await sbTx('readonly', function (st) { return st.getAll(); })) || [];
    SB.sounds = all.sort(function (a, b) { return a.order - b.order; });
    if (!SB.sounds.length && S.demo) await sbDemo();
  }
  function sbSave(snd) { return sbTx('readwrite', function (st) { return st.put(snd); }); }
  function sbCtx() {
    if (!SB.ctx) { SB.ctx = new AudioContext(); var ms = monitorSink(); if (ms && SB.ctx.setSinkId) SB.ctx.setSinkId(ms).catch(function () {}); }
    return SB.ctx;
  }
  function allHotkeys() {
    var m = Object.assign({}, S.settings.hotkeys);
    SB.sounds.forEach(function (x) { if (x.hotkey) m['sound:' + x.id] = x.hotkey; });
    return m;
  }
  function syncHotkeys() { return fx.setHotkeys(allHotkeys()); }
  async function sbAddFiles(files) {
    var added = 0;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!/^audio\//.test(f.type) && !/\.(mp3|wav|ogg|oga|m4a|aac|flac|webm|opus)$/i.test(f.name)) { toast(f.name + ' ist keine Audiodatei.', true); continue; }
      if (f.size > 25e6) { toast(f.name + ' ist größer als 25 MB.', true); continue; }
      var data = await f.arrayBuffer(), id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), dur = 0;
      try { var b = await sbCtx().decodeAudioData(data.slice(0)); dur = b.duration; SB.buf[id] = b; }
      catch (_) { toast(f.name + ' lässt sich nicht abspielen.', true); continue; }
      var snd = { id: id, name: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 28), data: data, duration: dur, volume: 0.85, color: SB_COLORS[SB.sounds.length % SB_COLORS.length], hotkey: '', order: Date.now() + i };
      SB.sounds.push(snd); await sbSave(snd); added++;
    }
    if (added) toast(added === 1 ? 'Sound hinzugefügt' : added + ' Sounds hinzugefügt');
    if (S.page === 'sounds') renderPage();
    syncHotkeys(); pushRemoteState(true);
  }
  async function sbPlay(id) {
    var snd = SB.sounds.filter(function (x) { return x.id === id; })[0];
    if (!snd) return;
    if (SB.playing[id]) { sbStop(id); return; }
    var st = S.settings.sb, entry = { srcs: [], t0: performance.now(), dur: snd.duration * 1000 };
    SB.playing[id] = entry;
    try {
      if (st.hearSelf) {
        var c = sbCtx();
        if (c.state === 'suspended') await c.resume();
        var b = SB.buf[id] || (SB.buf[id] = await c.decodeAudioData(snd.data.slice(0)));
        var src = c.createBufferSource(), g = c.createGain();
        src.buffer = b; g.gain.value = snd.volume * st.selfVol;
        src.connect(g); g.connect(c.destination); src.start();
        entry.srcs.push(src);
      }
      if (S.engine.state === 'on') { var s2 = await S.engine.playToMic(snd.data, snd.volume * st.micVol, id); if (s2) entry.srcs.push(s2); }
    } catch (e) { toast('Sound konnte nicht abgespielt werden: ' + e.message, true); }
    if (!entry.srcs.length) { delete SB.playing[id]; sbRefresh(); return; }
    entry.srcs[0].onended = function () { if (SB.playing[id] === entry) { delete SB.playing[id]; sbRefresh(); pushRemoteState(true); } };
    osd({ icon: 'music', tone: 'accent', title: snd.name, sub: S.engine.state === 'on' ? 'Läuft für dich und deine Zuhörer' : 'Läuft nur für dich', ms: 1400 });
    sbRefresh(); pushRemoteState(true);
  }
  function sbStop(id) {
    var e = SB.playing[id];
    if (!e) return;
    e.srcs.forEach(function (x) { try { x.onended = null; x.stop(); } catch (_) {} });
    delete SB.playing[id];
    sbRefresh(); pushRemoteState(true);
  }
  function sbStopAll() { Object.keys(SB.playing).forEach(sbStop); }
  function sbRefresh() {
    $$('.pad[data-sound]').forEach(function (el) {
      var on = !!SB.playing[el.dataset.sound];
      el.classList.toggle('playing', on);
      if (!on) { var bar = $('.padbar', el); if (bar) bar.style.width = '0%'; }
    });
  }
  function fmtDur(sec) { return sec < 60 ? (Math.round(sec * 10) / 10).toFixed(1).replace('.', ',') + ' s' : Math.floor(sec / 60) + ':' + String(Math.round(sec % 60)).padStart(2, '0') + ' min'; }
  function padHtml(x) {
    return '<div class="pad' + (SB.playing[x.id] ? ' playing' : '') + '" data-sound="' + x.id + '" style="--pc:' + x.color + '">' +
      '<button class="padplay" data-act="sbPlay" aria-label="' + esc(x.name) + ' abspielen"><span class="padico">' + ic('play') + '</span><b>' + esc(x.name) + '</b><span>' + fmtDur(x.duration) + '</span><i class="padbar"></i></button>' +
      '<div class="padfoot"><span class="keychip">' + esc(prettyKey(x.hotkey) || 'Kein Kürzel') + '</span><button class="iconbtn" data-act="sbEdit" aria-label="' + esc(x.name) + ' bearbeiten">' + ic('edit', 'sm') + '</button></div></div>';
  }
  function renderSounds(v) {
    var st = S.settings.sb, live = S.engine.state === 'on' && S.settings.virtualMicActive;
    v.innerHTML =
      '<section class="card"><div class="chead"><div><h2>' + ic('pads') + 'Soundboard</h2><p class="lead">Spiel Sounds ab, die du und alle im Voice-Chat oder Stream hören. Per Klick, Tastenkürzel oder Stream-Deck-Taste.</p></div>' +
        '<div class="row"><button class="btn" data-act="sbStopAll">' + ic('stop', 'sm') + 'Alle stoppen</button><button class="btn primary" data-act="sbAdd">' + ic('upload', 'sm') + 'Sounds hinzufügen</button></div></div>' +
        (live ? '' : '<div class="notice info" style="margin-bottom:12px">' + ic('info') + '<div><b>' + (S.demo ? 'In der Vorschau hörst nur du die Sounds' : 'Gerade hörst nur du die Sounds') + '</b>Andere hören sie, sobald deine Stimme über Fusion-X läuft (Mikrofon-Seite → „Für alle Apps aktivieren“).</div></div>') +
        '<div class="grid cols3">' + slider('sbMic', 'Für andere', 0, 1, 0.01, st.micVol, pct(st.micVol)) + slider('sbSelf', 'Für dich', 0, 1, 0.01, st.selfVol, pct(st.selfVol)) +
        '<div class="srow" style="border:0;padding:4px 0"><div class="t"><div>Selbst mithören</div></div>' + sw(st.hearSelf, 'id="sbHear"') + '</div></div>' +
        '<input type="file" id="sbFile" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.opus" multiple hidden></section>' +
      '<div class="pads" id="pads">' + SB.sounds.map(padHtml).join('') +
        '<button class="pad add" data-act="sbAdd">' + ic('plus', 'lg') + '<b>Sound hinzufügen</b><span>MP3, WAV, OGG – oder Dateien hierher ziehen</span></button></div>';
    var pads = $('#pads');
    ['dragenter', 'dragover'].forEach(function (ev) { v.addEventListener(ev, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) { e.preventDefault(); pads.classList.add('drop'); } }); });
    v.addEventListener('dragleave', function (e) { if (!v.contains(e.relatedTarget)) pads.classList.remove('drop'); });
    v.addEventListener('drop', function (e) { e.preventDefault(); pads.classList.remove('drop'); if (e.dataTransfer.files.length) sbAddFiles(e.dataTransfer.files); });
    $('#sbFile').addEventListener('change', function (e) { if (e.target.files.length) sbAddFiles(e.target.files); e.target.value = ''; });
  }
  function sbEdit(id) {
    var x = SB.sounds.filter(function (q) { return q.id === id; })[0];
    if (!x) return;
    var draft = { name: x.name, color: x.color, volume: x.volume, hotkey: x.hotkey };
    var dlg = modal('<h2>Sound bearbeiten</h2>' +
      '<label class="field" style="display:grid;gap:6px"><span class="eyebrow">Name</span><input class="input" id="sbName" maxlength="28" value="' + esc(x.name) + '"></label>' +
      '<div style="display:grid;gap:6px"><span class="eyebrow">Farbe</span><div class="row">' + SB_COLORS.map(function (c) { return '<button class="swatch" data-color="' + c + '" style="--sc:' + c + '" aria-pressed="' + (c === x.color) + '" aria-label="Farbe ' + c + '"></button>'; }).join('') + '</div></div>' +
      slider('sbVol', 'Lautstärke', 0, 1.5, 0.01, x.volume, pct(x.volume)) +
      srow('Tastenkürzel', 'Funktioniert überall, auch im Spiel', '<button class="keycap" id="sbHot">' + esc(prettyKey(x.hotkey) || 'Festlegen') + '</button>') +
      '<div class="foot"><button class="btn danger" id="sbDel">' + ic('x', 'sm') + 'Löschen</button><div class="row"><button class="btn" id="sbTest">' + ic('play', 'sm') + 'Anhören</button><button class="btn primary" id="sbOk">Speichern</button></div></div>');
    $$('input[type=range]', dlg).forEach(paintRange);
    $$('[data-color]', dlg).forEach(function (b) { b.onclick = function () { draft.color = b.dataset.color; $$('[data-color]', dlg).forEach(function (q) { q.setAttribute('aria-pressed', q === b); }); }; });
    $('#sbVol', dlg).oninput = function (e) { draft.volume = +e.target.value; $('#sbVol-out', dlg).textContent = pct(draft.volume); paintRange(e.target); };
    $('#sbHot', dlg).onclick = function () {
      var btn = this; btn.classList.add('rec'); btn.textContent = 'Kombination drücken …';
      var h = function (e) {
        e.preventDefault(); e.stopPropagation();
        if (e.key === 'Escape') { end(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') { draft.hotkey = ''; end(); return; }
        var acc = keyToAccel(e); if (!acc) return; draft.hotkey = acc; end();
      };
      var end = function () { document.removeEventListener('keydown', h, true); btn.classList.remove('rec'); btn.textContent = prettyKey(draft.hotkey) || 'Festlegen'; };
      document.addEventListener('keydown', h, true);
    };
    $('#sbTest', dlg).onclick = function () { var old = x.volume; x.volume = draft.volume; sbPlay(x.id); x.volume = old; };
    $('#sbOk', dlg).onclick = async function () {
      x.name = ($('#sbName', dlg).value || x.name).trim().slice(0, 28); x.color = draft.color; x.volume = draft.volume; x.hotkey = draft.hotkey;
      await sbSave(x); closeModal(); renderPage(); pushRemoteState(true);
      var failed = await syncHotkeys();
      if (failed && failed.indexOf('sound:' + x.id) >= 0) toast('Dieses Tastenkürzel ist schon von einem anderen Programm belegt.', true);
    };
    $('#sbDel', dlg).onclick = function () {
      var b = this;
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.innerHTML = ic('warn', 'sm') + 'Wirklich löschen?'; return; }
      sbStop(x.id);
      SB.sounds = SB.sounds.filter(function (q) { return q.id !== x.id; });
      sbTx('readwrite', function (st) { return st.delete(x.id); });
      closeModal(); renderPage(); syncHotkeys(); pushRemoteState(true);
    };
  }
  // Beispiel-Sounds für die Vorschau (synthetisch erzeugt)
  async function sbDemo() {
    var defs = [['Applaus', 'clap', '#3ddc97'], ['Trommelwirbel', 'drum', '#ff7a45'], ['Fanfare', 'fanfare', '#2b8cff'], ['Ding', 'ding', '#2ee6d6']];
    for (var i = 0; i < defs.length; i++) {
      try {
        var data = await synthSound(defs[i][1]);
        var b = await sbCtx().decodeAudioData(data.slice(0));
        SB.sounds.push({ id: 'demo' + i, name: defs[i][0], data: data, duration: b.duration, volume: 0.8, color: defs[i][2], hotkey: i === 0 ? 'Ctrl+Alt+1' : '', order: i });
      } catch (_) {}
    }
  }
  async function synthSound(kind) {
    var sr = 44100, len = { clap: 1.8, drum: 2.2, fanfare: 1.9, ding: 1.4 }[kind], oc = new OfflineAudioContext(1, Math.round(sr * len), sr);
    var noise = function () { var b = oc.createBuffer(1, sr * len, sr), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
    if (kind === 'ding') {
      [1320, 1760, 2640].forEach(function (f, i) { var o = oc.createOscillator(), g = oc.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.35 / (i + 1), 0); g.gain.exponentialRampToValueAtTime(0.0005, 1.3); o.connect(g).connect(oc.destination); o.start(0); o.stop(1.4); });
    } else if (kind === 'fanfare') {
      [[523, 0], [659, 0.28], [784, 0.56], [1047, 0.84]].forEach(function (n) { var o = oc.createOscillator(), g = oc.createGain(), lp = oc.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = n[0]; lp.frequency.value = 2400; var d = n[1] === 0.84 ? 0.95 : 0.26; g.gain.setValueAtTime(0, n[1]); g.gain.linearRampToValueAtTime(0.18, n[1] + 0.03); g.gain.setValueAtTime(0.18, n[1] + d - 0.06); g.gain.linearRampToValueAtTime(0, n[1] + d); o.connect(lp).connect(g).connect(oc.destination); o.start(n[1]); o.stop(n[1] + d + 0.02); });
    } else {
      var src = oc.createBufferSource(); src.buffer = noise();
      var bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = kind === 'clap' ? 1600 : 900; bp.Q.value = kind === 'clap' ? 0.8 : 1.5;
      var g = oc.createGain(); g.gain.value = 0;
      if (kind === 'clap') { for (var t = 0.02; t < 1.6; t += 0.03 + Math.random() * 0.05) { var a = 0.5 * (1 - t / 1.8); g.gain.setValueAtTime(a, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.025); } }
      else { for (var t2 = 0.02, step = 0.07; t2 < 1.6; t2 += step, step = Math.max(0.028, step * 0.93)) { g.gain.setValueAtTime(0.28 + t2 * 0.15, t2); g.gain.exponentialRampToValueAtTime(0.01, t2 + step * 0.8); } g.gain.setValueAtTime(0.9, 1.65); g.gain.exponentialRampToValueAtTime(0.001, 2.15); }
      src.connect(bp).connect(g).connect(oc.destination); src.start(0);
    }
    var buf = await oc.startRendering(), d = buf.getChannelData(0), out = new DataView(new ArrayBuffer(44 + d.length * 2));
    var w = function (o, s) { for (var i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, d.length * 2, true);
    for (var k = 0; k < d.length; k++) out.setInt16(44 + k * 2, Math.max(-1, Math.min(1, d[k])) * 32767, true);
    return out.buffer;
  }

  function syncTrayProfiles() {
    fx.setTray({ profiles: S.settings.profiles.map(function (p) { return { id: p.id, name: p.name }; }), profile: (profileById(S.settings.activeProfile) || {}).name || null, muted: !!S.settings.mic.muted, ducking: S.settings.ducking.enabled });
  }

  // ------------------------------------------------------------------ Live-Anzeige
  var lastFrame = performance.now(), demoT = 0;
  function frame(now) {
    var dt = Math.min(100, now - lastFrame) / 1000;
    lastFrame = now;
    var m = S.engine.meters();
    if (!m && S.demo) m = demoMeters(now);
    S.meters = m;
    var speaking = m && m.speaking;
    duckTick(!!speaking && !S.demo, now);
    if (S.demo) demoDuck(speaking, now);
    $('#micBtn').classList.toggle('talk', !!speaking && !S.settings.mic.muted);

    if (S.page === 'mixer' && refs.strips) {
      Object.keys(refs.strips).forEach(function (k) {
        var r = refs.strips[k], g = r.g;
        g.disp = Math.max(g.peak, (g.disp || 0) - dt * 1.4);
        g.hold = g.peak > (g.hold || 0) ? g.peak : Math.max(0, (g.hold || 0) - dt * 0.5);
        r.cover.style.height = (100 - linFrac(g.disp) * 100) + '%';
        r.pk.style.bottom = linFrac(g.hold) * 100 + '%';
        if (now - (r.lastSync || 0) > 400) { r.lastSync = now; syncStrip(g); }
      });
      if (refs.master) {
        var p = S.peaks[refs.master.dev.id] || 0;
        S.mDisp = Math.max(p, (S.mDisp || 0) - dt * 1.4);
        var mc = $('[data-meter="master"] .cover'); if (mc) mc.style.height = (100 - linFrac(S.mDisp) * 100) + '%';
      }
      var vc = $('[data-meter="voice"] .cover');
      if (vc) vc.style.height = (100 - (m ? dbFrac(m.output.peak) : 0) * 100) + '%';
    }
    if (S.page === 'mic' && refs.mic && refs.mic.in) updateMicMeters(m, dt);
    if (now - (S.lastRemoteT || 0) > 200) { S.lastRemoteT = now; pushRemoteState(); }
    drawLiveWave(now, m);
    if (m && S.settings.mic.muted && S.settings.osd.remind && m.input) {
      if (m.input.rms > Math.max(S.settings.mic.gate.open, -52) + 3) S.remindAcc = (S.remindAcc || 0) + dt; else S.remindAcc = Math.max(0, (S.remindAcc || 0) - dt * 0.5);
      if (S.remindAcc > 1.2 && now > (S.remindNext || 0)) {
        S.remindNext = now + 15000; S.remindAcc = 0;
        toast('Du sprichst, aber dein Mikro ist stumm.', true);
        osd({ icon: 'micOff', tone: 'bad', title: 'Du bist stumm geschaltet', sub: S.settings.hotkeys.toggleMute ? prettyKey(S.settings.hotkeys.toggleMute) + ' zum Einschalten' : 'Klick auf den Mikro-Knopf zum Einschalten', ms: 2800 });
        cue('mute');
      }
    }
    if (S.page === 'sounds') Object.keys(SB.playing).forEach(function (id) {
      var e = SB.playing[id], bar = $('.pad[data-sound="' + id + '"] .padbar');
      if (bar && e.dur) bar.style.width = Math.min(100, (now - e.t0) / e.dur * 100) + '%';
    });
    if (S.page === 'devices' && refs.devMeters) refs.devMeters.forEach(function (r) { r.fill.style.width = linFrac(S.peaks[r.id] || 0) * 100 + '%'; });
    requestAnimationFrame(frame);
  }
  function updateMicMeters(m, dt) {
    var R = refs.mic, pk = refs.micPk;
    var inDb = m ? m.input.peak : -100, outDb = m ? m.output.peak : -100;
    pk.in = Math.max(inDb, pk.in - dt * 20); pk.out = Math.max(outDb, pk.out - dt * 20);
    var w = R.in.parentNode.clientWidth;
    R.in.style.width = dbFrac(inDb) * 100 + '%'; R.in.style.setProperty('--w', w + 'px');
    R.inPk.style.left = dbFrac(pk.in) * 100 + '%';
    R.out.style.width = dbFrac(outDb) * 100 + '%'; R.out.style.setProperty('--w', R.out.parentNode.clientWidth + 'px');
    R.outPk.style.left = dbFrac(pk.out) * 100 + '%';
    R.inVal.textContent = pk.in < -59 ? '−∞' : Math.round(pk.in) + ' dB';
    R.outVal.textContent = pk.out < -59 ? '−∞' : Math.round(pk.out) + ' dB';
    if (m) {
      S.hintPk = Math.max(inDb, (S.hintPk || -100) - dt * 6);
      var h = S.hintPk, mic = S.settings.mic;
      var txt = h < -45 ? '<span class="muted">Sprich, um den Pegel zu sehen.</span>' : h < -24 ? '<span style="color:var(--warn)">Etwas leise. Mikro-Lautstärke erhöhen oder näher ans Mikro.</span>' : h > -2 ? '<span style="color:var(--bad)">Zu laut, es verzerrt. Mikro-Lautstärke oder Gain am Gerät runter.</span>' : '<span style="color:var(--ok)">Perfekt. So soll es sein.</span>';
      if (mic.muted) txt = '<span style="color:var(--bad)">Mikrofon ist stumm geschaltet.</span>';
      if (R.hint.innerHTML !== txt) R.hint.innerHTML = txt;
      if (R.gate) { R.gate.classList.toggle('on', !!m.gateOpen); R.gate.lastChild.textContent = m.gateOpen ? 'Offen, du sprichst' : 'Geschlossen'; }
      if (R.gr) R.gr.style.width = clamp(-(m.comp || 0) / 15, 0, 1) * 100 + '%';
      if (R.deess) R.deess.style.width = clamp((m.deess || 0) / 10, 0, 1) * 100 + '%';
      if (R.lat && m.latency != null) R.lat.textContent = 'Verzögerung ca. ' + m.latency + ' ms';
    }
  }
  // Live-Welle in der Kopfzeile: Ton des PCs (türkis) und deine Stimme (blau)
  var WAVE = { out: new Float32Array(96), voice: new Float32Array(96), t: 0 };
  function drawLiveWave(now, m) {
    var cv = $('#liveWave');
    if (!cv || !cv.offsetWidth || now - WAVE.t < 40) return;
    WAVE.t = now;
    var def = defaultRender(), out = def ? (S.peaks[def.id] || 0) : 0;
    var vo = m && !S.settings.mic.muted ? Math.pow(10, Math.max(-60, m.output.peak) / 20) : 0;
    WAVE.out.copyWithin(0, 1); WAVE.out[WAVE.out.length - 1] = out;
    WAVE.voice.copyWithin(0, 1); WAVE.voice[WAVE.voice.length - 1] = vo;
    var dpr = window.devicePixelRatio || 1, W = cv.offsetWidth, H = cv.offsetHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    var n = WAVE.out.length, bw = W / n, mid = H / 2;
    var gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(46,230,214,0)'); gr.addColorStop(0.35, 'rgba(46,230,214,.9)'); gr.addColorStop(1, 'rgba(43,140,255,1)');
    g.fillStyle = gr;
    for (var i = 0; i < n; i++) { var h = Math.max(0.6, Math.sqrt(WAVE.out[i]) * (mid - 2)); g.fillRect(i * bw, mid - h, Math.max(1, bw - 1), h * 2); }
    var lg = g.createLinearGradient(0, 0, W, 0);
    lg.addColorStop(0, 'rgba(155,185,255,0)'); lg.addColorStop(0.4, 'rgba(155,185,255,.95)'); lg.addColorStop(1, '#c4d5ff');
    g.strokeStyle = lg; g.lineWidth = 1.6; g.shadowColor = 'rgba(108,155,255,.9)'; g.shadowBlur = 6;
    g.beginPath();
    for (var j = 0; j < n; j++) { var a = Math.sqrt(WAVE.voice[j]) * (mid - 3), y = mid + Math.sin(j * 0.9 + now / 120) * a; if (j) g.lineTo(j * bw, y); else g.moveTo(0, y); }
    g.stroke(); g.shadowBlur = 0;
  }

  // Simulierte Stimme für die Vorschau
  var dv = { env: -80, target: -80, next: 0 };
  function demoMeters(now) {
    if (now > dv.next) { var talk = Math.random() < 0.55; dv.target = talk ? -20 + Math.random() * 10 : -62; dv.next = now + (talk ? 600 + Math.random() * 1600 : 500 + Math.random() * 1500); }
    dv.env += (dv.target - dv.env) * 0.2;
    var mic = S.settings.mic;
    var inP = dv.env + (Math.random() - 0.5) * 6 + mic.gainDb, sp = inP > mic.gate.open && !mic.muted;
    var outP = mic.muted ? -100 : (sp ? Math.min(-3, inP * 0.7 - 2) : -80);
    return { input: { peak: inP, rms: inP - 8 }, output: { peak: outP, rms: outP - 8 }, rawL: { rms: inP }, rawR: { rms: -80 }, comp: sp ? -(3 + Math.random() * 4) : 0, gate: sp ? 1 : 0, gateOpen: sp, deess: sp && Math.random() < 0.2 ? 4 : 0, speaking: sp, channel: 'left', channels: 2, latency: 18 };
  }
  function demoDuck(speaking, now) {
    // In der Vorschau zeigen wir das Leiserstellen nur optisch
    var d = S.settings.ducking;
    var want = d.enabled && speaking;
    if (want) { S.duck.releaseAt = now + d.release; if (!S.duck.active) { S.duck.active = true; S.groups.forEach(function (g) { g.ducked = isDuckTarget(g) && !g.muted; }); } }
    else if (S.duck.active && now > S.duck.releaseAt) { S.duck.active = false; S.groups.forEach(function (g) { g.ducked = false; }); }
  }

  // ------------------------------------------------------------------ Start
  async function boot() {
    var init = await fx.init();
    S.platform = init.platform; S.version = init.version; S.backend = init.backend || { ok: false }; S.autostart = init.autostart;
    S.settings = deepMerge(DEFAULTS, init.settings || {});
    applyLang();
    // Fehlende eingebaute Profile ergänzen
    PROFILES.forEach(function (p) { if (!S.settings.profiles.some(function (x) { return x.id === p.id; })) S.settings.profiles.push(clone(p)); });
    document.body.classList.toggle('win', S.platform === 'win32');
    document.body.classList.toggle('acrylic', !!init.acrylic);
    if (S.demo) renderDemoBar();
    try { S.asio = (await fx.call('asio')) || []; } catch (_) { S.asio = []; }
    try { setDevices(await fx.devices()); } catch (e) { setDevices([]); }
    fx.onDevices(function (list) { setDevices(list); if (S.page === 'devices' || S.page === 'mixer' || S.page === 'mic') { if (!(S.page === 'mixer' && refs.strips && Object.keys(refs.strips).some(function (k) { return refs.strips[k].g.dragging; }))) renderPage(); } });
    fx.onState(onState);
    fx.onHotkey(function (a) { if (/^sound:/.test(a)) sbPlay(a.slice(6)); else if (HOTKEY_ACTIONS[a]) runAction(HOTKEY_ACTIONS[a]); });
    if (fx.onKey) fx.onKey(function (k) { pttKey(k.vk, k.down); });
    // Ohne Windows-Helfer (Vorschau, Mac/Linux): Sprechtaste funktioniert, solange das Fenster aktiv ist
    if (S.platform !== 'win32') {
      document.addEventListener('keydown', function (e) { if (!e.repeat && !e.target.closest('input,textarea')) pttKey(CODE_VK[e.code] || e.keyCode, true); });
      document.addEventListener('keyup', function (e) { pttKey(CODE_VK[e.code] || e.keyCode, false); });
    }
    await sbLoad();
    syncHotkeys();
    pttWatch();
    fx.onTray(runAction);
    if (fx.onObs) fx.onObs(smOnObs);
    if (fx.update) { fx.update('status').then(onUpdate).catch(function () {}); if (fx.onUpdate) fx.onUpdate(onUpdate); }
    peqRefresh().then(function (st) { if (st && st.installed && (S.settings.eq.enabled || st.included)) peqApply(true); });
    if (smOn()) smConnect();
    if (fx.onRemote) fx.onRemote(runAction);
    if (fx.onRemoteClients) fx.onRemoteClients(function (r) { S.remote = r; if (S.page === 'deck') renderPage(); });
    if (fx.remoteInfo) fx.remoteInfo().then(function (r) { S.remote = r; }).catch(function () {});
    fx.onBackend(function (b) { S.backend = Object.assign({}, S.backend, b); if (S.page === 'mixer' || S.page === 'settings') renderPage(); });
    syncTrayProfiles();
    if (!S.settings.activeProfile && S.settings.useCase) S.settings.activeProfile = S.settings.useCase;

    var hash = (location.hash || '').slice(1);
    S.page = TITLES[hash] ? hash : 'mixer';
    renderTop();
    renderPage();
    requestAnimationFrame(frame);
    log('Fusion-X gestartet' + (S.backend.ok ? '' : ' (Windows-Audio nicht verbunden)'));

    if (S.settings.micEnabled && !S.demo) {
      if (S.settings.virtualMicWanted && !S.settings.virtualMicActive && virtualPair()) activateVirtualMic(true);
      else startEngine();
    }
    if (S.demo && !S.settings.activeProfile) { S.settings.activeProfile = 'gaming'; renderTop(); }
    if (!S.settings.onboarded && !S.demo) setTimeout(openWizard, 400);
    navigator.mediaDevices && navigator.mediaDevices.addEventListener && navigator.mediaDevices.addEventListener('devicechange', refreshBrowserDevices);
  }

  boot().catch(function (e) { console.error(e); toast('Start fehlgeschlagen: ' + e.message, true); });
})();
