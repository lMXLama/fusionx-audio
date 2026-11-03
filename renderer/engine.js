// Fusion-X Stimm-Engine: komplette Mikrofon-Kette im Web-Audio-Graph.
//
// Mikro → Kanalwahl → Lautstärke → Trittschall-Filter → Rauschunterdrückung → Gate + De-Esser
//       → EQ (5 Bänder) → Kompressor → Übersteuerungsschutz → Ausgang (virtuelles Mikro)
//                                                              ↘ Mithören (Kopfhörer)
(function (root) {
  'use strict';

  var dbToLin = function (db) { return Math.pow(10, db / 20); };
  var linToDb = function (v) { return 20 * Math.log10(Math.max(v, 1e-9)); };

  var DEFAULT_MIC = {
    inputId: '',
    channel: 'auto',
    gainDb: 0,
    hpf: { on: true, freq: 80 },
    denoise: 'ai',
    gate: { on: true, open: -50, close: -56, holdMs: 180, releaseMs: 140, floorDb: -60 },
    eq: { on: true, low: { f: 120, g: 0 }, mid1: { f: 350, g: 0, q: 1 }, mid2: { f: 3000, g: 0, q: 1 }, high: { f: 9000, g: 0 } },
    comp: { on: true, amount: 40, thr: -20, ratio: 3.3, att: 8, rel: 160, makeup: 3 },
    deess: { on: false, amount: 40, freq: 6500 },
    limiter: { on: true },
    outGainDb: 0,
    monitor: { on: false, device: '', volume: 0.8 },
    muted: false
  };

  // Kompressor-Werte aus einem einzigen "Stärke"-Regler (0–100)
  function compFromAmount(a) {
    var thr = -10 - a * 0.26, ratio = 1.4 + a * 0.046;
    return { amount: a, thr: Math.round(thr), ratio: Math.round(ratio * 10) / 10, att: 8, rel: 160, makeup: Math.round((-thr) * (1 - 1 / ratio) * 0.45 * 2) / 2 };
  }

  var PRESETS = {
    natural: { name: 'Natürlich', desc: 'Nur aufräumen, Klang bleibt wie er ist',
      hpf: { on: true, freq: 75 }, denoise: 'light', gate: { on: true }, deess: { on: false },
      eq: { low: { f: 120, g: 0 }, mid1: { f: 350, g: 0, q: 1 }, mid2: { f: 3000, g: 0, q: 1 }, high: { f: 9000, g: 0 } }, compAmount: 25 },
    clear: { name: 'Klar & präsent', desc: 'Verständlich in jedem Voice-Chat',
      hpf: { on: true, freq: 90 }, denoise: 'ai', gate: { on: true }, deess: { on: true, amount: 35 },
      eq: { low: { f: 120, g: -1 }, mid1: { f: 300, g: -2, q: 1.2 }, mid2: { f: 3000, g: 3, q: 0.9 }, high: { f: 9000, g: 2 } }, compAmount: 45 },
    broadcast: { name: 'Broadcast', desc: 'Voller Radio-Sound für Streams',
      hpf: { on: true, freq: 70 }, denoise: 'ai', gate: { on: true }, deess: { on: true, amount: 50 },
      eq: { low: { f: 110, g: 3 }, mid1: { f: 380, g: -3, q: 1.1 }, mid2: { f: 3200, g: 2.5, q: 0.9 }, high: { f: 10000, g: 3 } }, compAmount: 65 },
    gaming: { name: 'Gaming', desc: 'Stimme schneidet durch, Tastatur bleibt draußen',
      hpf: { on: true, freq: 120 }, denoise: 'ai', gate: { on: true }, deess: { on: true, amount: 30 },
      eq: { low: { f: 140, g: -2 }, mid1: { f: 400, g: -1, q: 1 }, mid2: { f: 2800, g: 3, q: 1 }, high: { f: 8000, g: 1 } }, compAmount: 55 },
    podcast: { name: 'Podcast warm', desc: 'Nah, warm und angenehm lange zuzuhören',
      hpf: { on: true, freq: 70 }, denoise: 'light', gate: { on: true }, deess: { on: true, amount: 45 },
      eq: { low: { f: 120, g: 2 }, mid1: { f: 320, g: -1, q: 1 }, mid2: { f: 3000, g: 1.5, q: 0.8 }, high: { f: 11000, g: 1 } }, compAmount: 50 },
    radio: { name: 'Funkgerät', desc: 'Spaß-Effekt wie über Funk',
      hpf: { on: true, freq: 420 }, denoise: 'ai', gate: { on: true }, deess: { on: false },
      eq: { low: { f: 300, g: -12 }, mid1: { f: 1400, g: 6, q: 0.8 }, mid2: { f: 2600, g: 4, q: 1.2 }, high: { f: 3800, g: -15 } }, compAmount: 85 }
  };

  function applyPreset(mic, key) {
    var p = PRESETS[key];
    if (!p) return mic;
    var m = JSON.parse(JSON.stringify(mic));
    m.hpf = Object.assign({}, m.hpf, p.hpf);
    m.denoise = p.denoise;
    m.gate.on = p.gate.on;
    m.deess = Object.assign({}, m.deess, p.deess);
    m.eq = Object.assign({ on: true }, JSON.parse(JSON.stringify(p.eq)));
    m.comp = Object.assign({ on: true }, compFromAmount(p.compAmount));
    m.preset = key;
    return m;
  }

  function VoiceEngine() {
    this.ctx = null;
    this.state = 'off';
    this.error = null;
    this.mic = JSON.parse(JSON.stringify(DEFAULT_MIC));
    this.denoiseMode = null;
    this.wasm = {};
    this.voice = { gate: 1, open: false, deess: 0, speaking: false, env: -100 };
    this.channels = 1;
    this.chanGains = { l: 1, r: 0 };
    this.autoChannel = 'mix';
    this.listeners = [];
    this.buf = new Float32Array(1024);
  }

  VoiceEngine.prototype.on = function (fn) { this.listeners.push(fn); };
  VoiceEngine.prototype.emit = function () { var self = this; this.listeners.forEach(function (f) { f(self.state, self.error); }); };

  VoiceEngine.prototype.start = async function (mic, opts) {
    await this.stop();
    this.mic = JSON.parse(JSON.stringify(mic));
    this.state = 'starting'; this.error = null; this.emit();
    try {
      var stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: opts.inputBrowserId ? { exact: opts.inputBrowserId } : undefined,
          echoCancellation: false, noiseSuppression: false, autoGainControl: false,
          channelCount: { ideal: 2 }, sampleRate: { ideal: 48000 }
        }
      });
      var ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
      this.ctx = ctx;
      this.stream = stream;
      var track = stream.getAudioTracks()[0];
      var ts = track.getSettings ? track.getSettings() : {};
      this.channels = ts.channelCount || 1;
      this.trackLabel = track.label;
      await ctx.audioWorklet.addModule('worklets/fx-voice.js');
      await ctx.audioWorklet.addModule('worklets/fx-recorder.js');
      this.build(stream);
      await this.setOutput(opts.outputSinkId || null);
      await this.setDenoise(this.mic.denoise);
      this.applyAll();
      if (this.mic.monitor.on) await this.setMonitor(true, opts.monitorSinkId);
      if (ctx.state === 'suspended') await ctx.resume();
      this.state = 'on';
    } catch (e) {
      this.state = 'error';
      this.error = e && e.name === 'NotAllowedError' ? 'Kein Zugriff auf das Mikrofon. Erlaube den Zugriff in den Windows-Datenschutzeinstellungen (Mikrofon → Desktop-Apps).'
        : e && e.name === 'NotFoundError' ? 'Dieses Mikrofon wurde nicht gefunden. Ist es angeschlossen?'
        : e && e.name === 'NotReadableError' ? 'Das Mikrofon wird gerade exklusiv von einer anderen App benutzt (z. B. ASIO in einer DAW).'
        : (e && e.message) || String(e);
      await this.stop(true);
    }
    this.emit();
  };

  VoiceEngine.prototype.build = function (stream) {
    var c = this.ctx, n = {};
    n.src = c.createMediaStreamSource(stream);
    n.split = c.createChannelSplitter(2);
    n.gl = c.createGain(); n.gr = c.createGain();
    n.mono = c.createGain(); n.mono.channelCount = 1; n.mono.channelCountMode = 'explicit';
    n.anL = c.createAnalyser(); n.anR = c.createAnalyser();
    [n.anL, n.anR].forEach(function (a) { a.fftSize = 1024; });
    n.src.connect(n.split);
    n.split.connect(n.gl, 0); n.split.connect(n.anL, 0);
    n.split.connect(n.gr, 1); n.split.connect(n.anR, 1);
    n.gl.connect(n.mono); n.gr.connect(n.mono);

    n.inGain = c.createGain();
    n.anIn = c.createAnalyser(); n.anIn.fftSize = 1024;
    n.hpf = c.createBiquadFilter(); n.hpf.type = 'highpass'; n.hpf.Q.value = 0.707;
    n.preDn = c.createGain(); n.postDn = c.createGain();
    n.voice = new AudioWorkletNode(c, 'fx-voice', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
    n.low = c.createBiquadFilter(); n.low.type = 'lowshelf';
    n.mid1 = c.createBiquadFilter(); n.mid1.type = 'peaking';
    n.mid2 = c.createBiquadFilter(); n.mid2.type = 'peaking';
    n.high = c.createBiquadFilter(); n.high.type = 'highshelf';
    n.comp = c.createDynamicsCompressor();
    n.makeup = c.createGain();
    n.limit = c.createDynamicsCompressor();
    n.outGain = c.createGain();
    n.anOut = c.createAnalyser(); n.anOut.fftSize = 1024;
    n.merge = c.createChannelMerger(2);
    n.sfx = c.createGain();          // Soundboard: geht an das virtuelle Mikro, ohne Stimm-Effekte
    n.monGain = c.createGain();
    n.monDest = c.createMediaStreamDestination();
    n.rec = new AudioWorkletNode(c, 'fx-recorder', { numberOfInputs: 2, numberOfOutputs: 0 });

    n.mono.connect(n.inGain);
    n.inGain.connect(n.anIn);
    n.inGain.connect(n.hpf);
    n.hpf.connect(n.preDn);
    n.preDn.connect(n.postDn);
    n.postDn.connect(n.voice);
    n.voice.connect(n.low); n.low.connect(n.mid1); n.mid1.connect(n.mid2); n.mid2.connect(n.high);
    n.high.connect(n.comp); n.comp.connect(n.makeup); n.makeup.connect(n.limit); n.limit.connect(n.outGain);
    n.outGain.connect(n.anOut);
    n.outGain.connect(n.merge, 0, 0); n.outGain.connect(n.merge, 0, 1);
    n.merge.connect(c.destination);
    n.sfx.connect(n.merge, 0, 0); n.sfx.connect(n.merge, 0, 1);
    n.merge.connect(n.monGain); n.monGain.connect(n.monDest);
    n.inGain.connect(n.rec, 0, 0);
    n.outGain.connect(n.rec, 0, 1);

    var self = this;
    n.voice.port.onmessage = function (e) { self.voice = e.data; };
    this.n = n;
  };

  VoiceEngine.prototype.stop = async function (keepError) {
    if (this.monitorEl) { try { this.monitorEl.pause(); } catch (_) {} this.monitorEl = null; }
    if (this.stream) this.stream.getTracks().forEach(function (t) { t.stop(); });
    if (this.ctx) { try { await this.ctx.close(); } catch (_) {} }
    this.ctx = null; this.stream = null; this.n = null; this.denoiseMode = null; this.dnNode = null; this.sfxCache = {};
    if (!keepError) { this.state = 'off'; this.error = null; }
  };

  VoiceEngine.prototype.setOutput = async function (sinkId) {
    if (!this.ctx || !this.ctx.setSinkId) return;
    try { await this.ctx.setSinkId(sinkId ? sinkId : { type: 'none' }); this.outputSink = sinkId; }
    catch (e) { this.outputSink = null; throw new Error('Ausgabe an das virtuelle Mikrofon fehlgeschlagen: ' + e.message); }
  };

  VoiceEngine.prototype.setMonitor = async function (on, sinkId) {
    if (!this.ctx) return;
    if (!on) { if (this.monitorEl) { this.monitorEl.pause(); this.monitorEl.srcObject = null; this.monitorEl = null; } return; }
    if (!this.monitorEl) { this.monitorEl = new Audio(); this.monitorEl.srcObject = this.n.monDest.stream; }
    if (this.monitorEl.setSinkId) { try { await this.monitorEl.setSinkId(sinkId || ''); } catch (_) {} }
    try { await this.monitorEl.play(); } catch (_) {}
  };

  // Rauschunterdrückung umschalten: aus · leicht (Speex) · KI (RNNoise) · KI Studio (GTCRN)
  VoiceEngine.prototype.setDenoise = async function (mode) {
    if (!this.ctx || mode === this.denoiseMode) return;
    var n = this.n, c = this.ctx;
    n.preDn.disconnect();
    if (this.dnNode) { try { this.dnNode.disconnect(); if (this.dnNode.destroy) this.dnNode.destroy(); } catch (_) {} this.dnNode = null; }
    this.denoiseMode = mode;
    if (mode === 'off') { n.preDn.connect(n.postDn); return; }
    try {
      var lib = this.lib || (this.lib = await import('./vendor/noise/index.js'));
      var node;
      if (mode === 'light') {
        if (!this.wasm.speex) { this.wasm.speex = await lib.loadSpeex({ url: 'vendor/noise/speex.wasm' }); await c.audioWorklet.addModule('vendor/noise/speexWorklet.js'); }
        node = new lib.SpeexWorkletNode(c, { wasmBinary: this.wasm.speex, maxChannels: 1 });
      } else if (mode === 'studio') {
        if (!this.wasm.gtcrn) { this.wasm.gtcrn = await lib.loadGtcrn({ url: 'vendor/noise/gtcrn.wasm' }); await c.audioWorklet.addModule('vendor/noise/gtcrnWorklet.js'); }
        node = new lib.GtcrnWorkletNode(c, { wasmBinary: this.wasm.gtcrn, maxChannels: 1 });
      } else {
        if (!this.wasm.rnnoise) { this.wasm.rnnoise = await lib.loadRnnoise({ url: 'vendor/noise/rnnoise.wasm', simdUrl: 'vendor/noise/rnnoise_simd.wasm' }); await c.audioWorklet.addModule('vendor/noise/rnnoiseWorklet.js'); }
        node = new lib.RnnoiseWorkletNode(c, { wasmBinary: this.wasm.rnnoise, maxChannels: 1 });
      }
      if (this.denoiseMode !== mode || !this.ctx) return;
      n.preDn.connect(node); node.connect(n.postDn);
      this.dnNode = node;
    } catch (e) {
      console.warn('Rauschunterdrückung nicht verfügbar', e);
      n.preDn.connect(n.postDn);
      this.denoiseMode = 'off';
    }
  };

  // Alle Parameter auf die Knoten übertragen (weich, ohne Knacken)
  VoiceEngine.prototype.applyAll = function () {
    if (!this.n) return;
    var m = this.mic, n = this.n, t = this.ctx.currentTime, k = 0.015;
    var set = function (param, v) { param.setTargetAtTime(v, t, k); };
    this.applyChannel();
    set(n.inGain.gain, dbToLin(m.gainDb));
    set(n.hpf.frequency, m.hpf.on ? m.hpf.freq : 10);
    var eq = m.eq, on = eq.on;
    set(n.low.frequency, eq.low.f); set(n.low.gain, on ? eq.low.g : 0);
    set(n.mid1.frequency, eq.mid1.f); set(n.mid1.gain, on ? eq.mid1.g : 0); set(n.mid1.Q, eq.mid1.q || 1);
    set(n.mid2.frequency, eq.mid2.f); set(n.mid2.gain, on ? eq.mid2.g : 0); set(n.mid2.Q, eq.mid2.q || 1);
    set(n.high.frequency, eq.high.f); set(n.high.gain, on ? eq.high.g : 0);
    var cp = m.comp;
    n.comp.threshold.value = cp.on ? cp.thr : 0;
    n.comp.ratio.value = cp.on ? cp.ratio : 1;
    n.comp.knee.value = 8;
    n.comp.attack.value = cp.att / 1000;
    n.comp.release.value = cp.rel / 1000;
    set(n.makeup.gain, dbToLin(cp.on ? cp.makeup : 0));
    n.limit.threshold.value = m.limiter.on ? -1.5 : 0;
    n.limit.ratio.value = m.limiter.on ? 20 : 1;
    n.limit.knee.value = 0;
    n.limit.attack.value = 0.001;
    n.limit.release.value = 0.08;
    set(n.outGain.gain, (m.muted || this.pttMuted) ? 0 : dbToLin(m.outGainDb));
    set(n.monGain.gain, m.monitor.volume);
    n.voice.port.postMessage({ type: 'params', gate: m.gate, deess: m.deess, speakDb: Math.max(m.gate.open, -55) });
  };

  // Sprechtaste: schnell öffnen, sanft schließen
  VoiceEngine.prototype.setPttMuted = function (muted) {
    this.pttMuted = !!muted;
    if (!this.n) return;
    var target = (this.mic.muted || this.pttMuted) ? 0 : dbToLin(this.mic.outGainDb);
    this.n.outGain.gain.setTargetAtTime(target, this.ctx.currentTime, this.pttMuted ? 0.012 : 0.004);
  };

  // Soundboard-Sound in das Mikro mischen
  VoiceEngine.prototype.playToMic = async function (arrayBuffer, volume, cacheKey) {
    if (!this.n) return null;
    this.sfxCache = this.sfxCache || {};
    var buf = this.sfxCache[cacheKey];
    if (!buf) { buf = await this.ctx.decodeAudioData(arrayBuffer.slice(0)); this.sfxCache[cacheKey] = buf; }
    var src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = buf; g.gain.value = volume;
    src.connect(g); g.connect(this.n.sfx);
    src.start();
    return src;
  };

  VoiceEngine.prototype.applyChannel = function () {
    if (!this.n) return;
    var mode = this.mic.channel === 'auto' ? this.autoChannel : this.mic.channel;
    var l = 1, r = 0;
    if (this.channels >= 2) {
      if (mode === 'left') { l = 1; r = 0; }
      else if (mode === 'right') { l = 0; r = 1; }
      else { l = 0.5; r = 0.5; }
    }
    var t = this.ctx.currentTime;
    this.n.gl.gain.setTargetAtTime(l, t, 0.02);
    this.n.gr.gain.setTargetAtTime(r, t, 0.02);
    this.effectiveChannel = this.channels >= 2 ? mode : 'mono';
  };

  VoiceEngine.prototype.update = async function (mic, opts) {
    var prev = this.mic;
    this.mic = JSON.parse(JSON.stringify(mic));
    if (!this.n) return;
    this.applyAll();
    if (mic.denoise !== this.denoiseMode) await this.setDenoise(mic.denoise);
    if (opts && 'monitorSinkId' in opts) {
      if (mic.monitor.on !== !!this.monitorEl || (prev.monitor.device !== mic.monitor.device)) await this.setMonitor(mic.monitor.on, opts.monitorSinkId);
    }
  };

  function measure(an, buf) {
    an.getFloatTimeDomainData(buf);
    var peak = 0, sum = 0;
    for (var i = 0; i < buf.length; i++) { var v = buf[i]; var a = v < 0 ? -v : v; if (a > peak) peak = a; sum += v * v; }
    return { peak: linToDb(peak), rms: linToDb(Math.sqrt(sum / buf.length)) };
  }

  VoiceEngine.prototype.meters = function () {
    if (!this.n) return null;
    var n = this.n, b = this.buf;
    var l = measure(n.anL, b), r = measure(n.anR, b), i = measure(n.anIn, b), o = measure(n.anOut, b);
    // Automatische Kanalwahl: liegt das Mikro nur auf einem Eingang des Interfaces, wird nur dieser genutzt
    if (this.channels >= 2 && this.mic.channel === 'auto') {
      this.chanScore = this.chanScore || 0;
      var loud = Math.max(l.rms, r.rms);
      if (loud > -55) {
        var diff = l.rms - r.rms;
        this.chanScore = this.chanScore * 0.97 + (diff > 18 ? 1 : diff < -18 ? -1 : 0) * 0.03;
      }
      var want = this.chanScore > 0.5 ? 'left' : this.chanScore < -0.5 ? 'right' : (Math.abs(this.chanScore) < 0.2 ? 'mix' : this.autoChannel);
      if (want !== this.autoChannel) { this.autoChannel = want; this.applyChannel(); }
    }
    return {
      rawL: l, rawR: r, input: i, output: o,
      comp: n.comp.reduction, limit: n.limit.reduction,
      gate: this.voice.gate, gateOpen: this.voice.open, deess: this.voice.deess, speaking: !!this.voice.speaking && !this.mic.muted,
      channel: this.effectiveChannel, channels: this.channels,
      latency: Math.round(((this.ctx.baseLatency || 0) + (this.ctx.outputLatency || 0)) * 1000)
    };
  };

  // Pegel über einen Zeitraum sammeln (für den Mikro-Check)
  VoiceEngine.prototype.sample = function (ms, onProgress) {
    var self = this;
    return new Promise(function (resolve) {
      var rows = [], t0 = performance.now();
      (function step() {
        var m = self.meters();
        if (m) rows.push({ inPeak: m.input.peak, inRms: m.input.rms, l: m.rawL.rms, r: m.rawR.rms, rawPeak: Math.max(m.rawL.peak, m.rawR.peak) });
        var p = (performance.now() - t0) / ms;
        if (onProgress) onProgress(Math.min(1, p), m);
        if (p >= 1 || !self.n) resolve(rows); else setTimeout(step, 50);
      })();
    });
  };

  // Vorher/Nachher-Aufnahme
  VoiceEngine.prototype.record = function (ms, onProgress) {
    var self = this;
    return new Promise(function (resolve, reject) {
      if (!self.n) return reject(new Error('Mikrofon ist nicht aktiv'));
      var a = [], b = [], port = self.n.rec.port, t0 = performance.now();
      port.onmessage = function (e) {
        if (e.data.a) { a.push(e.data.a); b.push(e.data.b); }
        if (e.data.done) {
          var join = function (parts) { var len = parts.reduce(function (s, p) { return s + p.length; }, 0), out = new Float32Array(len), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; }); return out; };
          resolve({ raw: join(a), proc: join(b), rate: self.ctx.sampleRate });
        }
      };
      port.postMessage('start');
      (function tick() {
        var p = (performance.now() - t0) / ms;
        if (onProgress) onProgress(Math.min(1, p));
        if (p >= 1) port.postMessage('stop'); else setTimeout(tick, 60);
      })();
    });
  };

  root.FxEngine = { VoiceEngine: VoiceEngine, DEFAULT_MIC: DEFAULT_MIC, PRESETS: PRESETS, applyPreset: applyPreset, compFromAmount: compFromAmount, dbToLin: dbToLin, linToDb: linToDb };
})(this);
