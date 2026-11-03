// Vor dem App-Build: Discord-Webhook für „Problem melden“ und Einladungslink in package.json eintragen.
// Ohne DISCORD_BOT_TOKEN passiert nichts (die App nutzt dann E-Mail).
import { readFileSync, writeFileSync } from 'node:fs';
import { api, TOKEN, GUILD } from './lib.mjs';

if (!TOKEN || !GUILD) { console.log('Kein Discord eingerichtet – überspringe.'); process.exit(0); }
try {
  const channels = await api('GET', '/guilds/' + GUILD + '/channels');
  const bugs = channels.find((c) => c.name === 'bug-reports');
  const welcome = channels.find((c) => c.name === 'willkommen');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  pkg.fusionx = pkg.fusionx || {};
  if (bugs) {
    const hooks = await api('GET', '/channels/' + bugs.id + '/webhooks');
    const h = hooks.find((x) => x.name === 'Fusion-X Meldungen' && x.token);
    if (h) { pkg.fusionx.reportWebhook = 'https://discord.com/api/webhooks/' + h.id + '/' + h.token; console.log('Webhook eingebaut.'); }
  }
  try { pkg.fusionx.discordInvite = JSON.parse(readFileSync('docs/community.json', 'utf8')).discord || pkg.fusionx.discordInvite; } catch (_) {}
  if (!pkg.fusionx.discordInvite && welcome) {
    const inv = await api('POST', '/channels/' + welcome.id + '/invites', { max_age: 0, max_uses: 0, unique: false });
    pkg.fusionx.discordInvite = 'https://discord.gg/' + inv.code;
  }
  writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  console.log('Einladung: ' + (pkg.fusionx.discordInvite || '-'));
} catch (e) { console.log('Discord nicht erreichbar, baue ohne: ' + e.message); }
