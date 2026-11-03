// Profil des Bots: „Über mich“, Tags, Profilbild und Banner.
import { readFileSync } from 'node:fs';
import { api, TOKEN, summary } from './lib.mjs';

if (!TOKEN) { console.log('Kein Bot-Token – überspringe Profil.'); process.exit(0); }
const DESCRIPTION = [
  'Der offizielle Bot von **Fusion-X Audio**, der kostenlosen Sound-Zentrale für Windows.',
  '',
  '🎧 Lautstärke pro App, KI-Rauschunterdrückung, Stream-Mix und Equalizer',
  '🐞 Meldungen aus der App landen direkt beim Entwickler',
  '🆕 Jede neue Version sofort im Changelog',
  '',
  '💬 Befehle: `/hilfe`',
  '⬇️ https://lmxlama.github.io/fusionx-audio/'
].join('\n');

try {
  await api('PATCH', '/applications/@me', { description: DESCRIPTION, tags: ['audio', 'support', 'streaming', 'windows', 'utility'] });
  summary('- Bot-Beschreibung („Über mich“) und Tags gesetzt');
} catch (e) { summary('- ⚠️ Bot-Beschreibung: ' + e.message); }

const me = await api('GET', '/users/@me');
const force = process.env.FORCE_PROFILE === '1';
const body = {};
if (!me.avatar || force) body.avatar = 'data:image/png;base64,' + readFileSync('renderer/brand/emblem.png').toString('base64');
if (!me.banner || force) body.banner = 'data:image/jpeg;base64,' + readFileSync('docs/discord/bot-banner.jpg').toString('base64');
if (Object.keys(body).length) {
  try { await api('PATCH', '/users/@me', body); summary('- Bot-Profilbild und Banner gesetzt'); }
  catch (e) { summary('- ⚠️ Profilbild/Banner: ' + e.message); }
} else summary('- Profilbild und Banner schon vorhanden');
