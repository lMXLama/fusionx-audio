// Baut native/FusionAudioHelper.exe neu (nur unter Windows nötig, falls du den C#-Code änderst).
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const csc = ['Framework64', 'Framework'].map((f) => path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', f, 'v4.0.30319', 'csc.exe')).find((p) => fs.existsSync(p));
if (!csc) { console.error('csc.exe nicht gefunden (.NET Framework 4 fehlt).'); process.exit(1); }
const dir = path.join(__dirname, '..', 'native');
execFileSync(csc, ['/nologo', '/optimize+', '/platform:anycpu', '/target:exe', '/r:System.Drawing.dll', '/r:System.Web.Extensions.dll', '/out:' + path.join(dir, 'FusionAudioHelper.exe'), path.join(dir, 'FusionAudioHelper.cs')], { stdio: 'inherit' });
console.log('FusionAudioHelper.exe gebaut.');
