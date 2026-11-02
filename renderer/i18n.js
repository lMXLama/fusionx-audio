// Fusion-X Audio – Sprachumschaltung (Deutsch / English)
// Die Oberfläche wird auf Deutsch gebaut. Ist Englisch aktiv, übersetzt dieses Modul jeden sichtbaren Text
// (Textknoten, title, aria-label, placeholder) sofort beim Einfügen. Zurück auf Deutsch stellt es die Originale her.
(function () {
  'use strict';
  var lang = 'de';
  var DICT = window.FX_EN || {};
  var KEYS = {
    'Strg': 'Ctrl', 'Strg links': 'Left Ctrl', 'Strg rechts': 'Right Ctrl', 'Umschalt': 'Shift', 'Umschalt links': 'Left Shift', 'Umschalt rechts': 'Right Shift',
    'Alt links': 'Left Alt', 'Alt Gr': 'Alt Gr', 'Leertaste': 'Space', 'Rücktaste': 'Backspace', 'Entf': 'Del', 'Einfg': 'Ins', 'Pos1': 'Home', 'Ende': 'End',
    'Bild hoch': 'Page Up', 'Bild runter': 'Page Down', 'Feststelltaste': 'Caps Lock', 'Rollen': 'Scroll Lock', 'Num-Taste': 'Num key', 'Zirkumflex (^)': 'Circumflex (^)',
    'Maustaste 4 (zurück)': 'Mouse button 4 (back)', 'Maustaste 5 (vor)': 'Mouse button 5 (forward)', 'Mittlere Maustaste': 'Middle mouse button'
  };
  // Muster für zusammengesetzte Texte. Die Funktion bekommt den Treffer und tr() für Teile.
  var P = [
    [/^(Ton|Mikrofon): „(.+)“ statt „(.+)“(\.?)$/, function (m) { return (m[1] === 'Ton' ? 'Sound' : 'Microphone') + ': “' + m[2] + '” instead of “' + m[3] + '”' + m[4]; }],
    [/^(\d+) Quellen? in der Szene „(.+)“$/, function (m) { return m[1] + (m[1] === '1' ? ' source' : ' sources') + ' in the scene “' + m[2] + '”'; }],
    [/^Vorverstärkung (.+) \(automatisch, damit nichts verzerrt\)$/, function (m) { return 'Preamp ' + m[1] + ' (automatic, so nothing distorts)'; }],
    [/^Grundrauschen (.+) – (.+)$/, function (m, t) { return 'Noise floor ' + m[1] + ' – ' + t(m[2]); }],
    [/^Störgeräusch-Sperre bei (.+)$/, function (m) { return 'Noise gate at ' + m[1]; }],
    [/^Fertig: Schwelle auf (.+) gesetzt \(Grundrauschen (.+)\)\.$/, function (m) { return 'Done: threshold set to ' + m[1] + ' (noise floor ' + m[2] + ').'; }],
    [/^Windows-Mikrofonpegel von (\d+) % auf 100 % erhöht$/, function (m) { return 'Raised the Windows mic level from ' + m[1] + ' % to 100 %'; }],
    [/^Besser: Gain am (.+)-Gerät aufdrehen, dann rauscht es weniger als bei digitaler Verstärkung\.$/, function (m) { return 'Better: turn up the gain on your ' + m[1] + ' device. That adds less noise than digital boost.'; }],
    [/^Dreh den Gain-Regler am (.+) etwas zurück\.$/, function (m, t) { return 'Turn the gain knob on your ' + t(m[1]) + ' down a little.'; }],
    [/^Mikro erkannt auf (.+)$/, function (m, t) { return 'Mic detected on ' + t(m[1]); }],
    [/^(.+) ist keine Audiodatei\.$/, function (m) { return m[1] + ' is not an audio file.'; }],
    [/^(.+) ist größer als 25 MB\.$/, function (m) { return m[1] + ' is larger than 25 MB.'; }],
    [/^(.+) lässt sich nicht abspielen\.$/, function (m) { return m[1] + ' can’t be played.'; }],
    [/^(\d+) Sounds hinzugefügt$/, function (m) { return m[1] + ' sounds added'; }],
    [/^Verzögerung ca\. (\d+) ms$/, function (m) { return 'Latency approx. ' + m[1] + ' ms'; }],
    [/^(.+) spielt jetzt über (.+)\. Manche Apps übernehmen das erst nach einem Neustart\.$/, function (m, t) { return m[1] + ' now plays through ' + t(m[2]) + '. Some apps only pick this up after a restart.'; }],
    [/^Fusion-X findet dein Mikrofon „(.+)“ nicht\. Ist es angeschlossen\? Wähle sonst unten ein anderes Mikrofon\.$/, function (m, t) { return 'Fusion-X can’t find your microphone “' + t(m[1]) + '”. Is it plugged in? Otherwise pick another microphone below.'; }],
    [/^(.+) zum Einschalten$/, function (m, t) { return t(m[1]) + ' to unmute'; }],
    [/^(.+) gedrückt$/, function (m, t) { return t(m[1]) + ' held'; }],
    [/^Profil „(.+)“ angelegt$/, function (m) { return 'Profile “' + m[1] + '” created'; }],
    [/^Profil „(.+)“$/, function (m, t) { return 'Profile “' + t(m[1]) + '”'; }],
    [/^„(.+)“ übernimmt jetzt deine aktuellen Einstellungen\.$/, function (m, t) { return '“' + t(m[1]) + '” now uses your current settings.'; }],
    [/^Vorlage „(.+)“ aktiv$/, function (m, t) { return 'Preset “' + t(m[1]) + '” active'; }],
    [/^Ton wieder über (.+)$/, function (m) { return 'Sound back on ' + m[1]; }],
    [/^Lade Version (.*) … (\d+) %$/, function (m) { return 'Downloading version ' + m[1] + ' … ' + m[2] + ' %'; }],
    [/^Version (.+) ist da\.$/, function (m) { return 'Version ' + m[1] + ' is available.'; }],
    [/^Version (.+) ist bereit\.$/, function (m) { return 'Version ' + m[1] + ' is ready.'; }],
    [/^Update auf Version (.+) ist bereit\. Es wird beim Beenden installiert\.$/, function (m) { return 'Update to version ' + m[1] + ' is ready. It installs when you quit.'; }],
    [/^Liebling (\d+)$/, function (m) { return 'Favorite ' + m[1]; }],
    [/^Farbe (#\w+)$/, function (m) { return 'Color ' + m[1]; }],
    [/^Ausgabegerät für (.+)$/, function (m) { return 'Output device for ' + m[1]; }],
    [/^Wo soll (.+) zu hören sein\?$/, function (m) { return 'Where should ' + m[1] + ' play?'; }],
    [/^(.+) für dich stumm$/, function (m) { return 'Mute ' + m[1] + ' for you'; }],
    [/^(.+) leiser beim Sprechen$/, function (m) { return 'Lower ' + m[1] + ' while you talk'; }],
    [/^(.+) im Stream$/, function (m, t) { return t(m[1]) + ' in stream'; }],
    [/^(.+) abspielen$/, function (m, t) { return 'Play ' + t(m[1]); }],
    [/^(.+) bearbeiten$/, function (m, t) { return 'Edit ' + t(m[1]); }],
    [/^(.+) Lautstärke$/, function (m) { return m[1] + ' volume'; }],
    [/^Lautstärke (.+)$/, function (m) { return 'Volume ' + m[1]; }],
    [/^(.+) stumm$/, function (m, t) { return 'Mute ' + t(m[1]); }],
    [/^(\d+) Bit$/, function (m) { return m[1] + '-bit'; }],
    [/^(\d+) Eingänge?$/, function (m) { return m[1] + (m[1] === '1' ? ' input' : ' inputs'); }],
    [/^(\d+) Ausgänge?$/, function (m) { return m[1] + (m[1] === '1' ? ' output' : ' outputs'); }],
    [/^· erkannt: (.+)$/, function (m, t) { return '· detected: ' + t(m[1]); }],
    [/^(.+) \((automatisch)\)$/, function (m, t) { return t(m[1]) + ' (automatic)'; }],
    // „Name 70 %“ (Kategorien in Profilen und Tasten)
    [/^(.+) (\d+) %$/, function (m, t) { return t(m[1]) + ' ' + m[2] + ' %'; }],
    // Tastenkombinationen „Strg + Alt + M“
    [/^(.+ \+ .+)$/, function (m) { return m[1].split(' + ').map(function (k) { return KEYS[k] || k; }).join(' + '); }]
  ];

  function exact(s) {
    if (Object.prototype.hasOwnProperty.call(DICT, s)) return DICT[s];
    if (Object.prototype.hasOwnProperty.call(KEYS, s)) return KEYS[s];
    return null;
  }
  function core(s, depth) {
    var e = exact(s);
    if (e != null) return e;
    if (depth > 3) return s;
    // Teile mit „ · “ einzeln übersetzen
    if (s.indexOf(' · ') > 0) return s.split(' · ').map(function (x) { return core(x, depth + 1); }).join(' · ');
    for (var i = 0; i < P.length; i++) {
      var m = s.match(P[i][0]);
      if (m) { var r = P[i][1](m, function (x) { return core(x, depth + 1); }); if (r != null) return r; }
    }
    // „Präfix: Rest“
    var c = s.indexOf(': ');
    if (c > 0) {
      var pre = exact(s.slice(0, c + 1));
      if (pre != null) return pre + ' ' + core(s.slice(c + 2), depth + 1);
    }
    // Satzweise
    var parts = s.split(/(?<=[.!?…])\s+(?=[A-ZÄÖÜ„])/);
    if (parts.length > 1) {
      var changed = false, out = parts.map(function (x) { var y = core(x, depth + 1); if (y !== x) changed = true; return y; });
      if (changed) return out.join(' ');
    }
    return s;
  }
  // Deutsche Dezimalkommas in Zahlen: 2,5 dB → 2.5 dB
  var nums = function (s) { return s.replace(/(\d),(\d)/g, '$1.$2'); };

  function tr(str) {
    if (lang !== 'en' || str == null) return str;
    var s = String(str);
    var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!m[2] || !/[A-Za-zÄÖÜäöüß]/.test(m[2])) return lang === 'en' ? nums(s) : s;
    var inner = m[2].replace(/\s+/g, ' ');
    return m[1] + nums(core(inner, 0)) + m[3];
  }

  // ---------------------------------------------------------------- DOM
  var ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  var busy = false;
  function doText(n) {
    var p = n.parentNode;
    if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || (p.closest && p.closest('[data-notr]'))) return;
    var v = n.nodeValue;
    if (n.__fxEn === v) return; // schon übersetzt
    var t = tr(v);
    if (t !== v) { n.__fxDe = v; n.__fxEn = t; n.nodeValue = t; }
  }
  function doEl(el) {
    if (el.closest && el.closest('[data-notr]')) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      if (el['__fxEn_' + a] === v) continue;
      var t = tr(v);
      if (t !== v) { el['__fxDe_' + a] = v; el['__fxEn_' + a] = t; el.setAttribute(a, t); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doEl(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }
  function restore(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (n.__fxDe != null && n.nodeValue === n.__fxEn) n.nodeValue = n.__fxDe; n.__fxDe = n.__fxEn = null; }
      else ATTRS.forEach(function (a) { if (n['__fxDe_' + a] != null && n.getAttribute(a) === n['__fxEn_' + a]) n.setAttribute(a, n['__fxDe_' + a]); n['__fxDe_' + a] = n['__fxEn_' + a] = null; });
    }
  }
  var mo = new MutationObserver(function (list) {
    if (lang !== 'en' || busy) return;
    busy = true;
    try {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doEl(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    } finally { busy = false; }
  });
  function start() {
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function resolve(pref) {
    if (pref === 'de' || pref === 'en') return pref;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'de';
    return /^de\b/i.test(nav) ? 'de' : 'en';
  }
  function set(pref) {
    var next = resolve(pref);
    if (next === lang) return lang;
    lang = next;
    document.documentElement.lang = lang;
    if (!document.body) return lang;
    busy = true;
    try { if (lang === 'en') walk(document.body); else restore(document.body); } finally { busy = false; }
    return lang;
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.FxI18n = { set: set, tr: tr, get lang() { return lang; }, resolve: resolve };
})();
