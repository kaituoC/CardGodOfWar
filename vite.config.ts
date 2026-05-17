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
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
})
