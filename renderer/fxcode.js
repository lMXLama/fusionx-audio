// Mikrofon-Einstellungen als Teil-Code („FX1-…“). Wird von der App und von der Website
// (docs/fxcode.js, identische Kopie) benutzt. Der Code enthält nur Klang-Einstellungen,
// jeder Wert wird beim Einlesen auf einen sicheren Bereich begrenzt.
(function (root) {
  var DENOISE = ['off', 'light', 'ai', 'studio'];
  var CATS = ['allgemein', 'gaming', 'streaming', 'podcast', 'musik'];
  // [Pfad, min, max, Schritt]  ·  'b' = an/aus  ·  ['e', Liste] = Auswahl
  var F = [
    ['hpf.on', 'b'], ['hpf.freq', 20, 400, 1], ['hpf.slope', 'e', [12, 24]],
    ['denoise', 'e', DENOISE],
    ['gate.on', 'b'], ['gate.open', -80, -20, 1], ['gate.close', -90, -20, 1], ['gate.holdMs', 0, 1000, 1], ['gate.attackMs', 0.5, 30, 0.5], ['gate.releaseMs', 10, 1000, 1], ['gate.floorDb', -80, 0, 1],
    ['eq.on', 'b'], ['eq.low.f', 30, 600, 1], ['eq.low.g', -12, 12, 0.5], ['eq.mid1.f', 80, 2500, 1], ['eq.mid1.g', -12, 12, 0.5], ['eq.mid1.q', 0.3, 6, 0.05],
    ['eq.mid2.f', 600, 9000, 1], ['eq.mid2.g', -12, 12, 0.5], ['eq.mid2.q', 0.3, 6, 0.05], ['eq.high.f', 2000, 18000, 1], ['eq.high.g', -12, 12, 0.5],
    ['comp.on', 'b'], ['comp.amount', 0, 100, 1], ['comp.thr', -60, 0, 0.5], ['comp.ratio', 1, 20, 0.1], ['comp.att', 0.5, 200, 0.5], ['comp.rel', 10, 2000, 1], ['comp.makeup', 0, 18, 0.5], ['comp.knee', 0, 40, 1],
    ['deess.on', 'b'], ['deess.amount', 0, 100, 1], ['deess.freq', 2000, 12000, 10],
    ['limiter.on', 'b'], ['limiter.ceiling', -12, 0, 0.5], ['limiter.release', 10, 1000, 1],
    ['outGainDb', -12, 12, 0.5], ['gainDb', -12, 30, 0.5]
  ];
  var LIMITS = { n: 32, a: 24, m: 40, d: 80 };

  function getP(o, p) { return p.split('.').reduce(function (x, k) { return x == null ? x : x[k]; }, o); }
  function setP(o, p, v) { var ks = p.split('.'), x = o; for (var i = 0; i < ks.length - 1; i++) { if (!x[ks[i]] || typeof x[ks[i]] !== 'object') x[ks[i]] = {}; x = x[ks[i]]; } x[ks[ks.length - 1]] = v; }
  function num(v, f) { v = +v; if (!isFinite(v)) v = f[1]; v = Math.min(f[2], Math.max(f[1], v)); var s = f[3]; return Math.round(Math.round(v / s) * s * 1000) / 1000; }
  function clean(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f<>`@]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }

  function pack(mic) {
    return F.map(function (f) {
      var v = getP(mic, f[0]);
      if (f[1] === 'b') return v ? 1 : 0;
      if (f[1] === 'e') { var i = f[2].indexOf(v); return i < 0 ? 0 : i; }
      return num(v == null ? f[1] : v, f);
    });
  }
  function unpack(arr) {
    var out = {};
    F.forEach(function (f, i) {
      var v = arr[i];
      if (f[1] === 'b') v = !!v;
      else if (f[1] === 'e') v = f[2][Math.min(f[2].length - 1, Math.max(0, v | 0))];
      else v = num(v, f);
      setP(out, f[0], v);
    });
    if (out.gate.close > out.gate.open) out.gate.close = out.gate.open - 1;
    out.limiter.on = true; // Schutz vor extrem lauten Einstellungen bleibt bei geteilten Settings immer an
    return out;
  }

  function b64u(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; var s = atob(str), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function stream(bytes, Ctor, fmt) { return new Response(new Blob([bytes]).stream().pipeThrough(new Ctor(fmt))).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }

  // meta: { name, author, mic, desc, cat }
  function encode(meta, mic) {
    var payload = { v: 1, n: clean(meta.name, LIMITS.n), a: clean(meta.author, LIMITS.a), m: clean(meta.mic, LIMITS.m), d: clean(meta.desc, LIMITS.d), c: Math.max(0, CATS.indexOf(meta.cat)), s: pack(mic) };
    var bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (typeof CompressionStream === 'undefined') return Promise.resolve('FX0-' + b64u(bytes));
    return stream(bytes, CompressionStream, 'deflate-raw').then(function (z) { return 'FX1-' + b64u(z); });
  }
  function extract(text) { var m = String(text || '').match(/FX[01]-[A-Za-z0-9_-]{16,}/); return m ? m[0] : null; }
  function decode(text) {
    var code = extract(text);
    if (!code) return Promise.reject(new Error('Kein gültiger Fusion-X-Code.'));
    var raw;
    try { raw = unb64u(code.slice(4)); } catch (_) { return Promise.reject(new Error('Der Code ist beschädigt.')); }
    var p = code[2] === '1' ? stream(raw, DecompressionStream, 'deflate-raw') : Promise.resolve(raw);
    return p.then(function (bytes) {
      var o = JSON.parse(new TextDecoder().decode(bytes));
      if (!o || o.v !== 1 || !Array.isArray(o.s) || o.s.length < F.length) throw new Error('Dieser Code ist von einer neueren Fusion-X-Version. Bitte aktualisiere die App.');
      return { code: code, meta: { name: clean(o.n, LIMITS.n) || 'Ohne Namen', author: clean(o.a, LIMITS.a), mic: clean(o.m, LIMITS.m), desc: clean(o.d, LIMITS.d), cat: CATS[o.c | 0] || 'allgemein' }, data: unpack(o.s) };
    }).catch(function (e) { throw e && /neueren/.test(e.message) ? e : new Error('Der Code ist beschädigt oder unvollständig.'); });
  }

  // Übernimmt die geteilten Werte. Lautstärke und Schwelle der Störgeräusch-Sperre bleiben die eigenen,
  // weil sie vom eigenen Mikrofon und Raum abhängen.
  function apply(mic, data, keepOwn) {
    var m = JSON.parse(JSON.stringify(mic)), d = JSON.parse(JSON.stringify(data));
    var own = { gainDb: m.gainDb, open: m.gate.open, close: m.gate.close };
    ['hpf', 'gate', 'eq', 'comp', 'deess', 'limiter'].forEach(function (k) {
      if (k === 'eq') { m.eq = m.eq || {}; m.eq.on = d.eq.on; ['low', 'mid1', 'mid2', 'high'].forEach(function (b) { m.eq[b] = Object.assign({}, m.eq[b], d.eq[b]); }); }
      else m[k] = Object.assign({}, m[k], d[k]);
    });
    m.denoise = d.denoise; m.outGainDb = d.outGainDb; m.gainDb = d.gainDb;
    if (keepOwn !== false) { m.gainDb = own.gainDb; m.gate.open = own.open; m.gate.close = own.close; }
    m.preset = null;
    return m;
  }

  function fmt(v, unit, sign) { var s = String(Math.round(v * 10) / 10).replace('.', ','); return (sign && v > 0 ? '+' : v < 0 ? '−' : '') + s.replace('-', '') + (unit ? ' ' + unit : ''); }
  function hz(f) { return f >= 1000 ? String(Math.round(f / 100) / 10).replace('.', ',') + ' kHz' : Math.round(f) + ' Hz'; }
  var DN = { off: 'Aus', light: 'Leicht', ai: 'KI', studio: 'KI Studio' };
  // Kurze Beschreibung für Discord und Website
  function summary(d) {
    return [
      ['Rauschunterdrückung', DN[d.denoise]],
      ['Trittschall-Filter', d.hpf.on ? hz(d.hpf.freq) + ' · ' + d.hpf.slope + ' dB' : 'Aus'],
      ['Klang', d.eq.on ? 'Bass ' + fmt(d.eq.low.g, 'dB', true) + ' · Wärme ' + fmt(d.eq.mid1.g, 'dB', true) + ' · Stimme ' + fmt(d.eq.mid2.g, 'dB', true) + ' · Glanz ' + fmt(d.eq.high.g, 'dB', true) : 'Aus'],
      ['Gleichmäßige Lautstärke', d.comp.on ? d.comp.amount + ' % · ' + fmt(d.comp.thr, 'dB') + ' · ' + String(d.comp.ratio).replace('.', ',') + ' : 1' : 'Aus'],
      ['Störgeräusch-Sperre', d.gate.on ? 'An' : 'Aus'],
      ['Zischlaute zähmen', d.deess.on ? d.deess.amount + ' %' : 'Aus']
    ];
  }

  root.FXCODE = { encode: encode, decode: decode, apply: apply, summary: summary, extract: extract, CATS: CATS, LIMITS: LIMITS };
})(typeof window !== 'undefined' ? window : globalThis);
