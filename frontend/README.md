# SIMRS SPKD — Frontend

Frontend Sistem Informasi Manajemen Rumah Sakit **SPKD** (PT Sistem Pelayanan Kesehatan dan Data), mengikuti PRD v1.0 dan desain Figma `simrs-spkd`.

- **Stack**: Vue 3 (`<script setup>`) + Vite 6 + Vue Router 4 + Pinia + lucide-vue-next
- **Backend**: Go 1.26 (belum tersambung). Semua layar memakai **data mock** di `src/modules/<modul>/data-*.js`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil di dist/
```

Login: username bebas (contoh `andi.spjp`) + password apa saja.
Kiosk (`/kiosk`) dan aplikasi mobile (`/m/pasien`, `/m/dokter`) dapat dibuka tanpa login.

## Struktur

```
src/
  components/ui/      Komponen bersama (DataTable, StatCard, UiAlert, UiButton, UiModal, ...)
  components/charts/  BarChart
  layouts/            AppShell (desktop), KioskLayout, MobileLayout
  modules/<modul>/    index.js (konfigurasi + menu), part-*.js (routes), views/, data-*.js (mock)
  modules/registry.js Registry modul otomatis (import.meta.glob)
  router/             Router dibangun dari registry + guard login
  services/http.js    Klien HTTP untuk backend Go (siap pakai, belum dipakai)
  styles/             tokens.css (design token Figma) + base.css (kelas utilitas)
  utils/              format tanggal/rupiah, ekspor CSV
```

Daftar lengkap layar ↔ node Figma ↔ route: [`../docs/screens.md`](../docs/screens.md).
Konvensi implementasi layar: [`../docs/ui-conventions.md`](../docs/ui-conventions.md).

## Menyambungkan ke backend Go

1. `cp .env.example .env`, set `VITE_USE_MOCK=false`.
2. Dev server sudah mem-proxy `/api` → `http://localhost:8080` (lihat `vite.config.js`).
3. Ganti impor data mock di view dengan `api.get('/...')` dari `@/services/http`.
4. Login di `src/stores/session.js` diganti dengan endpoint autentikasi + RBAC.
