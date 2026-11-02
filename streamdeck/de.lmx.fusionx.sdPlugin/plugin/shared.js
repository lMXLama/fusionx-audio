// Gemeinsame Bausteine für Plugin und Einstellungsfenster: Symbole und Tastenbilder.
var FX_ICONS = {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"/>',
  micOff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7M3 3l18 18"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  speakerOff: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6"/>',
  duck: '<path d="M3 9.5v5h3.2l4.3 3.6V5.9L6.2 9.5H3z"/><path d="M17.5 5.5v10M14 12.5l3.5 3.5 3.5-3.5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7L19 15z"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z"/>',
  game: '<path d="M6.5 8.5h11a4.5 4.5 0 0 1 4.3 5.6l-.6 2.4a2.5 2.5 0 0 1-4.3 1L15 15.5H9L7.1 17.5a2.5 2.5 0 0 1-4.3-1l-.6-2.4a4.5 4.5 0 0 1 4.3-5.6z"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01"/>',
  stream: '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
  call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5z"/><path d="M8 9.5h8M8 12.5h5"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9l5 3-5 3V9z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12.5l9 5 9-5M3 17l9 5 9-5"/>',
  ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.6"/><path d="M10 9a2 2 0 0 1 4 0"/>',
  dial: '<circle cx="12" cy="12" r="8"/><path d="M12 7v4"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v4"/>'
};
var FX_CAT_ICON = { game: 'game', music: 'music', voice: 'chat', web: 'web', video: 'video', stream: 'stream', launcher: 'layers', other: 'speaker' };
var FX_CAT_NAME = { game: 'Spiele', music: 'Musik', voice: 'Voice-Chat', web: 'Browser', video: 'Videos', stream: 'Streaming', launcher: 'Launcher', other: 'Andere Apps' };

// Sprache: Fusion-X meldet sie mit (state.lang), sonst die Sprache der Stream-Deck-Software
var FX_LANG = 'de';
var FX_EN = {
  'Spiele': 'Games', 'Musik': 'Music', 'Voice-Chat': 'Voice chat', 'Videos': 'Videos', 'Andere Apps': 'Other apps', 'Launcher': 'Launchers',
  'Ausgabe': 'Output', 'Deine Stimme': 'Your voice', 'nicht gestartet': 'not running', 'Stumm': 'Muted', 'Mikro an': 'Mic on', 'Leiser: an': 'Ducking: on', 'Leiser: aus': 'Ducking: off',
  'Mithören': 'Monitor', 'an': 'on', 'aus': 'off', 'Profil': 'Profile', 'nächstes': 'next', 'Aus': 'Off', 'Leicht': 'Light', 'KI': 'AI', 'KI Studio': 'AI Studio', 'Rauschfilter': 'Noise filter',
  'wechseln': 'switch', 'Gerät fehlt': 'Device missing', 'Alle stoppen': 'Stop all', 'Sound fehlt': 'Sound missing', 'läuft …': 'playing …', 'Lautstärke': 'Volume', 'nicht aktiv': 'not active',
  'Musik & Filme': 'Music & movies', 'Natürlich': 'Natural', 'Klar & präsent': 'Clear & present', 'Podcast warm': 'Warm podcast', 'Funkgerät': 'Walkie-talkie', 'Stream': 'Stream',
  'Applaus': 'Applause', 'Trommelwirbel': 'Drum roll',
  // Einstellungsfenster
  'Fusion-X Einstellungen': 'Fusion-X settings', 'Verbinde mit Fusion-X …': 'Connecting to Fusion-X …', 'Verbunden mit Fusion-X': 'Connected to Fusion-X',
  'Fusion-X läuft nicht. Starte die App, die Taste verbindet sich dann von selbst.': 'Fusion-X isn’t running. Start the app and the key connects by itself.',
  'Ziel': 'Target', 'Allgemein': 'General', 'Gesamtlautstärke (Ausgabe)': 'Master volume (output)', 'Deine Stimme (Mikro-Lautstärke)': 'Your voice (mic volume)', 'Kategorien': 'Categories', 'Apps': 'Apps', '(alle Apps)': '(all apps)', '(gerade nicht offen)': '(not open right now)',
  'Mix': 'Mix', 'Was du hörst': 'What you hear', 'Stream-Mix (OBS)': 'Stream mix (OBS)', 'Taste': 'Key', 'Stumm an/aus': 'Mute on/off', 'Lauter': 'Louder', 'Leiser': 'Quieter', 'Schritt (Taste)': 'Step (key)', 'Schritt (Regler)': 'Step (dial)', 'pro Raster': 'per notch',
  'Auf dem Stream Deck+: drehen = Lautstärke, drücken oder antippen = stumm.': 'On Stream Deck+: turn = volume, press or tap = mute.', 'Nächstes Profil (durchschalten)': 'Next profile (cycle)', 'Vorlage': 'Preset', 'Stufe': 'Level', 'Durchschalten': 'Cycle',
  'Sound': 'Sound', 'Alle Sounds stoppen': 'Stop all sounds', 'Ein Druck spielt den Sound, ein zweiter stoppt ihn. Neue Sounds fügst du in Fusion-X auf der Seite „Soundboard“ hinzu.': 'One press plays the sound, a second stops it. Add new sounds in Fusion-X on the “Soundboard” page.',
  'Gerät': 'Device', 'Durchschalten (Kopfhörer ↔ Lautsprecher)': 'Cycle (headphones ↔ speakers)',
  'Ein Druck schaltet dein Mikrofon stumm oder wieder an. Die Taste wird rot, solange du stumm bist.': 'One press mutes or unmutes your microphone. The key turns red while you’re muted.',
  'Schaltet das automatische Leiserstellen anderer Apps beim Sprechen an oder aus.': 'Turns automatic lowering of other apps while you talk on or off.', 'Schaltet Mithören (dich selbst hören) an oder aus.': 'Turns monitoring (hearing yourself) on or off.',
  'Stream-Mix ist in Fusion-X aus. Schalte ihn im Mixer ein.': 'Stream mix is off in Fusion-X. Turn it on in the mixer.'
};
function fxT(s) {
  if (FX_LANG !== 'en' || s == null) return s;
  s = String(s);
  if (FX_EN[s]) return FX_EN[s];
  var m = s.match(/^([+−] )(.+)$/); if (m) return m[1] + fxT(m[2]);
  m = s.match(/^(.+) (\(alle Apps\)|\(gerade nicht offen\))$/); if (m) return fxT(m[1]) + ' ' + FX_EN[m[2]];
  m = s.match(/^(\d+) % pro Raster$/); if (m) return m[1] + ' % ' + FX_EN['pro Raster'];
  m = s.match(/^Verbunden mit Fusion-X (.*)$/); if (m) return FX_EN['Verbunden mit Fusion-X'] + ' ' + m[1];
  return s;
}
function fxSetLang(l) { if (l === 'en' || l === 'de') FX_LANG = l; }

function fxEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

// Tastenbild 144×144 als SVG
function fxKeySvg(o) {
  var c = o.color || '#2ee6d6';
  var hasBar = o.frac != null;
  var iconY = hasBar ? 14 : 24;
  var icon = o.image
    ? '<image href="' + o.image + '" x="44" y="' + iconY + '" width="56" height="56"/>'
    : o.letter
      ? '<rect x="44" y="' + iconY + '" width="56" height="56" rx="16" fill="' + c + '"/><text x="72" y="' + (iconY + 39) + '" text-anchor="middle" font-family="Segoe UI, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#0b0d10">' + fxEsc(o.letter) + '</text>'
      : '<g transform="translate(46 ' + (iconY + 2) + ') scale(2.15)" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (FX_ICONS[o.icon] || '') + '</g>';
  var label = String(fxT(o.label) || '');
  if (label.length > 15) label = label.slice(0, 14).trim() + '…';
  var size = label.length > 12 ? 15 : label.length > 9 ? 17 : 19;
  var bar = hasBar ? '<rect x="18" y="116" width="108" height="9" rx="4.5" fill="#262d36"/><rect x="18" y="116" width="' + Math.max(0, Math.round(108 * Math.min(1, o.frac))) + '" height="9" rx="4.5" fill="' + (o.muted ? '#5b6672' : c) + '"/>' : '';
  var sub = o.sub ? '<text x="72" y="' + (hasBar ? 106 : 124) + '" text-anchor="middle" font-family="Segoe UI, Helvetica, sans-serif" font-size="15" fill="#8d98a4">' + fxEsc(fxT(o.sub)) + '</text>' : '';
  var ring = o.active ? '<rect x="3" y="3" width="138" height="138" rx="18" fill="none" stroke="' + c + '" stroke-width="5"/>' : '';
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">' +
    '<rect width="144" height="144" rx="20" fill="' + (o.bg || '#12161b') + '"/>' + ring + icon +
    '<text x="72" y="' + (hasBar ? (o.sub ? 88 : 98) : (o.sub ? 104 : 112)) + '" text-anchor="middle" font-family="Segoe UI, Helvetica, sans-serif" font-size="' + size + '" font-weight="600" fill="#e8edf2">' + fxEsc(label) + '</text>' +
    sub + bar + '</svg>';
  return svg;
}
function fxSvgUrl(svg) { return 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg); }
if (typeof module !== 'undefined') module.exports = { fxT: fxT, fxSetLang: fxSetLang, FX_ICONS: FX_ICONS, FX_CAT_ICON: FX_CAT_ICON, FX_CAT_NAME: FX_CAT_NAME, fxKeySvg: fxKeySvg };
