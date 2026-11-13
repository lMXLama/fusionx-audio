// Baut den offiziellen Fusion-X-Discord auf. Kann beliebig oft laufen: Vorhandenes wird gefunden und
// aktualisiert, Fehlendes angelegt. Gelöscht werden nur die leeren Standard-Kanäle eines neuen Servers.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { api, P, bits, TOKEN, GUILD, summary } from './lib.mjs';

if (!TOKEN || !GUILD) {
  summary('## ❌ Discord-Zugangsdaten fehlen');
  summary('- DISCORD_BOT_TOKEN: ' + (TOKEN ? 'vorhanden' : '**fehlt**'));
  summary('- DISCORD_GUILD_ID: ' + (GUILD ? 'vorhanden' : '**fehlt**'));
  summary('Bitte unter Settings → Secrets and variables → **Actions** → Reiter **Secrets** → „New repository secret“ anlegen (nicht unter Codespaces, Dependabot oder einer Environment).');
  process.exit(1);
}
if (!/^\d{17,20}$/.test(GUILD.trim())) { summary('❌ DISCORD_GUILD_ID sieht falsch aus (erwartet wird eine 17–20-stellige Zahl, Rechtsklick auf den Server → „Server-ID kopieren“).'); process.exit(1); }

const RAW = 'https://raw.githubusercontent.com/lMXLama/fusionx-audio/main';
const SITE = 'https://lmxlama.github.io/fusionx-audio/';
const DOWNLOAD = 'https://github.com/lMXLama/fusionx-audio/releases/latest';
const REPO = 'https://github.com/lMXLama/fusionx-audio';
const ICON = RAW + '/renderer/brand/emblem.png';
const banner = (n) => RAW + '/docs/discord/' + n + '.jpg';
const TEAL = 0x2ee6d6, BLUE = 0x2b8cff, VIOLET = 0xb48cff, NAVY = 0x0b1626;
const AUTHOR = { name: 'Fusion-X', icon_url: ICON, url: SITE };
// Zweites Projekt: Fusion-X Launcher (eigenes Repo, eigene Website)
const L_RAW = 'https://raw.githubusercontent.com/lMXLama/fusionx-launcher/main';
const L_SITE = 'https://lmxlama.github.io/fusionx-launcher/';
const L_REPO = 'https://github.com/lMXLama/fusionx-launcher';
const L_ICON = L_RAW + '/renderer/brand/emblem.png';
const GREEN = 0x6ed25a;
const A_AUTHOR = { name: 'Fusion-X Audio', icon_url: ICON, url: SITE };
const L_AUTHOR = { name: 'Fusion-X Launcher', icon_url: L_ICON, url: L_SITE };

const me = await api('GET', '/users/@me');
const guild = await api('GET', '/guilds/' + GUILD);
summary('## Fusion-X Discord-Aufbau');
summary('Bot: **' + me.username + '** · Server: **' + guild.name + '**');

// ================================================================ Server
const iconData = 'data:image/png;base64,' + readFileSync('renderer/brand/emblem.png').toString('base64');
await api('PATCH', '/guilds/' + GUILD, {
  name: 'Fusion-X', icon: iconData,
  verification_level: Math.max(1, guild.verification_level), explicit_content_filter: 2,
  default_message_notifications: 1, preferred_locale: 'de'
}, { reason: 'Fusion-X Einrichtung' });
summary('- Servername, Logo, Beschreibung und Sicherheit');

// ================================================================ Rollen
let roles = await api('GET', '/guilds/' + GUILD + '/roles');
async function role(name, color, perms, hoist, mentionable = false) {
  let r = roles.find((x) => x.name === name);
  const body = { name, color, permissions: perms, hoist, mentionable };
  if (r) r = await api('PATCH', '/guilds/' + GUILD + '/roles/' + r.id, body);
  else { r = await api('POST', '/guilds/' + GUILD + '/roles', body); roles.push(r); }
  return r;
}
const BASE = [P.VIEW, P.SEND, P.EMBED, P.ATTACH, P.HISTORY, P.ADD_REACTIONS, P.CONNECT, P.SPEAK, P.SEND_IN_THREADS, P.CREATE_PUBLIC_THREADS, P.SLASH];
const R = {
  dev: await role('Entwickler', TEAL, bits(P.ADMINISTRATOR), true),
  mod: await role('Moderator', BLUE, bits(...BASE, P.KICK, P.BAN, P.MANAGE_MESSAGES, P.MANAGE_THREADS, P.MODERATE), true),
  tester: await role('Tester', VIOLET, bits(...BASE), true),
  ping: await role('Update-Ping', 0x8fb2ff, '0', false, false),
  streamer: await role('Streamer', 0, '0', false),
  gamer: await role('Gamer', 0, '0', false),
  creator: await role('Musik & Podcast', 0, '0', false),
  lping: await role('Launcher-Ping', 0x7fe08a, '0', false, false),
  minecraft: await role('Minecraft', 0, '0', false)
};
// @everyone bekommt die normalen Rechte, damit keine zusätzliche Mitglieds-Rolle nötig ist
const everyone = roles.find((r) => r.id === GUILD);
const evPerms = ((everyone && everyone.permissions ? BigInt(everyone.permissions) : 0n) | BigInt(bits(...BASE))) & ~P.MENTION_EVERYONE;
await api('PATCH', '/guilds/' + GUILD + '/roles/' + GUILD, { permissions: evPerms.toString() });
try {
  const botRole = roles.find((r) => r.tags && r.tags.bot_id === me.id);
  const top = botRole ? botRole.position - 1 : roles.length - 1;
  await api('PATCH', '/guilds/' + GUILD + '/roles', [R.dev, R.mod, R.tester, R.ping, R.lping, R.streamer, R.gamer, R.creator, R.minecraft].map((r, i) => ({ id: r.id, position: Math.max(1, top - i) })));
} catch (e) { console.log('Rollen-Reihenfolge übersprungen: ' + e.message); }
try { await api('PUT', '/guilds/' + GUILD + '/members/' + guild.owner_id + '/roles/' + R.dev.id); } catch (e) { console.log('Entwickler-Rolle für Besitzer: ' + e.message); }
summary('- Rollen: Entwickler, Moderator, Tester, Update-Ping (Audio), Launcher-Ping, Streamer, Gamer, Musik & Podcast, Minecraft');

// ================================================================ Kanäle
let channels = await api('GET', '/guilds/' + GUILD + '/channels');
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9äöüß-]/g, '');
const READ_ONLY = [
  { id: GUILD, type: 0, allow: bits(P.VIEW, P.HISTORY, P.ADD_REACTIONS), deny: bits(P.SEND, P.CREATE_PUBLIC_THREADS, P.SEND_IN_THREADS) },
  { id: me.id, type: 1, allow: bits(P.VIEW, P.SEND, P.EMBED, P.ATTACH, P.MANAGE_MESSAGES), deny: '0' }
];
const TEAM_ONLY = [
  { id: GUILD, type: 0, allow: '0', deny: bits(P.VIEW) },
  { id: R.dev.id, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY), deny: '0' },
  { id: R.mod.id, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY), deny: '0' },
  { id: me.id, type: 1, allow: bits(P.VIEW, P.SEND, P.EMBED, P.ATTACH), deny: '0' }
];
let pos = 0;
async function channel(spec) {
  let c = channels.find((x) => x.type === spec.type && norm(x.name) === norm(spec.name));
  if (!c && spec.was) c = channels.find((x) => (x.type === spec.type || (spec.type === 5 && x.type === 0) || (spec.type === 0 && x.type === 5)) && norm(x.name) === norm(spec.was));
  const body = { name: spec.name, type: spec.type, position: spec.position != null ? spec.position : pos++ };
  if (spec.parent) body.parent_id = spec.parent;
  if (spec.topic != null) body.topic = spec.topic;
  if (spec.overwrites) body.permission_overwrites = spec.overwrites;
  if (spec.tags) body.available_tags = spec.tags;
  if (spec.type === 15) { body.default_sort_order = 0; body.default_forum_layout = 1; body.default_reaction_emoji = { emoji_name: '👍' }; }
  if (spec.slowmode) body.rate_limit_per_user = spec.slowmode;
  if (c) {
    const upd = { ...body }; delete upd.type;
    if (spec.tags && c.available_tags) upd.available_tags = spec.tags.map((t) => { const old = c.available_tags.find((o) => o.name === t.name); return old ? { ...t, id: old.id } : t; });
    const id = c.id;
    c = await api('PATCH', '/channels/' + id, upd);
    channels = channels.map((x) => (x.id === id ? c : x));
  } else {
    c = await api('POST', '/guilds/' + GUILD + '/channels', body);
    channels.push(c);
  }
  return c;
}

// Standard-Kanäle eines frisch erstellten Servers aufräumen (nur die leeren Vorlagen)
const DEFAULT_CATS = ['textkanäle', 'sprachkanäle', 'textchannels', 'voicechannels'];
for (const c of channels.filter((x) => x.type === 2 && /^(allgemein|general)$/i.test(x.name))) {
  const parent = channels.find((p) => p.id === c.parent_id);
  if (!parent || DEFAULT_CATS.includes(norm(parent.name))) { await api('DELETE', '/channels/' + c.id, undefined, { quiet: true }); channels = channels.filter((x) => x.id !== c.id); }
}

const catInfo = await channel({ name: 'Information', type: 4 });
const welcome = await channel({ name: '👋┃willkommen', type: 0, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Alles Wichtige zu Fusion-X auf einen Blick: Projekte, Downloads, Kanäle und Hilfe.' });
const rules = await channel({ name: '📜┃regeln', type: 0, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Die Regeln dieses Servers. Mit dem Beitritt erklärst du dich einverstanden.' });
const faq = await channel({ name: '❔┃faq', type: 0, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Antworten auf die häufigsten Fragen zu Fusion-X Audio und zum Fusion-X Launcher.' });
const projects = await channel({ name: '🧩┃projekte', type: 0, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Alle Fusion-X Projekte mit Download: Audio, Launcher und alles, was noch kommt.' });
const catTeam = await channel({ name: 'Team', type: 4, overwrites: TEAM_ONLY, position: 99 });
const modlog = await channel({ name: '📋┃mod-log', type: 0, parent: catTeam.id, overwrites: TEAM_ONLY, topic: 'Automatische Meldungen von Discord und AutoMod.' });

// Community-Server (Foren, Ankündigungen, Willkommensbildschirm, Onboarding, AutoMod)
let community = (guild.features || []).includes('COMMUNITY');
if (!community) {
  try {
    await api('PATCH', '/guilds/' + GUILD, { features: [...new Set([...(guild.features || []), 'COMMUNITY'])], rules_channel_id: rules.id, public_updates_channel_id: modlog.id, verification_level: Math.max(1, guild.verification_level), explicit_content_filter: 2, preferred_locale: 'de' }, { reason: 'Community-Funktionen' });
    community = true;
    summary('- Community-Funktionen eingeschaltet');
  } catch (e) { summary('- ⚠️ Community-Funktionen nicht möglich: ' + e.message); }
}
if (community) await api('PATCH', '/guilds/' + GUILD, { description: 'Die offizielle Community für alle Fusion-X Projekte: Audio, Minecraft Launcher und mehr.' }, { quiet: true });
const ANN = community ? 5 : 0, FORUM = community ? 15 : 0;

pos = 5;
const announcements = await channel({ name: '📢┃ankündigungen', type: ANN, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Offizielle Neuigkeiten zu allen Fusion-X Projekten.' });
const changelog = await channel({ name: '🎧┃audio-changelog', was: '🆕┃changelog', type: ANN, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Jede neue Version von Fusion-X Audio mit allen Änderungen. Wird bei jedem Update automatisch gepostet.' });
const lchangelog = await channel({ name: '⛏️┃launcher-changelog', type: ANN, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Jede neue Version des Fusion-X Launchers mit allen Änderungen. Wird bei jedem Update automatisch gepostet.' });

const catSupport = await channel({ name: 'Support', type: 4 });
const bugs = await channel({ name: '🐞┃bug-reports', type: FORUM, parent: catSupport.id, slowmode: 60,
  topic: 'Ein Beitrag pro Fehler, für Audio und Launcher. Bitte den passenden Tag wählen. In Fusion-X Audio geht es am schnellsten direkt in der App: Einstellungen → „Problem melden“.',
  tags: FORUM ? [{ name: 'Audio', emoji_name: '🎧' }, { name: 'Launcher', emoji_name: '⛏️' }, { name: 'Bug', emoji_name: '🐞' }, { name: 'Frage', emoji_name: '❓' }, { name: 'Idee', emoji_name: '💡' }, { name: 'Bestätigt', emoji_name: '🔍', moderated: true }, { name: 'In Arbeit', emoji_name: '🔧', moderated: true }, { name: 'Behoben', emoji_name: '✅', moderated: true }] : undefined });
const help = await channel({ name: '🛟┃hilfe', type: FORUM, parent: catSupport.id,
  topic: 'Hilfe bei Einrichtung und Bedienung von Audio und Launcher. Schau zuerst in die FAQ. Ist deine Frage gelöst, setz den Tag „Gelöst“.',
  tags: FORUM ? [{ name: 'Audio', emoji_name: '🎧' }, { name: 'Launcher', emoji_name: '⛏️' }, { name: 'Einrichtung', emoji_name: '⚙️' }, { name: 'Mikrofon', emoji_name: '🎙️' }, { name: 'Stream-Mix', emoji_name: '📡' }, { name: 'Equalizer', emoji_name: '🎚️' }, { name: 'Stream Deck', emoji_name: '🎛️' }, { name: 'Mods & Shader', emoji_name: '🧩' }, { name: 'Anmeldung', emoji_name: '🔑' }, { name: 'Absturz', emoji_name: '💥' }, { name: 'Gelöst', emoji_name: '✅' }] : undefined });
const ideas = await channel({ name: '💡┃feature-wünsche', type: FORUM, parent: catSupport.id, slowmode: 300,
  topic: 'Was sollen Fusion-X Audio und der Launcher noch können? Ein Wunsch pro Beitrag. Mit 👍 stimmst du für die Wünsche anderer ab.',
  tags: FORUM ? [{ name: 'Audio', emoji_name: '🎧' }, { name: 'Launcher', emoji_name: '⛏️' }, { name: 'Neu', emoji_name: '🆕' }, { name: 'Geplant', emoji_name: '🗓️', moderated: true }, { name: 'Umgesetzt', emoji_name: '✅', moderated: true }, { name: 'Abgelehnt', emoji_name: '⛔', moderated: true }] : undefined });

const catCom = await channel({ name: 'Community', type: 4 });
const general = await channel({ name: '💬┃allgemein', type: 0, parent: catCom.id, topic: 'Alles rund um Sound, Streaming, Gaming und Minecraft. Bitte freundlich bleiben.' });
const mc = await channel({ name: '⛏️┃minecraft', type: 0, parent: catCom.id, topic: 'Minecraft, Mods, Modpacks, Shader und Server. Zeig deine Welten und Bauwerke.' });
const designs = await channel({ name: '🎨┃launcher-designs', type: 0, parent: catCom.id, topic: 'Teile dein Launcher-Design als Code (Design → Teilen), deine Umhänge und Cosmetics-Kombis. Bilder ausdrücklich erwünscht.' });
const setups = await channel({ name: '🖥️┃setups', type: 0, parent: catCom.id, topic: 'Zeig dein Setup: Mikrofon, Interface, Headset, Stream Deck. Bilder ausdrücklich erwünscht.' });
const clips = await channel({ name: '🎬┃clips-und-sounds', type: 0, parent: catCom.id, topic: 'Clips, Soundboard-Sounds und eigene Klang-Einstellungen teilen.' });
const presets = await channel({ name: '🎚️┃mikrofon-settings', type: FORUM, parent: catCom.id, slowmode: 120,
  topic: 'Mikrofon-Einstellungen der Community. Teilen geht direkt in Fusion-X: Mikrofon → Mikrofon-Profile → Teilen. Mit „In Fusion-X übernehmen“ probierst du jede Einstellung mit einem Klick aus.',
  tags: FORUM ? [{ name: 'Allgemein', emoji_name: '🎙️' }, { name: 'Gaming', emoji_name: '🎮' }, { name: 'Streaming', emoji_name: '📡' }, { name: 'Podcast', emoji_name: '🎧' }, { name: 'Musik', emoji_name: '🎵' }, { name: 'Empfohlen', emoji_name: '⭐', moderated: true }] : undefined });
await channel({ name: '🔊 Lounge', type: 2, parent: catCom.id });
await channel({ name: '🎮 Gaming', type: 2, parent: catCom.id });
await channel({ name: '⛏️ Minecraft', type: 2, parent: catCom.id });
await channel({ name: '🎙️ Mikro-Test', type: 2, parent: catCom.id });

pos = 100;
const teamChat = await channel({ name: '🛡️┃team-chat', type: 0, parent: catTeam.id, overwrites: TEAM_ONLY, topic: 'Interner Austausch für Entwickler und Moderatoren.' });
await channel({ name: '🧪┃tester', type: 0, parent: catTeam.id, overwrites: TEAM_ONLY.concat([{ id: R.tester.id, type: 0, allow: bits(P.VIEW, P.SEND, P.HISTORY, P.ATTACH), deny: '0' }]), topic: 'Vorab-Versionen testen und Rückmeldung geben.' });

// Leere Standard-Kategorien entfernen
for (const c of channels.filter((x) => x.type === 4 && DEFAULT_CATS.includes(norm(x.name)))) {
  if (!channels.some((k) => k.parent_id === c.id)) await api('DELETE', '/channels/' + c.id, undefined, { quiet: true });
}
// Beitritts-Meldungen nicht in öffentliche Kanäle
await api('PATCH', '/guilds/' + GUILD, { system_channel_id: modlog.id, system_channel_flags: 1 | 2 | 4 | 8 }, { quiet: true });
summary('- Kanäle: Information, Support' + (FORUM ? ' (Foren mit Tags)' : '') + ', Community, Team');

// ================================================================ Inhalte
const ch = (c) => '<#' + c.id + '>';
const links = (extra) => [{ type: 1, components: [
  { type: 2, style: 5, label: 'Download für Windows', url: DOWNLOAD, emoji: { name: '⬇️' } },
  { type: 2, style: 5, label: 'Website', url: SITE, emoji: { name: '🌐' } },
  { type: 2, style: 5, label: 'Quellcode', url: REPO, emoji: { name: '💻' } }
].concat(extra || []) }];
// Nachricht mit Schlüssel im Fußtext: beim nächsten Lauf wird sie bearbeitet statt neu gepostet
async function post(channelObj, key, payload, alt = []) {
  const msgs = await api('GET', '/channels/' + channelObj.id + '/messages?limit=30', undefined, { quiet: true }) || [];
  const mine = msgs.find((m) => m.author && m.author.id === me.id && (m.embeds || []).some((e) => e.footer && [key].concat(alt).includes(e.footer.text)));
  if (mine) return api('PATCH', '/channels/' + channelObj.id + '/messages/' + mine.id, payload);
  return api('POST', '/channels/' + channelObj.id + '/messages', payload);
}
const bannerEmbed = (n) => ({ color: NAVY, image: { url: banner(n) } });

const links2 = () => [{ type: 1, components: [
  { type: 2, style: 5, label: 'Fusion-X Audio', url: SITE, emoji: { name: '🎧' } },
  { type: 2, style: 5, label: 'Fusion-X Launcher', url: L_SITE, emoji: { name: '⛏️' } }
] }];
const launcherLinks = () => [{ type: 1, components: [
  { type: 2, style: 5, label: 'Download für Windows', url: L_SITE + '#download', emoji: { name: '⬇️' } },
  { type: 2, style: 5, label: 'Website', url: L_SITE, emoji: { name: '🌐' } },
  { type: 2, style: 5, label: 'Quellcode', url: L_REPO, emoji: { name: '💻' } }
] }];

await post(welcome, 'Fusion-X · Kostenlose Programme für Gamer und Streamer', { embeds: [bannerEmbed('fx-willkommen'), {
  color: TEAL, author: AUTHOR, title: 'Willkommen in der Fusion-X Community',
  description: 'Fusion-X sind kostenlose Programme für Gamer und Streamer, ohne Abo, ohne Werbung und mit offenem Quellcode. Dieser Discord ist das Zuhause für alle Projekte: Hier bekommst du Hilfe, meldest Fehler direkt an den Entwickler, bringst deine Ideen ein und erfährst als Erstes von neuen Versionen.',
  fields: [
    { name: '🎧  Fusion-X Audio', value: 'Die Sound-Zentrale für Windows. Jede App bekommt ihren eigenen Regler, deine Stimme klingt mit KI-Rauschunterdrückung klar wie im Studio, dazu Stream-Mix und Equalizer.', inline: true },
    { name: '⛏️  Fusion-X Launcher', value: 'Der Minecraft-Launcher. Mods, Modpacks und Shader mit einem Klick, eigene Cosmetics und Umhänge und ein Design, das du selbst bestimmst.', inline: true },
    { name: 'Erste Schritte', value: '`1` In ' + ch(projects) + ' das passende Programm herunterladen\n`2` Unter **Kanäle & Rollen** auswählen, zu welchem Projekt du Update-Benachrichtigungen möchtest\n`3` Fragen? Einfach einen Beitrag in ' + ch(help) + ' erstellen' },
    { name: 'Wichtige Kanäle', value: ch(rules) + '  Bitte einmal lesen\n' + ch(faq) + '  Antworten auf häufige Fragen\n' + ch(announcements) + '  Neuigkeiten\n' + ch(bugs) + '  Fehler melden\n' + ch(ideas) + '  Ideen einreichen', inline: true },
    { name: 'Was ist neu', value: ch(changelog) + '  Fusion-X Audio\n' + ch(lchangelog) + '  Fusion-X Launcher\n\n<@&' + R.ping.id + '>  Updates für Audio\n<@&' + R.lping.id + '>  Updates für den Launcher', inline: true },
    { name: 'Team', value: '<@&' + R.dev.id + '>  Entwicklung\n<@&' + R.mod.id + '>  Moderation\n<@&' + R.tester.id + '>  Testet Vorab-Versionen' }
  ],
  footer: { text: 'Fusion-X · Kostenlose Programme für Gamer und Streamer', icon_url: ICON }
}], components: links2() }, ['Fusion-X Audio · Kostenlos für Windows 10 und 11']);

await post(projects, 'Fusion-X Audio · Projekt', { embeds: [bannerEmbed('fx-audio'), {
  color: TEAL, author: A_AUTHOR, title: 'Fusion-X Audio', url: SITE,
  description: 'Die kostenlose Sound-Zentrale für Windows 10 und 11.',
  fields: [
    { name: 'Was es kann', value: '• Eigener Lautstärke-Regler für jede App\n• Klare Stimme mit KI-Rauschunterdrückung, Equalizer, Kompressor\n• Eigener Mix für deinen Stream über OBS\n• Equalizer für den ganzen PC, Soundboard, Sprechtaste\n• Steuerung per Stream Deck' },
    { name: 'Kanäle', value: ch(changelog) + '  Was ist neu\n' + ch(presets) + '  Mikro-Settings der Community\n' + ch(help) + '  Hilfe (Tag **Audio**)', inline: true },
    { name: 'Updates', value: 'Rolle <@&' + R.ping.id + '> unter **Kanäle & Rollen**', inline: true }
  ],
  footer: { text: 'Fusion-X Audio · Projekt', icon_url: ICON }
}], components: links(), allowed_mentions: { parse: [] } });

await post(projects, 'Fusion-X Launcher · Projekt', { embeds: [bannerEmbed('fx-launcher'), {
  color: GREEN, author: L_AUTHOR, title: 'Fusion-X Launcher', url: L_SITE,
  description: 'Der kostenlose Minecraft-Launcher für Windows 10 und 11.',
  fields: [
    { name: 'Was er kann', value: '• Mods, Modpacks, Shader und Ressourcenpakete von Modrinth mit einem Klick\n• Beliebig viele Welten, jede mit eigener Version und eigenen Mods\n• Vanilla, Fabric und Quilt, Java wird automatisch geladen\n• Garderobe mit Cosmetics und Umhängen, auch selbst gemalt\n• Farben, Hintergrund und Formen frei einstellbar\n• Hilfe bei Abstürzen auf Deutsch' },
    { name: 'Kanäle', value: ch(lchangelog) + '  Was ist neu\n' + ch(designs) + '  Designs und Umhänge teilen\n' + ch(mc) + '  Minecraft-Talk\n' + ch(help) + '  Hilfe (Tag **Launcher**)', inline: true },
    { name: 'Updates', value: 'Rolle <@&' + R.lping.id + '> unter **Kanäle & Rollen**', inline: true }
  ],
  footer: { text: 'Fusion-X Launcher · Projekt', icon_url: L_ICON }
}], components: launcherLinks(), allowed_mentions: { parse: [] } });

await post(rules, 'Fusion-X · Serverregeln', { embeds: [bannerEmbed('fx-regeln'), {
  color: BLUE, author: AUTHOR, title: 'Serverregeln',
  description: 'Damit Fusion-X eine hilfsbereite und freundliche Community bleibt, gelten hier ein paar einfache Regeln. Mit deinem Beitritt erklärst du dich mit ihnen einverstanden.',
  fields: [
    { name: '§1  Respektvoller Umgang', value: 'Behandle alle so, wie du selbst behandelt werden möchtest. Beleidigungen, Hetze, Diskriminierung und Belästigung werden nicht geduldet.' },
    { name: '§2  Kein Spam und keine Werbung', value: 'Keine Massennachrichten, Ketten-Erwähnungen oder Eigenwerbung. Einladungen zu anderen Servern nur nach Absprache mit dem Team.' },
    { name: '§3  Der richtige Kanal', value: 'Fehler gehören in ' + ch(bugs) + ', Fragen in ' + ch(help) + ' und Ideen in ' + ch(ideas) + '. Bitte ein Thema pro Beitrag.' },
    { name: '§4  Hilfreiche Fehlerberichte', value: 'Nenne das Projekt (Audio oder Launcher), die Version, deine Windows-Version und beschreibe genau, was passiert. Die Diagnose aus der App hilft enorm.' },
    { name: '§5  Keine verbotenen Inhalte', value: 'Keine NSFW-Inhalte, keine Raubkopien, Cracks oder Schadsoftware, keine Inhalte, die gegen geltendes Recht verstoßen.' },
    { name: '§6  Privatsphäre', value: 'Teile keine persönlichen Daten von dir oder anderen, etwa Adressen, Telefonnummern oder private Fotos.' },
    { name: '§7  Entscheidungen des Teams', value: 'Entwickler und Moderatoren dürfen Beiträge entfernen und bei Verstößen Mitglieder stummschalten, entfernen oder sperren. Fragen dazu bitte per Direktnachricht an das Team.' },
    { name: '§8  Discord-Richtlinien', value: 'Zusätzlich gelten die [Nutzungsbedingungen](https://discord.com/terms) und [Community-Richtlinien](https://discord.com/guidelines) von Discord.' }
  ],
  timestamp: new Date().toISOString(),
  footer: { text: 'Fusion-X · Serverregeln', icon_url: ICON }
}] }, ['Fusion-X Audio · Serverregeln']);

await post(faq, 'Fusion-X Audio · Häufige Fragen', { embeds: [bannerEmbed('fx-faq'), {
  color: TEAL, author: A_AUTHOR, title: 'Häufige Fragen zu Fusion-X Audio',
  fields: [
    { name: 'Ist Fusion-X Audio wirklich kostenlos?', value: 'Ja. Kein Abo, keine Werbung, kein Konto. Der Quellcode ist offen auf [GitHub](' + REPO + ').' },
    { name: 'Windows warnt beim Installieren. Ist das sicher?', value: 'Ja. Windows warnt bei jedem Programm ohne kostenpflichtige digitale Signatur. Klick auf **Weitere Informationen → Trotzdem ausführen**.' },
    { name: 'Brauche ich ein Audio-Interface?', value: 'Nein. Fusion-X funktioniert mit jedem Headset, USB-Mikrofon und Laptop-Mikrofon. Mit Interface bekommst du zusätzlich Kanalwahl und passende Tipps.' },
    { name: 'Discord hört meine bearbeitete Stimme nicht.', value: 'In Fusion-X auf der Seite **Mikrofon** auf **Für alle Apps aktivieren** klicken. In Discord als Eingabegerät **Standard** auswählen.' },
    { name: 'Beim Bildschirm teilen hört man mich doppelt.', value: 'Wähle in Discord beim Teilen ein **Fenster** (z. B. dein Spiel) statt **Gesamter Bildschirm**. Beim ganzen Bildschirm nimmt Discord jeden Ton deines PCs auf, auch deine Stimme.' },
    { name: 'Wie richte ich den Stream-Mix ein?', value: 'In OBS (ab Version 28) unter **Werkzeuge → WebSocket-Servereinstellungen** den Server aktivieren und das Passwort in Fusion-X einfügen.' },
    { name: 'Wie bekomme ich den Equalizer?', value: 'Auf der Seite **Equalizer** Equalizer APO herunterladen, beim Installieren Kopfhörer und Lautsprecher anhaken und den PC neu starten.' },
    { name: 'Wie bekomme ich Updates?', value: 'Automatisch. Fusion-X lädt neue Versionen im Hintergrund und installiert sie beim Beenden. Mit der Rolle <@&' + R.ping.id + '> wirst du hier zusätzlich benachrichtigt.' },
    { name: 'Wie teile oder übernehme ich Mikro-Einstellungen?', value: 'In Fusion-X auf **Mikrofon → Mikrofon-Profile → Teilen**. Als Code für Freunde oder öffentlich in ' + ch(presets) + '. Dort übernimmst du jede Einstellung mit **In Fusion-X übernehmen** oder fügst den Code in der App ein.' },
    { name: 'Meine Frage ist nicht dabei.', value: 'Erstelle einfach einen Beitrag in ' + ch(help) + '. Die Community und das Team helfen dir weiter.' }
  ],
  footer: { text: 'Fusion-X Audio · Häufige Fragen', icon_url: ICON }
}], components: links() });

await post(faq, 'Fusion-X Launcher · Häufige Fragen', { embeds: [{
  color: GREEN, author: L_AUTHOR, title: 'Häufige Fragen zum Fusion-X Launcher',
  fields: [
    { name: 'Ist der Launcher wirklich kostenlos?', value: 'Ja. Kein Abo, keine Werbung. Der Quellcode ist offen auf [GitHub](' + L_REPO + ').' },
    { name: 'Brauche ich ein gekauftes Minecraft?', value: 'Ja. Du meldest dich mit dem Microsoft-Konto an, auf dem du Minecraft: Java Edition gekauft hast. Der Launcher umgeht keine Lizenzprüfung.' },
    { name: 'Ist mein Passwort sicher?', value: 'Die Anmeldung läuft direkt auf der Seite von Microsoft. Der Launcher sieht dein Passwort nie.' },
    { name: 'Die Anmeldung zeigt einen Fehler.', value: 'Ganz neue Launcher müssen von Mojang freigeschaltet werden, das kann ein paar Tage dauern. Sobald es so weit ist, steht es in ' + ch(announcements) + '. Hält der Fehler danach an, erstelle einen Beitrag in ' + ch(help) + '.' },
    { name: 'Welche Versionen und Mod-Loader gehen?', value: 'Jede Minecraft-Version mit Vanilla, Fabric oder Quilt. Das passende Java lädt der Launcher automatisch. Forge und NeoForge sind geplant.' },
    { name: 'Wie installiere ich Mods oder Shader?', value: 'Im Launcher auf **Entdecken**, Projekt auswählen, Welt auswählen, fertig. Was eine Mod zusätzlich braucht, wird automatisch mitinstalliert.' },
    { name: 'Sehen andere Spieler meine Cosmetics?', value: 'Im Moment siehst du Cosmetics und eigene Umhänge im Launcher. Damit andere sie im Spiel sehen, braucht es noch eine eigene Mod. Die ist in Arbeit.' },
    { name: 'Wie bekomme ich Updates?', value: 'Automatisch. Der Launcher lädt neue Versionen im Hintergrund und installiert sie beim Beenden. Mit der Rolle <@&' + R.lping.id + '> wirst du hier zusätzlich benachrichtigt.' },
    { name: 'Meine Frage ist nicht dabei.', value: 'Erstelle einen Beitrag in ' + ch(help) + ' und wähle den Tag **Launcher**.' }
  ],
  footer: { text: 'Fusion-X Launcher · Häufige Fragen', icon_url: L_ICON }
}], components: launcherLinks(), allowed_mentions: { parse: [] } });

await post(changelog, 'Fusion-X Audio · Changelog', { embeds: [bannerEmbed('fx-audio'), {
  color: TEAL, author: A_AUTHOR, title: 'Changelog',
  description: 'Hier erscheint jede neue Version von Fusion-X Audio mit allen Änderungen, automatisch in dem Moment, in dem sie veröffentlicht wird. Die App aktualisiert sich dabei von selbst.\n\nWer bei jedem Update eine Benachrichtigung möchte, wählt die Rolle <@&' + R.ping.id + '> unter **Kanäle & Rollen**.',
  footer: { text: 'Fusion-X Audio · Changelog', icon_url: ICON }
}], allowed_mentions: { parse: [] } });

await post(lchangelog, 'Fusion-X Launcher · Changelog', { embeds: [bannerEmbed('fx-launcher'), {
  color: GREEN, author: L_AUTHOR, title: 'Changelog',
  description: 'Hier erscheint jede neue Version des Fusion-X Launchers mit allen Änderungen, kurz nachdem sie veröffentlicht wurde. Der Launcher aktualisiert sich dabei von selbst.\n\nWer bei jedem Update eine Benachrichtigung möchte, wählt die Rolle <@&' + R.lping.id + '> unter **Kanäle & Rollen**.',
  footer: { text: 'Fusion-X Launcher · Changelog', icon_url: L_ICON }
}], components: launcherLinks(), allowed_mentions: { parse: [] } });

await post(teamChat, 'Fusion-X · Team-Leitfaden', { embeds: [bannerEmbed('fx-team'), {
  color: VIOLET, author: AUTHOR, title: 'Leitfaden für das Team',
  fields: [
    { name: 'Neue Fehlerberichte', value: 'Meldungen aus Fusion-X Audio kommen als „🐞 Bug: …“ in ' + ch(bugs) + ' an, mit Version, Kontakt und `diagnose.txt`. Bei jedem Beitrag den Projekt-Tag **Audio** oder **Launcher** setzen. Lässt sich der Fehler nachstellen, Tag **Bestätigt** setzen. Wird daran gearbeitet, **In Arbeit**, nach dem Update **Behoben**.' },
    { name: 'Wünsche', value: 'In ' + ch(ideas) + ' entscheidet das Team über **Geplant**, **Umgesetzt** oder **Abgelehnt**. Bei Ablehnung kurz begründen.' },
    { name: 'Moderation', value: 'Erst freundlich hinweisen, dann zeitweise stummschalten, erst bei wiederholten oder schweren Verstößen entfernen oder sperren. AutoMod-Treffer landen in ' + ch(modlog) + '.' }
  ],
  footer: { text: 'Fusion-X · Team-Leitfaden', icon_url: ICON }
}] }, ['Fusion-X Audio · Team-Leitfaden']);
summary('- Willkommen, Projekte, Regeln, FAQ (Audio und Launcher), beide Changelogs und Team-Leitfaden');

// ================================================================ Angepinnte Anleitungen in den Foren
async function pinnedGuide(forum, name, embed) {
  if (forum.type !== 15) return;
  const active = (await api('GET', '/guilds/' + GUILD + '/threads/active', undefined, { quiet: true }) || {}).threads || [];
  const archived = (await api('GET', '/channels/' + forum.id + '/threads/archived/public', undefined, { quiet: true }) || {}).threads || [];
  let th = active.concat(archived).find((t) => t.parent_id === forum.id && t.name === name);
  const payload = { embeds: [bannerEmbed('fx-support'), embed] };
  if (th) {
    await api('PATCH', '/channels/' + th.id, { archived: false, locked: false }, { quiet: true });
    await api('PATCH', '/channels/' + th.id + '/messages/' + th.id, payload, { quiet: true });
  }
  else th = await api('POST', '/channels/' + forum.id + '/threads', { name, message: payload, auto_archive_duration: 10080 });
  await api('PATCH', '/channels/' + th.id, { flags: 2, locked: true, archived: false }, { quiet: true });
}
await pinnedGuide(bugs, '📌 So meldest du einen Fehler', {
  color: TEAL, author: AUTHOR, title: 'So meldest du einen Fehler',
  description: 'Hier meldest du Fehler in **Fusion-X Audio** und im **Fusion-X Launcher**. Wähle beim Erstellen bitte den Tag **Audio** oder **Launcher**.\n\n**In Fusion-X Audio geht es am schnellsten direkt in der App:** Einstellungen → **Problem melden**. Dann landet alles Nötige automatisch hier, inklusive der technischen Infos.\n\nDu möchtest selbst posten? Dann bitte nach dieser Vorlage, ein Beitrag pro Fehler:',
  fields: [
    { name: 'Vorlage', value: '```\nProjekt:  Audio oder Launcher\nVersion:  (Einstellungen → Updates)\nWindows:  10 oder 11\nGerät:    z. B. Headset, USB-Mikro, Interface\n\nWas hast du gemacht?\nWas ist passiert?\nWas hast du erwartet?\n```' },
    { name: 'Tipps', value: 'Hänge die Diagnose an (Einstellungen → **Diagnose kopieren**) und gern einen Screenshot. Prüfe vorher kurz, ob es den Fehler schon gibt, und gib dort ein 👍.' },
    { name: 'Status', value: '🔍 **Bestätigt**  Fehler lässt sich nachstellen\n🔧 **In Arbeit**  Wird gerade behoben\n✅ **Behoben**  Ist im nächsten Update enthalten' }
  ],
  footer: { text: 'Fusion-X · Fehler melden', icon_url: ICON }
});
await pinnedGuide(help, '📌 Bevor du fragst', {
  color: TEAL, author: AUTHOR, title: 'Bevor du fragst',
  description: 'Viele Fragen sind schon in ' + ch(faq) + ' beantwortet. Wenn nicht, erstelle hier einen Beitrag und beschreibe kurz:',
  fields: [
    { name: 'Hilfreiche Angaben', value: '• Um welches Projekt es geht (Tag **Audio** oder **Launcher**)\n• Audio: welches Mikrofon, Headset oder Interface du nutzt\n• Launcher: Minecraft-Version, Mod-Loader und installierte Mods\n• Was du einstellen möchtest\n• Was du schon versucht hast\n• Ein Screenshot der betroffenen Seite' },
    { name: 'Gelöst?', value: 'Setz den Tag **✅ Gelöst**, damit andere mit derselben Frage die Antwort schnell finden.' }
  ],
  footer: { text: 'Fusion-X · Hilfe', icon_url: ICON }
});
await pinnedGuide(presets, '📌 So teilst und übernimmst du Settings', {
  color: TEAL, author: AUTHOR, title: 'Mikrofon-Settings teilen und übernehmen',
  description: 'Hier landen die Mikrofon-Einstellungen der Community. Jede kannst du mit einem Klick ausprobieren.',
  fields: [
    { name: 'Übernehmen', value: '**In Fusion-X übernehmen** klicken, im Browser „Fusion-X öffnen“ bestätigen und ausprobieren. Gefällt es dir, speicherst du es als eigenes Mikrofon-Profil. Wenn nicht, ist mit einem Klick alles wie vorher.\nAlternativ den Code kopieren und in Fusion-X unter **Mikrofon → Mikrofon-Profile → Code einfügen** einfügen.' },
    { name: 'Teilen', value: 'In Fusion-X auf **Mikrofon → Mikrofon-Profile → Teilen**, Name und Mikrofon eintragen, **Öffentlich im Discord** wählen. Der Beitrag erscheint dann automatisch hier.' },
    { name: 'Gut zu wissen', value: 'Lautstärke und Schwelle der Störgeräusch-Sperre hängen von deinem eigenen Mikro ab und werden nicht übernommen. Nach dem Übernehmen passt der **Mikro-Check** sie in 10 Sekunden an. Der Übersteuerungsschutz bleibt immer an.' },
    { name: 'Bewerten', value: 'Gefällt dir eine Einstellung, gib ihr ein 👍. Besonders gute markiert das Team als ⭐ **Empfohlen**.' }
  ],
  footer: { text: 'Fusion-X Audio · Mikrofon-Settings', icon_url: ICON }
});
await pinnedGuide(ideas, '📌 So funktionieren Wünsche', {
  color: TEAL, author: AUTHOR, title: 'So funktionieren Wünsche',
  description: 'Hier entscheidest du mit, wie es mit Fusion-X Audio und dem Fusion-X Launcher weitergeht. Wähle beim Erstellen den passenden Projekt-Tag.',
  fields: [
    { name: 'Wunsch einreichen', value: 'Ein Wunsch pro Beitrag. Beschreibe, **was** du dir wünschst und **wofür** du es brauchst. Schau vorher, ob es den Wunsch schon gibt.' },
    { name: 'Abstimmen', value: 'Gefällt dir ein Wunsch, gib ihm ein 👍. Die beliebtesten Wünsche werden zuerst umgesetzt.' },
    { name: 'Status', value: '🗓️ **Geplant**  Kommt in einer der nächsten Versionen\n✅ **Umgesetzt**  Ist in der App\n⛔ **Abgelehnt**  Mit kurzer Begründung' }
  ],
  footer: { text: 'Fusion-X · Wünsche', icon_url: ICON }
});
summary('- Angepinnte Anleitungen in Bug-Reports, Hilfe und Feature-Wünsche');

// ================================================================ Webhook für „Problem melden“ aus der App
const hooks = await api('GET', '/channels/' + bugs.id + '/webhooks');
let hook = hooks.find((h) => h.name === 'Fusion-X Meldungen');
if (!hook) hook = await api('POST', '/channels/' + bugs.id + '/webhooks', { name: 'Fusion-X Meldungen', avatar: iconData });
if (presets.type === 15) {
  const ph = await api('GET', '/channels/' + presets.id + '/webhooks');
  if (!ph.find((h) => h.name === 'Fusion-X Mikro-Settings')) await api('POST', '/channels/' + presets.id + '/webhooks', { name: 'Fusion-X Mikro-Settings', avatar: iconData });
  summary('- Forum „Mikrofon-Settings“ mit Webhook bereit');
}
summary('- Webhook „Fusion-X Meldungen“ bereit (wird beim nächsten App-Build eingebaut)');

// ================================================================ Einladung
const invites = await api('GET', '/guilds/' + GUILD + '/invites', undefined, { quiet: true }) || [];
let inv = invites.find((i) => i.max_age === 0 && i.channel && i.channel.id === welcome.id && i.inviter && i.inviter.id === me.id);
if (!inv) inv = await api('POST', '/channels/' + welcome.id + '/invites', { max_age: 0, max_uses: 0, unique: false });
const inviteUrl = 'https://discord.gg/' + inv.code;
mkdirSync('docs', { recursive: true });
writeFileSync('docs/community.json', JSON.stringify({ discord: inviteUrl }, null, 2) + '\n');
summary('- Einladung: ' + inviteUrl);

// ================================================================ Community-Extras
if (community) {
  try {
    await api('PATCH', '/guilds/' + GUILD + '/welcome-screen', { enabled: true, description: 'Die offizielle Community für alle Fusion-X Projekte: Audio, Minecraft Launcher und mehr.', welcome_channels: [
      { channel_id: welcome.id, description: 'Alles Wichtige auf einen Blick', emoji_name: '👋' },
      { channel_id: projects.id, description: 'Alle Projekte mit Download', emoji_name: '🧩' },
      { channel_id: bugs.id, description: 'Fehler melden', emoji_name: '🐞' },
      { channel_id: help.id, description: 'Hilfe bei der Einrichtung', emoji_name: '🛟' },
      { channel_id: announcements.id, description: 'Neuigkeiten', emoji_name: '📢' }
    ] });
    summary('- Willkommensbildschirm');
  } catch (e) { summary('- ⚠️ Willkommensbildschirm: ' + e.message); }
  try {
    // Discord verlangt IDs für Fragen und Antworten; vorhandene werden wiederverwendet
    const old = await api('GET', '/guilds/' + GUILD + '/onboarding', undefined, { quiet: true }) || {};
    let seq = 0n;
    const snow = () => (((BigInt(Date.now()) - 1420070400000n) << 22n) + (seq++)).toString();
    const oldPrompt = (t) => (old.prompts || []).find((p) => p.title === t);
    let curPrompt = null;
    const opt = (title, description, roleIds, emoji) => {
      const o = curPrompt && (curPrompt.options || []).find((x) => x.title === title);
      return { id: o ? o.id : snow(), title, description, role_ids: roleIds, channel_ids: [], emoji_name: emoji };
    };
    const prompt = (title, single, mk) => { curPrompt = oldPrompt(title); const p = { id: curPrompt ? curPrompt.id : snow(), type: 0, title, single_select: single, required: false, in_onboarding: true, options: mk() }; return p; };
    await api('PUT', '/guilds/' + GUILD + '/onboarding', {
      enabled: true, mode: 0,
      default_channel_ids: [welcome.id, rules.id, faq.id, projects.id, announcements.id, changelog.id, lchangelog.id, bugs.id, help.id, ideas.id, general.id, mc.id, designs.id, setups.id, clips.id, presets.id],
      prompts: [
        prompt('Wofür nutzt du Fusion-X?', false, () => [
          opt('Streaming', 'Ich streame auf Twitch, YouTube oder TikTok', [R.streamer.id], '📡'),
          opt('Gaming', 'Voice-Chat und Spiele', [R.gamer.id], '🎮'),
          opt('Musik & Podcast', 'Aufnehmen, Musik, Podcasts', [R.creator.id], '🎧'),
          opt('Minecraft', 'Ich spiele Minecraft, mit oder ohne Mods', [R.minecraft.id], '⛏️')
        ]),
        prompt('Benachrichtigungen', false, () => [
          opt('Neue Versionen', 'Fusion-X Audio: Erwähnung in #audio-changelog, sobald ein Update erscheint', [R.ping.id], '🎧'),
          opt('Neue Launcher-Versionen', 'Fusion-X Launcher: Erwähnung in #launcher-changelog, sobald ein Update erscheint', [R.lping.id], '⛏️')
        ])
      ]
    });
    summary('- Onboarding mit Rollen-Auswahl und Update-Benachrichtigung');
  } catch (e) { summary('- ⚠️ Onboarding: ' + e.message); }
  try {
    const amRules = await api('GET', '/guilds/' + GUILD + '/auto-moderation/rules');
    const ensure = async (name, trigger_type, trigger_metadata) => {
      if (amRules.some((r) => r.name === name)) return;
      await api('POST', '/guilds/' + GUILD + '/auto-moderation/rules', { name, event_type: 1, trigger_type, trigger_metadata, enabled: true,
        actions: [{ type: 1, metadata: { custom_message: 'Diese Nachricht wurde automatisch blockiert. Bitte beachte die Serverregeln.' } }, { type: 2, metadata: { channel_id: modlog.id } }],
        exempt_roles: [R.dev.id, R.mod.id] }).catch((e) => summary('- ⚠️ AutoMod „' + name + '“: ' + e.message));
    };
    await ensure('Fusion-X · Spam', 3, {});
    await ensure('Fusion-X · Massen-Erwähnungen', 5, { mention_total_limit: 5, mention_raid_protection_enabled: true });
    await ensure('Fusion-X · Fremde Einladungen', 1, { keyword_filter: ['discord.gg/*', 'discord.com/invite/*', 'discordapp.com/invite/*'], allow_list: ['discord.gg/' + inv.code, 'discord.com/invite/' + inv.code] });
    summary('- AutoMod gegen Spam, Massen-Erwähnungen und fremde Einladungen');
  } catch (e) { summary('- ⚠️ AutoMod: ' + e.message); }
}

// ================================================================ Ankündigung zum Umbau (nur auf ausdrücklichen Wunsch: ANNOUNCE=1)
if (process.env.ANNOUNCE === '1') try {
  // Nur ankündigen, wenn der Launcher wirklich heruntergeladen werden kann
  const rel = await fetch('https://api.github.com/repos/lMXLama/fusionx-launcher/releases/latest', { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'fusionx-discord-setup', ...(process.env.GITHUB_TOKEN ? { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : {}) } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (rel && (rel.assets || []).some((x) => /\.exe$/i.test(x.name))) {
    const posted = await post(announcements, 'Fusion-X · Ein Discord für alle Projekte', { embeds: [bannerEmbed('fx-neu'), {
      color: TEAL, author: AUTHOR, title: 'Aus dem Fusion-X Audio Discord wird der Fusion-X Discord',
      description: 'Fusion-X wächst. Ab sofort ist dieser Server das Zuhause für **alle** Fusion-X Projekte. Für Fusion-X Audio ändert sich nichts, alle Kanäle und Beiträge bleiben.\n\n**Neu dabei: der Fusion-X Launcher**\nEin kostenloser Minecraft-Launcher für Windows. Mods, Modpacks und Shader mit einem Klick, eigene Cosmetics und Umhänge und ein Design, das du selbst bestimmst.',
      fields: [
        { name: 'Was sich hier ändert', value: '• ' + ch(projects) + '  Alle Projekte mit Download\n• ' + ch(changelog) + ' und ' + ch(lchangelog) + '  Ein Changelog pro Projekt\n• ' + ch(mc) + ' und ' + ch(designs) + '  Neue Kanäle rund um Minecraft\n• In ' + ch(bugs) + ', ' + ch(help) + ' und ' + ch(ideas) + ' gibt es jetzt die Tags **Audio** und **Launcher**' },
        { name: 'Benachrichtigungen', value: 'Wer bei neuen Launcher-Versionen erwähnt werden möchte, wählt die Rolle <@&' + R.lping.id + '> unter **Kanäle & Rollen**. Die Rolle <@&' + R.ping.id + '> gilt weiter für Fusion-X Audio.' },
        { name: 'Gut zu wissen', value: 'Der Launcher ist ganz neu. Die Anmeldung mit Microsoft wird gerade von Mojang freigeschaltet, das kann ein paar Tage dauern. Rückmeldungen sind sehr willkommen.' }
      ],
      footer: { text: 'Fusion-X · Ein Discord für alle Projekte', icon_url: ICON }
    }], components: links2(), allowed_mentions: { parse: [] } });
    if (announcements.type === 5 && posted && !posted.edited_timestamp) await api('POST', '/channels/' + announcements.id + '/messages/' + posted.id + '/crosspost', undefined, { quiet: true });
    summary('- Ankündigung „Ein Discord für alle Projekte“');
  } else summary('- Ankündigung zum Launcher übersprungen (noch kein Download vorhanden)');
} catch (e) { summary('- ⚠️ Ankündigung: ' + e.message); }

summary('\n**Fertig.** Einladung: ' + inviteUrl);
