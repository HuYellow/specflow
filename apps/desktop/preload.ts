import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopViewLocation } from './view-state.ts';

contextBridge.exposeInMainWorld('specflowDesktop', Object.freeze({
  platform: process.platform,
  pickRepository: (): Promise<string | null> => ipcRenderer.invoke('specflow:pick-repository'),
  openDataDirectory: (): Promise<void> => ipcRenderer.invoke('specflow:open-data'),
  exportEvidence: (workItemId: string): Promise<void> => ipcRenderer.invoke('specflow:export', workItemId),
  readView: (workItemId: string): Promise<DesktopViewLocation | null> => ipcRenderer.invoke('specflow:read-view', workItemId),
  saveView: (view: DesktopViewLocation): Promise<void> => ipcRenderer.invoke('specflow:save-view', view),
}));
