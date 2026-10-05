# Konvensi implementasi layar — SIMRS SPKD Frontend

Stack: **Vue 3 (`<script setup>`, JS — bukan TS) + Vite + vue-router + pinia + lucide-vue-next**. TIDAK memakai Tailwind. Backend Go belum tersambung → semua data dari mock lokal.

Root proyek FE: `C:\Users\ASUS\simrs-spkd\frontend` (alias `@` = `src`).
Daftar semua layar + node Figma + route: `C:\Users\ASUS\simrs-spkd\docs\screens.md`. Figma file key: `hrUNSuK0g5ULCrR8QJtYo7`.

## 1. Kepemilikan file (WAJIB — banyak agen bekerja paralel)
Kamu HANYA boleh membuat/mengubah file berikut di modulmu `src/modules/<modul>/`:
- `part-<x>.js` milikmu (x = a atau b sesuai penugasan) — isi `export default { nav: [...], routes: [...] }` (modul dokter-app juga boleh `tabs`).
- `views/<NamaLayar>.vue` untuk layar yang ditugaskan.
- `data-<x>.js` (data mock bagianmu).
- Komponen privat modul: `views/parts-<x>/*.vue`.
- Aset gambar non-ikon: `src/assets/img/<modul>/`.
JANGAN mengubah: `index.js` modul, `src/components/**`, `src/layouts/**`, `src/styles/**`, `src/router/**`, modul lain, `package.json`. Jika komponen bersama kurang, buat versi privat di `views/parts-<x>/`.

## 2. Route
Path route = slug judul layar persis seperti di `docs/screens.md` (relatif terhadap basePath modul, tanpa `/` depan). Contoh RJ-01:
```js
// part-a.js
export default {
  nav: [{ label: 'Worklist poli', to: '/rawat-jalan/worklist-poli' }],
  routes: [
    {
      path: 'worklist-poli',
      name: 'rj-worklist-poli',
      component: () => import('./views/WorklistPoli.vue'),
      meta: { title: 'Worklist Poli', code: 'RJ-01' },
    },
  ],
}
```
- `nav` = item menu sidebar "Navigasi peran" seperti di Figma (label persis dari desain), urut sesuai desain, hanya untuk layar milikmu. Layar yang di Figma tidak punya item menu sendiri (mis. layar detail/langkah lanjutan) cukup didaftarkan di `routes` saja. Item nav boleh memakai `match: '/prefix'` agar aktif untuk beberapa layar.
- Urutan `routes` mengikuti kode layar (route pertama = beranda modul).
- Tautan antarlayar/antarmodul: pakai route dari `docs/screens.md` (mis. tombol "Buka workspace" → `/rawat-jalan/workspace-pasien`). Untuk detail entitas, kirim `?id=` via query bila perlu; layar detail harus tetap tampil dengan data default tanpa query.

## 3. Shell sudah disediakan — JANGAN gambar ulang
- **Desktop** (`AppShell`): Header SIMRS (logo, omnibox, status Satu Sehat, notifikasi, user), sidebar Navigasi peran, breadcrumb "Beranda / Modul / Judul", dan catatan kaki "Data fiktif · …" sudah dirender layout. View kamu mulai dari **judul halaman**:
  ```vue
  <template>
    <div class="page">
      <PageHeader>  <!-- judul & "RJ-01 · Rabu, … WIB" otomatis dari route.meta -->
        <UiButton variant="primary">Panggil J-07</UiButton>
      </PageHeader>
      ...konten "Area kerja"...
    </div>
  </template>
  ```
- **Kiosk** (`KioskLayout`): header kiosk (logo SPKD + jam/tanggal) sudah ada, wadah max 1080px, padding 56, gap 32. View mulai dari baris "KSK-0x · Anjungan mandiri". Bagian bawah ("← Kembali / Butuh bantuan?") dan teks kaki dibuat di view (boleh komponen privat).
- **Mobile** (`MobileLayout`): status bar, header (‹ judul 🔔), baris "P-01 · SPKD Mobile", dan navigasi bawah (dari `tabs`) sudah ada. View mulai dari konten di bawah baris kode. Root view: `<div class="stack">`.

## 4. Komponen & kelas bersama
`import { UiButton, UiBadge, UiAlert, UiCard, UiTabs, UiModal, StatCard, PageHeader, FormField, KeyValue, DataTable, BarChart } from '@/components/ui'`
Baca sumbernya di `src/components/ui/*.vue` untuk props. Ringkas:
- `UiButton` props: `variant` primary|secondary|danger|success|ghost, `size` sm|md|lg, `icon` (komponen lucide), `to`, `block`.  (desain "Aksi" = btn; primer biru = `variant="primary"`; besar 56px = `size="lg"`)
- `UiBadge tone="success|warning|danger|primary|neutral"` = "Status" pill.
- `UiAlert tone="info|success|warning|danger" title text` = "Pemberitahuan". Slot `actions` opsional.
- `UiCard title subtitle` = "Panel" (putih, border, radius 12, padding 20, gap 16). Slot `actions` di kanan judul.
- `StatCard label value note noteTone` = panel KPI (angka 30px).
- `DataTable` = "Daftar data" (judul opsional, pencarian, Filter/Excel/PDF, kolom ↕, zebra, baris terpilih biru muda, paginasi). Props: `columns` [{key,label,width?,strong?,align?,tone?(row)=>'success'…,format?}], `rows`, `selectable` + `v-model:selected`, `@row-click`, `:searchable/:exportable/:filterable/:paginated` (boolean), `page-size`. Slot sel: `#cell-<key>="{ row, value }"`. Slot `#actions` (kanan judul) dan `#toolbar`.
- `UiTabs :tabs v-model`, `UiModal v-model:open title subtitle` (slot default + `#footer`) = "Dialog kontekstual", `FormField label required hint error` membungkus `<input class="input">` / `<select class="select">` / `<textarea class="textarea">`, `KeyValue :items :columns`, `BarChart :data="[{label,value,highlight?}]"`.
- Kelas global (`src/styles/base.css`): `.page .stack .stack-sm .stack-lg .row .row-center .row-between .grow .grid-2 .grid-3 .grid-4 .card .btn .badge .input .select .textarea .check .progress .divider` dan tipografi `.t-page-title .t-title .t-lg .t-sm .t-xs .t-xxs .t-strong .t-muted .t-primary .t-success .t-warning .t-danger .t-overline .t-right .t-center`.
- Token warna di `src/styles/tokens.css`: `--c-primary #1762c4, --c-primary-soft #eaf2ff, --c-primary-tint #dceaff, --c-navy #102d50, --c-text #172b45, --c-muted #607187, --c-border #dee6ef, --c-bg #f3f6fa, --c-row-alt #fafcfe, --c-success #15734b / -soft #e9f7ef, --c-warning #946000 / -soft #fff5da, --c-danger #b52c39 / -soft #fdedf0`, radius `--r-sm 7px --r-md 12px --r-lg 16px --r-pill`. Font Inter (400/600). Selalu pakai token, jangan hex mentah bila ada tokennya.
- Util: `@/utils/format` → `formatRupiah, formatAngka, formatTanggal, formatTanggalPanjang, formatJam, maskNik, salam, useNow`.

## 5. Alur kerja per layar
1. Panggil `mcp__figma__get_design_context` (fileKey `hrUNSuK0g5ULCrR8QJtYo7`, nodeId dari screens.md, `skillNames: "figma-design-to-code"`, `clientFrameworks: "vue"`, `clientLanguages: "javascript,html,css"`). Hasilnya React+Tailwind = REFERENSI saja; terjemahkan ke Vue + komponen/kelas di atas + `<style scoped>` untuk sisanya. Jika hasil terlalu besar/timeout, panggil pada node anak (lihat `get_metadata` node layar).
2. Abaikan bagian Header SIMRS / Navigasi peran / breadcrumb / footnote / status bar / navigasi bawah (sudah ada di layout) — tapi ambil label menu sidebar untuk `nav`.
3. Teks, angka, label, urutan, warna, ukuran font, gap & padding mengikuti desain. Data contoh dari desain dipindah ke `data-<x>.js` (array/objek), bukan di-hardcode berulang di template.
4. **Ikon**: layer ikon di Figma bernama sesuai Lucide (mis. `circle-alert`, `list-filter`) → pakai komponen `lucide-vue-next` dengan nama PascalCase yang sama (`CircleAlert`, `ListFilter`), ukuran sesuai desain (lebar & tinggi eksplisit) dan warna `currentColor`. JANGAN menggambar `<svg>` ikon sendiri. Gambar non-ikon (foto, logo, QR, gambar radiologi) → unduh bytes aset dari URL asset Figma dengan `curl -sSL -o` ke `src/assets/img/<modul>/` lalu impor; cek tipe file sebenarnya (`file`) dan beri ekstensi yang benar.
5. **Interaktif** (FE tanpa BE, tapi terasa hidup): tab berpindah, form v-model dengan validasi sederhana, baris tabel bisa dipilih → panel detail berubah, tombol aksi melakukan perubahan state lokal/tampil toast/alert sukses atau navigasi ke layar berikut sesuai alur PRD, modal buka/tutup. Tidak perlu persistensi.
6. Responsif: desain 1440px; pastikan ≥1100px rapi dan di bawahnya tidak pecah (kolom membungkus/menumpuk, tabel scroll horizontal sudah ditangani DataTable).
7. Bahasa UI: Bahasa Indonesia persis seperti desain. Komentar kode singkat, Bahasa Indonesia, gaya seperti `src/modules/operasional/` (contoh referensi lengkap: `views/BerandaOperasional.vue`, `data.js`, `index.js`).

## 6. Verifikasi
Setelah selesai, jalankan build ke folder sementara unik agar tidak bentrok dengan agen lain:
`cd C:/Users/ASUS/simrs-spkd/frontend && npx vite build --outDir "$TEMP/spkd-build-<modul>-<x>" --emptyOutDir`
Perbaiki semua error yang berasal dari file milikmu. Error dari file modul lain (sedang dikerjakan agen lain) abaikan saja. Jangan jalankan `npm install`.

## 7. Laporan akhir (singkat)
Daftar layar yang selesai (kode → file view → route), hal yang menyimpang dari desain beserta alasan, aset yang diunduh, dan status build.
