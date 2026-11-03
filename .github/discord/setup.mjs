// Baut den offiziellen Fusion-X-Discord auf. Kann beliebig oft laufen: Vorhandenes wird gefunden und
// aktualisiert, Fehlendes angelegt. Gelöscht werden nur die leeren Standard-Kanäle eines neuen Servers.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { api, P, bits, TOKEN, GUILD, summary } from './lib.mjs';

if (!TOKEN || !GUILD) { console.error('DISCORD_BOT_TOKEN oder DISCORD_GUILD_ID fehlt (GitHub → Settings → Secrets → Actions).'); process.exit(1); }

const RAW = 'https://raw.githubusercontent.com/lMXLama/fusionx-audio/main';
const SITE = 'https://lmxlama.github.io/fusionx-audio/';
const DOWNLOAD = 'https://github.com/lMXLama/fusionx-audio/releases/latest';
const REPO = 'https://github.com/lMXLama/fusionx-audio';
const ICON = RAW + '/renderer/brand/emblem.png';
const banner = (n) => RAW + '/docs/discord/' + n + '.jpg';
const TEAL = 0x2ee6d6, BLUE = 0x2b8cff, VIOLET = 0xb48cff, NAVY = 0x0b1626;
const AUTHOR = { name: 'Fusion-X Audio', icon_url: ICON, url: SITE };

const me = await api('GET', '/users/@me');
const guild = await api('GET', '/guilds/' + GUILD);
summary('## Fusion-X Discord-Aufbau');
summary('Bot: **' + me.username + '** · Server: **' + guild.name + '**');

// ================================================================ Server
const iconData = 'data:image/png;base64,' + readFileSync('renderer/brand/emblem.png').toString('base64');
await api('PATCH', '/guilds/' + GUILD, {
  name: 'Fusion-X Audio', icon: iconData,
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
  creator: await role('Musik & Podcast', 0, '0', false)
};
// @everyone bekommt die normalen Rechte, damit keine zusätzliche Mitglieds-Rolle nötig ist
const everyone = roles.find((r) => r.id === GUILD);
const evPerms = ((everyone && everyone.permissions ? BigInt(everyone.permissions) : 0n) | BigInt(bits(...BASE))) & ~P.MENTION_EVERYONE;
await api('PATCH', '/guilds/' + GUILD + '/roles/' + GUILD, { permissions: evPerms.toString() });
try {
  const botRole = roles.find((r) => r.tags && r.tags.bot_id === me.id);
  const top = botRole ? botRole.position - 1 : roles.length - 1;
  await api('PATCH', '/guilds/' + GUILD + '/roles', [R.dev, R.mod, R.tester, R.ping, R.streamer, R.gamer, R.creator].map((r, i) => ({ id: r.id, position: Math.max(1, top - i) })));
} catch (e) { console.log('Rollen-Reihenfolge übersprungen: ' + e.message); }
try { await api('PUT', '/guilds/' + GUILD + '/members/' + guild.owner_id + '/roles/' + R.dev.id); } catch (e) { console.log('Entwickler-Rolle für Besitzer: ' + e.message); }
summary('- Rollen: Entwickler, Moderator, Tester, Update-Ping, Streamer, Gamer, Musik & Podcast');

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
const welcome = await channel({ name: '👋┃willkommen', type: 0, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Alles Wichtige zu Fusion-X Audio auf einen Blick: Download, Kanäle und Hilfe.' });
const rules = await channel({ name: '📜┃regeln', type: 0, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Die Regeln dieses Servers. Mit dem Beitritt erklärst du dich einverstanden.' });
const faq = await channel({ name: '❔┃faq', type: 0, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Antworten auf die häufigsten Fragen zu Fusion-X Audio.' });
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
if (community) await api('PATCH', '/guilds/' + GUILD, { description: 'Die offizielle Community der kostenlosen Sound-App für Windows.' }, { quiet: true });
const ANN = community ? 5 : 0, FORUM = community ? 15 : 0;

pos = 4;
const announcements = await channel({ name: '📢┃ankündigungen', type: ANN, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Offizielle Neuigkeiten rund um Fusion-X Audio.' });
const changelog = await channel({ name: '🆕┃changelog', type: ANN, parent: catInfo.id, overwrites: READ_ONLY, topic: 'Jede neue Version mit allen Änderungen. Wird bei jedem Update automatisch gepostet.' });

const catSupport = await channel({ name: 'Support', type: 4 });
const bugs = await channel({ name: '🐞┃bug-reports', type: FORUM, parent: catSupport.id, slowmode: 60,
  topic: 'Ein Beitrag pro Fehler. Am schnellsten direkt in der App: Einstellungen → „Problem melden“. Bitte vorher den angepinnten Beitrag lesen.',
  tags: FORUM ? [{ name: 'Bug', emoji_name: '🐞' }, { name: 'Frage', emoji_name: '❓' }, { name: 'Idee', emoji_name: '💡' }, { name: 'Bestätigt', emoji_name: '🔍', moderated: true }, { name: 'In Arbeit', emoji_name: '🔧', moderated: true }, { name: 'Behoben', emoji_name: '✅', moderated: true }] : undefined });
const help = await channel({ name: '🛟┃hilfe', type: FORUM, parent: catSupport.id,
  topic: 'Hilfe bei Einrichtung und Bedienung. Schau zuerst in die FAQ. Ist deine Frage gelöst, setz den Tag „Gelöst“.',
  tags: FORUM ? [{ name: 'Einrichtung', emoji_name: '⚙️' }, { name: 'Mikrofon', emoji_name: '🎙️' }, { name: 'Stream-Mix', emoji_name: '📡' }, { name: 'Equalizer', emoji_name: '🎚️' }, { name: 'Stream Deck', emoji_name: '🎛️' }, { name: 'Gelöst', emoji_name: '✅' }] : undefined });
const ideas = await channel({ name: '💡┃feature-wünsche', type: FORUM, parent: catSupport.id, slowmode: 300,
  topic: 'Was soll Fusion-X noch können? Ein Wunsch pro Beitrag. Mit 👍 stimmst du für die Wünsche anderer ab.',
  tags: FORUM ? [{ name: 'Neu', emoji_name: '🆕' }, { name: 'Geplant', emoji_name: '🗓️', moderated: true }, { name: 'Umgesetzt', emoji_name: '✅', moderated: true }, { name: 'Abgelehnt', emoji_name: '⛔', moderated: true }] : undefined });

const catCom = await channel({ name: 'Community', type: 4 });
const general = await channel({ name: '💬┃allgemein', type: 0, parent: catCom.id, topic: 'Alles rund um Sound, Streaming und Gaming. Bitte freundlich bleiben.' });
const setups = await channel({ name: '🖥️┃setups', type: 0, parent: catCom.id, topic: 'Zeig dein Setup: Mikrofon, Interface, Headset, Stream Deck. Bilder ausdrücklich erwünscht.' });
const clips = await channel({ name: '🎬┃clips-und-sounds', type: 0, parent: catCom.id, topic: 'Clips, Soundboard-Sounds und eigene Klang-Einstellungen teilen.' });
await channel({ name: '🔊 Lounge', type: 2, parent: catCom.id });
await channel({ name: '🎮 Gaming', type: 2, parent: catCom.id });
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
async function post(channelObj, key, payload) {
  const msgs = await api('GET', '/channels/' + channelObj.id + '/messages?limit=30', undefined, { quiet: true }) || [];
  const mine = msgs.find((m) => m.author && m.author.id === me.id && (m.embeds || []).some((e) => e.footer && e.footer.text === key));
  if (mine) return api('PATCH', '/channels/' + channelObj.id + '/messages/' + mine.id, payload);
  return api('POST', '/channels/' + channelObj.id + '/messages', payload);
}
const bannerEmbed = (n) => ({ color: NAVY, image: { url: banner(n) } });

await post(welcome, 'Fusion-X Audio · Kostenlos für Windows 10 und 11', { embeds: [bannerEmbed('willkommen'), {
  color: TEAL, author: AUTHOR, title: 'Willkommen in der Fusion-X Community',
  description: 'Fusion-X Audio ist die kostenlose Sound-Zentrale für Windows. Jede App bekommt ihren eigenen Regler, deine Stimme klingt mit KI-Rauschunterdrückung klar wie im Studio, dein Stream bekommt einen eigenen Mix und ein Equalizer verbessert alles, was du hörst.\n\nHier bekommst du Hilfe, meldest Fehler direkt an den Entwickler und erfährst als Erstes, was neu ist.',
  fields: [
    { name: 'Erste Schritte', value: '`1` App herunterladen und installieren\n`2` Den Einrichtungs-Assistenten durchlaufen, das dauert etwa eine Minute\n`3` Fragen? Einfach einen Beitrag in ' + ch(help) + ' erstellen' },
    { name: 'Wichtige Kanäle', value: ch(rules) + '  Bitte einmal lesen\n' + ch(faq) + '  Antworten auf häufige Fragen\n' + ch(changelog) + '  Was ist neu\n' + ch(bugs) + '  Fehler melden\n' + ch(ideas) + '  Ideen einreichen', inline: true },
    { name: 'Rollen', value: '<@&' + R.dev.id + '>  Entwicklung\n<@&' + R.mod.id + '>  Moderation\n<@&' + R.tester.id + '>  Testet Vorab-Versionen\n<@&' + R.ping.id + '>  Wird bei Updates benachrichtigt', inline: true },
    { name: 'Fehler direkt aus der App melden', value: 'In Fusion-X unter **Einstellungen → Problem melden**. Deine Meldung landet automatisch in ' + ch(bugs) + ', inklusive der technischen Infos, die für die Fehlersuche gebraucht werden.' }
  ],
  footer: { text: 'Fusion-X Audio · Kostenlos für Windows 10 und 11', icon_url: ICON }
}], components: links() });

await post(rules, 'Fusion-X Audio · Serverregeln', { embeds: [bannerEmbed('regeln'), {
  color: BLUE, author: AUTHOR, title: 'Serverregeln',
  description: 'Damit Fusion-X eine hilfsbereite und freundliche Community bleibt, gelten hier ein paar einfache Regeln. Mit deinem Beitritt erklärst du dich mit ihnen einverstanden.',
  fields: [
    { name: '§1  Respektvoller Umgang', value: 'Behandle alle so, wie du selbst behandelt werden möchtest. Beleidigungen, Hetze, Diskriminierung und Belästigung werden nicht geduldet.' },
    { name: '§2  Kein Spam und keine Werbung', value: 'Keine Massennachrichten, Ketten-Erwähnungen oder Eigenwerbung. Einladungen zu anderen Servern nur nach Absprache mit dem Team.' },
    { name: '§3  Der richtige Kanal', value: 'Fehler gehören in ' + ch(bugs) + ', Fragen in ' + ch(help) + ' und Ideen in ' + ch(ideas) + '. Bitte ein Thema pro Beitrag.' },
    { name: '§4  Hilfreiche Fehlerberichte', value: 'Nenne die Version, deine Windows-Version und beschreibe genau, was passiert. Die Diagnose aus der App (Einstellungen → Diagnose kopieren) hilft enorm.' },
    { name: '§5  Keine verbotenen Inhalte', value: 'Keine NSFW-Inhalte, keine Raubkopien, Cracks oder Schadsoftware, keine Inhalte, die gegen geltendes Recht verstoßen.' },
    { name: '§6  Privatsphäre', value: 'Teile keine persönlichen Daten von dir oder anderen, etwa Adressen, Telefonnummern oder private Fotos.' },
    { name: '§7  Entscheidungen des Teams', value: 'Entwickler und Moderatoren dürfen Beiträge entfernen und bei Verstößen Mitglieder stummschalten, entfernen oder sperren. Fragen dazu bitte per Direktnachricht an das Team.' },
    { name: '§8  Discord-Richtlinien', value: 'Zusätzlich gelten die [Nutzungsbedingungen](https://discord.com/terms) und [Community-Richtlinien](https://discord.com/guidelines) von Discord.' }
  ],
  timestamp: new Date().toISOString(),
  footer: { text: 'Fusion-X Audio · Serverregeln', icon_url: ICON }
}] });

await post(faq, 'Fusion-X Audio · Häufige Fragen', { embeds: [bannerEmbed('faq'), {
  color: TEAL, author: AUTHOR, title: 'Häufige Fragen',
  fields: [
    { name: 'Ist Fusion-X wirklich kostenlos?', value: 'Ja. Kein Abo, keine Werbung, kein Konto. Der Quellcode ist offen auf [GitHub](' + REPO + ').' },
    { name: 'Windows warnt beim Installieren. Ist das sicher?', value: 'Ja. Windows warnt bei jedem Programm ohne kostenpflichtige digitale Signatur. Klick auf **Weitere Informationen → Trotzdem ausführen**.' },
    { name: 'Brauche ich ein Audio-Interface?', value: 'Nein. Fusion-X funktioniert mit jedem Headset, USB-Mikrofon und Laptop-Mikrofon. Mit Interface bekommst du zusätzlich Kanalwahl und passende Tipps.' },
    { name: 'Discord hört meine bearbeitete Stimme nicht.', value: 'In Fusion-X auf der Seite **Mikrofon** auf **Für alle Apps aktivieren** klicken. In Discord als Eingabegerät **Standard** auswählen.' },
    { name: 'Wie richte ich den Stream-Mix ein?', value: 'In OBS (ab Version 28) unter **Werkzeuge → WebSocket-Servereinstellungen** den Server aktivieren und das Passwort in Fusion-X einfügen.' },
    { name: 'Wie bekomme ich den Equalizer?', value: 'Auf der Seite **Equalizer** Equalizer APO herunterladen, beim Installieren Kopfhörer und Lautsprecher anhaken und den PC neu starten.' },
    { name: 'Wie bekomme ich Updates?', value: 'Automatisch. Fusion-X lädt neue Versionen im Hintergrund und installiert sie beim Beenden. Mit der Rolle <@&' + R.ping.id + '> wirst du hier zusätzlich benachrichtigt.' },
    { name: 'Meine Frage ist nicht dabei.', value: 'Erstelle einfach einen Beitrag in ' + ch(help) + '. Die Community und das Team helfen dir weiter.' }
  ],
  footer: { text: 'Fusion-X Audio · Häufige Fragen', icon_url: ICON }
}], components: links() });

await post(changelog, 'Fusion-X Audio · Changelog', { embeds: [bannerEmbed('updates'), {
  color: TEAL, author: AUTHOR, title: 'Changelog',
  description: 'Hier erscheint jede neue Version von Fusion-X Audio mit allen Änderungen, automatisch in dem Moment, in dem sie veröffentlicht wird. Die App aktualisiert sich dabei von selbst.\n\nWer bei jedem Update eine Benachrichtigung möchte, wählt die Rolle <@&' + R.ping.id + '> unter **Kanäle & Rollen**.',
  footer: { text: 'Fusion-X Audio · Changelog', icon_url: ICON }
}], allowed_mentions: { parse: [] } });

await post(teamChat, 'Fusion-X Audio · Team-Leitfaden', { embeds: [bannerEmbed('team'), {
  color: VIOLET, author: AUTHOR, title: 'Leitfaden für das Team',
  fields: [
    { name: 'Neue Fehlerberichte', value: 'Meldungen aus der App kommen als „🐞 Bug: …“ in ' + ch(bugs) + ' an, mit Version, Kontakt und `diagnose.txt`. Lässt sich der Fehler nachstellen, Tag **Bestätigt** setzen. Wird daran gearbeitet, **In Arbeit**, nach dem Update **Behoben**.' },
    { name: 'Wünsche', value: 'In ' + ch(ideas) + ' entscheidet das Team über **Geplant**, **Umgesetzt** oder **Abgelehnt**. Bei Ablehnung kurz begründen.' },
    { name: 'Moderation', value: 'Erst freundlich hinweisen, dann zeitweise stummschalten, erst bei wiederholten oder schweren Verstößen entfernen oder sperren. AutoMod-Treffer landen in ' + ch(modlog) + '.' }
  ],
  footer: { text: 'Fusion-X Audio · Team-Leitfaden', icon_url: ICON }
}] });
summary('- Willkommen, Regeln, FAQ, Changelog und Team-Leitfaden mit Bannern');

// ================================================================ Angepinnte Anleitungen in den Foren
async function pinnedGuide(forum, name, embed) {
  if (forum.type !== 15) return;
  const active = (await api('GET', '/guilds/' + GUILD + '/threads/active', undefined, { quiet: true }) || {}).threads || [];
  const archived = (await api('GET', '/channels/' + forum.id + '/threads/archived/public', undefined, { quiet: true }) || {}).threads || [];
  let th = active.concat(archived).find((t) => t.parent_id === forum.id && t.name === name);
  const payload = { embeds: [bannerEmbed('support'), embed] };
  if (th) {
    await api('PATCH', '/channels/' + th.id, { archived: false, locked: false }, { quiet: true });
    await api('PATCH', '/channels/' + th.id + '/messages/' + th.id, payload, { quiet: true });
  }
  else th = await api('POST', '/channels/' + forum.id + '/threads', { name, message: payload, auto_archive_duration: 10080 });
  await api('PATCH', '/channels/' + th.id, { flags: 2, locked: true, archived: false }, { quiet: true });
}
await pinnedGuide(bugs, '📌 So meldest du einen Fehler', {
  color: TEAL, author: AUTHOR, title: 'So meldest du einen Fehler',
  description: '**Am schnellsten geht es direkt in der App:** Einstellungen → **Problem melden**. Dann landet alles Nötige automatisch hier, inklusive der technischen Infos.\n\nDu möchtest selbst posten? Dann bitte nach dieser Vorlage, ein Beitrag pro Fehler:',
  fields: [
    { name: 'Vorlage', value: '```\nVersion:  (Einstellungen → Updates)\nWindows:  10 oder 11\nGerät:    z. B. Headset, USB-Mikro, Interface\n\nWas hast du gemacht?\nWas ist passiert?\nWas hast du erwartet?\n```' },
    { name: 'Tipps', value: 'Hänge die Diagnose an (Einstellungen → **Diagnose kopieren**) und gern einen Screenshot. Prüfe vorher kurz, ob es den Fehler schon gibt, und gib dort ein 👍.' },
    { name: 'Status', value: '🔍 **Bestätigt**  Fehler lässt sich nachstellen\n🔧 **In Arbeit**  Wird gerade behoben\n✅ **Behoben**  Ist im nächsten Update enthalten' }
  ],
  footer: { text: 'Fusion-X Audio · Fehler melden', icon_url: ICON }
});
await pinnedGuide(help, '📌 Bevor du fragst', {
  color: TEAL, author: AUTHOR, title: 'Bevor du fragst',
  description: 'Viele Fragen sind schon in ' + ch(faq) + ' beantwortet. Wenn nicht, erstelle hier einen Beitrag und beschreibe kurz:',
  fields: [
    { name: 'Hilfreiche Angaben', value: '• Welches Mikrofon, Headset oder Interface du nutzt\n• Was du einstellen möchtest\n• Was du schon versucht hast\n• Ein Screenshot der betroffenen Seite' },
    { name: 'Gelöst?', value: 'Setz den Tag **✅ Gelöst**, damit andere mit derselben Frage die Antwort schnell finden.' }
  ],
  footer: { text: 'Fusion-X Audio · Hilfe', icon_url: ICON }
});
await pinnedGuide(ideas, '📌 So funktionieren Wünsche', {
  color: TEAL, author: AUTHOR, title: 'So funktionieren Wünsche',
  description: 'Hier entscheidest du mit, wie es mit Fusion-X weitergeht.',
  fields: [
    { name: 'Wunsch einreichen', value: 'Ein Wunsch pro Beitrag. Beschreibe, **was** du dir wünschst und **wofür** du es brauchst. Schau vorher, ob es den Wunsch schon gibt.' },
    { name: 'Abstimmen', value: 'Gefällt dir ein Wunsch, gib ihm ein 👍. Die beliebtesten Wünsche werden zuerst umgesetzt.' },
    { name: 'Status', value: '🗓️ **Geplant**  Kommt in einer der nächsten Versionen\n✅ **Umgesetzt**  Ist in der App\n⛔ **Abgelehnt**  Mit kurzer Begründung' }
  ],
  footer: { text: 'Fusion-X Audio · Wünsche', icon_url: ICON }
});
summary('- Angepinnte Anleitungen in Bug-Reports, Hilfe und Feature-Wünsche');

// ================================================================ Webhook für „Problem melden“ aus der App
const hooks = await api('GET', '/channels/' + bugs.id + '/webhooks');
let hook = hooks.find((h) => h.name === 'Fusion-X Meldungen');
if (!hook) hook = await api('POST', '/channels/' + bugs.id + '/webhooks', { name: 'Fusion-X Meldungen', avatar: iconData });
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
    await api('PATCH', '/guilds/' + GUILD + '/welcome-screen', { enabled: true, description: 'Die offizielle Community der kostenlosen Sound-App für Windows.', welcome_channels: [
      { channel_id: welcome.id, description: 'Download und alles Wichtige', emoji_name: '👋' },
      { channel_id: faq.id, description: 'Antworten auf häufige Fragen', emoji_name: '❔' },
      { channel_id: bugs.id, description: 'Fehler melden', emoji_name: '🐞' },
      { channel_id: help.id, description: 'Hilfe bei der Einrichtung', emoji_name: '🛟' },
      { channel_id: changelog.id, description: 'Was ist neu', emoji_name: '🆕' }
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
      default_channel_ids: [welcome.id, rules.id, faq.id, announcements.id, changelog.id, bugs.id, help.id, ideas.id, general.id, setups.id, clips.id],
      prompts: [
        prompt('Wofür nutzt du Fusion-X?', false, () => [
          opt('Streaming', 'Ich streame auf Twitch, YouTube oder TikTok', [R.streamer.id], '📡'),
          opt('Gaming', 'Voice-Chat und Spiele', [R.gamer.id], '🎮'),
          opt('Musik & Podcast', 'Aufnehmen, Musik, Podcasts', [R.creator.id], '🎧')
        ]),
        prompt('Bei neuen Updates benachrichtigt werden?', true, () => [
          opt('Ja, bitte', 'Du wirst in #changelog erwähnt, sobald eine neue Version erscheint', [R.ping.id], '🔔'),
          opt('Nein, danke', 'Du kannst das später unter Kanäle & Rollen ändern', [], '🔕')
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

// ================================================================ Eröffnungs-Ankündigung
try {
  const cl = JSON.parse(readFileSync('docs/changelog.json', 'utf8'));
  const latest = Object.keys(cl).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
  await post(announcements, 'Fusion-X Audio · Server-Eröffnung', { embeds: [bannerEmbed('willkommen'), {
    color: TEAL, author: AUTHOR, title: 'Der offizielle Fusion-X Discord ist eröffnet',
    description: 'Ab sofort ist das hier der Ort für alles rund um Fusion-X Audio: Hilfe bei der Einrichtung, Fehlerberichte direkt an den Entwickler, Ideen für neue Funktionen und alle Neuigkeiten aus erster Hand.\n\nDie aktuelle Version ist **' + latest + '**. Was sich zuletzt geändert hat, steht in ' + ch(changelog) + '.\n\nSchön, dass du dabei bist.',
    footer: { text: 'Fusion-X Audio · Server-Eröffnung', icon_url: ICON }
  }], components: links() });
} catch (e) { console.log('Ankündigung: ' + e.message); }

summary('\n**Fertig.** Einladung: ' + inviteUrl);
