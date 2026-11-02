// Einstellungsfenster einer Fusion-X-Taste in der Stream-Deck-Software
'use strict';

var ws = null, ctx = null, action = '', kind = '', settings = {}, state = null;

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, actionInfo) {
  ctx = uuid;
  try { var inf = JSON.parse(info || '{}'); fxSetLang(/^de/i.test((inf.application || {}).language || 'de') ? 'de' : 'en'); } catch (_) {}
  var ai = JSON.parse(actionInfo);
  action = ai.action;
  kind = action.split('.').pop();
  settings = (ai.payload && ai.payload.settings) || {};
  ws = new WebSocket('ws://127.0.0.1:' + port);
  ws.onopen = function () {
    send({ event: registerEvent, uuid: uuid });
    send({ event: 'sendToPlugin', action: action, context: ctx, payload: { type: 'getState' } });
  };
  ws.onmessage = function (e) {
    var m; try { m = JSON.parse(e.data); } catch (_) { return; }
    if (m.event === 'sendToPropertyInspector' && m.payload && m.payload.type === 'state') { state = m.payload.state; if (state && state.lang) fxSetLang(state.lang); build(); }
    if (m.event === 'didReceiveSettings') { settings = m.payload.settings || {}; build(); }
  };
  build();
}
function send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
function save() { send({ event: 'setSettings', context: ctx, payload: settings }); }

function opt(v, label, cur) { return '<option value="' + fxEsc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + fxEsc(fxT(label)) + '</option>'; }
function field(id, label, options) { return '<div class="item"><label for="' + id + '">' + fxEsc(fxT(label)) + '</label><select id="' + id + '">' + options + '</select></div>'; }
function grp(label, inner) { return '<optgroup label="' + fxEsc(fxT(label)) + '">' + inner + '</optgroup>'; }

var lastSig = null;
function build() {
  // Nur neu aufbauen, wenn sich Auswahllisten ändern – sonst klappt ein offenes Menü zu
  var sig = JSON.stringify([!!state, FX_LANG, state && state.streamMix && state.streamMix.enabled, settings, state && [state.profiles, state.presets, state.outputs, (state.apps || []).map(function (a) { return a.key + a.name; }), (state.sounds || []).map(function (x) { return x.id + x.name; })]]);
  if (sig === lastSig) return;
  lastSig = sig;
  var st = document.getElementById('status'), stt = document.getElementById('statusText');
  st.className = 'status ' + (state ? 'ok' : 'bad');
  stt.textContent = fxT(state ? 'Verbunden mit Fusion-X ' + (state.version || '') : 'Fusion-X läuft nicht. Starte die App, die Taste verbindet sich dann von selbst.');
  var ttl = document.querySelector('h1, .title'); if (ttl) ttl.textContent = fxT(ttl.textContent);
  var html = '';
  var s = state || { profiles: [], presets: [], outputs: [], apps: [], categories: {}, sounds: [] };
  if (kind === 'volume') {
    var t = settings.target || 'master';
    var apps = (s.apps || []).slice();
    if (t.indexOf('app:') === 0 && !apps.some(function (a) { return 'app:' + a.key === t; })) apps.push({ key: t.slice(4), name: t.slice(4).replace(/\.exe$/i, '') + ' (gerade nicht offen)' });
    html += field('target', 'Ziel',
      grp('Allgemein', opt('master', 'Gesamtlautstärke (Ausgabe)', t) + opt('voice', 'Deine Stimme (Mikro-Lautstärke)', t)) +
      grp('Kategorien', ['game', 'music', 'voice', 'web', 'video', 'stream'].map(function (k) { return opt('cat:' + k, FX_CAT_NAME[k] + ' (alle Apps)', t); }).join('')) +
      grp('Apps', apps.map(function (a) { return opt('app:' + a.key, a.name, t); }).join('')));
    html += field('mix', 'Mix', opt('', 'Was du hörst', settings.mix || '') + opt('stream', 'Stream-Mix (OBS)', settings.mix || ''));
    if (settings.mix === 'stream' && state && state.streamMix && !state.streamMix.enabled) html += '<p class="hint">' + fxEsc(fxT('Stream-Mix ist in Fusion-X aus. Schalte ihn im Mixer ein.')) + '</p>';
    html += field('mode', 'Taste', opt('mute', 'Stumm an/aus', settings.mode || 'mute') + opt('up', 'Lauter', settings.mode) + opt('down', 'Leiser', settings.mode));
    html += field('step', 'Schritt (Taste)', [1, 2, 5, 10, 20].map(function (n) { return opt(n, n + ' %', settings.step || 5); }).join(''));
    html += field('dialStep', 'Schritt (Regler)', [1, 2, 3, 5].map(function (n) { return opt(n, n + ' % pro Raster', settings.dialStep || 2); }).join(''));
    html += '<p class="hint">' + fxEsc(fxT('Auf dem Stream Deck+: drehen = Lautstärke, drücken oder antippen = stumm.')) + '</p>';
  } else if (kind === 'profile') {
    html += field('profile', 'Profil', opt('', 'Nächstes Profil (durchschalten)', settings.profile || '') + (s.profiles || []).map(function (p) { return opt(p.id, p.name, settings.profile); }).join(''));
  } else if (kind === 'preset') {
    html += field('preset', 'Vorlage', (s.presets.length ? s.presets : [{ key: 'clear', name: 'Klar & präsent' }]).map(function (p) { return opt(p.key, p.name, settings.preset || 'clear'); }).join(''));
  } else if (kind === 'denoise') {
    html += field('mode', 'Stufe', opt('cycle', 'Durchschalten', settings.mode || 'cycle') + opt('off', 'Aus', settings.mode) + opt('light', 'Leicht', settings.mode) + opt('ai', 'KI', settings.mode) + opt('studio', 'KI Studio', settings.mode));
  } else if (kind === 'sound') {
    html += field('sound', 'Sound', opt('', 'Alle Sounds stoppen', settings.sound || '') + (s.sounds || []).map(function (x) { return opt(x.id, x.name, settings.sound); }).join(''));
    html += '<p class="hint">' + fxEsc(fxT('Ein Druck spielt den Sound, ein zweiter stoppt ihn. Neue Sounds fügst du in Fusion-X auf der Seite „Soundboard“ hinzu.')) + '</p>';
  } else if (kind === 'output') {
    html += field('device', 'Gerät', opt('cycle', 'Durchschalten (Kopfhörer ↔ Lautsprecher)', settings.device || 'cycle') + (s.outputs || []).map(function (d) { return opt(d.id, d.name, settings.device); }).join(''));
  } else {
    var txt = { mute: 'Ein Druck schaltet dein Mikrofon stumm oder wieder an. Die Taste wird rot, solange du stumm bist.', ducking: 'Schaltet das automatische Leiserstellen anderer Apps beim Sprechen an oder aus.', monitor: 'Schaltet Mithören (dich selbst hören) an oder aus.' }[kind] || '';
    html += '<p class="hint" style="margin-left:0">' + fxEsc(fxT(txt)) + '</p>';
  }
  var form = document.getElementById('form');
  var focused = document.activeElement && document.activeElement.id;
  form.innerHTML = html;
  Array.prototype.forEach.call(form.querySelectorAll('select'), function (sel) {
    sel.onchange = function () { settings[sel.id] = sel.value; save(); };
  });
  if (focused && document.getElementById(focused)) document.getElementById(focused).focus();
}
