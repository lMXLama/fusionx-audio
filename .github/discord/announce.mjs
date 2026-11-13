// Nach dem Release: Änderungen der neuen Version in #changelog posten (und als Ankündigung veröffentlichen).
import { readFileSync } from 'node:fs';
import { api, TOKEN, GUILD } from './lib.mjs';

if (!TOKEN || !GUILD) { console.log('Kein Discord eingerichtet – überspringe.'); process.exit(0); }
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
let cl = {}; try { cl = JSON.parse(readFileSync('docs/changelog.json', 'utf8')); } catch (_) {}
const entry = cl[version] || {};
const de = (entry.de || []).map((l) => '• ' + l).join('\n') || 'Verbesserungen und Fehlerbehebungen.';
const en = (entry.en || []).map((l) => '• ' + l).join('\n');
try {
  const channels = await api('GET', '/guilds/' + GUILD + '/channels');
  const isText = (c) => c.type === 0 || c.type === 5;
  const ch = channels.find((c) => c.name.includes('audio-changelog') && isText(c)) || channels.find((c) => c.name.includes('changelog') && !c.name.includes('launcher') && isText(c));
  const roles = await api('GET', '/guilds/' + GUILD + '/roles');
  const ping = roles.find((r) => r.name === 'Update-Ping');
  if (!ch) { console.log('Kein #changelog gefunden.'); process.exit(0); }
  const msg = await api('POST', '/channels/' + ch.id + '/messages', {
    content: ping ? '<@&' + ping.id + '>' : undefined,
    allowed_mentions: { roles: ping ? [ping.id] : [] },
    embeds: [{
    color: 0x2ee6d6, title: 'Fusion-X Audio ' + version + ' ist da',
    author: { name: 'Fusion-X Audio · Update', icon_url: 'https://raw.githubusercontent.com/lMXLama/fusionx-audio/main/renderer/brand/emblem.png' },
    url: 'https://github.com/lMXLama/fusionx-audio/releases/tag/v' + version,
    description: de + (en ? '\n\n**English**\n' + en : '') + '\n\nFusion-X lädt das Update automatisch und installiert es beim nächsten Beenden.',
    thumbnail: { url: 'https://raw.githubusercontent.com/lMXLama/fusionx-audio/main/renderer/brand/emblem.png' },
    footer: { text: 'Version ' + version },
    timestamp: new Date().toISOString()
  }],
    components: [{ type: 1, components: [
      { type: 2, style: 5, label: 'Herunterladen', url: 'https://github.com/lMXLama/fusionx-audio/releases/latest', emoji: { name: '⬇️' } },
      { type: 2, style: 5, label: 'Alle Änderungen', url: 'https://github.com/lMXLama/fusionx-audio/releases/tag/v' + version }
    ] }]
  });
  if (ch.type === 5) await api('POST', '/channels/' + ch.id + '/messages/' + msg.id + '/crosspost', undefined, { quiet: true });
  console.log('Changelog gepostet.');
} catch (e) { console.log('Discord-Post fehlgeschlagen: ' + e.message); }
