// Simulierte Audio-Umgebung. Wird genutzt, wenn Fusion-X nicht unter Windows läuft
// (Entwicklung auf Mac/Linux) oder als reine Demo im Browser.
(function (root) {
  'use strict';

  // Drei typische Setups: mit Audio-Interface, mit Gaming-Headset, nur Laptop
  function MockAudio(scenario) {
    this.scenario = scenario = scenario || 'interface';
    var R = function (id, name, desc, adapter, en, fmt, extra) {
      var d = { id: id, flow: 'render', name: name, desc: desc, adapter: adapter, enumerator: en, formFactor: 1, format: fmt, volume: 0.62, muted: false, isDefault: false, isDefaultComms: false };
      for (var k in extra) d[k] = extra[k];
      return d;
    };
    var C = function (id, name, desc, adapter, en, fmt, extra) {
      var d = R(id, name, desc, adapter, en, fmt, extra);
      d.flow = 'capture';
      d.volume = 0.8;
      for (var k in extra) d[k] = extra[k];
      return d;
    };
    var f = function (rate, bits, ch) { return { rate: rate, bits: bits, channels: ch }; };
    var cableOut = R('{0.0.0.00000000}.{a5}', 'CABLE Input (VB-Audio Virtual Cable)', 'CABLE Input', 'VB-Audio Virtual Cable', 'ROOT', f(48000, 24, 2), { volume: 1 });
    var cableIn = C('{0.0.1.00000000}.{b4}', 'CABLE Output (VB-Audio Virtual Cable)', 'CABLE Output', 'VB-Audio Virtual Cable', 'ROOT', f(48000, 24, 2), { volume: 1 });
    if (scenario === 'headset') {
      this.devices = [
        R('{0.0.0.00000000}.{a2}', 'Kopfhörer (HyperX Cloud III Wireless)', 'Kopfhörer', 'HyperX Cloud III Wireless', 'USB', f(48000, 16, 2), { isDefault: true, isDefaultComms: true, volume: 0.55 }),
        R('{0.0.0.00000000}.{a3}', 'Lautsprecher (Realtek(R) Audio)', 'Lautsprecher', 'Realtek(R) Audio', 'HDAUDIO', f(48000, 24, 2), { volume: 0.3 }),
        R('{0.0.0.00000000}.{a4}', 'LG HDR 4K (NVIDIA High Definition Audio)', 'LG HDR 4K', 'NVIDIA High Definition Audio', 'HDAUDIO', f(48000, 24, 2), {}),
        cableOut,
        C('{0.0.1.00000000}.{b2}', 'Mikrofon (HyperX Cloud III Wireless)', 'Mikrofon', 'HyperX Cloud III Wireless', 'USB', f(48000, 16, 1), { isDefault: true, isDefaultComms: true, volume: 0.5 }),
        C('{0.0.1.00000000}.{b5}', 'Mikrofon (Realtek(R) Audio)', 'Mikrofon', 'Realtek(R) Audio', 'HDAUDIO', f(48000, 24, 2), {}),
        cableIn
      ];
      this.asio = [];
    } else if (scenario === 'laptop') {
      this.devices = [
        R('{0.0.0.00000000}.{a6}', 'Lautsprecher (Realtek(R) Audio)', 'Lautsprecher', 'Realtek(R) Audio', 'HDAUDIO', f(48000, 24, 2), { isDefault: true, isDefaultComms: true, volume: 0.45 }),
        R('{0.0.0.00000000}.{a7}', 'Kopfhörer (Galaxy Buds2 Pro)', 'Kopfhörer', 'Galaxy Buds2 Pro', 'BTHENUM', f(48000, 16, 2), { volume: 0.5 }),
        C('{0.0.1.00000000}.{b6}', 'Mikrofonarray (Realtek(R) Audio)', 'Mikrofonarray', 'Realtek(R) Audio', 'HDAUDIO', f(48000, 16, 2), { isDefault: true, isDefaultComms: true, volume: 0.42 }),
        C('{0.0.1.00000000}.{b7}', 'Headset (Galaxy Buds2 Pro Hands-Free)', 'Headset', 'Galaxy Buds2 Pro Hands-Free', 'BTHENUM', f(16000, 16, 1), {})
      ];
      this.asio = [];
    } else {
      this.devices = [
        R('{0.0.0.00000000}.{a1}', 'Lautsprecher (Focusrite USB Audio)', 'Lautsprecher', 'Focusrite USB Audio', 'USB', f(48000, 24, 2), { isDefault: true }),
        R('{0.0.0.00000000}.{a2}', 'Kopfhörer (HyperX Cloud III Wireless)', 'Kopfhörer', 'HyperX Cloud III Wireless', 'USB', f(48000, 16, 2), { isDefaultComms: true, volume: 0.48 }),
        R('{0.0.0.00000000}.{a3}', 'Lautsprecher (Realtek(R) Audio)', 'Lautsprecher', 'Realtek(R) Audio', 'HDAUDIO', f(48000, 24, 2), { volume: 0.3 }),
        R('{0.0.0.00000000}.{a4}', 'LG HDR 4K (NVIDIA High Definition Audio)', 'LG HDR 4K', 'NVIDIA High Definition Audio', 'HDAUDIO', f(48000, 24, 2), {}),
        cableOut,
        C('{0.0.1.00000000}.{b1}', 'Mikrofon (Focusrite USB Audio)', 'Mikrofon', 'Focusrite USB Audio', 'USB', f(48000, 24, 2), { isDefault: true }),
        C('{0.0.1.00000000}.{b2}', 'Mikrofon (HyperX Cloud III Wireless)', 'Mikrofon', 'HyperX Cloud III Wireless', 'USB', f(48000, 16, 1), { isDefaultComms: true }),
        C('{0.0.1.00000000}.{b3}', 'Mikrofon (Logitech BRIO)', 'Mikrofon', 'Logitech BRIO', 'USB', f(48000, 16, 2), {}),
        cableIn
      ];
      this.asio = ['Focusrite USB ASIO', 'ASIO4ALL v2'];
    }
    var spk = this.devices.filter(function (d) { return d.flow === 'render' && d.isDefault; })[0].id;
    var mic = this.devices.filter(function (d) { return d.flow === 'capture' && d.isDefault; })[0].id;
    var S = function (pid, exe, name, vol, kind, flow, dev) {
      return { pid: pid, exe: exe, name: name, path: 'C:\\Programme\\' + exe, volume: vol, muted: false, kind: kind, flow: flow || 'render', device: dev || spk, system: false, active: true, env: 0, target: 0, next: 0 };
    };
    this.sessions = [
      S(4120, 'Discord.exe', 'Discord', 0.86, 'voice'),
      S(8812, 'VALORANT-Win64-Shipping.exe', 'VALORANT', 0.7, 'game'),
      S(5560, 'Spotify.exe', 'Spotify', 0.42, 'music'),
      S(9024, 'chrome.exe', 'Google Chrome', 0.65, 'web'),
      S(7300, 'obs64.exe', 'OBS Studio', 1, 'quiet'),
      S(4120, 'Discord.exe', 'Discord', 1, 'quiet', 'capture', mic),
      S(7300, 'obs64.exe', 'OBS Studio', 1, 'quiet', 'capture', mic)
    ];
    var sys = S(0, 'system', 'Systemsounds', 0.5, 'system');
    sys.system = true; sys.path = '';
    this.sessions.push(sys);
    this.appOutput = {};
    this.t0 = Date.now();
  }

  MockAudio.prototype.tick = function () {
    var now = Date.now();
    this.sessions.forEach(function (s) {
      var p = 0, t = (now - 0) / 1000;
      if (now > s.next) {
        if (s.kind === 'voice') { s.target = Math.random() < 0.55 ? 0.25 + Math.random() * 0.45 : 0; s.next = now + 300 + Math.random() * 1400; }
        else if (s.kind === 'game') { s.target = 0.15 + Math.random() * (Math.random() < 0.25 ? 0.8 : 0.35); s.next = now + 90 + Math.random() * 400; }
        else if (s.kind === 'music') { s.target = 0.35 + Math.random() * 0.3; s.next = now + 120 + Math.random() * 200; }
        else if (s.kind === 'web') { s.target = Math.random() < 0.2 ? 0.3 + Math.random() * 0.3 : 0; s.next = now + 1500 + Math.random() * 3000; }
        else if (s.kind === 'system') { s.target = Math.random() < 0.04 ? 0.5 : 0; s.next = now + 2000; }
        else { s.target = 0; s.next = now + 5000; }
      }
      s.env += (s.target - s.env) * 0.35;
      p = s.env * (0.75 + 0.25 * Math.abs(Math.sin(t * 9 + s.pid)));
      if (s.kind === 'music') p *= 0.85 + 0.15 * Math.abs(Math.sin(t * 2.1));
      s.peak = s.muted ? 0 : Math.max(0, Math.min(1, p * s.volume * 1.3));
    });
  };

  MockAudio.prototype.call = function (cmd, a) {
    a = a || {};
    var self = this, byId = function (id) { return self.devices.filter(function (d) { return d.id === id; })[0]; };
    switch (cmd) {
      case 'hello': return { version: 'demo', os: 'Demo', build: 22631, is64: true, appOutput: true, demo: true };
      case 'devices': return JSON.parse(JSON.stringify(this.devices));
      case 'asio': return this.asio.slice();
      case 'poll': {
        this.tick();
        var peaks = {}, spk0 = (this.devices.filter(function (d) { return d.flow === 'render' && d.isDefault; })[0] || {}).id;
        var sum = 0;
        this.sessions.forEach(function (s) { if (s.flow === 'render' && s.device === spk0) sum = Math.max(sum, s.peak || 0); });
        this.devices.forEach(function (d) { peaks[d.id] = d.flow === 'render' ? (d.isDefault ? sum * d.volume : 0) : 0; });
        return {
          peaks: peaks,
          sessions: this.sessions.map(function (s, i) {
            return { key: s.device + '|' + s.pid + '|' + i, pid: s.pid, device: s.device, flow: s.flow, system: s.system, active: s.active, name: s.name, exe: s.exe, path: s.path, volume: s.volume, muted: s.muted, peak: s.flow === 'render' ? Math.round((s.peak || 0) * 1e4) / 1e4 : 0 };
          })
        };
      }
      case 'setAppVolume':
      case 'setAppMute': {
        var n = 0;
        this.sessions.forEach(function (s) {
          if (s.flow !== 'render' && !a.includeCapture) return;
          if ((a.system && s.system) || (!s.system && (a.pids || []).indexOf(s.pid) >= 0)) {
            if (cmd === 'setAppVolume') s.volume = Math.max(0, Math.min(1, a.value)); else s.muted = !!a.muted;
            n++;
          }
        });
        return n;
      }
      case 'setDeviceVolume': { var d = byId(a.device); if (!d) throw new Error('Gerät nicht gefunden'); d.volume = Math.max(0, Math.min(1, a.value)); return true; }
      case 'setDeviceMute': { var d2 = byId(a.device); if (!d2) throw new Error('Gerät nicht gefunden'); d2.muted = !!a.muted; return true; }
      case 'setDefault': {
        var dev = byId(a.device);
        if (!dev) throw new Error('Gerät nicht gefunden');
        this.devices.forEach(function (x) {
          if (x.flow !== dev.flow) return;
          if (a.roles !== 'comms') x.isDefault = x.id === dev.id;
          if (a.roles !== 'console') x.isDefaultComms = x.id === dev.id;
        });
        return true;
      }
      case 'setAppOutput': (a.pids || []).forEach(function (p) { self.appOutput[p] = a.device || null; }); return (a.pids || []).length;
      case 'getAppOutput': return this.appOutput[a.pid] || null;
      case 'icon': return null;
      case 'watchKeys': return (a.keys || []).length;
      default: throw new Error('Unbekannter Befehl: ' + cmd);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = { MockAudio: MockAudio };
  else root.MockAudio = MockAudio;
})(this);
