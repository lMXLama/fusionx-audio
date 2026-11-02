// Equalizer für den ganzen PC-Sound über Equalizer APO (kostenlos, Open Source, GPL).
// Equalizer APO hängt sich als Audio-Effekt direkt in Windows ein – ohne Verzögerung und für alle Apps.
// Fusion-X schreibt nur seine eigene Datei "fusionx.txt" und bindet sie in config.txt ein.

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const OWN_FILE = 'fusionx.txt';
const MARK = '# Fusion-X Audio';
const DOWNLOAD_URL = 'https://sourceforge.net/projects/equalizerapo/files/latest/download';
const HOME_URL = 'https://sourceforge.net/projects/equalizerapo/';

function regQuery(key, value) {
  return new Promise((resolve) => {
    execFile('reg', ['query', key, '/v', value], { windowsHide: true }, (err, out) => {
      if (err) return resolve(null);
      const m = String(out).match(new RegExp(value + '\\s+REG_\\w+\\s+(.+)', 'i'));
      resolve(m ? m[1].trim() : null);
    });
  });
}

async function locate() {
  if (process.platform !== 'win32') return null;
  const keys = ['HKLM\\SOFTWARE\\EqualizerAPO', 'HKLM\\SOFTWARE\\WOW6432Node\\EqualizerAPO'];
  let install = null, config = null;
  for (const k of keys) {
    install = install || await regQuery(k, 'InstallPath');
    config = config || await regQuery(k, 'ConfigPath');
  }
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  install = install || path.join(pf, 'EqualizerAPO');
  config = config || path.join(install, 'config');
  if (!fs.existsSync(path.join(install, 'EqualizerAPO.dll')) && !fs.existsSync(config)) return null;
  return { install, config };
}

function canWrite(dir) {
  const probe = path.join(dir, '.fusionx-probe');
  try { fs.writeFileSync(probe, 'x'); fs.unlinkSync(probe); return true; } catch (_) { return false; }
}

async function status() {
  const loc = await locate();
  if (!loc) return { installed: false, downloadUrl: DOWNLOAD_URL, homeUrl: HOME_URL };
  let included = false;
  try { included = fs.readFileSync(path.join(loc.config, 'config.txt'), 'utf8').includes(OWN_FILE); } catch (_) {}
  const selector = ['DeviceSelector.exe', 'Configurator.exe'].map((f) => path.join(loc.install, f)).find((f) => fs.existsSync(f)) || null;
  return { installed: true, configPath: loc.config, writable: canWrite(loc.config), included, selector, downloadUrl: DOWNLOAD_URL, homeUrl: HOME_URL };
}

// Einmalig Schreibrechte für den config-Ordner holen (Windows fragt nach Administrator-Erlaubnis)
function grantWrite(dir) {
  return new Promise((resolve) => {
    const cmd = 'Start-Process icacls -ArgumentList @(\'"' + dir.replace(/'/g, "''") + '"\',\'/grant\',\'*S-1-5-32-545:(OI)(CI)M\') -Verb RunAs -Wait -WindowStyle Hidden';
    execFile('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cmd], { windowsHide: true }, () => resolve(canWrite(dir)));
  });
}

async function apply(text) {
  const loc = await locate();
  if (!loc) throw new Error('Equalizer APO ist nicht installiert');
  if (!canWrite(loc.config) && !(await grantWrite(loc.config))) throw new Error('Keine Schreibrechte für den Equalizer-APO-Ordner');
  const cfg = path.join(loc.config, 'config.txt');
  let cur = '';
  try { cur = fs.readFileSync(cfg, 'utf8'); } catch (_) {}
  if (!cur.includes(OWN_FILE)) {
    // Bisherige Einstellung sichern, dann nur noch die Fusion-X-Datei einbinden
    const backup = path.join(loc.config, 'config.vor-fusionx.txt');
    if (cur && !fs.existsSync(backup)) fs.writeFileSync(backup, cur);
    fs.writeFileSync(cfg, MARK + '\r\n# Wird von Fusion-X gesteuert. Deine alte Einstellung liegt in config.vor-fusionx.txt\r\nInclude: ' + OWN_FILE + '\r\n');
  }
  fs.writeFileSync(path.join(loc.config, OWN_FILE), String(text || '').replace(/\r?\n/g, '\r\n'));
  return true;
}

// Ursprüngliche config.txt zurückholen
async function restore() {
  const loc = await locate();
  if (!loc) return false;
  const backup = path.join(loc.config, 'config.vor-fusionx.txt');
  const cfg = path.join(loc.config, 'config.txt');
  try {
    if (fs.existsSync(backup)) fs.writeFileSync(cfg, fs.readFileSync(backup));
    else fs.writeFileSync(cfg, '');
    return true;
  } catch (_) { return false; }
}

module.exports = { status, apply, restore, DOWNLOAD_URL, HOME_URL };
