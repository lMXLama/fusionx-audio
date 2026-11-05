// Fusion-X Farb-Designs (Einstellungen → Design). Alle Designs behalten den dunklen Studio-Look
// und ändern nur die Akzentfarben. „Chrom-Chamäleon“ ist dem Inhaber vorbehalten.
(function () {
  var LIST = [
    { id: 'fusion', name: 'Fusion', desc: 'Das Original', accent: '#2ee6d6', accent2: '#2b8cff', voice: '#6c9bff', va: '#7aa7ff', vb: '#4a6dff', vh: '#9bb9ff', ink: '#02201e' },
    { id: 'ocean', name: 'Ozean', desc: 'Tiefes Blau', accent: '#4cc9ff', accent2: '#5b6cff', voice: '#a08cff', va: '#ad9cff', vb: '#7260ff', vh: '#c6bbff', ink: '#021826' },
    { id: 'aurora', name: 'Aurora', desc: 'Nordlicht-Grün', accent: '#4ef0a0', accent2: '#1fc8e3', voice: '#7cc4ff', va: '#8ccfff', vb: '#3a8dff', vh: '#b3e0ff', ink: '#022014' },
    { id: 'nebula', name: 'Nebula', desc: 'Violett und Pink', accent: '#b48cff', accent2: '#6a5cff', voice: '#ff7ac8', va: '#ff8fd2', vb: '#e0479c', vh: '#ffb8e2', ink: '#160628' },
    { id: 'sunset', name: 'Sunset', desc: 'Orange und Magenta', accent: '#ff8a4c', accent2: '#ff3d81', voice: '#ffc15e', va: '#ffcd73', vb: '#ff9a2e', vh: '#ffe0a6', ink: '#2a1002' },
    { id: 'sakura', name: 'Sakura', desc: 'Kirschblüten-Rosa', accent: '#ff7ac0', accent2: '#9b6bff', voice: '#8fb2ff', va: '#9bbaff', vb: '#5f7dff', vh: '#bdd0ff', ink: '#2a0718' },
    { id: 'frost', name: 'Frost', desc: 'Kühles Silber', accent: '#dbe7f3', accent2: '#8fa9c6', voice: '#a8c4ff', va: '#b4ccff', vb: '#7d9bea', vh: '#d0deff', ink: '#0b121b' },
    { id: 'chameleon', name: 'Chrom-Chamäleon', desc: 'Nur für den Inhaber', owner: true, accent: '#8ff3ff', accent2: '#c08bff', voice: '#ff9be8', va: '#ffaeea', vb: '#d77bff', vh: '#ffd1f3', ink: '#0f0820' }
  ];
  // Inhaber-Code: nur der Hash steht hier, der Code selbst nicht
  var OWNER = { salt: '2a83a43c5ca945c7', hash: '1c6446d8ca35cadb959c0e8349aa77a85135b85276ccb90b4c60a4201fc91e72', iter: 150000 };

  function rgb(hex) {
    var h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function get(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return null; }
  var current = LIST[0];
  function apply(id, allowOwner) {
    var t = get(id);
    if (!t || (t.owner && !allowOwner)) t = LIST[0];
    var r = document.documentElement.style;
    r.setProperty('--accent', t.accent); r.setProperty('--accent2', t.accent2); r.setProperty('--accent-ink', t.ink);
    r.setProperty('--amber', t.voice); r.setProperty('--voice-a', t.va); r.setProperty('--voice-b', t.vb); r.setProperty('--voice-hi', t.vh);
    r.setProperty('--acc-rgb', rgb(t.accent).join(', ')); r.setProperty('--acc2-rgb', rgb(t.accent2).join(', '));
    r.setProperty('--amb-rgb', rgb(t.voice).join(', ')); r.setProperty('--va-rgb', rgb(t.va).join(', '));
    r.setProperty('--vb-rgb', rgb(t.vb).join(', ')); r.setProperty('--vh-rgb', rgb(t.vh).join(', '));
    document.documentElement.setAttribute('data-theme', t.id);
    current = t;
    return t;
  }
  // Farbe für Zeichnungen (Canvas): c('accent') oder c('accent', .5)
  function c(key, alpha) {
    var hex = current[key] || current.accent;
    if (alpha == null) return hex;
    return 'rgba(' + rgb(hex).join(',') + ',' + alpha + ')';
  }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function fromHex(h) { var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  // Prüft den Inhaber-Code (PBKDF2, damit man ihn nicht durchprobieren kann)
  function checkOwner(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code || !window.crypto || !crypto.subtle) return Promise.resolve(false);
    return crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(OWNER.salt), iterations: OWNER.iter }, k, 256); })
      .then(function (bits) { return hex(bits) === OWNER.hash; })
      .catch(function () { return false; });
  }
  window.FX_THEMES = { list: LIST, get: get, apply: apply, color: c, current: function () { return current; }, checkOwner: checkOwner };
})();
