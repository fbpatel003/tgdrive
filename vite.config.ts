import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// On GitHub Actions, GITHUB_REPOSITORY is "owner/repo-name"
// We extract just the repo name for the base path e.g. "/tgdrive/"
// Locally this is undefined so base stays "/"
const repoName = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  base: repoName,
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