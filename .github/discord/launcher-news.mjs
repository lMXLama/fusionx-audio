// Postet neue Versionen des Fusion-X Launchers in #launcher-changelog.
// Der Launcher liegt in einem eigenen Repo; dieses Skript schaut regelmäßig nach dem neuesten Release
// und postet es genau einmal (erkannt am Fußtext „Fusion-X Launcher · Version x.y.z“).
import { api, TOKEN, GUILD, summary } from './lib.mjs';

if (!TOKEN || !GUILD) { console.log('Kein Discord eingerichtet – überspringe.'); process.exit(0); }
const REPO = 'lMXLama/fusionx-launcher';
const SITE = 'https://lmxlama.github.io/fusionx-launcher/';
const ICON = 'https://raw.githubusercontent.com/' + REPO + '/main/renderer/brand/emblem.png';
const GH = process.env.GITHUB_API || 'https://api.github.com';

const rel = await fetch(GH + '/repos/' + REPO + '/releases/latest', { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'fusionx-launcher-news', ...(process.env.GITHUB_TOKEN ? { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : {}) } })
  .then((r) => (r.ok ? r.json() : null)).catch(() => null);
if (!rel || !rel.tag_name) { summary('Kein Launcher-Release gefunden.'); process.exit(0); }
const exe = (rel.assets || []).find((a) => /\.exe$/i.test(a.name));
if (!exe) { summary('Release ' + rel.tag_name + ' hat noch keine Installationsdatei – später erneut.'); process.exit(0); }
const version = String(rel.tag_name).replace(/^v/, '');
const key = 'Fusion-X Launcher · Version ' + version;

const channels = await api('GET', '/guilds/' + GUILD + '/channels');
const ch = channels.find((c) => c.name.includes('launcher-changelog') && (c.type === 0 || c.type === 5));
if (!ch) { summary('Kein #launcher-changelog gefunden (erst „Discord einrichten“ laufen lassen).'); process.exit(0); }
const me = await api('GET', '/users/@me');
const msgs = await api('GET', '/channels/' + ch.id + '/messages?limit=50', undefined, { quiet: true }) || [];
if (msgs.some((m) => m.author && m.author.id === me.id && (m.embeds || []).some((e) => e.footer && e.footer.text === key))) { console.log(key + ' ist schon gepostet.'); process.exit(0); }

// Nur den Abschnitt der neuesten Version aus den Release-Notizen nehmen
const body = String(rel.body || '');
const parts = body.split(/\r?\n(?=##\s)/);
const section = (parts.find((p) => p.includes(version)) || parts[0] || '').replace(/^##[^\n]*\n?/, '');
const lines = section.split(/\r?\n/).filter((l) => /^\s*[-*•]\s+/.test(l)).map((l) => '• ' + l.replace(/^\s*[-*•]\s+/, '').trim());
let text = lines.join('\n') || 'Verbesserungen und Fehlerbehebungen.';
if (text.length > 3400) text = text.slice(0, 3400).replace(/\n[^\n]*$/, '') + '\n• …';

const roles = await api('GET', '/guilds/' + GUILD + '/roles');
const ping = roles.find((r) => r.name === 'Launcher-Ping');
const msg = await api('POST', '/channels/' + ch.id + '/messages', {
  content: ping ? '<@&' + ping.id + '>' : undefined,
  allowed_mentions: { roles: ping ? [ping.id] : [] },
  embeds: [{
    color: 0x6ed25a, title: 'Fusion-X Launcher ' + version + ' ist da',
    author: { name: 'Fusion-X Launcher · Update', icon_url: ICON },
    url: rel.html_url,
    description: text + '\n\nDer Launcher lädt das Update automatisch und installiert es beim nächsten Beenden.',
    thumbnail: { url: ICON },
    footer: { text: key },
    timestamp: rel.published_at || new Date().toISOString()
  }],
  components: [{ type: 1, components: [
    { type: 2, style: 5, label: 'Herunterladen', url: SITE + '#download', emoji: { name: '⬇️' } },
    { type: 2, style: 5, label: 'Alle Änderungen', url: rel.html_url }
  ] }]
});
if (ch.type === 5) await api('POST', '/channels/' + ch.id + '/messages/' + msg.id + '/crosspost', undefined, { quiet: true });
summary('✅ ' + key + ' in #' + ch.name + ' gepostet.');
