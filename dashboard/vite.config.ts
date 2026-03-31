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
    proxy: {
      '^/(user|auth|wallet|affiliate|admin|platform|settings|verification|live)': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
