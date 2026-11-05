// Ankündigung über GitHub posten (Ausweich, wenn der Bot gerade nicht online ist). Gleiche Vorlagen wie /ankündigung.
import { readFileSync } from 'node:fs';
import { api, TOKEN, GUILD, summary } from './lib.mjs';
import { TEMPLATES, buildAnnouncement } from '../../discord-bot/templates.mjs';

if (!TOKEN || !GUILD) { summary('❌ DISCORD_BOT_TOKEN oder DISCORD_GUILD_ID fehlt.'); process.exit(1); }
const env = (k) => (process.env[k] || '').trim();
const key = Object.keys(TEMPLATES).find((k) => TEMPLATES[k].name === env('VORLAGE')) || 'news';
// Im GitHub-Formular gibt es nur einzeilige Felder: „//“ oder „\n“ wird zum Zeilenumbruch
const lines = (s) => s.replace(/\s*\/\/\s*/g, '\n').replace(/\\n/g, '\n');
const pingMap = { 'Niemand': 'none', 'Rolle Update-Ping': 'update', 'Alle (@everyone)': 'everyone' };

const channels = await api('GET', '/guilds/' + GUILD + '/channels');
const roles = await api('GET', '/guilds/' + GUILD + '/roles');
const target = channels.find((c) => c.name.includes(env('KANAL') || 'ankündigungen') && (c.type === 0 || c.type === 5));
if (!target) { summary('❌ Kanal „' + env('KANAL') + '“ nicht gefunden.'); process.exit(1); }
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const ping = roles.find((r) => r.name === 'Update-Ping');
const msg = buildAnnouncement({ template: key, title: env('TITEL'), text: lines(env('TEXT')), image: env('BILD'), button: env('BUTTON'), ping: pingMap[env('PING')] || 'none' },
  { version, channels, pingRoleId: ping && ping.id });
const posted = await api('POST', '/channels/' + target.id + '/messages', msg);
if (target.type === 5) await api('POST', '/channels/' + target.id + '/messages/' + posted.id + '/crosspost', undefined, { quiet: true });
// Optional: echte Discord-Umfrage direkt unter der Ankündigung
if (env('FRAGE') && env('ANTWORTEN')) {
  const answers = env('ANTWORTEN').split(/\s*\/\/\s*/).filter(Boolean).slice(0, 10).map((a) => {
    const m = a.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.+)$/u);
    return { poll_media: m ? { text: m[2].slice(0, 55), emoji: { name: m[1] } } : { text: a.slice(0, 55) } };
  });
  const days = Math.min(32, Math.max(1, parseInt(env('DAUER'), 10) || 7));
  await api('POST', '/channels/' + target.id + '/messages', { poll: { question: { text: env('FRAGE').slice(0, 300) }, answers, duration: days * 24, allow_multiselect: false, layout_type: 1 } });
  summary('📊 Umfrage mit ' + answers.length + ' Antworten, läuft ' + days + ' Tage');
}
summary('✅ Ankündigung gepostet in **#' + target.name + '**: https://discord.com/channels/' + GUILD + '/' + target.id + '/' + posted.id);
