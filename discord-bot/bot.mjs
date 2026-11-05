// Fusion-X Discord-Bot: hält den Bot online, zeigt einen Status, beantwortet Slash-Befehle
// und begrüßt neue Beiträge in den Support-Foren. Start: npm install && npm start
import { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags, Events } from 'discord.js';
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { TEMPLATES, buildAnnouncement, templateFromFooter } from './templates.mjs';

// .env (falls vorhanden) einlesen, ohne zusätzliches Paket
if (existsSync(new URL('./.env', import.meta.url))) {
  for (const line of readFileSync(new URL('./.env', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const TOKEN = (process.env.DISCORD_BOT_TOKEN || '').trim();
const GUILD = (process.env.DISCORD_GUILD_ID || '').trim();
if (!TOKEN || !GUILD) { console.error('DISCORD_BOT_TOKEN und DISCORD_GUILD_ID fehlen (siehe .env.example).'); process.exit(1); }

const REPO = 'lMXLama/fusionx-audio';
const SITE = 'https://lmxlama.github.io/fusionx-audio/';
const DOWNLOAD = 'https://github.com/' + REPO + '/releases/latest';
const RAW = 'https://raw.githubusercontent.com/' + REPO + '/main';
const ICON = RAW + '/renderer/brand/emblem.png';
const TEAL = 0x2ee6d6;
const FOOT = { text: 'Fusion-X Audio', iconURL: ICON };

// ------------------------------------------------------------ Aktuelle Version (von GitHub, 10 min Cache)
let cache = { at: 0, version: null, changelog: {} };
async function info() {
  if (Date.now() - cache.at < 10 * 60e3 && cache.version) return cache;
  try {
    const [rel, cl] = await Promise.all([
      fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { 'User-Agent': 'fusionx-bot' } }).then((r) => r.json()),
      fetch(RAW + '/docs/changelog.json').then((r) => r.json())
    ]);
    cache = { at: Date.now(), version: String(rel.tag_name || '').replace(/^v/, '') || Object.keys(cl)[0], changelog: cl };
  } catch (e) { console.log('GitHub nicht erreichbar: ' + e.message); cache.at = Date.now() - 9 * 60e3; }
  return cache;
}

const linkRow = () => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Download für Windows').setEmoji('⬇️').setURL(DOWNLOAD),
  new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Website').setEmoji('🌐').setURL(SITE)
);
const embed = (title, description) => new EmbedBuilder().setColor(TEAL).setAuthor({ name: 'Fusion-X Audio', iconURL: ICON, url: SITE }).setTitle(title).setDescription(description).setFooter(FOOT);

// ------------------------------------------------------------ FAQ
const FAQ = {
  kostenlos: ['Ist Fusion-X wirklich kostenlos?', 'Ja. Kein Abo, keine Werbung, kein Konto. Der Quellcode ist offen auf [GitHub](https://github.com/' + REPO + ').'],
  smartscreen: ['Windows warnt beim Installieren', 'Das ist normal bei Programmen ohne kostenpflichtige Signatur. Klick auf **Weitere Informationen → Trotzdem ausführen**.'],
  discord: ['Discord hört meine bearbeitete Stimme nicht', 'In Fusion-X auf der Seite **Mikrofon** auf **Für alle Apps aktivieren** klicken. In Discord als Eingabegerät **Standard** wählen.'],
  teilen: ['Beim Bildschirm teilen hört man mich doppelt', 'Wähle in Discord beim Teilen ein **Fenster** (z. B. dein Spiel) statt **Gesamter Bildschirm**. Beim ganzen Bildschirm nimmt Discord jeden Ton deines PCs auf, auch deine Stimme.'],
  streammix: ['Stream-Mix einrichten', 'In OBS (ab Version 28) unter **Werkzeuge → WebSocket-Servereinstellungen** den Server aktivieren und das Passwort in Fusion-X auf der Seite **Stream-Mix** einfügen.'],
  equalizer: ['Equalizer einrichten', 'Auf der Seite **Equalizer** Equalizer APO herunterladen, beim Installieren Kopfhörer und Lautsprecher anhaken und den PC neu starten.'],
  interface: ['Brauche ich ein Audio-Interface?', 'Nein. Fusion-X funktioniert mit jedem Headset, USB-Mikrofon und Laptop-Mikrofon.'],
  updates: ['Wie bekomme ich Updates?', 'Automatisch. Fusion-X lädt neue Versionen im Hintergrund und installiert sie beim nächsten Beenden.']
};

// ------------------------------------------------------------ Befehle
const commands = [
  new SlashCommandBuilder().setName('hilfe').setDescription('Alle Befehle und wichtigen Links'),
  new SlashCommandBuilder().setName('download').setDescription('Link zur neuesten Version von Fusion-X Audio'),
  new SlashCommandBuilder().setName('faq').setDescription('Antwort auf eine häufige Frage')
    .addStringOption((o) => o.setName('thema').setDescription('Worum geht es?').setRequired(true)
      .addChoices(...Object.entries(FAQ).map(([value, [name]]) => ({ name, value })))),
  new SlashCommandBuilder().setName('changelog').setDescription('Was ist neu in der aktuellen Version?'),
  new SlashCommandBuilder().setName('bug').setDescription('So meldest du einen Fehler richtig'),
  new SlashCommandBuilder().setName('diagnose').setDescription('So kopierst du die technischen Infos aus der App'),
  new SlashCommandBuilder().setName('ankündigung').setDescription('Ankündigung im Fusion-X-Stil schreiben (nur Team)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName('vorlage').setDescription('Welche Art von Ankündigung?').setRequired(true)
      .addChoices(...Object.entries(TEMPLATES).map(([value, t]) => ({ name: t.emoji + ' ' + t.name, value }))))
    .addStringOption((o) => o.setName('ping').setDescription('Wer soll benachrichtigt werden? (Standard je nach Vorlage)')
      .addChoices({ name: 'Niemand', value: 'none' }, { name: 'Rolle Update-Ping', value: 'update' }, { name: 'Alle (@everyone)', value: 'everyone' }))
    .addChannelOption((o) => o.setName('kanal').setDescription('Wohin? (Standard: Ankündigungen)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
  new ContextMenuCommandBuilder().setName('Ankündigung bearbeiten').setType(ApplicationCommandType.Message)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map((c) => c.toJSON());

// ------------------------------------------------------------ Ankündigungen schreiben
const drafts = new Map(); // id → Entwurf, wird nach einer Stunde vergessen
const PING_NAME = { none: 'niemand', update: 'Rolle Update-Ping', everyone: '@everyone' };
function draftModal(id, d, title) {
  const t = TEMPLATES[d.template];
  const input = (cid, label, style, value, required, max, placeholder) => {
    const x = new TextInputBuilder().setCustomId(cid).setLabel(label).setStyle(style).setRequired(required).setMaxLength(max);
    if (value) x.setValue(String(value).slice(0, max));
    if (placeholder) x.setPlaceholder(placeholder);
    return new ActionRowBuilder().addComponents(x);
  };
  return new ModalBuilder().setCustomId(id).setTitle((title || t.emoji + ' ' + t.name).slice(0, 45)).addComponents(
    input('title', 'Überschrift', TextInputStyle.Short, d.title, false, 200, 'z. B. Fusion-X Audio {version} ist da'),
    input('text', 'Text', TextInputStyle.Paragraph, d.text, true, 4000, '**fett**, *kursiv*, • Aufzählung, #hilfe wird zum Kanal-Link'),
    input('image', 'Bild unter dem Text (Link, optional)', TextInputStyle.Short, d.image, false, 500, 'https://…'),
    input('button', 'Button (optional): Text | Link', TextInputStyle.Short, d.button, false, 300, 'Herunterladen | https://…')
  );
}
const readModal = (i, d) => Object.assign(d, {
  title: i.fields.getTextInputValue('title'), text: i.fields.getTextInputValue('text'),
  image: i.fields.getTextInputValue('image'), button: i.fields.getTextInputValue('button')
});
async function buildFor(guild, d) {
  const { version } = await info();
  const ping = guild.roles.cache.find((r) => r.name === 'Update-Ping');
  return buildAnnouncement(d, { version, channels: [...guild.channels.cache.values()], pingRoleId: ping && ping.id });
}
async function preview(i, id) {
  const d = drafts.get(id);
  const msg = await buildFor(i.guild, d);
  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ann:pub:' + id).setStyle(ButtonStyle.Success).setLabel('Veröffentlichen').setEmoji('✅'),
    new ButtonBuilder().setCustomId('ann:edit:' + id).setStyle(ButtonStyle.Secondary).setLabel('Bearbeiten').setEmoji('✏️'),
    new ButtonBuilder().setCustomId('ann:cancel:' + id).setStyle(ButtonStyle.Danger).setLabel('Verwerfen')
  );
  const payload = {
    content: '**Vorschau** · nur du siehst das · Ziel: <#' + d.channelId + '> · Benachrichtigt: ' + PING_NAME[d.ping],
    embeds: msg.embeds, components: [...msg.components, controls], allowed_mentions: { parse: [] }
  };
  return i.isFromMessage && i.isFromMessage() ? i.update(payload) : i.reply({ ...payload, flags: MessageFlags.Ephemeral });
}
const isTeam = (i) => i.memberPermissions && i.memberPermissions.has(PermissionFlagsBits.ManageGuild);

async function handleAnnouncement(i) {
  // /ankündigung → Formular mit Vorlage öffnen
  if (i.isChatInputCommand() && i.commandName === 'ankündigung') {
    if (!isTeam(i)) return i.reply({ flags: MessageFlags.Ephemeral, content: 'Das darf nur das Team.' });
    const template = i.options.getString('vorlage');
    const t = TEMPLATES[template];
    const target = i.options.getChannel('kanal') || findChannel(i.guild, 'ankündigungen');
    if (!target) return i.reply({ flags: MessageFlags.Ephemeral, content: 'Kein Ankündigungs-Kanal gefunden. Bitte mit „kanal“ einen auswählen.' });
    const id = randomUUID().slice(0, 8);
    drafts.set(id, { template, title: t.title, text: t.text, image: '', button: t.button || '', ping: i.options.getString('ping') || t.ping, channelId: target.id, userId: i.user.id });
    setTimeout(() => drafts.delete(id), 60 * 60e3);
    return i.showModal(draftModal('ann:form:' + id, drafts.get(id)));
  }
  // Rechtsklick auf eine veröffentlichte Ankündigung → bearbeiten
  if (i.isMessageContextMenuCommand() && i.commandName === 'Ankündigung bearbeiten') {
    if (!isTeam(i)) return i.reply({ flags: MessageFlags.Ephemeral, content: 'Das darf nur das Team.' });
    const m = i.targetMessage;
    const e = m.embeds[1];
    const template = m.author.id === client.user.id && e && e.footer && templateFromFooter(e.footer.text);
    if (!template) return i.reply({ flags: MessageFlags.Ephemeral, content: 'Das ist keine Ankündigung von /ankündigung.' });
    const t = TEMPLATES[template];
    const btn = m.components[0] && m.components[0].components[0];
    const id = randomUUID().slice(0, 8);
    drafts.set(id, { template, messageId: m.id, channelId: m.channelId, userId: i.user.id, ping: 'none',
      title: String(e.title || '').replace(t.emoji, '').trim(), text: (e.description === '…' ? '' : (e.description || '')).replace(/<#(\d+)>/g, (x, cid) => { const c = i.guild.channels.cache.get(cid); return c ? '#' + c.name.split('┃').pop() : x; }),
      image: e.image ? e.image.url : '', button: btn && btn.url ? btn.label + ' | ' + btn.url : '' });
    setTimeout(() => drafts.delete(id), 60 * 60e3);
    return i.showModal(draftModal('ann:editpub:' + id, drafts.get(id), 'Ankündigung bearbeiten'));
  }
  if (i.isModalSubmit() && i.customId.startsWith('ann:')) {
    const [, kind, id] = i.customId.split(':');
    const d = drafts.get(id);
    if (!d) return i.reply({ flags: MessageFlags.Ephemeral, content: 'Der Entwurf ist abgelaufen. Bitte /ankündigung neu starten.' });
    readModal(i, d);
    if (kind === 'editpub') {
      const ch = await i.guild.channels.fetch(d.channelId);
      const msg = await ch.messages.fetch(d.messageId);
      const built = await buildFor(i.guild, d);
      built.embeds[1].timestamp = msg.embeds[1] && msg.embeds[1].timestamp ? msg.embeds[1].timestamp : built.embeds[1].timestamp;
      await msg.edit({ embeds: built.embeds, components: built.components });
      drafts.delete(id);
      return i.reply({ flags: MessageFlags.Ephemeral, content: '✅ Ankündigung aktualisiert: ' + msg.url });
    }
    return preview(i, id);
  }
  if (i.isButton() && i.customId.startsWith('ann:')) {
    const [, kind, id] = i.customId.split(':');
    const d = drafts.get(id);
    if (!d) return i.update({ content: 'Der Entwurf ist abgelaufen. Bitte /ankündigung neu starten.', embeds: [], components: [] });
    if (kind === 'edit') return i.showModal(draftModal('ann:form:' + id, d));
    if (kind === 'cancel') { drafts.delete(id); return i.update({ content: 'Entwurf verworfen.', embeds: [], components: [] }); }
    if (kind === 'pub') {
      const ch = await i.guild.channels.fetch(d.channelId);
      const msg = await ch.send(await buildFor(i.guild, d));
      if (ch.type === ChannelType.GuildAnnouncement) await msg.crosspost().catch(() => {});
      drafts.delete(id);
      return i.update({ content: '✅ Veröffentlicht: ' + msg.url + '\nÄndern kannst du sie später mit Rechtsklick auf die Nachricht → Apps → **Ankündigung bearbeiten**.', embeds: [], components: [] });
    }
  }
  return false;
}

const findChannel = (guild, part) => guild.channels.cache.find((c) => c.name.includes(part));
const mention = (guild, part) => { const c = findChannel(guild, part); return c ? '<#' + c.id + '>' : '#' + part; };

async function handle(i) {
  const g = i.guild;
  switch (i.commandName) {
    case 'hilfe':
      return i.reply({ flags: MessageFlags.Ephemeral, components: [linkRow()], embeds: [embed('So kann ich dir helfen', [
        '`/download`  Neueste Version herunterladen',
        '`/faq`  Antworten auf häufige Fragen',
        '`/changelog`  Was ist neu',
        '`/bug`  So meldest du einen Fehler',
        '`/diagnose`  Technische Infos aus der App kopieren',
        '',
        'Nicht dabei? Erstelle einen Beitrag in ' + mention(g, 'hilfe') + '.'
      ].join('\n'))] });
    case 'download': {
      const { version } = await info();
      return i.reply({ components: [linkRow()], embeds: [embed('Fusion-X Audio' + (version ? ' ' + version : ''), 'Kostenlos für Windows 10 und 11. Einfach herunterladen, installieren und den Einrichtungs-Assistenten durchlaufen.')] });
    }
    case 'faq': {
      const [q, a] = FAQ[i.options.getString('thema')] || ['Häufige Fragen', 'Schau in ' + mention(g, 'faq') + '.'];
      return i.reply({ embeds: [embed(q, a + '\n\nMehr Antworten in ' + mention(g, 'faq') + '.')] });
    }
    case 'changelog': {
      const { version, changelog } = await info();
      const lines = ((changelog[version] || {}).de || []).map((l) => '• ' + l).join('\n') || 'Verbesserungen und Fehlerbehebungen.';
      return i.reply({ components: [linkRow()], embeds: [embed('Neu in Version ' + (version || ''), lines + '\n\nAlle Versionen in ' + mention(g, 'changelog') + '.')] });
    }
    case 'bug':
      return i.reply({ embeds: [embed('So meldest du einen Fehler', 'Am schnellsten direkt in der App: **Einstellungen → Problem melden**. Deine Meldung landet dann automatisch in ' + mention(g, 'bug-reports') + ', mit allen technischen Infos.\n\nOder selbst einen Beitrag in ' + mention(g, 'bug-reports') + ' erstellen: Version, Windows-Version, was du gemacht hast und was passiert ist.')] });
    case 'diagnose':
      return i.reply({ embeds: [embed('Technische Infos kopieren', 'In Fusion-X unter **Einstellungen → Diagnose kopieren** klicken und hier mit **Strg + V** einfügen. Darin stehen nur technische Angaben wie Version, Geräte und Einstellungen.')] });
  }
}

// ------------------------------------------------------------ Status
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let statusIndex = 0;
async function updateStatus() {
  const g = client.guilds.cache.get(GUILD);
  const { version } = await info();
  const list = [
    { type: ActivityType.Custom, name: 'status', state: '🎧 Fusion-X Audio' + (version ? ' ' + version : '') },
    { type: ActivityType.Custom, name: 'status', state: '💬 /hilfe für Hilfe und Infos' },
    { type: ActivityType.Custom, name: 'status', state: '⬇️ Kostenlos für Windows' }
  ];
  if (g) list.push({ type: ActivityType.Custom, name: 'status', state: '👥 ' + g.memberCount + ' Mitglieder' });
  const a = list[statusIndex++ % list.length];
  client.user.setPresence({ status: 'online', activities: [a] });
}

client.once(Events.ClientReady, async () => {
  console.log('Online als ' + client.user.tag);
  try {
    const g = await client.guilds.fetch(GUILD);
    await g.commands.set(commands);
    console.log(commands.length + ' Befehle registriert.');
  } catch (e) { console.log('Befehle konnten nicht registriert werden: ' + e.message); }
  updateStatus(); setInterval(updateStatus, 30e3);
});

client.on(Events.InteractionCreate, async (i) => {
  const isAnn = (i.isChatInputCommand() && i.commandName === 'ankündigung') || i.isMessageContextMenuCommand() || ((i.isModalSubmit() || i.isButton()) && i.customId.startsWith('ann:'));
  if (!isAnn && !i.isChatInputCommand()) return;
  try { if (isAnn) await handleAnnouncement(i); else await handle(i); }
  catch (e) {
    console.log('Befehl /' + i.commandName + ': ' + e.message);
    if (!i.replied) i.reply({ flags: MessageFlags.Ephemeral, content: 'Da ist etwas schiefgelaufen. Bitte versuch es gleich noch einmal.' }).catch(() => {});
  }
});

// ------------------------------------------------------------ Neue Beiträge in den Foren
const TAG_BY_PREFIX = [['🐞', 'Bug'], ['❓', 'Frage'], ['💡', 'Idee']];
client.on(Events.ThreadCreate, async (thread, newlyCreated) => {
  try {
    if (!newlyCreated || thread.guildId !== GUILD || thread.ownerId === client.user.id) return;
    const forum = thread.parent;
    if (!forum || forum.type !== ChannelType.GuildForum) return;
    await new Promise((r) => setTimeout(r, 1500)); // Startnachricht abwarten
    if (forum.name.includes('bug-reports')) {
      // Meldungen aus der App bekommen automatisch den passenden Tag
      const hit = TAG_BY_PREFIX.find(([p]) => thread.name.startsWith(p));
      const tag = hit && forum.availableTags.find((t) => t.name === hit[1]);
      if (tag && !thread.appliedTags.includes(tag.id)) await thread.setAppliedTags([...thread.appliedTags, tag.id].slice(0, 5)).catch(() => {});
      await thread.send({ embeds: [embed('Danke für deine Meldung', 'Das Team hat sie erhalten und schaut sie sich an. Du wirst hier benachrichtigt, sobald es Neuigkeiten gibt.\n\n🔍 **Bestätigt**  Fehler lässt sich nachstellen\n🔧 **In Arbeit**  Wird gerade behoben\n✅ **Behoben**  Ist im nächsten Update enthalten')] });
    } else if (forum.name.includes('hilfe')) {
      await thread.send({ embeds: [embed('Danke für deine Frage', 'Die Community und das Team helfen dir so schnell wie möglich. Ein Screenshot und die Diagnose aus der App (`/diagnose`) machen es leichter.\n\nWenn deine Frage gelöst ist, setz bitte den Tag **✅ Gelöst**.')] });
    } else if (forum.name.includes('feature')) {
      await thread.send({ embeds: [embed('Danke für deinen Wunsch', 'Andere können ihn jetzt mit 👍 unterstützen. Die beliebtesten Wünsche werden zuerst umgesetzt.')] });
    }
  } catch (e) { console.log('Foren-Begrüßung: ' + e.message); }
});

process.on('unhandledRejection', (e) => console.log('Fehler: ' + (e && e.message)));
client.login(TOKEN);
