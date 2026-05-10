/// <reference types="vite/client" />

interface ElectronAPI {
  saveGame(slot: number | 'auto', data: any): Promise<boolean>
  loadGame(slot: number | 'auto'): Promise<any>
  hasAutoSave(): Promise<boolean>
  listSaves(): Promise<Array<{ slot: number; filename: string }>>
}

interface Window {
  electronAPI: ElectronAPI
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
