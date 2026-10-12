import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('specflowDesktop', Object.freeze({
  platform: process.platform,
  pickRepository: (): Promise<string | null> => ipcRenderer.invoke('specflow:pick-repository'),
  openDataDirectory: (): Promise<void> => ipcRenderer.invoke('specflow:open-data'),
  exportEvidence: (workItemId: string): Promise<void> => ipcRenderer.invoke('specflow:export', workItemId),
}));
