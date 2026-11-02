// Nimmt zwei Signale gleichzeitig auf (Original und bearbeitet) für den Vorher/Nachher-Vergleich.
class FxRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.on = false;
    this.bufA = new Float32Array(4096);
    this.bufB = new Float32Array(4096);
    this.pos = 0;
    this.port.onmessage = (e) => {
      if (e.data === 'start') { this.on = true; this.pos = 0; }
      if (e.data === 'stop') { this.flush(); this.on = false; this.port.postMessage({ done: true }); }
    };
  }
  flush() {
    if (this.pos > 0) this.port.postMessage({ a: this.bufA.slice(0, this.pos), b: this.bufB.slice(0, this.pos) });
    this.pos = 0;
  }
  process(inputs) {
    if (!this.on) return true;
    const a = inputs[0] && inputs[0][0], b = inputs[1] && inputs[1][0];
    const n = (a || b) ? (a || b).length : 128;
    for (let i = 0; i < n; i++) {
      this.bufA[this.pos] = a ? a[i] : 0;
      this.bufB[this.pos] = b ? b[i] : 0;
      if (++this.pos === this.bufA.length) this.flush();
    }
    return true;
  }
}
registerProcessor('fx-recorder', FxRecorder);
