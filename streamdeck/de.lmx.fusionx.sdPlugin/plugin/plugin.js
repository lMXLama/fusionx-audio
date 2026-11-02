// Fusion-X Audio – Stream-Deck-Plugin
// Verbindet sich mit der Stream-Deck-Software und mit Fusion-X (ws://127.0.0.1:39063).
'use strict';

var FX_URL = 'ws://127.0.0.1:39063';
var sd = null, fx = null, state = null, pluginUUID = null;
var contexts = {};          // context → { action, kind, settings, controller, last }
var piContexts = {};        // contexts mit offenem Einstellungsfenster

// Wird von der Stream-Deck-Software aufgerufen
function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info) {
  pluginUUID = uuid;
  try { var inf = JSON.parse(info || '{}'); fxSetLang(/^de/i.test((inf.application || {}).language || 'de') ? 'de' : 'en'); } catch (_) {}
  sd = new WebSocket('ws://127.0.0.1:' + port);
  sd.onopen = function () { sdSend({ event: registerEvent, uuid: uuid }); };
  sd.onmessage = function (e) { var m; try { m = JSON.parse(e.data); } catch (_) { return; } onStreamDeck(m); };
  connectFx();
}

function sdSend(o) { if (sd && sd.readyState === 1) sd.send(JSON.stringify(o)); }

// ------------------------------------------------------------------ Verbindung zu Fusion-X
var retry = null;
function connectFx() {
  clearTimeout(retry);
  try { fx = new WebSocket(FX_URL); } catch (_) { retry = setTimeout(connectFx, 2000); return; }
  fx.onopen = function () { fx.send(JSON.stringify({ type: 'hello', client: 'streamdeck' })); };
  fx.onmessage = function (e) {
    var m; try { m = JSON.parse(e.data); } catch (_) { return; }
    if (m.type === 'state') { state = m.data; if (state.lang) fxSetLang(state.lang); renderAll(); sendStateToPIs(); }
  };
  fx.onclose = function () { state = null; renderAll(); sendStateToPIs(); retry = setTimeout(connectFx, 2000); };
  fx.onerror = function () {};
}
function act(context, o) {
  if (!fx || fx.readyState !== 1) { sdSend({ event: 'showAlert', context: context }); return false; }
  o.type = 'action';
  fx.send(JSON.stringify(o));
  return true;
}

// ------------------------------------------------------------------ Ereignisse vom Stream Deck
function onStreamDeck(m) {
  var c = m.context;
  switch (m.event) {
    case 'willAppear':
      contexts[c] = { action: m.action, kind: m.action.split('.').pop(), settings: (m.payload && m.payload.settings) || {}, controller: m.payload && m.payload.controller, last: '' };
      render(c);
      break;
    case 'willDisappear': delete contexts[c]; delete piContexts[c]; break;
    case 'didReceiveSettings':
      if (contexts[c]) { contexts[c].settings = m.payload.settings || {}; contexts[c].last = ''; render(c); }
      break;
    case 'keyDown': press(c); break;
    case 'keyUp': if (contexts[c]) { contexts[c].last = ''; render(c); } break; // Stream Deck schaltet Mehrfach-Zustände selbst um

    case 'dialRotate': rotate(c, (m.payload && m.payload.ticks) || 0); break;
    case 'dialDown': case 'touchTap': dialPress(c); break;
    case 'propertyInspectorDidAppear': piContexts[c] = m.action; sendStateToPI(c); break;
    case 'propertyInspectorDidDisappear': delete piContexts[c]; break;
    case 'sendToPlugin': if (m.payload && m.payload.type === 'getState') { piContexts[c] = m.action; sendStateToPI(c); } break;
  }
}

function sendStateToPI(c) {
  sdSend({ event: 'sendToPropertyInspector', action: piContexts[c] || (contexts[c] && contexts[c].action), context: c, payload: { type: 'state', state: state } });
}
function sendStateToPIs() { Object.keys(piContexts).forEach(sendStateToPI); }

// ------------------------------------------------------------------ Bedienung
function press(c) {
  var x = contexts[c]; if (!x) return;
  var s = x.settings;
  switch (x.kind) {
    case 'mute': act(c, { action: 'toggleMute' }); break;
    case 'ducking': act(c, { action: 'toggleDucking' }); break;
    case 'monitor': act(c, { action: 'monitor' }); break;
    case 'profile': act(c, s.profile ? { action: 'profile', id: s.profile } : { action: 'nextProfile' }); break;
    case 'preset': act(c, { action: 'preset', key: s.preset || 'clear' }); break;
    case 'denoise': act(c, { action: 'denoise', mode: s.mode || 'cycle' }); break;
    case 'output': act(c, { action: 'output', device: s.device || 'cycle' }); break;
    case 'sound': act(c, s.sound ? { action: 'sound', id: s.sound } : { action: 'stopSounds' }); break;
    case 'volume': {
      var t = s.target || 'master', step = +s.step || 5, mode = s.mode || 'mute', mix = s.mix === 'stream' ? 'stream' : undefined;
      if (mode === 'up') act(c, { action: 'volume', target: t, delta: step, mix: mix });
      else if (mode === 'down') act(c, { action: 'volume', target: t, delta: -step, mix: mix });
      else act(c, { action: 'mute', target: t, mix: mix });
      break;
    }
  }
}
function rotate(c, ticks) {
  var x = contexts[c]; if (!x || x.kind !== 'volume') return;
  var step = +x.settings.dialStep || 2;
  act(c, { action: 'volume', target: x.settings.target || 'master', delta: ticks * step, mix: x.settings.mix === 'stream' ? 'stream' : undefined });
}
function dialPress(c) {
  var x = contexts[c]; if (!x || x.kind !== 'volume') return;
  act(c, { action: 'mute', target: x.settings.target || 'master', mix: x.settings.mix === 'stream' ? 'stream' : undefined });
}

// ------------------------------------------------------------------ Darstellung
function targetInfo(t, mix) {
  if (!state) return null;
  if (mix === 'stream') return streamInfo(t);
  if (t === 'master') return state.master ? { name: 'Ausgabe', sub: state.master.name, volume: state.master.volume, muted: state.master.muted, icon: state.master.muted ? 'speakerOff' : 'speaker' } : null;
  if (t === 'voice') return { name: 'Deine Stimme', volume: state.mic.gain, muted: state.mic.muted, icon: state.mic.muted ? 'micOff' : 'mic', color: '#6c9bff' };
  if (t.indexOf('cat:') === 0) {
    var k = t.slice(4), cat = state.categories && state.categories[k];
    return { name: FX_CAT_NAME[k] || k, volume: cat ? cat.volume : 0, muted: cat ? cat.muted : false, icon: FX_CAT_ICON[k] || 'speaker', missing: !cat };
  }
  if (t.indexOf('app:') === 0) {
    var key = t.slice(4), app = (state.apps || []).filter(function (a) { return a.key === key; })[0];
    if (!app) return { name: key.replace(/\.exe$/i, ''), volume: 0, muted: false, icon: 'speaker', missing: true };
    return { name: app.name, volume: app.volume, muted: app.muted, image: app.icon, letter: app.icon ? null : app.name.charAt(0).toUpperCase(), color: app.icon ? null : app.color };
  }
  return null;
}

// Werte im Stream-Mix (rechter Regler in Fusion-X)
function streamInfo(t) {
  var sm = state.streamMix || { master: 100, voice: { on: false, volume: 100 } };
  var base = { color: '#b48cff' };
  if (t === 'master') return Object.assign(base, { name: 'Stream', volume: sm.master, muted: false, icon: 'stream' });
  if (t === 'voice') return Object.assign(base, { name: 'Deine Stimme', volume: sm.voice.volume, muted: !sm.voice.on, icon: 'mic' });
  var apps = (state.apps || []).filter(function (a) { return t.indexOf('cat:') === 0 ? a.cat === t.slice(4) : a.key === t.slice(4); });
  var on = apps.filter(function (a) { return a.stream && a.stream.on; });
  var vol = on.length ? Math.round(on.reduce(function (s, a) { return s + a.stream.volume; }, 0) / on.length) : 0;
  var nm = t.indexOf('cat:') === 0 ? (FX_CAT_NAME[t.slice(4)] || t.slice(4)) : (apps[0] ? apps[0].name : t.slice(4).replace(/\.exe$/i, ''));
  return Object.assign(base, { name: nm, volume: vol, muted: !on.length && apps.length > 0, missing: !apps.length, icon: t.indexOf('cat:') === 0 ? (FX_CAT_ICON[t.slice(4)] || 'speaker') : 'stream' });
}

function keyFor(x) {
  var s = x.settings;
  if (!state) return { icon: 'plug', label: 'Fusion-X', sub: 'nicht gestartet', color: '#5b6672' };
  switch (x.kind) {
    case 'mute': return state.mic.muted ? { icon: 'micOff', label: 'Stumm', color: '#ff5a5a', bg: '#2a1214', state: 1 } : { icon: 'mic', label: 'Mikro an', color: '#6c9bff', state: 0 };
    case 'ducking': return state.ducking ? { icon: 'duck', label: 'Leiser: an', color: '#6c9bff', state: 0 } : { icon: 'duck', label: 'Leiser: aus', color: '#5b6672', state: 1 };
    case 'monitor': return state.mic.monitor ? { icon: 'ear', label: 'Mithören', sub: 'an', color: '#6c9bff', state: 0 } : { icon: 'ear', label: 'Mithören', sub: 'aus', color: '#5b6672', state: 1 };
    case 'profile': {
      var p = (state.profiles || []).filter(function (q) { return q.id === s.profile; })[0];
      if (!p) return { icon: 'layers', label: state.profile ? state.profile.name : 'Profil', sub: 'nächstes', active: false };
      var on = state.profile && state.profile.id === p.id;
      return { icon: p.icon === 'game' ? 'game' : p.icon === 'stream' ? 'stream' : p.icon === 'call' ? 'call' : p.icon === 'music' ? 'music' : 'star', label: p.name, active: on, color: on ? '#2ee6d6' : '#8d98a4' };
    }
    case 'preset': {
      var k = s.preset || 'clear', pr = (state.presets || []).filter(function (q) { return q.key === k; })[0];
      var act2 = state.mic.preset === k;
      return { icon: 'star', label: pr ? pr.name : k, active: act2, color: act2 ? '#6c9bff' : '#8d98a4' };
    }
    case 'denoise': {
      var names = { off: 'Aus', light: 'Leicht', ai: 'KI', studio: 'KI Studio' };
      var mode = s.mode || 'cycle';
      if (mode === 'cycle') return { icon: 'sparkle', label: names[state.mic.denoise] || '', sub: 'Rauschfilter', color: state.mic.denoise === 'off' ? '#5b6672' : '#6c9bff' };
      var on2 = state.mic.denoise === mode;
      return { icon: 'sparkle', label: names[mode], sub: 'Rauschfilter', active: on2, color: on2 ? '#6c9bff' : '#8d98a4' };
    }
    case 'output': {
      var dev = s.device && s.device !== 'cycle' ? (state.outputs || []).filter(function (d) { return d.id === s.device; })[0] : (state.outputs || []).filter(function (d) { return d.isDefault; })[0];
      var isHp = dev && /kopfh|headph|headset|buds|airpods|cloud|arctis/i.test(dev.name);
      if (!s.device || s.device === 'cycle') return { icon: isHp ? 'headphones' : 'speaker', label: dev ? dev.name : 'Ausgabe', sub: 'wechseln' };
      return { icon: isHp ? 'headphones' : 'speaker', label: dev ? dev.name : 'Gerät fehlt', active: dev && dev.isDefault, color: dev && dev.isDefault ? '#2ee6d6' : '#8d98a4' };
    }
    case 'sound': {
      if (!s.sound) return { icon: 'music', label: 'Alle stoppen', sub: 'Soundboard', color: '#ff5a6a' };
      var snd = (state.sounds || []).filter(function (q) { return q.id === s.sound; })[0];
      if (!snd) return { icon: 'music', label: 'Sound fehlt', color: '#4e6479' };
      return { icon: 'music', label: snd.name, sub: snd.playing ? 'läuft …' : 'Sound', color: snd.color, active: snd.playing };
    }
    case 'volume': {
      var info = targetInfo(s.target || 'master', s.mix);
      if (!info) return { icon: 'speaker', label: 'Lautstärke', color: '#5b6672' };
      var mode2 = s.mode || 'mute';
      var sub = info.missing ? 'nicht aktiv' : info.muted ? 'Stumm' : info.volume + ' %';
      var label = (mode2 === 'up' ? '+ ' : mode2 === 'down' ? '− ' : '') + info.name;
      return { icon: info.icon, image: info.image, letter: info.letter, label: label, sub: sub, frac: info.muted ? 0 : info.volume / 100, muted: info.muted, color: info.color || (info.muted ? '#ff5a5a' : '#2ee6d6'), feedback: info };
    }
  }
  return { icon: 'star', label: '' };
}

function render(c) {
  var x = contexts[c]; if (!x) return;
  var k = keyFor(x);
  if (x.controller === 'Encoder') {
    var f = k.feedback;
    var fb = f ? { title: fxT(f.name) + (x.settings.mix === 'stream' ? ' · Stream' : ''), value: fxT(f.missing ? 'nicht aktiv' : f.muted ? 'Stumm' : f.volume + ' %'), indicator: { value: f.muted ? 0 : f.volume } } : { title: 'Fusion-X', value: fxT('nicht gestartet'), indicator: { value: 0 } };
    var sig = JSON.stringify(fb) + (k.image || k.icon || '');
    if (sig !== x.last) {
      x.last = sig;
      fb.icon = fxSvgUrl(fxKeySvg({ icon: k.icon, image: k.image, letter: k.letter, color: k.color, label: '' }));
      sdSend({ event: 'setFeedback', context: c, payload: fb });
    }
    return;
  }
  var svg = fxKeySvg(k);
  if (svg === x.last) return;
  x.last = svg;
  // Erst den Zustand setzen, dann das Bild – sonst überschreibt der Zustand das Live-Bild
  if (k.state != null) sdSend({ event: 'setState', context: c, payload: { state: k.state } });
  sdSend({ event: 'setImage', context: c, payload: { image: fxSvgUrl(svg), target: 0 } });
}
function renderAll() { Object.keys(contexts).forEach(render); }
