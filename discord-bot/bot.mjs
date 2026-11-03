// Fusion-X Discord-Bot: hält den Bot online, zeigt einen Status, beantwortet Slash-Befehle
// und begrüßt neue Beiträge in den Support-Foren. Start: npm install && npm start
import { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, SlashCommandBuilder, MessageFlags, Events } from 'discord.js';
import { readFileSync, existsSync } from 'node:fs';

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
  new SlashCommandBuilder().setName('diagnose').setDescription('So kopierst du die technischen Infos aus der App')
].map((c) => c.toJSON());

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
  if (!i.isChatInputCommand()) return;
  try { await handle(i); }
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
