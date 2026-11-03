// Baut den Fusion-X-Discord-Server auf. Kann beliebig oft laufen: Vorhandenes wird gefunden und
// aktualisiert, Fehlendes angelegt. Nichts wird gelöscht.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { api, P, bits, TOKEN, GUILD, summary } from './lib.mjs';

if (!TOKEN || !GUILD) { console.error('DISCORD_BOT_TOKEN oder DISCORD_GUILD_ID fehlt (GitHub → Settings → Secrets → Actions).'); process.exit(1); }

const RAW = 'https://raw.githubusercontent.com/lMXLama/fusionx-audio/main';
const SITE = 'https://lmxlama.github.io/fusionx-audio/';
const DOWNLOAD = 'https://github.com/lMXLama/fusionx-audio/releases/latest';
const TEAL = 0x2ee6d6, BLUE = 0x2b8cff, VIOLET = 0xb48cff;

const me = await api('GET', '/users/@me');
const guild = await api('GET', '/guilds/' + GUILD);
summary('## Fusion-X Discord-Aufbau');
summary('Bot: **' + me.username + '** · Server: **' + guild.name + '**');

// ---------------------------------------------------------------- Server-Grundeinstellungen
const icon = 'data:image/png;base64,' + readFileSync('renderer/brand/emblem.png').toString('base64');
await api('PATCH', '/guilds/' + GUILD, {
  name: 'Fusion-X Audio', icon,
  verification_level: Math.max(1, guild.verification_level), explicit_content_filter: 2,
  default_message_notifications: 1, preferred_locale: 'de'
}, { reason: 'Fusion-X Einrichtung' });
summary('- Servername, Logo und Sicherheit eingestellt');

// ---------------------------------------------------------------- Rollen
let roles = await api('GET', '/guilds/' + GUILD + '/roles');
const everyone = roles.find((r) => r.id === GUILD);
async function role(name, color, perms, hoist) {
  let r = roles.find((x) => x.name === name);
  const body = { name, color, permissions: perms, hoist, mentionable: false };
  if (r) r = await api('PATCH', '/guilds/' + GUILD + '/roles/' + r.id, body);
  else { r = await api('POST', '/guilds/' + GUILD + '/roles', body); roles.push(r); }
  return r;
}
const R = {
  dev: await role('Entwickler', TEAL, bits(P.ADMINISTRATOR), true),
  mod: await role('Moderator', BLUE, bits(P.KICK, P.BAN, P.MANAGE_MESSAGES, P.MANAGE_THREADS, P.MODERATE, P.VIEW, P.SEND, P.EMBED, P.ATTACH, P.HISTORY, P.ADD_REACTIONS, P.CONNECT, P.SPEAK, P.SEND_IN_THREADS, P.CREATE_PUBLIC_THREADS), true),
  tester: await role('Tester', VIOLET, bits(P.VIEW, P.SEND, P.EMBED, P.ATTACH, P.HISTORY, P.ADD_REACTIONS, P.CONNECT, P.SPEAK, P.SEND_IN_THREADS, P.CREATE_PUBLIC_THREADS, P.SLASH), true),
  member: await role('Mitglied', 0x8fb2ff, bits(P.VIEW, P.SEND, P.EMBED, P.ATTACH, P.HISTORY, P.ADD_REACTIONS, P.CONNECT, P.SPEAK, P.SEND_IN_THREADS, P.CREATE_PUBLIC_THREADS, P.SLASH), false)
};
// Reihenfolge: Entwickler oben, dann Moderator, Tester, Mitglied (unter der Bot-Rolle)
try {
  const botRole = roles.find((r) => r.tags && r.tags.bot_id === me.id);
  const top = botRole ? botRole.position - 1 : roles.length - 1;
  await api('PATCH', '/guilds/' + GUILD + '/roles', [
    { id: R.dev.id, position: Math.max(1, top) }, { id: R.mod.id, position: Math.max(1, top - 1) },
    { id: R.tester.id, position: Math.max(1, top - 2) }, { id: R.member.id, position: Math.max(1, top - 3) }
  ]);
} catch (e) { console.log('Rollen-Reihenfolge übersprungen: ' + e.message); }
try { await api('PUT', '/guilds/' + GUILD + '/members/' + guild.owner_id + '/roles/' + R.dev.id); } catch (e) { console.log('Entwickler-Rolle für Besitzer: ' + e.message); }
summary('- Rollen: Entwickler, Moderator, Tester, Mitglied');

// ---------------------------------------------------------------- Kanäle
let channels = await api('GET', '/guilds/' + GUILD + '/channels');
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9äöüß-]/g, '');
const READ_ONLY = [{ id: GUILD, type: 0, allow: bits(P.VIEW, P.HISTORY, P.ADD_REACTIONS), deny: bits(P.SEND, P.CREATE_PUBLIC_THREADS, P.SEND_IN_THREADS) }, { id: me.id, type: 1, allow: bits(P.VIEW, P.SEND, P.EMBED, P.ATTACH, P.MANAGE_MESSAGES), deny: '0' }];
const TEAM_ONLY = [{ id: GUILD, type: 0, allow: '0', deny: bits(P.VIEW) }, { id: R.dev.id, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY), deny: '0' }, { id: R.mod.id, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY), deny: '0' }, { id: me.id, type: 1, allow: bits(P.VIEW, P.SEND, P.EMBED), deny: '0' }];
async function channel(spec) {
  let c = channels.find((x) => x.type === spec.type && norm(x.name) === norm(spec.name) && (spec.type === 4 || !spec.parent || x.parent_id === spec.parent || !x.parent_id));
  const body = { name: spec.name, type: spec.type };
  if (spec.parent) body.parent_id = spec.parent;
  if (spec.topic != null) body.topic = spec.topic;
  if (spec.overwrites) body.permission_overwrites = spec.overwrites;
  if (spec.tags) body.available_tags = spec.tags;
  if (spec.type === 15) { body.default_sort_order = 0; body.default_forum_layout = 1; body.default_reaction_emoji = { emoji_name: '👍' }; }
  if (spec.position != null) body.position = spec.position;
  if (c) {
    const upd = { ...body }; delete upd.type;
    if (spec.tags && c.available_tags) upd.available_tags = spec.tags.map((t) => { const old = c.available_tags.find((o) => o.name === t.name); return old ? { ...t, id: old.id } : t; }).concat(c.available_tags.filter((o) => !spec.tags.some((t) => t.name === o.name)));
    c = await api('PATCH', '/channels/' + c.id, upd);
  } else {
    c = await api('POST', '/guilds/' + GUILD + '/channels', body);
    channels.push(c);
  }
  return c;
}

const catStart = await channel({ name: '📌 Start', type: 4, position: 0 });
const welcome = await channel({ name: 'willkommen', type: 0, parent: catStart.id, overwrites: READ_ONLY, topic: 'Alles Wichtige zu Fusion-X Audio auf einen Blick' });
const rules = await channel({ name: 'regeln', type: 0, parent: catStart.id, overwrites: READ_ONLY, topic: 'Bitte einmal lesen' });
const catTeam = await channel({ name: '🔒 Team', type: 4, overwrites: TEAM_ONLY });
const modlog = await channel({ name: 'mod-log', type: 0, parent: catTeam.id, overwrites: TEAM_ONLY, topic: 'Meldungen von Discord und AutoMod' });

// Community-Server einschalten (nötig für Foren, Ankündigungen, Willkommensbildschirm, AutoMod)
let community = (guild.features || []).includes('COMMUNITY');
if (!community) {
  try {
    await api('PATCH', '/guilds/' + GUILD, { features: [...new Set([...(guild.features || []), 'COMMUNITY'])], rules_channel_id: rules.id, public_updates_channel_id: modlog.id, verification_level: Math.max(1, guild.verification_level), explicit_content_filter: 2, preferred_locale: 'de' }, { reason: 'Community-Funktionen für Foren und Ankündigungen' });
    community = true;
    summary('- Community-Funktionen eingeschaltet');
  } catch (e) { summary('- ⚠️ Community-Funktionen nicht möglich: ' + e.message); }
}
const ANN = community ? 5 : 0, FORUM = community ? 15 : 0;

const announcements = await channel({ name: 'ankündigungen', type: ANN, parent: catStart.id, overwrites: READ_ONLY, topic: 'Neuigkeiten zu Fusion-X Audio' });
const changelog = await channel({ name: 'changelog', type: ANN, parent: catStart.id, overwrites: READ_ONLY, topic: 'Was ist neu in jeder Version – kommt automatisch bei jedem Update' });

const catSupport = await channel({ name: '🛠 Support', type: 4 });
const bugs = await channel({ name: 'bug-reports', type: FORUM, parent: catSupport.id, topic: 'Fehler gefunden? Ein Beitrag pro Problem: Was hast du gemacht, was ist passiert, welche Version? Am einfachsten direkt in der App unter Einstellungen → „Problem melden“.', tags: FORUM ? [{ name: 'Bug', emoji_name: '🐞' }, { name: 'Frage', emoji_name: '❓' }, { name: 'Idee', emoji_name: '💡' }, { name: 'In Arbeit', emoji_name: '🔧', moderated: true }, { name: 'Erledigt', emoji_name: '✅', moderated: true }] : undefined });
const help = await channel({ name: 'hilfe', type: FORUM, parent: catSupport.id, topic: 'Fragen zur Einrichtung: Mikrofon, virtuelles Mikro, Stream-Mix mit OBS, Equalizer, Stream Deck.', tags: FORUM ? [{ name: 'Einrichtung', emoji_name: '⚙️' }, { name: 'Mikrofon', emoji_name: '🎙️' }, { name: 'Stream-Mix', emoji_name: '📡' }, { name: 'Equalizer', emoji_name: '🎚️' }, { name: 'Stream Deck', emoji_name: '🎛️' }, { name: 'Gelöst', emoji_name: '✅' }] : undefined });
const ideas = await channel({ name: 'feature-wünsche', type: FORUM, parent: catSupport.id, topic: 'Was soll Fusion-X noch können? Ein Wunsch pro Beitrag. Mit 👍 stimmst du für Wünsche anderer ab.', tags: FORUM ? [{ name: 'Neu', emoji_name: '🆕' }, { name: 'Geplant', emoji_name: '🗓️', moderated: true }, { name: 'Umgesetzt', emoji_name: '✅', moderated: true }, { name: 'Abgelehnt', emoji_name: '⛔', moderated: true }] : undefined });

const catCom = await channel({ name: '💬 Community', type: 4 });
const general = await channel({ name: 'allgemein', type: 0, parent: catCom.id, topic: 'Quatschen über alles rund um Sound, Streaming und Gaming' });
await channel({ name: 'zeig-dein-setup', type: 0, parent: catCom.id, topic: 'Zeig dein Setup: Mikro, Interface, Headset, Stream Deck' });
await channel({ name: 'clips-und-sounds', type: 0, parent: catCom.id, topic: 'Clips, Soundboard-Sounds und Klang-Vorlagen teilen' });
await channel({ name: 'Lounge', type: 2, parent: catCom.id });
await channel({ name: 'Mikro-Test', type: 2, parent: catCom.id });

await channel({ name: 'team-chat', type: 0, parent: catTeam.id, overwrites: TEAM_ONLY, topic: 'Nur für Entwickler und Moderatoren' });
await channel({ name: 'tester', type: 0, parent: catTeam.id, overwrites: TEAM_ONLY.concat([{ id: R.tester.id, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY, P.ATTACH), deny: '0' }]), topic: 'Vorab-Versionen testen und Feedback geben' });
summary('- Kanäle: Start, Support' + (FORUM ? ' (Foren mit Tags)' : '') + ', Community, Team');

// ---------------------------------------------------------------- Nachrichten (werden beim nächsten Lauf aktualisiert statt doppelt gepostet)
async function botMessage(ch, payload, key) {
  const msgs = await api('GET', '/channels/' + ch.id + '/messages?limit=20', undefined, { quiet: true }) || [];
  const mine = msgs.find((m) => m.author && m.author.id === me.id && (m.embeds || []).some((e) => (e.footer || {}).text === key));
  if (mine) return api('PATCH', '/channels/' + ch.id + '/messages/' + mine.id, payload);
  return api('POST', '/channels/' + ch.id + '/messages', payload);
}
const footer = (key) => ({ text: key });
await botMessage(welcome, { embeds: [{
  color: TEAL, title: 'Willkommen bei Fusion-X Audio',
  description: 'Fusion-X regelt jede App auf deinem PC einzeln, macht deine Stimme mit KI klar und rauschfrei und gibt deinem Stream einen eigenen Mix. Kostenlos für Windows, mit oder ohne Audio-Interface.',
  thumbnail: { url: RAW + '/renderer/brand/emblem.png' },
  image: { url: RAW + '/docs/og.jpg' },
  fields: [
    { name: '⬇️ Download', value: '[Neueste Version für Windows](' + DOWNLOAD + ')\n[Website](' + SITE + ')', inline: true },
    { name: '🐞 Fehler gefunden?', value: 'In der App: Einstellungen → „Problem melden“\noder ein Beitrag in <#' + bugs.id + '>', inline: true },
    { name: '❓ Hilfe', value: 'Fragen zur Einrichtung in <#' + help.id + '>', inline: true },
    { name: '💡 Wünsche', value: 'Ideen in <#' + ideas.id + '>, mit 👍 abstimmen', inline: true },
    { name: '📰 Neuigkeiten', value: 'Updates in <#' + changelog.id + '> und <#' + announcements.id + '>', inline: true },
    { name: '📜 Regeln', value: 'Kurz lesen in <#' + rules.id + '>', inline: true }
  ],
  footer: footer('fusionx-welcome')
}] }, 'fusionx-welcome');
await botMessage(rules, { embeds: [{
  color: BLUE, title: 'Regeln',
  description: [
    '**1. Respekt.** Kein Beleidigen, kein Hass, keine Diskriminierung.',
    '**2. Kein Spam und keine Werbung** ohne Erlaubnis des Teams.',
    '**3. Richtiger Kanal.** Fehler in <#' + bugs.id + '>, Fragen in <#' + help.id + '>, Wünsche in <#' + ideas.id + '>.',
    '**4. Ein Problem pro Beitrag** mit Version und kurzer Beschreibung. Die Diagnose aus der App (Einstellungen → „Diagnose kopieren“) hilft sehr.',
    '**5. Keine illegalen Inhalte**, keine Cracks, keine NSFW-Inhalte.',
    '**6. Datenschutz.** Keine privaten Daten von dir oder anderen posten.',
    '**7. Discord-Regeln gelten:** discord.com/terms und discord.com/guidelines',
    '',
    'Das Team darf Beiträge entfernen und Mitglieder bei Verstößen stummschalten oder entfernen.'
  ].join('\n'),
  footer: footer('fusionx-rules')
}] }, 'fusionx-rules');
summary('- Willkommens- und Regel-Nachricht gepostet');

// ---------------------------------------------------------------- Webhook für „Problem melden“ aus der App
const hooks = await api('GET', '/channels/' + bugs.id + '/webhooks');
let hook = hooks.find((h) => h.name === 'Fusion-X Meldungen');
if (!hook) hook = await api('POST', '/channels/' + bugs.id + '/webhooks', { name: 'Fusion-X Meldungen', avatar: icon });
summary('- Webhook „Fusion-X Meldungen“ in #bug-reports bereit (wird beim nächsten App-Build eingebaut)');

// ---------------------------------------------------------------- Einladungslink (läuft nie ab)
const invites = await api('GET', '/guilds/' + GUILD + '/invites', undefined, { quiet: true }) || [];
let inv = invites.find((i) => i.max_age === 0 && i.channel && i.channel.id === welcome.id && i.inviter && i.inviter.id === me.id);
if (!inv) inv = await api('POST', '/channels/' + welcome.id + '/invites', { max_age: 0, max_uses: 0, unique: false });
const inviteUrl = 'https://discord.gg/' + inv.code;
mkdirSync('docs', { recursive: true });
writeFileSync('docs/community.json', JSON.stringify({ discord: inviteUrl }, null, 2) + '\n');
summary('- Einladungslink: ' + inviteUrl);

// ---------------------------------------------------------------- Willkommensbildschirm und AutoMod (nur Community-Server)
if (community) {
  try {
    await api('PATCH', '/guilds/' + GUILD + '/welcome-screen', { enabled: true, description: 'Die Community rund um Fusion-X Audio, die Sound-App für Windows.', welcome_channels: [
      { channel_id: welcome.id, description: 'Download und alles Wichtige', emoji_name: '👋' },
      { channel_id: bugs.id, description: 'Fehler melden', emoji_name: '🐞' },
      { channel_id: help.id, description: 'Hilfe bei der Einrichtung', emoji_name: '❓' },
      { channel_id: changelog.id, description: 'Was ist neu', emoji_name: '📰' },
      { channel_id: general.id, description: 'Quatschen', emoji_name: '💬' }
    ] });
    summary('- Willkommensbildschirm eingerichtet');
  } catch (e) { summary('- ⚠️ Willkommensbildschirm: ' + e.message); }
  try {
    const rulesAm = await api('GET', '/guilds/' + GUILD + '/auto-moderation/rules');
    const ensure = async (name, trigger_type, trigger_metadata) => {
      if (rulesAm.some((r) => r.name === name)) return;
      await api('POST', '/guilds/' + GUILD + '/auto-moderation/rules', { name, event_type: 1, trigger_type, trigger_metadata, enabled: true,
        actions: [{ type: 1, metadata: { custom_message: 'Diese Nachricht wurde automatisch blockiert.' } }, { type: 2, metadata: { channel_id: modlog.id } }],
        exempt_roles: [R.dev.id, R.mod.id] });
    };
    await ensure('Fusion-X: Spam', 3, {});
    await ensure('Fusion-X: Massen-Erwähnungen', 5, { mention_total_limit: 5, mention_raid_protection_enabled: true });
    await ensure('Fusion-X: Einladungen anderer Server', 1, { keyword_filter: ['discord.gg/*', 'discord.com/invite/*', 'discordapp.com/invite/*'], allow_list: ['discord.gg/' + inv.code, 'discord.com/invite/' + inv.code] });
    summary('- AutoMod gegen Spam, Massen-Erwähnungen und fremde Einladungen');
  } catch (e) { summary('- ⚠️ AutoMod: ' + e.message); }
}

// ---------------------------------------------------------------- Erste Ankündigung
try {
  const cl = JSON.parse(readFileSync('docs/changelog.json', 'utf8'));
  const latest = Object.keys(cl).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
  await botMessage(announcements, { embeds: [{
    color: TEAL, title: 'Der Fusion-X-Discord ist offen!',
    description: 'Hier bekommst du Hilfe, meldest Fehler und siehst als Erstes, was neu ist. Aktuell ist **Version ' + latest + '**.\n\n[⬇️ Jetzt herunterladen](' + DOWNLOAD + ')',
    thumbnail: { url: RAW + '/renderer/brand/emblem.png' },
    footer: footer('fusionx-hello')
  }] }, 'fusionx-hello');
} catch (e) { console.log('Ankündigung: ' + e.message); }

summary('\n**Fertig.** Einladung: ' + inviteUrl);
