// Fusion-X Stimm-Prozessor (AudioWorklet)
// Störgeräusch-Sperre (Noise Gate) mit Hysterese und weichem Öffnen/Schließen,
// De-Esser (Zischlaute) und Sprach-Erkennung für das automatische Leiserstellen anderer Apps.

const dbToLin = (db) => Math.pow(10, db / 20);
const linToDb = (v) => 20 * Math.log10(Math.max(v, 1e-9));

class FxVoice extends AudioWorkletProcessor {
  constructor() {
    super();
    this.p = {
      gate: { on: false, open: -48, close: -54, holdMs: 160, attackMs: 2, releaseMs: 140, floorDb: -60 },
      deess: { on: false, amount: 50, freq: 6500 },
      speakDb: -45
    };
    this.env = 0;            // Hüllkurve für das Gate
    this.gateOpen = false;
    this.gateGain = 1;
    this.hold = 0;
    this.sibEnv = 0;
    this.wideEnv = 0;
    this.deGain = 1;
    this.speaking = false;
    this.speakHang = 0;
    this.reportCounter = 0;
    this.maxGr = 0;
    this.setBand(6500);
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'params') {
        if (m.gate) Object.assign(this.p.gate, m.gate);
        if (m.deess) { Object.assign(this.p.deess, m.deess); this.setBand(this.p.deess.freq); }
        if (typeof m.speakDb === 'number') this.p.speakDb = m.speakDb;
      }
    };
  }

  // Bandpass (RBJ) für die Zischlaut-Erkennung
  setBand(f) {
    const w = 2 * Math.PI * f / sampleRate, q = 1.6, al = Math.sin(w) / (2 * q), a0 = 1 + al;
    this.b0 = al / a0; this.b1 = 0; this.b2 = -al / a0; this.a1 = -2 * Math.cos(w) / a0; this.a2 = (1 - al) / a0;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }

  process(inputs, outputs) {
    const inp = inputs[0], out = outputs[0];
    if (!inp || !inp.length) return true;
    const x = inp[0], y = out[0];
    const n = x.length, g = this.p.gate, d = this.p.deess, sr = sampleRate;
    const envAtt = Math.exp(-1 / (0.001 * sr)), envRel = Math.exp(-1 / (0.06 * sr));
    const gAtt = Math.exp(-1 / (Math.max(0.5, g.attackMs) * 0.001 * sr));
    const gRel = Math.exp(-1 / (Math.max(10, g.releaseMs) * 0.001 * sr));
    const openLin = dbToLin(g.open), closeLin = dbToLin(Math.min(g.close, g.open)), floor = dbToLin(g.floorDb);
    const holdSamples = g.holdMs * 0.001 * sr;
    const sAtt = Math.exp(-1 / (0.0008 * sr)), sRel = Math.exp(-1 / (0.05 * sr));
    const dAtt = Math.exp(-1 / (0.0015 * sr)), dRel = Math.exp(-1 / (0.06 * sr));
    const thrRatioDb = -1.5 - (d.amount / 100) * 9;
    const maxGrDb = 3 + (d.amount / 100) * 9;
    let blockPeak = 0;

    for (let i = 0; i < n; i++) {
      let s = x[i];
      const a = Math.abs(s);
      if (a > blockPeak) blockPeak = a;
      this.env = a > this.env ? envAtt * this.env + (1 - envAtt) * a : envRel * this.env + (1 - envRel) * a;

      // Gate mit Hysterese und Haltezeit
      if (g.on) {
        if (this.env >= openLin) { this.gateOpen = true; this.hold = holdSamples; }
        else if (this.env < closeLin) { if (this.hold > 0) this.hold--; else this.gateOpen = false; }
        else if (this.gateOpen) this.hold = holdSamples;
        const target = this.gateOpen ? 1 : floor;
        this.gateGain = target > this.gateGain ? gAtt * this.gateGain + (1 - gAtt) * target : gRel * this.gateGain + (1 - gRel) * target;
        s *= this.gateGain;
      } else {
        this.gateGain = 1;
        this.gateOpen = this.env >= openLin;
      }

      // De-Esser: Verhältnis von Zischband zu Gesamtpegel
      if (d.on) {
        const b = this.b0 * s + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1; this.x1 = s; this.y2 = this.y1; this.y1 = b;
        const ab = Math.abs(b), as = Math.abs(s);
        this.sibEnv = ab > this.sibEnv ? sAtt * this.sibEnv + (1 - sAtt) * ab : sRel * this.sibEnv + (1 - sRel) * ab;
        this.wideEnv = as > this.wideEnv ? sAtt * this.wideEnv + (1 - sAtt) * as : sRel * this.wideEnv + (1 - sRel) * as;
        let gr = 0;
        if (this.wideEnv > 1e-4) {
          const ratio = linToDb(this.sibEnv / this.wideEnv);
          if (ratio > thrRatioDb) gr = Math.min(maxGrDb, (ratio - thrRatioDb) * 1.6);
        }
        const tgt = dbToLin(-gr);
        this.deGain = tgt < this.deGain ? dAtt * this.deGain + (1 - dAtt) * tgt : dRel * this.deGain + (1 - dRel) * tgt;
        s *= this.deGain;
        if (gr > this.maxGr) this.maxGr = gr;
      } else {
        this.deGain = 1;
      }
      y[i] = s;
    }
    for (let c = 1; c < out.length; c++) out[c].set(y);

    // Sprache erkennen (für Ducking), mit Nachlaufzeit
    const talking = linToDb(this.env) > this.p.speakDb && (!g.on || this.gateOpen);
    if (talking) { this.speaking = true; this.speakHang = 0.35 * sr; }
    else if (this.speakHang > 0) this.speakHang -= n;
    else this.speaking = false;

    if (++this.reportCounter >= 10) {
      this.reportCounter = 0;
      this.port.postMessage({ gate: this.gateGain, open: this.gateOpen, deess: this.maxGr, speaking: this.speaking, env: linToDb(this.env) });
      this.maxGr = 0;
    }
    return true;
  }
}

registerProcessor('fx-voice', FxVoice);
