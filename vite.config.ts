import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { build } from 'esbuild'
import { watch } from 'fs'

const electronEntries = [
  { entry: 'src/main.ts', outfile: 'dist/main/main.js' },
  { entry: 'src/preload.ts', outfile: 'dist/main/preload.js' },
]

function buildElectron() {
  return Promise.all(
    electronEntries.map(({ entry, outfile }) =>
      build({
        entryPoints: [entry],
        bundle: true,
        platform: 'node',
        target: 'node20',
        outfile,
        external: ['electron', 'path', 'fs', 'os', 'crypto', 'stream', 'url', 'util', 'child_process', 'net', 'http', 'https', 'zlib', 'events'],
        format: 'cjs',
      })
    ),
  ).catch(() => {/* ignore during dev */})
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'build-electron-main',
      apply: 'serve',
      configureServer(server) {
        buildElectron()

        watch('src/main.ts', (event) => {
          if (event === 'change') buildElectron()
        })
        watch('src/preload.ts', (event) => {
          if (event === 'change') buildElectron()
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
    },
  },
  root: 'src/renderer',
  server: {
    // 钉死 IPv4 回环地址：vite 6 默认会把 dev server 绑到 IPv6 [::1]，
    // 而 wait-on / electron 走 IPv4 127.0.0.1，二者不匹配会导致 wait-on 永久超时、
    // electron 永不启动（窗口不弹）。统一 127.0.0.1 消除 IPv4/IPv6 歧义。
    host: '127.0.0.1',
    // 固定端口并禁止自动切换：端口被占用时直接报错退出，
    // 避免 vite 静默切到 5174 而 dev 脚本的 wait-on 仍死等 5173。
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
})
