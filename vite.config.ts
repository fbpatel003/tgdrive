import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/tgdrive/' : '/',
  resolve: {
    alias: {
      os: path.resolve(__dirname, 'src/stubs/os.ts'),
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util', 'events', 'path', 'crypto'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
})