import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { pledgeHub } from './server/pledgeHub'

export default defineConfig({
  plugins: [react(), pledgeHub()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
