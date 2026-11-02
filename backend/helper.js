// Verbindung zum Windows-Audio-Helfer (native/FusionAudioHelper.exe).
// Startet den Helfer, schickt JSON-Befehle und ordnet die Antworten zu.
// Falls die mitgelieferte .exe fehlt oder blockiert wird, baut sie sich mit dem
// in Windows enthaltenen C#-Compiler (csc.exe aus .NET Framework 4) selbst neu.

const { spawn, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { EventEmitter } = require('events');

class AudioHelper extends EventEmitter {
  constructor({ appPath, userDataPath, isPackaged, resourcesPath }) {
    super();
    const nativeDir = isPackaged
      ? path.join(resourcesPath, 'app.asar.unpacked', 'native')
      : path.join(appPath, 'native');
    this.bundledExe = path.join(nativeDir, 'FusionAudioHelper.exe');
    this.sourceFile = path.join(nativeDir, 'FusionAudioHelper.cs');
    this.compiledExe = path.join(userDataPath, 'helper', 'FusionAudioHelper.exe');
    this.proc = null;
    this.pending = new Map();
    this.nextId = 1;
    this.ready = false;
    this.restarts = 0;
    this.stopping = false;
    this.info = null;
  }

  async start() {
    const candidates = [this.bundledExe, this.compiledExe].filter((p) => fs.existsSync(p));
    for (const exe of candidates) {
      if (await this.tryLaunch(exe)) return this.info;
    }
    // Letzter Versuch: selbst kompilieren
    await this.compile();
    if (await this.tryLaunch(this.compiledExe)) return this.info;
    throw new Error('Der Audio-Helfer konnte nicht gestartet werden.');
  }

  tryLaunch(exe) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok) => { if (!settled) { settled = true; clearTimeout(timer); resolve(ok); } };
      let proc;
      try {
        proc = spawn(exe, [], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (e) {
        return done(false);
      }
      const timer = setTimeout(() => { try { proc.kill(); } catch (_) {} done(false); }, 10000);
      proc.on('error', () => done(false));
      proc.stderr.on('data', (d) => this.emit('log', String(d)));
      const rl = readline.createInterface({ input: proc.stdout });
      rl.on('line', (line) => {
        let msg;
        try { msg = JSON.parse(line); } catch (_) { return; }
        if (msg.event === 'ready') {
          this.proc = proc;
          this.exe = exe;
          this.ready = true;
          this.call('hello').then((info) => { this.info = info; done(true); }).catch(() => done(true));
          return;
        }
        if (msg.event === 'fatal') { this.emit('log', msg.detail); done(false); return; }
        if (msg.event === 'key') { this.emit('key', msg); return; }
        if (msg.id != null && this.pending.has(msg.id)) {
          const p = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          clearTimeout(p.timer);
          if (msg.ok) p.resolve(msg.result); else p.reject(new Error(msg.error || 'Unbekannter Fehler'));
        }
      });
      proc.on('exit', (code) => {
        if (this.proc === proc) {
          this.proc = null;
          this.ready = false;
          for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('Audio-Helfer beendet')); }
          this.pending.clear();
          this.emit('exit', code);
          if (!this.stopping && this.restarts < 5) {
            this.restarts++;
            setTimeout(() => this.tryLaunch(exe).then((ok) => ok && this.emit('restarted')), 800 * this.restarts);
          }
        }
        done(false);
      });
    });
  }

  compile() {
    const csc = ['Framework64', 'Framework']
      .map((f) => path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', f, 'v4.0.30319', 'csc.exe'))
      .find((p) => fs.existsSync(p));
    if (!csc || !fs.existsSync(this.sourceFile)) return Promise.resolve(false);
    fs.mkdirSync(path.dirname(this.compiledExe), { recursive: true });
    return new Promise((resolve) => {
      execFile(csc, [
        '/nologo', '/optimize+', '/platform:anycpu', '/target:exe',
        '/r:System.Drawing.dll', '/r:System.Web.Extensions.dll',
        '/out:' + this.compiledExe, this.sourceFile
      ], { windowsHide: true }, (err, stdout) => {
        if (err) this.emit('log', 'Kompilieren fehlgeschlagen: ' + stdout);
        resolve(!err);
      });
    });
  }

  call(cmd, args = {}, timeoutMs = 5000) {
    if (!this.proc) return Promise.reject(new Error('Audio-Helfer läuft nicht'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Zeitüberschreitung bei ' + cmd));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.proc.stdin.write(JSON.stringify({ ...args, id, cmd }) + '\n');
    });
  }

  stop() {
    this.stopping = true;
    if (this.proc) {
      try { this.proc.stdin.write('{"cmd":"quit"}\n'); } catch (_) {}
      const p = this.proc;
      setTimeout(() => { try { p.kill(); } catch (_) {} }, 500);
    }
  }
}

module.exports = { AudioHelper };
