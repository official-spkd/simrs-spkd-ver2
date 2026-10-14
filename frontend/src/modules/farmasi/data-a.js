// Data mock modul Farmasi (FRS-01 s.d. FRS-05) — fiktif, sesuai desain Figma.

// Pasien contoh pada layar telaah, komposisi, dan serah terima (banner pasien)
export const pasienResep = {
  nama: 'Budi Santoso',
  rm: '00-12-34',
  info: 'Laki-laki · 45 tahun · RM 00-12-34 · BPJS Kelas 2',
  status: 'J-07 · Poli Jantung',
  identitas: 'NIK 32XXXXXXXXXX · IHS P024783755348 · ✓ Dukcapil',
  alergi: 'ALERGI: PENISILIN',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

// Item resep RX-DEMO-007 (dipakai FRS-02 s.d. FRS-04)
export const itemResep = [
  {
    id: 'fur40', obat: 'Furosemid 40 mg', jumlah: '7 tablet', qty: 7, aturan: 'Oral · 1×1', durasi: '7 hari',
    barcode: '899-DEMO-FUR40', batch: 'FUR-DEMO-2504', ed: '30 Apr 2027',
    label: 'Furosemid 40 mg · 7 tablet 1 tablet, 1 kali sehari, pagi. Oral · selama 7 hari.',
  },
  {
    id: 'bis25', obat: 'Bisoprolol 2,5 mg', jumlah: '7 tablet', qty: 7, aturan: 'Oral · 1×1', durasi: '7 hari',
    barcode: '899-DEMO-BIS25', batch: 'BIS-DEMO-2503', ed: '31 Mar 2027',
    label: 'Bisoprolol 2,5 mg · 7 tablet 1 tablet, 1 kali sehari. Oral · selama 7 hari.',
  },
]

/* ---------- FRS-01 · Resep Board ---------- */
export const ringkasanResep = [
  { key: 'aktif', label: 'Resep aktif', value: 23 },
  { key: 'cito', label: 'CITO', value: 2 },
  { key: 'tunggu', label: 'Rata-rata tunggu', value: '12 menit' },
  { key: 'selesai', label: 'Selesai hari ini', value: 64 },
]

// Kolom proses. tone = warna status pill; titleTone = warna judul kolom (text = warna teks biasa).
// to = layar lanjutan saat "Buka detail".
export const kolomResep = [
  { key: 'baru', label: 'Baru', tone: 'primary', titleTone: 'primary', to: '/farmasi/telaah-resep' },
  { key: 'telaah', label: 'Telaah', tone: 'warning', titleTone: 'warning', to: '/farmasi/telaah-resep' },
  { key: 'proses', label: 'Proses', tone: 'primary', titleTone: 'text', to: '/farmasi/komposisi-obat' },
  { key: 'siap', label: 'Siap', tone: 'success', titleTone: 'success', to: '/farmasi/serah-terima' },
  { key: 'diambil', label: 'Diambil', tone: 'primary', titleTone: 'text', to: '/farmasi/serah-terima' },
]

export const resepBoard = [
  { id: 'RX-DEMO-011', kolom: 'baru', nama: 'Rina Pertiwi', info: 'IGD · NIK 33XXXXXXXXXX', status: 'CITO · 03 menit', cito: true },
  { id: 'RX-DEMO-010', kolom: 'baru', nama: 'Nina Lestari', info: 'Mata · RM 00-12-38', status: '06 menit' },
  { id: 'RX-DEMO-007', kolom: 'telaah', nama: 'Budi Santoso', info: 'Jantung · RM 00-12-34', status: '12 menit' },
  { id: 'RX-DEMO-008', kolom: 'telaah', nama: 'Agus Wijaya', info: 'Jantung · RM 00-12-39', status: '18 menit' },
  { id: 'RX-DEMO-006', kolom: 'proses', nama: 'Dedi Prasetyo', info: 'Saraf · RM 00-12-37', status: '09 menit' },
  { id: 'RX-DEMO-005', kolom: 'siap', nama: 'Sari Wulandari', info: 'Anak · RM 00-12-35', status: 'F-012 · 04 menit' },
  { id: 'RX-DEMO-004', kolom: 'diambil', nama: 'Rudi Saputra', info: 'Umum · RM 00-14-01', status: '09:08 · selesai' },
]

/* ---------- FRS-02 · Telaah Resep ---------- */
export const evaluasiTelaah = [
  { label: 'Dosis sesuai resep dokter', done: true },
  { label: 'Tidak ditemukan duplikasi zat aktif', done: true },
  { label: 'Rute dan durasi jelas', done: true },
  { label: 'Konfirmasi parameter ginjal & elektrolit', done: false },
]
export const labTerkait = 'Kalium 3,8 mmol/L · Kreatinin 1,0 mg/dL · 14 Mei 09:20'

/* ---------- FRS-03 · Komposisi Obat ---------- */
export const langkahResep = [
  { label: '1 Telaah ✓', to: '/farmasi/telaah-resep' },
  { label: '2 Komposisi', to: '/farmasi/komposisi-obat' },
  { label: '3 Serah terima', to: '/farmasi/serah-terima' },
]
// Jumlah yang sudah dipindai saat layar dibuka (sesuai desain)
export const scanAwal = { fur40: 7, bis25: 0 }
export const checklist6R = [
  { label: 'Benar pasien · NIK / RM cocok', done: true },
  { label: 'Benar obat', done: true },
  { label: 'Benar dosis', done: true },
  { label: 'Benar rute', done: true },
  { label: 'Benar waktu', done: true },
  { label: 'Benar dokumentasi', done: false },
]

/* ---------- FRS-04 · Serah Terima ---------- */
export const antreanFarmasi = 'F-007 · Budi Santoso'
export const edukasiObat = [
  { label: 'Nama, fungsi, dan dosis dijelaskan', done: true },
  { label: 'Furosemid diminum pagi', done: true },
  { label: 'Efek samping & tanda bahaya dijelaskan', done: true },
  { label: 'Penyimpanan obat dijelaskan', done: true },
  { label: 'Pasien mengulangi aturan pakai', done: true },
  { label: 'Konfirmasi penerima obat', done: false },
]
export const penerimaAwal = 'Budi Santoso · pasien sendiri'

/* ---------- FRS-05 · Stok & Kartu Persediaan ---------- */
export const ringkasanStok = [
  { key: 'item', label: 'Item aktif', value: '1.248' },
  { key: 'min', label: 'Di bawah minimum', value: 12 },
  { key: 'ed', label: 'Kedaluwarsa ≤90 hari', value: 4 },
  { key: 'gudang', label: 'Permintaan gudang', value: 6 },
]
export const tabStok = ['Stok', 'Mutasi 30 hari', 'DRP klinis', 'Refill kronis']

const tanggalMutasi = ['15 Apr', '20 Apr', '25 Apr', '30 Apr', '05 Mei', '10 Mei', '14 Mei']

// aksi: label tombol pada kolom Aksi; mutasi = posisi stok 30 hari (grafik)
export const stokObat = [
  { id: 'fur40', obat: 'Furosemid 40 mg', nama: 'furosemid', stok: '43 tablet', minMaks: '50 / 300', batchEd: '2504 / Apr 2027', status: 'Di bawah min', aksi: 'Ajukan Gudang', satuan: 'tablet', mutasi: [70, 63, 57, 76, 65, 50, 43] },
  { id: 'bis25', obat: 'Bisoprolol 2,5 mg', nama: 'bisoprolol', stok: '193 tablet', minMaks: '50 / 300', batchEd: '2503 / Mar 2027', status: 'Aman', aksi: 'Kartu stok', satuan: 'tablet', mutasi: [240, 232, 221, 215, 207, 200, 193] },
  { id: 'par500', obat: 'Parasetamol 500 mg', nama: 'parasetamol', stok: '640 tablet', minMaks: '100 / 1000', batchEd: '2502 / Feb 2027', status: 'Aman', aksi: 'Kartu stok', satuan: 'tablet', mutasi: [820, 760, 705, 900, 810, 712, 640] },
  { id: 'nacl', obat: 'NaCl 500 mL', nama: 'NaCl', stok: '18 botol', minMaks: '30 / 200', batchEd: '2408 / Agu 2025', status: 'ED ≤90 hari', aksi: 'Tinjau batch', satuan: 'botol', mutasi: [64, 55, 47, 40, 32, 24, 18] },
  { id: 'amx500', obat: 'Amoksisilin 500 mg', nama: 'amoksisilin', stok: '350 kapsul', minMaks: '100 / 600', batchEd: '2501 / Jan 2027', status: 'Aman', aksi: 'Kartu stok', satuan: 'kapsul', mutasi: [480, 455, 430, 410, 392, 371, 350] },
].map((o) => ({ ...o, mutasi: o.mutasi.map((value, i) => ({ label: tanggalMutasi[i], value })) }))

// Isi tab selain "Stok" (data simulasi)
export const mutasiStok = [
  { id: 'm1', tanggal: '14 Mei 09:38', obat: 'Furosemid 40 mg', jenis: 'Keluar · resep RX-DEMO-007', jumlah: '−7', saldo: '43' },
  { id: 'm2', tanggal: '14 Mei 09:38', obat: 'Bisoprolol 2,5 mg', jenis: 'Keluar · resep RX-DEMO-007', jumlah: '−7', saldo: '193' },
  { id: 'm3', tanggal: '13 Mei 14:10', obat: 'Parasetamol 500 mg', jenis: 'Keluar · resep RX-DEMO-003', jumlah: '−20', saldo: '640' },
  { id: 'm4', tanggal: '12 Mei 08:00', obat: 'Amoksisilin 500 mg', jenis: 'Masuk · gudang', jumlah: '+100', saldo: '371' },
  { id: 'm5', tanggal: '10 Mei 10:22', obat: 'NaCl 500 mL', jenis: 'Keluar · IGD', jumlah: '−8', saldo: '24' },
]
export const drpKlinis = [
  { id: 'd1', pasien: 'Budi Santoso', masalah: 'Pantau elektrolit terapi diuretik', intervensi: 'Edukasi & usul cek kalium', status: 'Dipantau' },
  { id: 'd2', pasien: 'Agus Wijaya', masalah: 'Potensi interaksi warfarin–aspirin', intervensi: 'Konfirmasi ke DPJP', status: 'Menunggu dokter' },
]
export const refillKronis = [
  { id: 'r1', pasien: 'Budi Santoso', obat: 'Bisoprolol 2,5 mg', jadwal: '13 Jun 2025', kontrol: 'Poli Jantung · 12 Jun 2025', status: 'Terjadwal' },
  { id: 'r2', pasien: 'Sri Handayani', obat: 'Metformin 500 mg', jadwal: '20 Mei 2025', kontrol: 'Poli Penyakit Dalam · 19 Mei 2025', status: 'Perlu verifikasi' },
]
export const catatanKlinis =
  'DRP: pantau elektrolit terapi diuretik. Refill kronis: verifikasi resep & jadwal kontrol sebelum pengulangan.'
