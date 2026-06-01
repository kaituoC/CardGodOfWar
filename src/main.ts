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
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: iconPath,
    webPreferences: { preload: join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: false },
  })

  // 兜底计时器：即使始终未触发 ready-to-show（例如 renderer 持续加载失败），
  // 也强制显示窗口，避免"终端无报错但窗口永不出现"的静默黑屏。
  const forceShow = setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) win.show()
  }, 8000)

  win.once('ready-to-show', () => {
    clearTimeout(forceShow)
    win.show()
    if (devServerUrl) win.webContents.openDevTools({ mode: 'detach' })
  })

  const loadRenderer = () => {
    if (win.isDestroyed()) return
    if (devServerUrl) {
      win.loadURL(devServerUrl)
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  // dev 下 dev server 可能尚未就绪，加载失败时自动重试，避免首次竞态导致黑屏。
  if (devServerUrl) {
    let retries = 0
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      if (win.isDestroyed() || errorCode === -3) return // -3 = ERR_ABORTED，正常导航中断，忽略
      if (retries < 10) {
        retries += 1
        console.error(`[main] renderer 加载失败 (${errorCode} ${errorDescription})，1s 后重试 ${retries}/10`)
        setTimeout(loadRenderer, 1000)
      } else if (!win.isVisible()) {
        win.show() // 重试耗尽也把窗口显示出来，便于在页面/DevTools 看到错误
      }
    })
  }

  loadRenderer()
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
