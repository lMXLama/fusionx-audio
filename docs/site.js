// Fusion-X Audio – Website
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var REPO = 'lMXLama/fusionx-audio';

  // ================================================================ Sprache
  var EN = {
    'skip': 'Skip to content', 'nav.features': 'Features', 'nav.demo': 'Try it', 'nav.gallery': 'Screenshots', 'nav.faq': 'FAQ', 'nav.contact': 'Contact', 'nav.download': 'Download',
    'hero.title': 'Your sound.<br>Fully in control.',
    'hero.lead': 'Fusion-X Audio controls every app on its own, makes your voice clear and noise-free and gives your stream its own mix. Free for Windows, with or without an audio interface.',
    'cta.win': 'Download for Windows', 'cta.look': 'See what it looks like',
    'fact.free': 'Free, no subscription', 'fact.win': 'Windows 10 and 11', 'fact.lang': 'English and German', 'fact.upd': 'Updates itself',
    'alt.hero': 'Fusion-X mixer with stream mix: two faders per app, left for you, right for the stream',
    'works.t': 'Works with what you already have', 'works.hs': 'any headset', 'works.lap': 'laptop mics',
    'tour.t': 'Everything an interface app does. For any PC.', 'tour.p': 'Manufacturer apps only control their own device. Fusion-X controls all of your PC audio, whatever mic or headset you have.',
    't1.k': 'Mixer', 't1.t': 'Every app gets its own fader', 't1.p': 'Game quieter, Discord louder, Spotify on the speakers: every app gets a fader, a live meter and its own output device. Windows likes to forget volumes, Fusion-X remembers them.',
    't2.k': 'Voice', 't2.t': 'Your voice, studio quality', 't2.p': 'AI noise suppression filters out keyboard, fans and barking dogs. Noise gate, EQ, compressor and de-esser come ready to go. One preset like “Broadcast” or “Gaming” is all it takes.',
    't3.k': 'Mic Check', 't3.t': 'Set up right in 10 seconds', 't3.p': 'Stay quiet for a moment, then talk. Fusion-X measures your room and voice and sets volume, noise filter and the right interface input by itself. If your mic is only on input 1, people still hear you on both sides.',
    't4.k': 'Stream Mix', 't4.t': 'One mix for you, one for your stream', 't4.p': 'Two faders per app: left is what you hear, right is what your audience hears. Fusion-X controls OBS directly, no extra driver. Music only for the stream, Discord only for you: one click.',
    't5.k': 'Equalizer', 't5.t': 'Better sound for everything you hear', 't5.p': 'Ten bands for your whole PC, with presets like “Hear footsteps”, “Bass boost” or “Clear voices”. No added delay, and you can save it in profiles: footsteps while gaming, music afterwards.',
    't6.k': 'Soundboard', 't6.t': 'Sounds for voice chat and stream', 't6.p': 'Drop a sound in, assign a key, play it. You hear it, your Discord and your stream do too, each at its own volume.',
    't7.k': 'Stream Deck', 't7.t': 'Made for Stream Deck', 't7.p': 'Its own plugin with nine actions and live keys: red when you’re muted, volume as a bar. On Stream Deck+ you control any app with a dial.',
    'demo.t': 'Try it right here', 'demo.p': 'Drag the faders. Hold the talk button and watch game and music get quieter automatically while Discord stays loud.',
    'demo.stream': 'Stream mix', 'demo.duck': 'Lower while talking', 'demo.talk': 'Hold to talk', 'demo.hint': 'The space bar works too.',
    'wipe.t': 'Noise suppression: before and after', 'wipe.p': 'Your voice with keyboard and fan noise in the background. Move the slider to see the difference.', 'wipe.before': 'Without Fusion-X', 'wipe.after': 'With AI Studio', 'wipe.noise': 'Keyboard, fan, room', 'wipe.voice': 'Your voice', 'wipe.note': 'Runs locally on your PC. Nothing is uploaded, nothing needs the internet.',
    'more.t': 'The little things that usually annoy you are solved',
    'm1.t': 'Push to talk for every app', 'm1.p': 'Push-to-talk for every game and chat at once, including your mouse side buttons.',
    'm2.t': 'Muted reminder', 'm2.p': 'Talking while your mic is off? Fusion-X tells you before you talk into the void for five minutes.',
    'm3.t': 'Overlay on top of your game', 'm3.p': 'Mute, profile changes or volume show up briefly as a small overlay, right in your game.',
    'm4.t': 'Favorite devices', 'm4.p': 'Windows jumps to the wrong device after an update? Fusion-X brings your headset back automatically.',
    'm5.t': 'Profiles that switch by themselves', 'm5.p': 'Game starts: Gaming. OBS starts: Streaming. Teams starts: Meeting. With voice, volumes and equalizer.',
    'm6.t': 'Quieter while you talk', 'm6.p': 'Game and music go down as soon as you talk and come back smoothly.',
    'm7.t': 'Virtual mic in one minute', 'm7.p': 'So Discord and OBS hear your processed voice, Fusion-X installs the virtual mic you need.',
    'm8.t': 'Updates by themselves', 'm8.p': 'Fusion-X downloads new versions in the background and installs them when you quit.',
    'split.t': 'With or without an audio interface',
    's1.t': 'You have an audio interface?', 's1.p': 'Fusion-X recognizes devices from Focusrite, Universal Audio, Behringer, PreSonus, Steinberg, Audient, MOTU, RME, Native Instruments, GoXLR and many more. Gain, 48 V and Direct Monitor stay on the device, you control sound, effects and app volumes here. ASIO drivers are detected, and the app warns about mismatched sample rates before anything crackles.',
    's2.t': 'Just a headset or a laptop?', 's2.p': 'That’s exactly what Fusion-X is made for. Headset, USB mic, webcam, laptop mic or Bluetooth: the app recognizes what you have, gives fitting tips and raises a Windows level that’s too low by itself. The AI gets a clear voice out of any mic.',
    'gal.t': 'What Fusion-X looks like', 'gal.p': 'Click an image to see it large.',
    'g.sm': 'Mixer with stream mix', 'g.mic': 'Voice and effects', 'g.eq': 'Equalizer for your whole PC', 'g.sb': 'Soundboard', 'g.ptt': 'Push to talk', 'g.dev': 'Devices and favorites', 'g.prof': 'Profiles', 'g.check': 'Mic Check', 'g.en': 'Also in English',
    'inst.t': 'Ready in three minutes', 'i1.t': 'Download', 'i1.p': 'Get the installer for Windows. About 95 MB, free.', 'i2.t': 'Run the installer', 'i2.p': 'If Windows shows “Windows protected your PC”, click “More info” and then “Run anyway”.', 'i3.t': 'Follow the assistant', 'i3.p': 'Fusion-X detects your devices and sets up voice, volumes and the virtual mic in about a minute.',
    'dl.t': 'Fusion-X Audio for Windows', 'dl.latest': 'Latest version', 'dl.btn': 'Download for free', 'dl.small': 'Installer for Windows 10 and 11 (64-bit)', 'dl.all': 'All versions and changes on GitHub', 'dl.new': 'New in this version', 'dl.loading': 'Loading …', 'dl.req': 'You need',
    'r1': 'Windows 10 (version 1903 or later) or Windows 11, 64-bit', 'r2': 'For the stream mix: OBS Studio 28 or later', 'r3': 'For the equalizer: Equalizer APO (free, the app guides you)', 'r4': 'The Stream Deck plugin is included in the app',
    'faq.t': 'Frequently asked questions',
    'q1': 'Is Fusion-X really free?', 'a1': 'Yes. No subscription, no ads, no account. The source code is open on GitHub.',
    'q2': 'Windows warns me when installing. Is that dangerous?', 'a2': 'No. Windows warns about every program that doesn’t have an expensive digital signature yet. Click “More info” and then “Run anyway”. You can check what the app does in the open source code on GitHub.',
    'q3': 'Do I need an audio interface?', 'a3': 'No. Fusion-X works with any mic and headset, including your laptop’s built-in mic. With an interface you also get channel selection and interface tips.',
    'q4': 'Do Discord and OBS hear my processed voice?', 'a4': 'Yes. Fusion-X uses a virtual microphone for that (VB-CABLE by VB-Audio, donationware). The app downloads and installs it for you on first start. You don’t have to change anything in Discord or OBS.',
    'q5': 'How does the stream mix work?', 'a5': 'In OBS (version 28 or later) turn on the WebSocket server under Tools and paste the password into Fusion-X. Fusion-X creates its own audio source for each app in OBS and controls it with the right fader. OBS desktop audio is muted so nothing is doubled.',
    'q6': 'How do I get the equalizer?', 'a6': 'It uses the free Equalizer APO. On the “Equalizer” page in the app click “Download”, tick your headphones and speakers while installing, restart your PC. After that Fusion-X controls everything.',
    'q7': 'Is there Fusion-X for Mac or Linux?', 'a7': 'No, right now it’s Windows 10 and 11 only.',
    'q8': 'Something doesn’t work. What now?', 'a8': 'In the app go to Settings, click “Copy diagnostics” and send the text to maxilama67@gmail.com. Then I can see exactly what’s wrong.',
    'ct.t': 'Questions, problems or ideas?', 'ct.p': 'Write to me. Bug reports and wishes go straight into the next version.', 'ct.mail': 'Email for problems', 'ct.gh': 'Source code and versions',
    'f.by': 'by L_MX_', 'f.privacy': 'Privacy', 'f.rel': 'Versions', 'f.contact': 'Contact',
    'f.fine': '© 2026 L_MX_. Discord, OBS, Spotify, Stream Deck and all other names mentioned are trademarks of their respective owners. VB-CABLE is a product of VB-Audio, Equalizer APO is an open-source project by Jonas Thedering.',
    'ver': 'Version', 'free': 'Free', 'size': 'MB', 'released': 'Released'
  };
  var DE = {};
  var lang = 'de';
  function snapshotDe() {
    $$('[data-i18n]').forEach(function (el) { DE[el.dataset.i18n] = el.innerHTML; });
    $$('[data-i18n-alt]').forEach(function (el) { DE[el.dataset.i18nAlt] = el.alt; });
  }
  function t(k) { return lang === 'en' && EN[k] != null ? EN[k] : (DE[k] != null ? DE[k] : k); }
  function setLang(l) {
    lang = l === 'en' ? 'en' : 'de';
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) { var v = lang === 'en' ? EN[el.dataset.i18n] : DE[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
    $$('[data-i18n-alt]').forEach(function (el) { var v = lang === 'en' ? EN[el.dataset.i18nAlt] : DE[el.dataset.i18nAlt]; if (v != null) el.alt = v; });
    try { localStorage.setItem('fx.lang', lang); } catch (_) {}
    renderRelease();
    if (window.__chans) window.__chans();
  }
  snapshotDe();
  DE.ver = 'Version'; DE.free = 'Kostenlos'; DE.size = 'MB'; DE.released = 'Veröffentlicht am';
  var saved = null; try { saved = localStorage.getItem('fx.lang'); } catch (_) {}
  var initial = saved || (/^de\b/i.test(navigator.language || 'de') ? 'de' : 'en');
  $('#langBtn').addEventListener('click', function () { setLang(lang === 'de' ? 'en' : 'de'); });

  // ================================================================ Neueste Version von GitHub
  var REL = null, CHANGES = null;
  var apiFailed = false;
  function renderRelease() {
    var r = REL;
    // GitHub nicht erreichbar (z. B. Abfrage-Limit): neueste Version aus changelog.json zeigen
    if (!r && apiFailed && CHANGES) { var keys = Object.keys(CHANGES).sort(function (a, b) { return b.localeCompare(a, undefined, { numeric: true }); }); if (keys.length) r = { tag_name: 'v' + keys[0], assets: [] }; }
    var exe = r && (r.assets || []).filter(function (a) { return /\.exe$/i.test(a.name); })[0];
    $$('[data-dl]').forEach(function (a) { if (exe) a.href = exe.browser_download_url; });
    var verTxt = r ? t('ver') + ' ' + String(r.tag_name).replace(/^v/, '') : '';
    $$('[data-ver]').forEach(function (el) { el.textContent = r ? (verTxt + (exe ? ', ' + Math.round(exe.size / 1048576) + ' ' + t('size') : '')) : t('free'); });
    var v2 = $('[data-ver2]'); if (v2 && r) v2.textContent = verTxt;
    var sz = $('[data-size]'); if (sz) sz.textContent = exe ? Math.round(exe.size / 1048576) + ' ' + t('size') : '';
    var dt = $('[data-date]'); if (dt) dt.textContent = r && r.published_at ? t('released') + ' ' + new Date(r.published_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    var ch = $('#changes');
    if (ch) {
      var lines = r && r.body ? r.body.split(/\r?\n/).map(function (l) { return l.replace(/^\s*[-*]\s+/, '').replace(/\*\*/g, '').trim(); }).filter(function (l) { return l && !/^#/.test(l); }) : [];
      // Zweisprachige Notizen: Zeilen mit „EN:“ für Englisch, sonst Deutsch
      var de = lines.filter(function (l) { return !/^EN:/i.test(l); }), en = lines.filter(function (l) { return /^EN:/i.test(l); }).map(function (l) { return l.replace(/^EN:\s*/i, ''); });
      var use = lang === 'en' && en.length ? en : de;
      var cl = CHANGES && r && CHANGES[String(r.tag_name).replace(/^v/, '')];
      if (cl && cl[lang]) use = cl[lang];
      ch.innerHTML = '';
      (use.length ? use.slice(0, 8) : [r ? (lang === 'en' ? 'See GitHub for details.' : 'Details auf GitHub.') : t('dl.loading')]).forEach(function (l) { var li = document.createElement('li'); li.textContent = l; ch.appendChild(li); });
    }
  }
  fetch('changelog.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { CHANGES = j; renderRelease(); }).catch(function () {});
  fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && j.tag_name) { REL = j; renderRelease(); } else failRel(); })
    .catch(failRel);
  function failRel() { apiFailed = true; renderRelease(); }

  // ================================================================ Navigation
  var nav = $('.nav');
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); heroScroll(); };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ================================================================ Hero: das X aus Wellen (wie im Logo)
  var cv = $('#xwave'), cx = cv.getContext('2d');
  var mouse = { x: .5, y: .5, k: 0 }, start = performance.now(), running = true, W = 0, H = 0, dpr = 1;
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }
  size(); window.addEventListener('resize', size);
  function strand(a, b, amp, freq, phase, prog, col, width, alpha) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    cx.beginPath();
    var steps = 180, t0 = .5 - prog / 2, t1 = .5 + prog / 2;
    for (var i = 0; i <= steps; i++) {
      var t = t0 + (t1 - t0) * i / steps;
      var env = Math.pow(Math.sin(Math.PI * t), 1.6);
      var dmx = (a[0] + dx * t) / W - mouse.x, dmy = (a[1] + dy * t) / H - mouse.y;
      var near = Math.exp(-(dmx * dmx + dmy * dmy) * 18) * mouse.k;
      var o = amp * env * (1 + near * 1.6) * Math.sin(t * freq * Math.PI * 2 + phase) + amp * .35 * env * Math.sin(t * freq * 5.3 + phase * 1.7);
      var x = a[0] + dx * t + nx * o, y = a[1] + dy * t + ny * o;
      if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
    }
    cx.strokeStyle = col; cx.globalAlpha = alpha; cx.lineWidth = width; cx.stroke();
  }
  function drawX(now) {
    var e = (now - start) / 1000, prog = reduce ? 1 : clamp(e / 1.4, 0, 1), ease = 1 - Math.pow(1 - prog, 3);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    var g = cx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2ee6d6'); g.addColorStop(.55, '#2b8cff'); g.addColorStop(1, '#2ee6d6');
    var g2 = cx.createLinearGradient(W, 0, 0, H); g2.addColorStop(0, '#2b8cff'); g2.addColorStop(.5, '#2ee6d6'); g2.addColorStop(1, '#2b8cff');
    var m = Math.min(W, H) * .1, A = [W * .12, m], B = [W * .92, H - m], C = [W * .12, H - m], D = [W * .92, m];
    var ph = reduce ? 1 : e * 1.6, amp = Math.min(W, H) * .07;
    cx.shadowBlur = 18; cx.shadowColor = 'rgba(46,230,214,.7)';
    for (var k = 0; k < 6; k++) {
      var off = k * .55, w = k === 0 ? 3.2 : 1.4, al = k === 0 ? .95 : .38 - k * .04;
      strand(A, B, amp * (1 - k * .08), 3.2 + k * .35, ph + off, ease, g, w, al);
      strand(C, D, amp * (1 - k * .08), 3.6 + k * .3, -ph * 1.1 + off + 1.3, ease, g2, w, al);
    }
    cx.shadowBlur = 0; cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    // weiches Licht im Kreuzungspunkt
    var rg = cx.createRadialGradient(W * .52, H * .5, 0, W * .52, H * .5, Math.min(W, H) * .32);
    rg.addColorStop(0, 'rgba(46,230,214,' + (.22 * ease) + ')'); rg.addColorStop(1, 'rgba(46,230,214,0)');
    cx.fillStyle = rg; cx.fillRect(0, 0, W, H);
    mouse.k *= .96;
  }
  function loop(now) { if (running) drawX(now); if (!reduce) requestAnimationFrame(loop); }
  if (reduce) drawX(performance.now() + 5000); else requestAnimationFrame(loop);
  new IntersectionObserver(function (es) { running = es[0].isIntersecting; }).observe(cv);
  window.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width; mouse.y = (e.clientY - r.top) / r.height; mouse.k = Math.min(1, mouse.k + .08); }, { passive: true });

  // Screenshot im Hero: kippt mit der Maus und richtet sich beim Scrollen auf
  var hs = $('#heroShot'), hw = $('.win', hs), tilt = { x: 0, y: 0 };
  function heroScroll() {
    if (reduce || !hw) return;
    var r = hs.getBoundingClientRect(), vh = window.innerHeight;
    var p = clamp(1 - (r.top - vh * .15) / (vh * .75), 0, 1); // 0 = gekippt, 1 = gerade
    var base = window.innerWidth < 760 ? 8 : 16;
    hw.style.setProperty('--rx', (base * (1 - p) + tilt.y) + 'deg');
    hw.style.setProperty('--ry', tilt.x + 'deg');
    hw.style.setProperty('--sc', (.94 + .06 * p));
  }
  hs.addEventListener('pointermove', function (e) { var r = hs.getBoundingClientRect(); tilt.x = ((e.clientX - r.left) / r.width - .5) * 6; tilt.y = -((e.clientY - r.top) / r.height - .5) * 4; heroScroll(); });
  hs.addEventListener('pointerleave', function () { tilt.x = tilt.y = 0; heroScroll(); });
  heroScroll();

  // ================================================================ Tour: Bild wechselt mit dem Text
  var frames = $$('.frames img'), stageName = $('#stageName');
  var steps = $$('.step');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      steps.forEach(function (s) { s.classList.toggle('on', s === en.target); });
      var f = en.target.dataset.shot;
      frames.forEach(function (im) { im.classList.toggle('on', im.dataset.f === f); });
      if (stageName) stageName.textContent = en.target.querySelector('.tag').textContent;
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(function (s) { io.observe(s); });

  // ================================================================ Demo-Mixer
  var CH = [
    { k: 'game', n: 'VALORANT', l: 'V', c: '#ff4655', v: .7, s: .55, duck: true, base: .72 },
    { k: 'music', n: 'Spotify', l: 'S', c: '#1db954', v: .45, s: .8, duck: true, base: .6 },
    { k: 'chat', n: 'Discord', l: 'D', c: '#5865f2', v: .9, s: 0, duck: false, base: .5 },
    { k: 'voice', n: { de: 'Stimme', en: 'Voice' }, l: '', c: '#6c9bff', v: .75, s: .85, duck: false, base: 0, voice: true }
  ];
  var con = $('#console'), box = $('#chans'), talking = false, duckOn = true, demoVisible = false;
  function fader(cls, get, set, label) {
    var f = document.createElement('div');
    f.className = 'fader ' + cls; f.tabIndex = 0; f.setAttribute('role', 'slider'); f.setAttribute('aria-label', label); f.setAttribute('aria-valuemin', 0); f.setAttribute('aria-valuemax', 100);
    f.innerHTML = '<div class="fill"></div><div class="cap"></div>';
    var upd = function () { var v = get(); f.style.setProperty('--p', v); f.setAttribute('aria-valuenow', Math.round(v * 100)); };
    var pos = function (y) { var r = f.getBoundingClientRect(); return clamp(1 - (y - r.top - 10) / (r.height - 20), 0, 1); };
    f.addEventListener('pointerdown', function (e) { f.setPointerCapture(e.pointerId); e.preventDefault(); f.focus(); set(pos(e.clientY)); upd(); });
    f.addEventListener('pointermove', function (e) { if (f.hasPointerCapture(e.pointerId)) { set(pos(e.clientY)); upd(); } });
    f.addEventListener('keydown', function (e) { var d = { ArrowUp: .05, ArrowRight: .05, ArrowDown: -.05, ArrowLeft: -.05 }[e.key]; if (d) { e.preventDefault(); set(clamp(get() + d, 0, 1)); upd(); } });
    f.upd = upd; upd();
    return f;
  }
  function buildChans() {
    box.innerHTML = '';
    CH.forEach(function (ch) {
      var el = document.createElement('div'); el.className = 'chan'; ch.el = el;
      var name = typeof ch.n === 'object' ? ch.n[lang] : ch.n;
      el.innerHTML = '<div class="ico" style="background:' + ch.c + '">' + (ch.voice ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>' : ch.l) + '</div>' +
        '<div class="nm">' + name + '</div><div class="fz"></div><div class="val"><span class="m"></span><span class="s"></span></div>';
      var fz = $('.fz', el);
      ch.f1 = fader('', function () { return ch.v; }, function (v) { ch.v = v; vals(ch); }, name + (lang === 'en' ? ' volume for you' : ' Lautstärke für dich'));
      ch.meter = document.createElement('div'); ch.meter.className = 'meter'; ch.meter.innerHTML = '<i></i>';
      ch.f2 = fader('st', function () { return ch.s; }, function (v) { ch.s = v; vals(ch); }, name + (lang === 'en' ? ' volume in stream' : ' Lautstärke im Stream'));
      fz.appendChild(ch.f1); fz.appendChild(ch.meter); fz.appendChild(ch.f2);
      box.appendChild(el); vals(ch);
    });
  }
  function vals(ch) {
    $('.m', ch.el).innerHTML = '<small>' + (lang === 'en' ? 'Me' : 'Ich') + '</small>' + Math.round(ch.v * 100) + ' %';
    $('.s', ch.el).innerHTML = '<small>Stream</small>' + (ch.s > 0.005 ? Math.round(ch.s * 100) + ' %' : (lang === 'en' ? 'off' : 'aus'));
  }
  window.__chans = buildChans;
  buildChans();
  $('#dmStream').addEventListener('change', function (e) { con.classList.toggle('sm', e.target.checked); });
  $('#dmDuck').addEventListener('change', function (e) { duckOn = e.target.checked; });
  var talkBtn = $('#dmTalk');
  var setTalk = function (on) { talking = on; talkBtn.classList.toggle('on', on); };
  talkBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); talkBtn.setPointerCapture(e.pointerId); setTalk(true); });
  talkBtn.addEventListener('pointerup', function () { setTalk(false); });
  talkBtn.addEventListener('pointercancel', function () { setTalk(false); });
  talkBtn.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setTalk(true); } });
  talkBtn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') setTalk(false); });
  document.addEventListener('keydown', function (e) { if (e.code === 'Space' && demoVisible && !e.repeat && !/INPUT|TEXTAREA|BUTTON|SUMMARY|A/.test(document.activeElement.tagName) && !document.activeElement.classList.contains('fader')) { e.preventDefault(); setTalk(true); } });
  document.addEventListener('keyup', function (e) { if (e.code === 'Space' && talking && document.activeElement !== talkBtn) setTalk(false); });
  new IntersectionObserver(function (es) { demoVisible = es[0].isIntersecting; }, { threshold: .2 }).observe(con);
  // Pegel: einfache Ton-Simulation, läuft nur, solange der Mixer zu sehen ist
  var duckAmt = 0, tick = 0;
  function meters() {
    requestAnimationFrame(meters);
    if (!demoVisible) return;
    tick++;
    duckAmt += ((talking && duckOn ? 1 : 0) - duckAmt) * (talking ? .18 : .05);
    CH.forEach(function (ch, i) {
      var src;
      if (ch.voice) src = talking ? .55 + .35 * Math.abs(Math.sin(tick * .21) * Math.sin(tick * .053 + 1)) : .02 * Math.random();
      else src = ch.base * (.65 + .35 * Math.abs(Math.sin(tick * (.07 + i * .031)) + .3 * Math.sin(tick * .19 + i)) ) * (ch.k === 'chat' ? (Math.sin(tick * .017) > .2 ? 1 : .08) : 1);
      var g = ch.duck ? 1 - .6 * duckAmt : 1;
      var lvl = clamp(src * ch.v * g * (reduce ? 1 : (.85 + Math.random() * .15)), 0, 1);
      ch.lvl = (ch.lvl || 0) * .7 + lvl * .3;
      ch.meter.firstChild.style.height = (ch.lvl * 100) + '%';
      ch.el.classList.toggle('ducked', ch.duck && duckAmt > .3);
    });
  }
  requestAnimationFrame(meters);

  // ================================================================ Vorher/Nachher
  var wipe = $('#wipe'), wc = $('#wipeCv'), wx = wc.getContext('2d'), wpos = .5, handle = $('#wipeHandle');
  var NOISE = [], VOICE = [];
  (function gen() {
    var n = 600, seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < n; i++) {
      var t = i / n;
      var word = Math.max(0, Math.sin(t * 38) * Math.sin(t * 7.3 + 1) + .15) * (t > .06 && t < .94 ? 1 : 0);
      var v = word * (.55 + .45 * Math.sin(i * .9) * Math.sin(i * .37));
      var key = (rnd() < .04 ? .5 + rnd() * .4 : 0);
      VOICE.push(v); NOISE.push(.12 + rnd() * .14 + key);
    }
  })();
  function drawWipe() {
    var d = Math.min(2, window.devicePixelRatio || 1), w = wc.clientWidth, h = wc.clientHeight;
    wc.width = w * d; wc.height = h * d; wx.setTransform(d, 0, 0, d, 0, 0);
    wx.clearRect(0, 0, w, h);
    var mid = h / 2, cut = w * wpos, n = VOICE.length, bw = w / n;
    for (var i = 0; i < n; i++) {
      var x = i * bw, before = x < cut;
      var nz = before ? NOISE[i] : NOISE[i] * .04, vo = VOICE[i];
      var hn = Math.min(.95, nz) * (h * .42), hv = vo * (h * .42);
      if (before) { wx.fillStyle = 'rgba(255,138,90,.75)'; wx.fillRect(x, mid - hn, Math.max(1, bw - .3), hn * 2); }
      var g = wx.createLinearGradient(0, mid - hv, 0, mid + hv); g.addColorStop(0, '#2ee6d6'); g.addColorStop(.5, '#2b8cff'); g.addColorStop(1, '#2ee6d6');
      wx.fillStyle = g; wx.fillRect(x, mid - hv, Math.max(1, bw - .3), hv * 2);
    }
    wipe.style.setProperty('--x', (wpos * 100) + '%');
    handle.setAttribute('aria-valuenow', Math.round(wpos * 100));
  }
  var wpointer = function (e) { var r = wipe.getBoundingClientRect(); wpos = clamp((e.clientX - r.left) / r.width, 0, 1); drawWipe(); };
  handle.addEventListener('pointerdown', function (e) { handle.setPointerCapture(e.pointerId); e.preventDefault(); wpointer(e); });
  handle.addEventListener('pointermove', function (e) { if (handle.hasPointerCapture(e.pointerId)) wpointer(e); });
  wipe.addEventListener('click', function (e) { if (e.target === wc) wpointer(e); });
  handle.addEventListener('keydown', function (e) { var d = { ArrowLeft: -.05, ArrowRight: .05 }[e.key]; if (d) { e.preventDefault(); wpos = clamp(wpos + d, 0, 1); drawWipe(); } });
  drawWipe(); window.addEventListener('resize', drawWipe);

  // ================================================================ Großansicht
  var lb = $('#lightbox'), lbImg = $('#lbImg');
  $$('.shot').forEach(function (b) {
    b.addEventListener('click', function () { lbImg.src = b.dataset.full; lbImg.alt = $('img', b).alt; if (lb.showModal) lb.showModal(); else window.open(b.dataset.full); });
  });
  $('#lbClose').addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });

  setLang(initial);
  onScroll();
})();
