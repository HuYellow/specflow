import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopViewLocation } from './view-state.ts';
import type { Locale } from '../../packages/i18n/index.ts';

contextBridge.exposeInMainWorld('specflowDesktop', Object.freeze({
  platform: process.platform,
  initialLocale: ipcRenderer.sendSync('specflow:initial-locale') as Locale,
  readLocale: (): Promise<Locale> => ipcRenderer.invoke('specflow:read-locale'),
  setLocale: (locale: Locale): Promise<Locale> => ipcRenderer.invoke('specflow:set-locale', locale),
  pickRepository: (): Promise<string | null> => ipcRenderer.invoke('specflow:pick-repository'),
  openDataDirectory: (): Promise<void> => ipcRenderer.invoke('specflow:open-data'),
  exportEvidence: (workItemId: string): Promise<void> => ipcRenderer.invoke('specflow:export', workItemId),
  readView: (workItemId: string): Promise<DesktopViewLocation | null> => ipcRenderer.invoke('specflow:read-view', workItemId),
  saveView: (view: DesktopViewLocation): Promise<void> => ipcRenderer.invoke('specflow:save-view', view),
}));
