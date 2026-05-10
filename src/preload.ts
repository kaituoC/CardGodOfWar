import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveGame: (slot: number | 'auto', data: any) => ipcRenderer.invoke('save-game', slot, data),
  loadGame: (slot: number | 'auto') => ipcRenderer.invoke('load-game', slot),
  hasAutoSave: () => ipcRenderer.invoke('has-auto-save'),
  listSaves: () => ipcRenderer.invoke('list-saves'),
})
