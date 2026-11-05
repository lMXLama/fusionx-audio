// Vorlagen für Ankündigungen im Fusion-X-Stil. Wird vom Bot (/ankündigung) und vom
// GitHub-Workflow „Ankündigung posten“ genutzt, damit beides exakt gleich aussieht.
export const RAW = 'https://raw.githubusercontent.com/lMXLama/fusionx-audio/main';
export const ICON = RAW + '/renderer/brand/emblem.png';
export const SITE = 'https://lmxlama.github.io/fusionx-audio/';
export const DOWNLOAD = 'https://github.com/lMXLama/fusionx-audio/releases/latest';
const banner = (n) => RAW + '/docs/discord/' + n + '.jpg';

export const TEMPLATES = {
  news: {
    name: 'Neuigkeit', emoji: '📢', color: 0x2ee6d6, banner: 'willkommen', ping: 'none',
    title: '', text: ''
  },
  update: {
    name: 'Update', emoji: '🆕', color: 0x2ee6d6, banner: 'updates', ping: 'update',
    title: 'Fusion-X Audio {version} ist da',
    text: '**Neu**\n• \n\n**Verbessert**\n• \n\nFusion-X lädt das Update automatisch und installiert es beim nächsten Beenden.',
    button: 'Herunterladen | ' + DOWNLOAD
  },
  notice: {
    name: 'Wichtiger Hinweis', emoji: '⚠️', color: 0xffb547, banner: 'support', ping: 'none',
    title: 'Wichtiger Hinweis',
    text: '**Was ist los?**\n\n\n**Was du tun kannst**\n\n\nFragen? Einfach einen Beitrag in #hilfe erstellen.'
  },
  event: {
    name: 'Event', emoji: '🎉', color: 0xb48cff, banner: 'willkommen', ping: 'none',
    title: '',
    text: '**Wann?**\n\n\n**Was erwartet dich?**\n\n\n**So machst du mit**\n'
  },
  feedback: {
    name: 'Feedback gesucht', emoji: '💬', color: 0x2b8cff, banner: 'faq', ping: 'none',
    title: 'Deine Meinung ist gefragt',
    text: '\n\nSchreib uns deine Meinung in #feature-wünsche. Jede Rückmeldung hilft, Fusion-X besser zu machen.'
  }
};

export const FOOTER_PREFIX = 'Fusion-X Audio · ';
export const templateFromFooter = (text) => Object.keys(TEMPLATES).find((k) => text === FOOTER_PREFIX + TEMPLATES[k].name);

// „Herunterladen | https://…“ → { label, url }
export function parseButton(s) {
  const m = String(s || '').match(/^\s*(.+?)\s*\|\s*(https?:\/\/\S+)\s*$/);
  return m ? { label: m[1].slice(0, 80), url: m[2] } : null;
}

// #hilfe, #bug-reports … in echte Kanal-Links umwandeln. channels: [{ id, name }]
export function linkChannels(text, channels) {
  const map = {};
  for (const c of channels || []) {
    const plain = String(c.name).split('┃').pop().toLowerCase();
    if (plain) map[plain] = c.id;
  }
  return String(text || '').replace(/(^|[\s(])#([a-z0-9äöüß-]+)/gi, (m, pre, n) => (map[n.toLowerCase()] ? pre + '<#' + map[n.toLowerCase()] + '>' : m));
}

// Baut die fertige Nachricht (Discord-API-Format, funktioniert mit discord.js und REST)
// d: { template, title, text, image, button, ping }   opts: { version, channels, pingRoleId }
export function buildAnnouncement(d, opts = {}) {
  const t = TEMPLATES[d.template] || TEMPLATES.news;
  const title = String(d.title || '').replace(/\{version\}/g, opts.version || '').trim();
  const text = linkChannels(String(d.text || '').replace(/\{version\}/g, opts.version || '').trim(), opts.channels);
  const content = {
    color: t.color,
    author: { name: 'Fusion-X Audio', icon_url: ICON, url: SITE },
    footer: { text: FOOTER_PREFIX + t.name, icon_url: ICON },
    timestamp: new Date().toISOString()
  };
  if (title) content.title = (t.emoji + '  ' + title).slice(0, 256);
  if (text) content.description = text.slice(0, 4000);
  if (!title && !text) content.description = '…';
  if (d.image && /^https?:\/\//.test(d.image.trim())) content.image = { url: d.image.trim() };
  const embeds = [{ color: 0x0b1626, image: { url: banner(t.banner) } }, content];

  const btn = parseButton(d.button);
  const components = btn ? [{ type: 1, components: [{ type: 2, style: 5, label: btn.label, url: btn.url }] }] : [];

  const ping = d.ping || t.ping;
  let mention = '', allowed = { parse: [] };
  if (ping === 'update' && opts.pingRoleId) { mention = '<@&' + opts.pingRoleId + '>'; allowed = { roles: [opts.pingRoleId] }; }
  if (ping === 'everyone') { mention = '@everyone'; allowed = { parse: ['everyone'] }; }
  return { content: mention || undefined, allowed_mentions: allowed, embeds, components };
}
