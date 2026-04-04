import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


const apiTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8787'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
   tsconfigPaths: true,
  },
  plugins: [react(),tailwindcss()],
  server: {
    port: 4000,
    // Do not proxy `/admin/*` — browser refreshes on `/admin/...` must hit Vite (SPA).
    // Admin REST lives at the same paths; call it via VITE_API_URL (e.g. http://localhost:8787).
    proxy: {
      '^/(user|auth|wallet|affiliate|platform|settings|verification|live|crypto)': {
        target: apiTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
