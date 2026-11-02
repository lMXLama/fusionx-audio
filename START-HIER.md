# Fusion-X Audio

Sound-Zentrale für Windows 10 und 11. Jede App einzeln regeln, die eigene Stimme klar und rauschfrei machen, Geräte mit einem Klick wechseln, alles auch per Stream Deck.

**Ein Audio-Interface ist nicht nötig.** Fusion-X funktioniert genauso mit Gaming-Headset, USB-Mikro, Laptop-Mikro, Webcam oder einem Mikro an der Klinke. Ist ein Interface da, erkennt Fusion-X es und arbeitet mit ihm zusammen.

## Installieren (für Nutzer)

1. `Fusion-X Audio Setup 1.1.0.exe` starten.
2. Windows zeigt eventuell „Der Computer wurde durch Windows geschützt“. Das kommt, weil der Installer noch nicht digital signiert ist. Auf **Weitere Informationen → Trotzdem ausführen** klicken.
3. Beim ersten Start führt ein Assistent durch die Einrichtung (ca. 1 Minute).

Damit Discord, OBS, Teams und Spiele die **bearbeitete** Stimme bekommen, braucht Windows ein virtuelles Mikrofon. Fusion-X installiert es selbst: im Assistenten oder auf der Mikrofon-Seite auf **Automatisch installieren** klicken und die zwei Windows-Abfragen mit „Ja“ bzw. „Installieren“ bestätigen. Fusion-X lädt dafür den Treiber VB-CABLE von der offiziellen Seite vb-audio.com, prüft die digitale Signatur von VB-Audio, installiert ihn und schaltet das virtuelle Mikro danach automatisch ein. Zeigt Windows das Gerät erst nach einem Neustart an, aktiviert Fusion-X es beim nächsten Start von selbst. In den Apps bleibt das Eingabegerät einfach auf „Standard“.

VB-CABLE ist Donationware von VB-Audio. Diese Art der Installation (Download von der offiziellen Seite mit Hinweis auf Herkunft und Donationware) erlaubt VB-Audio ausdrücklich. Wird Fusion-X später von einer Firma in großem Stil verkauft, bittet VB-Audio um eine Lizenzgebühr (siehe vb-audio.com/Services/licensing.htm).

Probleme? **Einstellungen → Info & Diagnose → Diagnose kopieren** und den Text weitergeben.

## Was die App kann

| Bereich | Funktionen |
|---|---|
| Mixer | Lautstärke und Stumm pro App mit echten App-Symbolen, Live-Pegel, Ausgabegerät pro App (z. B. Spotify auf Lautsprecher, Spiel auf Kopfhörer), Gesamtlautstärke |
| Stimme | Kanalwahl fürs Interface (Mikro nur an Eingang 1 wird automatisch erkannt), Rauschunterdrückung in 3 Stufen (Speex, KI RNNoise, KI GTCRN), Störgeräusch-Sperre, EQ, Kompressor, De-Esser, Übersteuerungsschutz, Mithören |
| Mikro-Check | 10 Sekunden: misst Raumrauschen und Stimme, stellt Lautstärke, Gate, Rauschfilter und Interface-Eingang automatisch ein |
| Testaufnahme | Vorher/Nachher direkt vergleichen |
| Beim Sprechen leiser | Spiele, Musik und Browser werden automatisch leiser, wenn du sprichst. Discord und Co. nie |
| Geräte | Erkennt Audio-Interfaces (Focusrite, UA, Behringer, PreSonus, Steinberg, Audient, MOTU, RME, NI, Arturia, SSL, Yamaha, RØDE, GoXLR …), USB-Mikros, Headsets, Bluetooth, Virtuelles. Zeigt Abtastrate und Bit-Tiefe, ASIO-Treiber, warnt bei 44,1/48-kHz-Mix, Bluetooth-Telefonqualität und getrennten Anruf-Geräten |
| Profile | Gaming, Streaming, Meeting, Musik und eigene. Wechseln automatisch, wenn ein Spiel, OBS oder Teams startet |
| Ohne Interface | Erkennt Headset-, USB-, Laptop-, Webcam-, Klinken- und Bluetooth-Mikros und gibt passende Tipps. Regler für den Windows-Mikrofonpegel. Der Mikro-Check hebt einen zu niedrigen Windows-Pegel automatisch an |
| Sprechtaste | Push-to-Talk für alle Apps gleichzeitig (Halten = sprechen oder Halten = stumm), auch mit Maus-Seitentasten und Mausrad-Klick, Nachlauf einstellbar, Signalton |
| Soundboard | Eigene Sounds per Drag & Drop (MP3, WAV, OGG), getrennte Lautstärke für dich und für andere, Farbe, Tastenkürzel und Stream-Deck-Taste pro Sound, „Alle stoppen“ |
| Bildschirm-Anzeige | Kleine Einblendung über Spielen (Fenster/randlos) bei Stumm, Sprechtaste, Profilwechsel, Lautstärke. Oben oder unten |
| Stumm-Erinnerung | Meldet sich, wenn du sprichst, dein Mikro aber stumm ist |
| Signaltöne | Kurzer Ton beim Stummschalten und Einschalten, nur für dich hörbar |
| Lautstärken merken | Windows setzt App-Lautstärken gern zurück. Fusion-X stellt sie beim nächsten Start der App wieder her |
| Lieblingsgeräte | Stern an Kopfhörer/Mikro: springt Windows nach Neustart oder Einstecken aufs falsche Gerät, stellt Fusion-X es zurück |
| Stream Deck | Eigenes Plugin mit 9 Aktionen (inkl. Soundboard), Live-Anzeige auf den Tasten und Drehregler-Unterstützung fürs Stream Deck+ |
| Stream-Mix | Zweiter Regler pro App: links das, was du hörst, rechts das, was dein Stream hört (wie Sonar/Wave Link). Läuft über OBS (ab Version 28), ohne Zusatz-Treiber. „Nur für dich stumm“ hält eine App im Stream hörbar |
| Equalizer | 10-Band-Equalizer für den ganzen PC-Sound mit 8 Vorlagen (z. B. „Schritte hören“, „Bass-Boost“, „Stimmen klar“). Nutzt das kostenlose Equalizer APO, ohne Verzögerung. Speicherbar in Profilen |
| Updates | Fusion-X sucht selbst nach neuen Versionen, lädt sie im Hintergrund und installiert sie beim Beenden |
| Sprache | Deutsch und Englisch, automatisch nach Windows-Sprache oder fest in den Einstellungen |
| Komfort | Tray-Symbol, 19 globale Tastenkürzel (Strg+Alt+M = Mikro stumm), Autostart, Einfach-/Profi-Modus, Glas-Optik mit durchsichtigem Fenster unter Windows 11 |

## Stream-Mix mit OBS

1. OBS öffnen, **Werkzeuge → WebSocket-Servereinstellungen**, „WebSocket-Server aktivieren“ anhaken.
2. Dort „Verbindungsinformationen anzeigen“ und das Passwort kopieren.
3. In Fusion-X im Mixer **Stream-Mix** einschalten, Passwort einfügen, **Verbinden**.

Fusion-X legt in OBS die Szene „Fusion-X Audio“ an (je App eine Anwendungsaudioaufnahme) und fügt sie unsichtbar in alle Szenen ein. Das OBS-Desktop-Audio wird stummgeschaltet, damit nichts doppelt ist; beim Ausschalten kommt es zurück. „Aus OBS entfernen“ räumt alles wieder weg.

Technik: Die App-Aufnahme in OBS enthält die Windows-Lautstärke der App. Fusion-X rechnet das in OBS wieder heraus (bis +56 dB über Lautstärke und einen Verstärkungs-Filter). Deshalb setzt „nur für dich stumm“ die App für dich auf −56 dB statt auf echtes Stumm.

## Equalizer für den ganzen PC

Einmalig **Equalizer APO** installieren (kostenlos, Open Source, GPL): In Fusion-X auf der Seite **Equalizer** auf „Equalizer APO herunterladen“ klicken, im Setup bei „Device Selector“ Kopfhörer und Lautsprecher anhaken, PC neu starten. Danach steuert Fusion-X den Equalizer. Fusion-X schreibt nur die Datei `fusionx.txt` im Equalizer-APO-Ordner und bindet sie in `config.txt` ein; die alte Einstellung wird als `config.vor-fusionx.txt` gesichert.

## Neue Version veröffentlichen (Updates)

Das Repository ist https://github.com/lMXLama/fusionx-audio. GitHub baut den Installer selbst (Windows-Rechner von GitHub, kostenlos für öffentliche Repos) und veröffentlicht ihn als Release. Alle installierten Fusion-X finden ihn innerhalb von 6 Stunden oder beim nächsten Start und installieren ihn beim Beenden.

1. Änderungen machen und in `package.json` die `version` erhöhen (z. B. 1.1.0 → 1.1.1).
2. Hochladen und ein Tag mit derselben Nummer setzen:
   ```
   git add -A
   git commit -m "Version 1.1.1"
   git tag v1.1.1
   git push origin main --tags
   ```
   Vorher kurz eintragen, was neu ist: in `assets/release-notes.md` (landet automatisch im GitHub-Release, Zeilen mit `EN:` sind die englische Fassung) und in `docs/changelog.json` (für die Website).
3. Auf GitHub unter **Actions** läuft „Release“ (ca. 5–10 Minuten). Danach liegt unter **Releases** die neue Version.

Ein eigener Token ist dafür nicht nötig, GitHub Actions bringt seinen eigenen mit. Ohne Code-Signing zeigt Windows beim allerersten Installieren eine SmartScreen-Warnung; die Updates laufen trotzdem.

## Website

Die Download-Seite liegt im Ordner `docs/` und wird über GitHub Pages veröffentlicht: https://lmxlama.github.io/fusionx-audio/

Einmalig einschalten: im Repo **Settings → Pages**, bei „Source“ **Deploy from a branch**, Branch **main** und Ordner **/docs** wählen, **Save**. Danach ist jede Änderung in `docs/` nach ca. einer Minute online. Die Seite zeigt Version, Größe und Download-Link automatisch aus dem neuesten GitHub-Release.

## Stream Deck

1. Stream-Deck-Software 6.4 oder neuer installieren (elgato.com).
2. In Fusion-X auf der Seite **Stream Deck** auf **Plugin installieren** klicken (oder `streamdeck/Fusion-X.streamDeckPlugin` doppelklicken).
3. In der Stream-Deck-Software erscheint rechts die Kategorie **Fusion-X Audio**. Aktion auf eine Taste ziehen, unten Ziel wählen, fertig.

| Aktion | Taste | Stream Deck+ (Drehregler) |
|---|---|---|
| Mikro stumm | an/aus, wird rot | – |
| Lautstärke | lauter / leiser / stumm für Gesamt, deine Stimme, eine Kategorie (alle Spiele, Musik, Voice-Chat …) oder eine App | drehen = Lautstärke, drücken = stumm, Anzeige mit Balken |
| Profil | festes Profil oder durchschalten, aktives leuchtet | – |
| Klang-Vorlage | Natürlich, Klar, Broadcast, Gaming, Podcast, Funkgerät | – |
| Beim Sprechen leiser | an/aus | – |
| Rauschunterdrückung | durchschalten oder feste Stufe | – |
| Ausgabegerät | Kopfhörer ↔ Lautsprecher oder festes Gerät | – |
| Mithören | an/aus | – |
| Soundboard | spielt einen Sound ab, nochmal drücken stoppt | – |

Bei der Aktion „Lautstärke“ wählst du unter **Mix**, ob die Taste das regelt, was du hörst, oder den Stream-Mix.

Ohne Plugin geht es auch: Stream-Deck-Aktion „System → Hotkey“ mit einem der Tastenkürzel aus den Einstellungen.

**Für andere Tools** (Touch Portal, Bitfocus Companion, eigene Skripte): WebSocket `ws://127.0.0.1:39063`, nur von diesem PC erreichbar.

```
→ {"type":"hello"}
← {"type":"state","data":{"mic":{...},"apps":[...],"master":{...},"profile":{...},"categories":{...}}}
→ {"type":"action","action":"toggleMute"}
→ {"type":"action","action":"volume","target":"cat:game","delta":-10}     Ziele: master, voice, cat:<kategorie>, app:<programm.exe>
→ {"type":"action","action":"mute","target":"app:spotify.exe"}
→ {"type":"action","action":"profile","id":"stream"}
→ {"type":"action","action":"preset","key":"broadcast"}
→ {"type":"action","action":"denoise","mode":"cycle"}                    off · light · ai · studio · cycle
→ {"type":"action","action":"output","device":"cycle"}
→ {"type":"action","action":"volume","target":"app:spotify.exe","delta":5,"mix":"stream"}   Stream-Mix statt eigener Lautstärke
→ {"type":"action","action":"sound","id":"<sound-id>"} / "stopSounds"
→ {"type":"action","action":"toggleDucking"} / "monitor" / "effects" / "nextProfile"
```

## Für Entwickler

Voraussetzung: Node.js 20 oder neuer.

```
npm install        # einmalig
npm start          # App starten (unter Mac/Linux mit simulierten Geräten)
npm run dist       # Windows-Installer bauen → Ordner dist/
npm run pack-streamdeck   # Stream-Deck-Plugin neu packen (Windows/Mac)
```

`Start.bat` macht `npm install` und `npm start` per Doppelklick.

### Aufbau

```
main.js                       Hauptprozess: Fenster, Tray, Tastenkürzel, Autostart, Einstellungen, Bildschirm-Anzeige
preload.js                    sichere Brücke zur Oberfläche
backend/helper.js             startet den Windows-Audio-Helfer und spricht JSON mit ihm
backend/remote.js             lokaler WebSocket für Stream Deck & Co. (Port 39063)
backend/obs.js                Verbindung zu OBS (obs-websocket 5) für den Stream-Mix
backend/eqapo.js              Equalizer APO finden und fusionx.txt schreiben
backend/vbcable.js            VB-CABLE laden, Signatur prüfen, installieren
streamdeck/                   Stream-Deck-Plugin (de.lmx.fusionx.sdPlugin) und fertige .streamDeckPlugin-Datei
native/FusionAudioHelper.cs   C#-Helfer: Core Audio (WASAPI) – Geräte, App-Lautstärken, Pegel,
                              Standardgerät, Ausgabegerät pro App, ASIO-Liste, App-Symbole,
                              Tasten-/Maus-Abfrage für die Sprechtaste
native/FusionAudioHelper.exe  fertig gebaut; fehlt sie, baut Windows sie mit csc.exe selbst
renderer/                     Oberfläche (HTML/CSS/JS ohne Build-Schritt)
  app.js                      Seiten, Logik, Ducking, Profile, Assistent, Mikro-Check
  engine.js                   Stimm-Kette im Web-Audio-Graph
  worklets/fx-voice.js        Gate, De-Esser, Spracherkennung
  classify.js                 Gerätetyp- und App-Erkennung
  mock.js                     simulierte Geräte für Entwicklung und Vorschau
  osd.html / osd.js           Bildschirm-Anzeige über Spielen
  i18n.js / i18n-en.js        Sprachumschaltung und englische Texte
  vendor/noise/               Rauschunterdrückung (MIT, @sapphi-red/web-noise-suppressor)
```

Ändert man den C#-Code: `npm run build-helper` (unter Windows).

## Bitte auf einem echten Windows-PC testen

Oberfläche, Stimm-Kette, Electron-App und Installer-Build sind getestet. Das Stream-Deck-Plugin wurde gegen die echte App mit einem nachgebauten Stream-Deck-Host getestet (Tasten, Drehregler, Einstellungsfenster). Der Windows-Audio-Teil ist kompiliert, konnte aber nicht auf echter Windows-Hardware laufen. Beim ersten Test darauf achten:

1. Erscheinen im Mixer die laufenden Apps mit Symbol, und reagieren die Regler?
2. Wechselt „Ausgabe über“ das Windows-Standardgerät?
3. Funktioniert das Ausgabegerät pro App (z. B. Spotify auf ein anderes Gerät)? Manche Apps brauchen danach einen Neustart.
4. Wird dein Interface auf der Geräte-Seite erkannt?
5. Mit VB-CABLE: „Für alle Apps aktivieren“, dann in Discord testen.
6. Stream Deck: Plugin installieren, „Mikro stumm“ und „Lautstärke“ auf Tasten legen und ausprobieren.
7. Sprechtaste: Taste oder Maus-Seitentaste festlegen, in einem Spiel testen. Läuft das Spiel als Administrator, Fusion-X ebenfalls als Administrator starten.
8. Bildschirm-Anzeige: Spiel im randlosen Fenster starten und Strg+Alt+M drücken.
9. Soundboard: Sound hinzufügen, Stimme „für alle Apps aktivieren“, in Discord abspielen.
10. Stream-Mix: OBS verbinden, Spotify abspielen, in Fusion-X den rechten Regler bewegen und in OBS den Pegel von „Fusion-X · Spotify“ ansehen. Prüfen, ob der Stream-Pegel gleich bleibt, wenn du die Windows-Gesamtlautstärke änderst.
11. Equalizer: Equalizer APO installieren, „Bass-Boost“ wählen und Musik hören.

Fehler stehen unter Einstellungen → Info & Diagnose.

## Für den Verkauf an viele Nutzer

- **Eigenes virtuelles Mikrofon** statt VB-CABLE. VB-CABLE darf ohne Lizenz von VB-Audio nicht mitgeliefert werden. Ein eigener Treiber braucht ein EV-Code-Signing-Zertifikat und die Treiber-Signatur über das Microsoft Partner Center.
- **Code-Signing** für Installer und Helfer. Dann entfällt die SmartScreen-Warnung, und Virenscanner melden sich seltener.
- Absturzberichte.
- Eigener virtueller Audiotreiber: dann gäbe es den Stream-Mix auch als Gerät für jede App (nicht nur OBS) und den Equalizer ohne Equalizer APO. Braucht ein EV-Zertifikat und Microsoft-Signatur.
- Später: Fusion-X-Hardware direkt ansteuern. Geräte mit „Fusion-X“ im Namen erkennt die App bereits.
