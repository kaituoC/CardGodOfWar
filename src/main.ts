import { app, BrowserWindow, ipcMain, nativeImage } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs'

const SAVE_DIR = join(homedir(), '.cardgodofwar', 'saves')

function ensureSaveDir() {
  if (!existsSync(SAVE_DIR)) {
    mkdirSync(SAVE_DIR, { recursive: true })
  }
}

function getSavePath(slot: number | 'auto'): string {
  const name = slot === 'auto' ? 'autosave.json' : `save_${slot}.json`
  return join(SAVE_DIR, name)
}

function getAppIconPath(): string | undefined {
  const iconPath = join(process.cwd(), 'assets', 'icon.png')
  return existsSync(iconPath) ? iconPath : undefined
}

function applyDockIcon() {
  const iconPath = getAppIconPath()
  if (process.platform !== 'darwin' || !iconPath) return

  const icon = nativeImage.createFromPath(iconPath)
  if (!icon.isEmpty()) {
    app.dock.setIcon(icon)
  }
}

function createWindow() {
  const iconPath = getAppIconPath()
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: iconPath,
    webPreferences: { preload: join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: false },
  })
  win.once('ready-to-show', () => {
    win.show()
  })
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ensureSaveDir()
  applyDockIcon()

  ipcMain.handle('save-game', (_event, slot: number | 'auto', data: unknown) => {
    try {
      ensureSaveDir()
      writeFileSync(getSavePath(slot), JSON.stringify(data, null, 2), 'utf-8')
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('load-game', (_event, slot: number | 'auto') => {
    const path = getSavePath(slot)
    if (!existsSync(path)) return null
    try {
      return JSON.parse(readFileSync(path, 'utf-8'))
    } catch {
      return null
    }
  })

  ipcMain.handle('has-auto-save', () => {
    return existsSync(getSavePath('auto'))
  })

  ipcMain.handle('list-saves', () => {
    ensureSaveDir()
    const files = readdirSync(SAVE_DIR)
    return files
      .filter(f => f.startsWith('save_') && f.endsWith('.json'))
      .map(f => {
        const match = f.match(/^save_(\d+)\.json$/)
        return match ? { slot: parseInt(match[1], 10), filename: f } : null
      })
      .filter(Boolean)
  })

  createWindow()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
