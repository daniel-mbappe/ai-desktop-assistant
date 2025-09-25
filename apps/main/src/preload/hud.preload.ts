import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('aiGirl', {
  quit: () => ipcRenderer.invoke('aiGirl/app/quit'),

  onStatus: (cb: (s: any) => void) => {
    const listener = (_: any, data: any) => cb(data);
    ipcRenderer.on('aiGirl/status', listener);
    return () => ipcRenderer.off('aiGirl/status', listener);
  },

  // NEW: mic control (optional for now)
  mic: {
    start: () => ipcRenderer.invoke('aiGirl/mic/start'),
    stop: () => ipcRenderer.invoke('aiGirl/mic/stop'),
  },

  // NEW: send PCM16 audio chunks to main
  sendAudioChunk: (buf: ArrayBuffer, timestamp: number) =>
    ipcRenderer.send('aiGirl/stt/chunk', buf, timestamp),
});