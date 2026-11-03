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
  const ch = channels.find((c) => c.name === 'changelog');
  if (!ch) { console.log('Kein #changelog gefunden.'); process.exit(0); }
  const msg = await api('POST', '/channels/' + ch.id + '/messages', { embeds: [{
    color: 0x2ee6d6, title: 'Fusion-X Audio ' + version + ' ist da',
    url: 'https://github.com/lMXLama/fusionx-audio/releases/tag/v' + version,
    description: de + (en ? '\n\n**English**\n' + en : '') + '\n\n[⬇️ Herunterladen](https://github.com/lMXLama/fusionx-audio/releases/latest) · Die App aktualisiert sich auch von selbst.',
    thumbnail: { url: 'https://raw.githubusercontent.com/lMXLama/fusionx-audio/main/renderer/brand/emblem.png' },
    timestamp: new Date().toISOString()
  }] });
  if (ch.type === 5) await api('POST', '/channels/' + ch.id + '/messages/' + msg.id + '/crosspost', undefined, { quiet: true });
  console.log('Changelog gepostet.');
} catch (e) { console.log('Discord-Post fehlgeschlagen: ' + e.message); }
