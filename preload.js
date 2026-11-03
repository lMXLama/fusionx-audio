// Sichere Brücke zwischen Oberfläche und Hauptprozess
const { contextBridge, ipcRenderer } = require('electron');

const on = (channel) => (cb) => {
  const fn = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};

contextBridge.exposeInMainWorld('fx', {
  isDemo: false,
  init: () => ipcRenderer.invoke('fx:init'),
  call: (cmd, args) => ipcRenderer.invoke('fx:call', cmd, args),
  devices: () => ipcRenderer.invoke('fx:devices'),
  saveSettings: (patch) => ipcRenderer.invoke('fx:settings:set', patch),
  setAutostart: (on) => ipcRenderer.invoke('fx:autostart', on),
  setHotkeys: (map) => ipcRenderer.invoke('fx:hotkeys', map),
  setTray: (state) => ipcRenderer.invoke('fx:tray', state),
  openExternal: (url) => ipcRenderer.invoke('fx:open', url),
  window: (action) => ipcRenderer.invoke('fx:window', action),
  onState: on('fx:state'),
  onDevices: on('fx:devices'),
  onHotkey: on('fx:hotkey'),
  onTray: on('fx:tray'),
  onBackend: on('fx:backend'),
  remoteState: (data) => ipcRenderer.invoke('fx:remote:state', data),
  remoteInfo: () => ipcRenderer.invoke('fx:remote:info'),
  installStreamDeck: () => ipcRenderer.invoke('fx:streamdeck:install'),
  onRemote: on('fx:remote'),
  onRemoteClients: on('fx:remoteClients'),
  diag: () => ipcRenderer.invoke('fx:diag'),
  copyText: (t) => ipcRenderer.invoke('fx:copy', t),
  installVbCable: () => ipcRenderer.invoke('fx:vbcable:install'),
  onVbCable: on('fx:vbcable'),
  onKey: on('fx:key'),
  osd: (data) => ipcRenderer.invoke('fx:osd', data),
  onOsd: on('fx:osd'),
  obsConfig: (cfg) => ipcRenderer.invoke('fx:obs:config', cfg),
  obsStatus: () => ipcRenderer.invoke('fx:obs:status'),
  obsRequest: (type, data) => ipcRenderer.invoke('fx:obs:request', type, data),
  obsBatch: (list) => ipcRenderer.invoke('fx:obs:batch', list),
  onObs: on('fx:obs'),
  eq: (op, text) => ipcRenderer.invoke('fx:eq', op, text),
  update: (op, val) => ipcRenderer.invoke('fx:update', op, val),
  onUpdate: on('fx:update'),
  onVisible: on('fx:visible'),
  report: (r) => ipcRenderer.invoke('fx:report', r)
});
