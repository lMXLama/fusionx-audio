// Verbindung zu OBS Studio über den eingebauten WebSocket-Server (obs-websocket 5, ab OBS 28).
// Fusion-X baut damit den Stream-Mix: pro App eine "Anwendungsaudioaufnahme" mit eigener Lautstärke.

const crypto = require('crypto');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

const sha256b64 = (s) => crypto.createHash('sha256').update(s).digest('base64');

class ObsClient extends EventEmitter {
  constructor() {
    super();
    this.ws = null;
    this.cfg = { enabled: false, host: '127.0.0.1', port: 4455, password: '' };
    this.state = 'off'; // off | connecting | auth | ok | error
    this.error = '';
    this.version = null;
    this.pending = new Map();
    this.nextId = 1;
    this.retryT = null;
  }

  configure(cfg) {
    const prev = JSON.stringify(this.cfg);
    this.cfg = { ...this.cfg, ...(cfg || {}) };
    if (JSON.stringify(this.cfg) === prev && (this.state === 'ok' || this.state === 'connecting')) return this.status();
    this.disconnect(true);
    if (this.cfg.enabled) this.connect();
    else this.setState('off', '');
    return this.status();
  }

  status() { return { state: this.state, error: this.error, version: this.version }; }

  setState(s, err) {
    this.state = s; this.error = err || '';
    this.emit('status', this.status());
  }

  connect() {
    clearTimeout(this.retryT);
    const url = 'ws://' + (this.cfg.host || '127.0.0.1') + ':' + (+this.cfg.port || 4455);
    this.setState('connecting', '');
    let ws;
    try { ws = new WebSocket(url, 'obswebsocket.json', { handshakeTimeout: 4000 }); } catch (e) { return this.fail(e.message); }
    this.ws = ws;
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(String(raw)); } catch (_) { return; }
      this.onMessage(m);
    });
    ws.on('error', (e) => {
      const msg = /ECONNREFUSED/.test(e.message) ? 'OBS läuft nicht oder der WebSocket-Server ist aus' : e.message;
      this.fail(msg);
    });
    ws.on('close', (code, reason) => {
      if (this.ws !== ws) return;
      this.ws = null;
      for (const p of this.pending.values()) { clearTimeout(p.t); p.reject(new Error('Verbindung zu OBS getrennt')); }
      this.pending.clear();
      if (code === 4009) this.fail('Falsches OBS-Passwort');
      else if (this.state === 'ok') this.fail('OBS wurde geschlossen');
      else if (this.state !== 'error') this.fail(String(reason || '') || 'OBS nicht erreichbar');
    });
  }

  fail(msg) {
    if (this.ws) { const w = this.ws; this.ws = null; try { w.terminate(); } catch (_) {} }
    this.version = null;
    this.setState('error', msg);
    clearTimeout(this.retryT);
    // Falsches Passwort nicht ständig wiederholen, sonst automatisch neu verbinden
    if (this.cfg.enabled && !/Passwort/.test(msg)) this.retryT = setTimeout(() => this.connect(), 5000);
  }

  disconnect(silent) {
    clearTimeout(this.retryT);
    if (this.ws) { const w = this.ws; this.ws = null; try { w.close(); } catch (_) {} }
    this.version = null;
    if (!silent) this.setState('off', '');
  }

  onMessage(m) {
    const d = m.d || {};
    if (m.op === 0) { // Hello
      const ident = { rpcVersion: 1, eventSubscriptions: (1 << 0) | (1 << 2) | (1 << 3) };
      if (d.authentication) {
        if (!this.cfg.password) { this.fail('OBS verlangt ein Passwort'); return; }
        ident.authentication = sha256b64(sha256b64(this.cfg.password + d.authentication.salt) + d.authentication.challenge);
      }
      this.setState('auth', '');
      this.send(1, ident);
    } else if (m.op === 2) { // Identified
      this.request('GetVersion').then((v) => {
        this.version = { obs: v.obsVersion, ws: v.obsWebSocketVersion, platform: v.platform };
        this.setState('ok', '');
      }).catch((e) => this.fail(e.message));
    } else if (m.op === 5) { // Event
      this.emit('event', { type: d.eventType, data: d.eventData || {} });
    } else if (m.op === 9) { // RequestBatchResponse
      const p = this.pending.get(d.requestId);
      if (p) { this.pending.delete(d.requestId); clearTimeout(p.t); p.resolve({ results: d.results || [] }); }
    } else if (m.op === 7) { // RequestResponse
      const p = this.pending.get(d.requestId);
      if (!p) return;
      this.pending.delete(d.requestId); clearTimeout(p.t);
      const st = d.requestStatus || {};
      if (st.result) p.resolve(d.responseData || {});
      else { const e = new Error(st.comment || ('OBS-Fehler ' + st.code)); e.code = st.code; p.reject(e); }
    }
  }

  send(op, d) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ op, d })); }

  request(type, data, timeoutMs = 5000) {
    if (!this.ws || this.ws.readyState !== 1) return Promise.reject(new Error('Nicht mit OBS verbunden'));
    const id = 'fx' + (this.nextId++);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error('OBS antwortet nicht (' + type + ')')); }, timeoutMs);
      this.pending.set(id, { resolve, reject, t });
      this.send(6, { requestType: type, requestId: id, requestData: data || {} });
    });
  }

  // Mehrere Anfragen in einem Rutsch (Fehler einzelner Anfragen brechen nicht ab)
  batch(list) {
    if (!list.length) return Promise.resolve([]);
    if (!this.ws || this.ws.readyState !== 1) return Promise.reject(new Error('Nicht mit OBS verbunden'));
    const id = 'fxb' + (this.nextId++);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error('OBS antwortet nicht')); }, 8000);
      this.pending.set(id, { resolve: (r) => resolve(r.results || []), reject, t });
      this.send(8, { requestId: id, haltOnFailure: false, requests: list.map((r) => ({ requestType: r[0], requestData: r[1] || {} })) });
    });
  }
}

module.exports = { ObsClient };
