// Lädt VB-CABLE (Donationware von VB-Audio, https://vb-audio.com/Cable/) von der offiziellen
// Seite, prüft die digitale Signatur und startet die Installation mit Administratorrechten.
// Windows zeigt dabei die übliche Nachfrage (UAC) und die Treiber-Bestätigung.

const { net } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const URLS = [
  'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip',
  'https://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack43.zip'
];

function run(file, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(file, args, { windowsHide: true, timeout: opts.timeout || 120000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ err, stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}
const ps = (script, timeout) => run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { timeout });
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

async function download(url, dest, onProgress) {
  const res = await net.fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error('Download fehlgeschlagen (HTTP ' + res.status + ')');
  const total = +res.headers.get('content-length') || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
    got += value.length;
    if (total) onProgress(Math.min(1, got / total));
  }
  const buf = Buffer.concat(chunks);
  if (buf.length < 100000 || buf[0] !== 0x50 || buf[1] !== 0x4b) throw new Error('Die heruntergeladene Datei ist kein gültiges Treiberpaket');
  fs.writeFileSync(dest, buf);
}

function findSetup(dir) {
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else files.push(p); } })(dir);
  const want = process.arch === 'arm64' ? /vbcable_setup_arm64\.exe$/i : process.arch === 'ia32' ? /vbcable_setup\.exe$/i : /vbcable_setup_x64\.exe$/i;
  return files.find((f) => want.test(f)) || files.find((f) => /vbcable_setup.*\.exe$/i.test(f));
}

async function installVbCable({ workDir, onProgress }) {
  if (process.platform !== 'win32') throw new Error('Die automatische Installation gibt es nur unter Windows.');
  const step = (phase, pct) => onProgress && onProgress({ phase, pct });
  fs.rmSync(workDir, { recursive: true, force: true });
  fs.mkdirSync(workDir, { recursive: true });
  const zip = path.join(workDir, 'vbcable.zip');

  // 1. Herunterladen
  let lastErr = null;
  for (const url of URLS) {
    try { step('download', 0); await download(url, zip, (p) => step('download', p)); lastErr = null; break; }
    catch (e) { lastErr = e; }
  }
  if (lastErr) throw new Error('VB-CABLE konnte nicht heruntergeladen werden: ' + lastErr.message);

  // 2. Entpacken (tar.exe ist seit Windows 10 1803 dabei, sonst PowerShell)
  step('extract', null);
  const out = path.join(workDir, 'pack');
  fs.mkdirSync(out, { recursive: true });
  const tarExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  let r = fs.existsSync(tarExe) ? await run(tarExe, ['-xf', zip, '-C', out]) : { err: true };
  if (r.err) r = await ps('Expand-Archive -LiteralPath ' + q(zip) + ' -DestinationPath ' + q(out) + ' -Force');
  const setup = findSetup(out);
  if (!setup) throw new Error('Im Treiberpaket wurde kein Installationsprogramm gefunden.');

  // 3. Signatur prüfen: nur echte, gültig signierte VB-Audio-Dateien werden gestartet
  step('verify', null);
  r = await ps('$s = Get-AuthenticodeSignature -LiteralPath ' + q(setup) + '; "$($s.Status)|$($s.SignerCertificate.Subject)"');
  const [status, subject] = r.stdout.trim().split('|');
  if (status !== 'Valid' || !/vb-audio|burel/i.test(subject || '')) {
    throw new Error('Die Signatur des Installationsprogramms ist ungültig (' + (status || 'unbekannt') + '). Installation abgebrochen.');
  }

  // 4. Installieren (mit Windows-Nachfrage)
  step('install', null);
  r = await ps('try { $p = Start-Process -FilePath ' + q(setup) + " -ArgumentList '-i','-h' -Verb RunAs -Wait -PassThru; exit $p.ExitCode } catch { exit 1223 }", 300000);
  const code = r.err && typeof r.err.code === 'number' ? r.err.code : 0;
  if (code === 1223) throw new Error('Die Windows-Nachfrage wurde abgebrochen oder die Installation konnte nicht starten. Ohne Bestätigung kann der Treiber nicht installiert werden.');
  step('done', 1);
  return { ok: true, setup: path.basename(setup) };
}

module.exports = { installVbCable };
