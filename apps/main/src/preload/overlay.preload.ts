import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('aiGirlOverlay', {
  // reserved for mouth/caption events later
});
