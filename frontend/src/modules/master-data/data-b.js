// Data mock — Master data bagian B (MD-06..MD-10). Kode Location/KFA bersifat ilustratif.

// MD-06 · Peta Ruang — Bed Master. Per gedung: pohon struktur, satu lantai aktif, kamar & bed.
export const gedung = [
  {
    key: 'utama',
    label: 'Gedung utama',
    struktur: ['└ Gedung utama', '   ├ Lantai 1 · IGD', '   ├ Lantai 2 · Poli', '   └ Lantai 3 · Melati', '      ├ Kamar 301', '      ├ Kamar 302', '      └ Kamar 303'],
    lantai: 'Lantai 3 · Melati',
    kamar: [
      { id: '301', kelas: '2', status: 'Location · Terkirim' },
      { id: '302', kelas: '2', status: 'Location · Terkirim' },
      { id: '303', kelas: '1', status: 'Location · Terkirim' },
    ],
    bed: [
      { id: '301-1', kamar: '301', locationId: 'LOC-DEMO-3011', kelas: '2', status: 'Aktif' },
      { id: '301-2', kamar: '301', locationId: 'LOC-DEMO-3012', kelas: '2', status: 'Aktif' },
      { id: '302-1', kamar: '302', locationId: 'LOC-DEMO-3021', kelas: '2', status: 'Aktif' },
      { id: '303-1', kamar: '303', locationId: 'LOC-DEMO-3031', kelas: '1', status: 'Pemeliharaan' },
    ],
  },
  {
    key: 'pelayanan',
    label: 'Gedung pelayanan',
    struktur: ['└ Gedung pelayanan', '   ├ Lantai 1 · Radiologi', '   └ Lantai 2 · Mawar', '      ├ Kamar 201', '      └ Kamar 202'],
    lantai: 'Lantai 2 · Mawar',
    kamar: [
      { id: '201', kelas: '3', status: 'Location · Terkirim' },
      { id: '202', kelas: 'VIP', status: 'Location · Antrian' },
    ],
    bed: [
      { id: '201-1', kamar: '201', locationId: 'LOC-DEMO-2011', kelas: '3', status: 'Aktif' },
      { id: '201-2', kamar: '201', locationId: 'LOC-DEMO-2012', kelas: '3', status: 'Aktif' },
      { id: '202-1', kamar: '202', locationId: '', kelas: 'VIP', status: 'Aktif' },
    ],
  },
  {
    key: 'icu',
    label: 'ICU',
    struktur: ['└ ICU', '   └ Lantai 4 · ICU', '      ├ Ruang ICU A', '      └ Ruang ICU B'],
    lantai: 'Lantai 4 · ICU',
    kamar: [
      { id: 'ICU A', kelas: 'ICU', status: 'Location · Terkirim' },
      { id: 'ICU B', kelas: 'ICU', status: 'Location · Terkirim' },
    ],
    bed: [
      { id: 'ICU A-1', kamar: 'ICU A', locationId: 'LOC-DEMO-4011', kelas: 'ICU', status: 'Aktif' },
      { id: 'ICU A-2', kamar: 'ICU A', locationId: 'LOC-DEMO-4012', kelas: 'ICU', status: 'Aktif' },
      { id: 'ICU B-1', kamar: 'ICU B', locationId: 'LOC-DEMO-4021', kelas: 'ICU', status: 'Pemeliharaan' },
    ],
  },
]

export const organisasi = { nama: 'RS SPKD', status: 'Organization ✓', orgId: 'ORG-DEMO-SPKD' }

// MD-07 · Master Tarif — nilai per kelas (Rupiah)
export const tabPenjamin = ['BPJS', 'Umum', 'Asuransi']

export const tarifAktif = {
  title: 'Tarif aktif v2025.05',
  text: 'Berlaku 1 Mei 2025 · disahkan direktur · Riwayat versi: v2025.01 / v2024.10',
}

const tarifBpjs = [
  { id: 'adm', tindakan: 'Administrasi', k3: 25000, k2: 25000, k1: 25000, vip: 25000 },
  { id: 'konsul', tindakan: 'Konsultasi spesialis', k3: 100000, k2: 150000, k1: 200000, vip: 250000 },
  { id: 'ekg', tindakan: 'EKG', k3: 75000, k2: 100000, k1: 125000, vip: 150000 },
  { id: 'kamar', tindakan: 'Kamar / hari', k3: 150000, k2: 250000, k1: 350000, vip: 600000 },
  { id: 'dl', tindakan: 'Darah lengkap', k3: 75000, k2: 75000, k1: 75000, vip: 75000 },
  { id: 'thorax', tindakan: 'Thorax PA', k3: 100000, k2: 125000, k1: 150000, vip: 175000 },
]

// Tarif Umum/Asuransi simulasi: kelipatan tarif BPJS, dibulatkan ke ribuan.
const kali = (rows, f) =>
  rows.map((r) => ({ ...r, k3: Math.round((r.k3 * f) / 1000) * 1000, k2: Math.round((r.k2 * f) / 1000) * 1000, k1: Math.round((r.k1 * f) / 1000) * 1000, vip: Math.round((r.vip * f) / 1000) * 1000 }))

export const tarif = {
  BPJS: tarifBpjs,
  Umum: kali(tarifBpjs, 1.2),
  Asuransi: kali(tarifBpjs, 1.35),
}

export const riwayatVersiTarif = [
  { id: 'v2025.05', versi: 'v2025.05', berlaku: '1 Mei 2025', pengesah: 'Direktur', status: 'Aktif' },
  { id: 'v2025.01', versi: 'v2025.01', berlaku: '1 Januari 2025', pengesah: 'Direktur', status: 'Arsip' },
  { id: 'v2024.10', versi: 'v2024.10', berlaku: '1 Oktober 2024', pengesah: 'Direktur', status: 'Arsip' },
]

// MD-08 · Master Obat & KFA
export const ringkasanObat = [
  { label: 'Obat aktif', value: '1.248', note: 'Diperbarui 09:12 WIB' },
  { label: 'KFA terpetakan', value: '1.223', note: 'Diperbarui 09:12 WIB' },
  { label: 'Perlu mapping', value: '25', note: 'Diperbarui 09:12 WIB' },
]

export const obat = [
  { id: 'O-001', nama: 'Furosemid', bentuk: 'Tablet', kekuatan: '40 mg', kfa: 'KFA-DEMO-001', status: 'Terkirim' },
  { id: 'O-002', nama: 'Bisoprolol', bentuk: 'Tablet', kekuatan: '2,5 mg', kfa: 'KFA-DEMO-002', status: 'Terkirim' },
  { id: 'O-003', nama: 'Parasetamol', bentuk: 'Tablet', kekuatan: '500 mg', kfa: 'KFA-DEMO-003', status: 'Terkirim' },
  { id: 'O-004', nama: 'NaCl 0,9%', bentuk: 'Infus', kekuatan: '500 mL', kfa: 'Belum dipilih', status: 'Antrian' },
  { id: 'O-005', nama: 'Amoksisilin', bentuk: 'Kapsul', kekuatan: '500 mg', kfa: 'KFA-DEMO-005', status: 'Terkirim' },
]

// Katalog KFA simulasi untuk dialog pemetaan.
export const katalogKfa = [
  { kode: 'KFA-DEMO-001', nama: 'Furosemid', bentuk: 'Tablet', kekuatan: '40 mg' },
  { kode: 'KFA-DEMO-011', nama: 'Furosemid', bentuk: 'Injeksi', kekuatan: '10 mg/mL' },
  { kode: 'KFA-DEMO-002', nama: 'Bisoprolol', bentuk: 'Tablet', kekuatan: '2,5 mg' },
  { kode: 'KFA-DEMO-012', nama: 'Bisoprolol', bentuk: 'Tablet', kekuatan: '5 mg' },
  { kode: 'KFA-DEMO-003', nama: 'Parasetamol', bentuk: 'Tablet', kekuatan: '500 mg' },
  { kode: 'KFA-DEMO-013', nama: 'Parasetamol', bentuk: 'Sirup', kekuatan: '120 mg/5 mL' },
  { kode: 'KFA-DEMO-004', nama: 'Natrium klorida 0,9%', bentuk: 'Infus', kekuatan: '500 mL' },
  { kode: 'KFA-DEMO-014', nama: 'Natrium klorida 0,9%', bentuk: 'Infus', kekuatan: '100 mL' },
  { kode: 'KFA-DEMO-005', nama: 'Amoksisilin', bentuk: 'Kapsul', kekuatan: '500 mg' },
]

export const catatanKfa = {
  title: 'Kode ilustratif',
  text: 'Kode KFA simulasi untuk desain; pemetaan produksi harus menggunakan katalog resmi.',
}

// MD-09 · Terminologi Sync (tabel memakai sinkronTerminologi dari data-a.js)
export const ringkasanTerminologi = [
  { key: 'valueSet', label: 'Value set', value: '5', note: 'Diperbarui 09:12 WIB' },
  { key: 'kode', label: 'Kode aktif', value: '82.460', note: 'Diperbarui 09:12 WIB' },
  { key: 'terakhir', label: 'Sinkron terakhir', value: '07:04', note: 'Diperbarui 09:12 WIB' },
]

export const riwayatSinkron = [
  '14 Mei 07:04 · 82.460 kode tervalidasi',
  '13 Mei 07:04 · Tidak ada perubahan',
  '12 Mei 07:03 · 12 pembaruan LOINC',
]

export const jadwalSinkron =
  'Otomatis setiap hari pukul 07.00 WIB. Sinkron manual tidak menghapus kode lokal yang telah digunakan.'

// MD-10 · RBAC Matrix — [lihat, input, edit, hapus, verifikasi] per modul per role
export const roles = ['Dokter', 'Perawat', 'Pendaftaran', 'Apoteker', 'Kasir', 'Admin IT']
export const modulRbac = ['Rawat jalan', 'Rawat inap', 'IGD', 'Farmasi', 'RME', 'Billing', 'Credential vault']
export const aksiRbac = [
  { key: 'lihat', label: 'Lihat' },
  { key: 'input', label: 'Input' },
  { key: 'edit', label: 'Edit' },
  { key: 'hapus', label: 'Hapus' },
  { key: 'verifikasi', label: 'Verifikasi' },
]

// 1 = diizinkan, 0 = tidak. Urutan baris = modulRbac.
export const matriksRbac = {
  Dokter: ['11101', '11101', '11101', '10000', '11101', '00000', '00000'],
  Perawat: ['11100', '11100', '11100', '10000', '11100', '00000', '00000'],
  Pendaftaran: ['11100', '11100', '11100', '00000', '10000', '10000', '00000'],
  Apoteker: ['10000', '10000', '10000', '11101', '10000', '10000', '00000'],
  Kasir: ['10000', '10000', '10000', '10000', '00000', '11101', '00000'],
  'Admin IT': ['10000', '10000', '10000', '10000', '10000', '10000', '11100'],
}

export const catatanRbac = 'Hak akses mengikuti unit penempatan. Hapus catatan bertanda tangan tidak diizinkan.'
