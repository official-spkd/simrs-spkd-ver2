import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Saat deploy ke GitHub Pages, VITE_BASE diisi '/<nama-repo>/' oleh workflow.
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true, // listen di 0.0.0.0 agar bisa diakses perangkat lain di jaringan
    port: 5173,
    // Disiapkan untuk backend Go (belum aktif). Semua request /api diteruskan ke server Go.
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
