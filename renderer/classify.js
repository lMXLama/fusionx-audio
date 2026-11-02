// Erkennung von Gerätetypen (Audio-Interface, USB-Mikro, Headset, Bluetooth …)
// und saubere Namen für bekannte Apps.
(function (root) {
  'use strict';

  var INTERFACES = [
    [/fusion-?x/i, 'Fusion-X'],
    [/focusrite|scarlett|clarett|vocaster/i, 'Focusrite'],
    [/universal audio|\bvolt \d|apollo|\buad\b/i, 'Universal Audio'],
    [/behringer|\bumc ?\d|u-phoria|\bflow ?8\b|xenyx/i, 'Behringer'],
    [/presonus|audiobox|studio ?\d+c|revelator/i, 'PreSonus'],
    [/steinberg|\bur ?\d{2}|\bixo\b/i, 'Steinberg'],
    [/audient|\bid ?(4|14|22|44)\b|\bevo ?\d/i, 'Audient'],
    [/\bmotu\b/i, 'MOTU'],
    [/\brme\b|babyface|fireface|madiface/i, 'RME'],
    [/native instruments|komplete audio/i, 'Native Instruments'],
    [/m-audio|air ?192/i, 'M-Audio'],
    [/arturia|minifuse/i, 'Arturia'],
    [/\bssl ?(2|12)\b|solid state logic/i, 'Solid State Logic'],
    [/yamaha|\bag ?0\d\b|\bzg ?0\d\b/i, 'Yamaha'],
    [/r(o|ø)decaster|rode ?ai-1|streamer x|rode ?connect/i, 'RØDE'],
    [/go ?xlr|tc-helicon/i, 'TC-Helicon GoXLR'],
    [/podtrak|\bzoom (uac|l-|r16|h\d)/i, 'Zoom'],
    [/tascam|\bus-\d|ixr\b/i, 'Tascam'],
    [/antelope|apogee|mackie|onyx|ik multimedia|axe i\/o|lewitt connect/i, null],
    [/wave ?xlr/i, 'Elgato']
  ];
  var USB_MICS = /yeti|snowball|shure ?mv|\bmv ?7|nt-usb|podmic usb|quadcast|solocast|duocast|wave ?(:|neo)?\s?(1|3)\b|wave:?\d|seiren|fifine|samson|maono|at2020usb|neat |razer seiren|trust gxt|elgato wave/i;
  var HEADSETS = /arctis|hyperx cloud|blackshark|kraken|g ?pro x|g733|g435|corsair hs|virtuoso|void|astro a\d|headset|barracuda|nari|cloud (ii|iii|alpha)/i;
  var VIRTUAL = /vb-audio|\bcable (in|out)put|voicemeeter|nvidia broadcast|steam streaming|wave link|sonar|virtual|krisp|oculus virtual|elgato virtual|xsplit|nahimic mirroring/i;
  var HDMI = /nvidia high definition audio|hdmi|displayport|intel\(r\) display audio|amd high definition audio|\bhdr\b/i;
  var WEBCAM = /webcam|\bbrio\b|c9[0-9]{2}\b|c270|camera|kamera|facecam/i;
  var BT_HANDSFREE = /hands-?free|freisprech|headset-?gateway|\bag audio\b/i;

  function brandOf(text) {
    for (var i = 0; i < INTERFACES.length; i++) {
      var m = text.match(INTERFACES[i][0]);
      if (m) return INTERFACES[i][1] || titleCase(m[0]);
    }
    return null;
  }

  function titleCase(s) { return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }

  function classifyDevice(d, asioDrivers) {
    var text = [d.name, d.adapter, d.desc].join(' ');
    var en = String(d.enumerator || '').toUpperCase();
    var r = { kind: 'other', label: 'Audiogerät', brand: null, interface: false, virtual: false, bluetooth: false, handsFree: false };
    var brand = brandOf(text);
    if (VIRTUAL.test(text) || en === 'ROOT') {
      r.kind = 'virtual'; r.label = 'Virtuell'; r.virtual = true;
    } else if (en.indexOf('BTH') === 0 || /bluetooth/i.test(text)) {
      r.kind = 'bluetooth'; r.bluetooth = true;
      r.handsFree = BT_HANDSFREE.test(text) || d.flow === 'capture';
      r.label = d.flow === 'capture' ? 'Bluetooth-Mikro' : 'Bluetooth';
    } else if (brand) {
      r.kind = 'interface'; r.label = 'Audio-Interface'; r.brand = brand; r.interface = true;
    } else if (USB_MICS.test(text)) {
      r.kind = 'usbmic'; r.label = d.flow === 'capture' ? 'USB-Mikrofon' : 'USB-Mikrofon (Ausgang)';
    } else if (HEADSETS.test(text)) {
      r.kind = 'headset'; r.label = d.flow === 'capture' ? 'Headset-Mikro' : 'Headset';
    } else if (WEBCAM.test(text)) {
      r.kind = 'webcam'; r.label = 'Webcam';
    } else if (HDMI.test(text)) {
      r.kind = 'hdmi'; r.label = 'Monitor / TV';
    } else if (d.flow === 'capture' && /array|eingebaut|internal|integrated|integriert|digital mic/i.test(text)) {
      r.kind = 'builtin'; r.label = 'Eingebautes Mikro';
    } else if (en === 'HDAUDIO' || /realtek|conexant|high definition audio|intel.*sst|smart sound/i.test(text)) {
      r.kind = 'onboard'; r.label = d.flow === 'capture' ? 'Klinken-Mikro am PC' : 'Onboard';
    } else if (en === 'USB') {
      r.kind = 'usb'; r.label = 'USB-Audio';
    }
    // ASIO-Treiber eines Herstellers bestätigt ein Interface, auch wenn der Name neutral ist ("USB Audio CODEC")
    if (!r.interface && !r.virtual && en === 'USB' && asioDrivers && asioDrivers.length) {
      var hit = asioDrivers.map(brandOf).filter(Boolean)[0];
      if (hit && /usb audio|codec|line/i.test(text)) { r.kind = 'interface'; r.label = 'Audio-Interface'; r.brand = hit; r.interface = true; }
    }
    return r;
  }

  // Erkannte Interfaces samt Ein- und Ausgängen zusammenfassen
  function detectInterfaces(devices, asioDrivers) {
    var map = {};
    devices.forEach(function (d) {
      var c = d.cls || classifyDevice(d, asioDrivers);
      if (!c.interface) return;
      var key = (d.adapter || d.name).toLowerCase();
      if (!map[key]) map[key] = { name: d.adapter || d.name, brand: c.brand, inputs: [], outputs: [], asio: null };
      (d.flow === 'capture' ? map[key].inputs : map[key].outputs).push(d);
    });
    var list = Object.keys(map).map(function (k) { return map[k]; });
    list.forEach(function (it) {
      it.asio = (asioDrivers || []).filter(function (a) { return brandOf(a) === it.brand; })[0] || null;
    });
    return list;
  }

  var ASIO_GENERIC = /asio4all|realtek|fl studio|generic low latency|flexasio/i;

  // ------------------------------------------------------------------ Apps

  var APPS = [
    [/^discord(ptb|canary)?\.exe$/i, 'Discord', 'voice', '#5865f2'],
    [/^(ms-)?teams\.exe$/i, 'Microsoft Teams', 'voice', '#5b5fc7'],
    [/^zoom\.exe$/i, 'Zoom', 'voice', '#2d8cff'],
    [/^ts3client_win(32|64)\.exe$|^teamspeak\.exe$/i, 'TeamSpeak', 'voice', '#2580c3'],
    [/^skype\.exe$/i, 'Skype', 'voice', '#00aff0'],
    [/^whatsapp(\.root)?\.exe$/i, 'WhatsApp', 'voice', '#25d366'],
    [/^telegram\.exe$/i, 'Telegram', 'voice', '#27a7e7'],
    [/^slack\.exe$/i, 'Slack', 'voice', '#611f69'],
    [/^chrome\.exe$/i, 'Google Chrome', 'web', '#4285f4'],
    [/^msedge\.exe$/i, 'Microsoft Edge', 'web', '#0c8ae0'],
    [/^firefox\.exe$/i, 'Firefox', 'web', '#ff7139'],
    [/^opera(_gx)?\.exe$|^launcher\.exe$/i, 'Opera', 'web', '#ff1b2d'],
    [/^brave\.exe$/i, 'Brave', 'web', '#fb542b'],
    [/^vivaldi\.exe$/i, 'Vivaldi', 'web', '#ef3939'],
    [/^arc\.exe$/i, 'Arc', 'web', '#ff6b6b'],
    [/^spotify\.exe$/i, 'Spotify', 'music', '#1db954'],
    [/^applemusic\.exe$|^itunes\.exe$/i, 'Apple Music', 'music', '#fa2d48'],
    [/^tidal\.exe$/i, 'TIDAL', 'music', '#8a96a3'],
    [/^deezer\.exe$/i, 'Deezer', 'music', '#a238ff'],
    [/^amazon ?music\.exe$/i, 'Amazon Music', 'music', '#25d1da'],
    [/^vlc\.exe$/i, 'VLC', 'video', '#ff8800'],
    [/^(mpc-hc64|mpv|potplayermini64)\.exe$/i, 'Videoplayer', 'video', '#8a96a3'],
    [/^netflix\.exe$/i, 'Netflix', 'video', '#e50914'],
    [/^obs(32|64)?\.exe$/i, 'OBS Studio', 'stream', '#8a96a3'],
    [/^streamlabs ?(obs|desktop)?\.exe$/i, 'Streamlabs', 'stream', '#80f5d2'],
    [/^steam(webhelper)?\.exe$/i, 'Steam', 'launcher', '#66c0f4'],
    [/^epicgameslauncher\.exe$/i, 'Epic Games', 'launcher', '#c8c8c8'],
    [/^battle\.net\.exe$/i, 'Battle.net', 'launcher', '#148eff'],
    [/^riotclientux\.exe$|^riotclientservices\.exe$/i, 'Riot Client', 'launcher', '#eb0029'],
    [/^valorant(-win64-shipping)?\.exe$/i, 'VALORANT', 'game', '#ff4655'],
    [/^cs2\.exe$|^csgo\.exe$/i, 'Counter-Strike 2', 'game', '#f2a73b'],
    [/^fortniteclient-win64-shipping\.exe$/i, 'Fortnite', 'game', '#9d4dff'],
    [/^fivem(_b\d+)?(_gtaprocess)?\.exe$|^fivem\.exe$/i, 'FiveM', 'game', '#f40552'],
    [/^gta5(_enhanced)?\.exe$|^gtavlauncher\.exe$/i, 'GTA V', 'game', '#57a64a'],
    [/^r5apex(_dx12)?\.exe$/i, 'Apex Legends', 'game', '#da292a'],
    [/^league of legends\.exe$|^leagueclientux\.exe$/i, 'League of Legends', 'game', '#c89b3c'],
    [/^rocketleague\.exe$/i, 'Rocket League', 'game', '#1e90ff'],
    [/^overwatch\.exe$/i, 'Overwatch 2', 'game', '#f99e1a'],
    [/^cod(hq)?\.exe$|^modernwarfare\.exe$/i, 'Call of Duty', 'game', '#7ac943'],
    [/^minecraft(\.windows)?\.exe$/i, 'Minecraft', 'game', '#62b47a'],
    [/^rainbowsix(_vulkan)?\.exe$/i, 'Rainbow Six Siege', 'game', '#c8c8c8'],
    [/^eldenring\.exe$/i, 'Elden Ring', 'game', '#c9a96e'],
    [/^dota2\.exe$/i, 'Dota 2', 'game', '#d32a1e'],
    [/^pubg|^tslgame\.exe$/i, 'PUBG', 'game', '#f2a900'],
    [/^rust(client)?\.exe$/i, 'Rust', 'game', '#cd412b'],
    [/^eafc\d+\.exe$|^fc\d+\.exe$/i, 'EA SPORTS FC', 'game', '#2fd4a7'],
    [/^system$/i, 'Systemsounds', 'system', '#8a96a3']
  ];

  var CATEGORIES = {
    voice: 'Sprach-Chat', web: 'Browser', music: 'Musik', video: 'Video', stream: 'Streaming',
    launcher: 'Launcher', game: 'Spiel', system: 'Windows', other: 'App'
  };

  function appInfo(session) {
    var exe = String(session.exe || '');
    for (var i = 0; i < APPS.length; i++) {
      if (APPS[i][0].test(exe)) return { name: APPS[i][1], cat: APPS[i][2], color: APPS[i][3] };
    }
    // Java mit Minecraft im Pfad
    if (/^javaw?\.exe$/i.test(exe) && /minecraft|\.minecraft|lunar|badlion|prism|curseforge|modrinth/i.test(session.path || '')) {
      return { name: 'Minecraft (Java)', cat: 'game', color: '#62b47a' };
    }
    var name = String(session.name || exe.replace(/\.exe$/i, ''));
    // Typische Fehlbezeichnungen glätten ("Google Chat Download", "Chromium-Hilfsprozess" …)
    name = name.replace(/\s*(helper|hilfsprozess|launcher|client|shipping|win64|x64)\b/gi, '').replace(/\s{2,}/g, ' ').trim() || exe;
    var cat = /steamapps|epic games|riot games|ubisoft|ea games|games?\\/i.test(session.path || '') ? 'game' : 'other';
    return { name: name, cat: cat, color: colorFor(exe) };
  }

  function colorFor(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return 'hsl(' + (h % 360) + ' 55% 55%)';
  }

  var api = {
    classifyDevice: classifyDevice,
    detectInterfaces: detectInterfaces,
    brandOf: brandOf,
    appInfo: appInfo,
    CATEGORIES: CATEGORIES,
    ASIO_GENERIC: ASIO_GENERIC
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FxClassify = api;
})(this);
