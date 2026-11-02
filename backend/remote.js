// Fernsteuerung für das Stream Deck (und andere lokale Tools).
// Lokaler WebSocket auf 127.0.0.1:39063 – nur von diesem PC erreichbar.
//
// Fusion-X → Client:  {"type":"state","data":{...}}          bei jeder Änderung
// Client → Fusion-X:  {"type":"hello"}                        liefert sofort den Zustand
//                     {"type":"action","action":"toggleMute"} usw. (siehe START-HIER.md)

const { WebSocketServer } = require('ws');
const { EventEmitter } = require('events');

const PORT = 39063;

class RemoteServer extends EventEmitter {
  constructor() {
    super();
    this.state = null;
    this.stateJson = '';
    this.wss = null;
    this.error = null;
  }

  start() {
    try {
      this.wss = new WebSocketServer({
        host: '127.0.0.1',
        port: PORT,
        maxPayload: 64 * 1024,
        // Webseiten im Browser dürfen nicht mitsteuern, nur lokale Programme wie das Stream Deck
        verifyClient: ({ origin }) => !origin || origin === 'null' || /^(file|qrc|app):/i.test(origin)
      });
    } catch (e) {
      this.error = e.message;
      return;
    }
    this.wss.on('error', (e) => {
      this.error = e.code === 'EADDRINUSE' ? 'Port ' + PORT + ' ist schon belegt' : e.message;
      this.emit('clients', 0);
    });
    this.wss.on('connection', (ws) => {
      this.emit('clients', this.count());
      if (this.stateJson) ws.send(this.stateJson);
      ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(String(raw)); } catch (_) { return; }
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'hello') { if (this.stateJson) ws.send(this.stateJson); return; }
        if (msg.type === 'action' && typeof msg.action === 'string') this.emit('action', msg);
      });
      ws.on('close', () => this.emit('clients', this.count()));
    });
  }

  count() { return this.wss ? this.wss.clients.size : 0; }

  setState(data) {
    const json = JSON.stringify({ type: 'state', data });
    if (json === this.stateJson) return;
    this.stateJson = json;
    if (!this.wss) return;
    for (const c of this.wss.clients) if (c.readyState === 1) c.send(json);
  }

  stop() { if (this.wss) { for (const c of this.wss.clients) c.terminate(); this.wss.close(); } }
}

module.exports = { RemoteServer, PORT };
