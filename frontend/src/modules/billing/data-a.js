// Data mock modul Billing (BLG-01 s.d. BLG-06) — fiktif, sesuai desain Figma.

// ── BLG-01 · Worklist tagihan ────────────────────────────────────────────────
const t = (id, nama, nik, unit, penjamin, total, status) => ({
  id, nama, nik, unit, penjamin, total, status, pasien: `${nama} / ${nik}`,
})

export const tagihan = [
  t('INV-007', 'Budi', '32XXXXXXXXXX', 'Jantung', 'BPJS', 357000, 'Siap koding'),
  t('INV-008', 'Sari', '31XXXXXXXXXX', 'Umum', 'Umum', 285000, 'Siap bayar'),
  t('INV-009', 'Dedi', '34XXXXXXXXXX', 'Saraf', 'Asuransi', 425000, 'Siap bayar'),
  t('INV-010', 'Nina', '35XXXXXXXXXX', 'Mata', 'Umum', 175000, 'Siap bayar'),
  t('INV-011', 'Agus', '36XXXXXXXXXX', 'Jantung', 'BPJS', 310000, 'Siap koding'),
  t('INV-012', 'Rudi', '37XXXXXXXXXX', 'Bedah', 'Umum', 680000, 'Belum final'),
  t('INV-013', 'Wati', '33XXXXXXXXXX', 'Anak', 'Umum', 215000, 'Siap bayar'),
  t('INV-014', 'Joko', '32XXXXXXXXXX', 'Penyakit dalam', 'Asuransi', 540000, 'Belum final'),
  t('INV-001', 'Lina', '31XXXXXXXXXX', 'Gigi', 'Umum', 250000, 'Lunas'),
  t('INV-002', 'Hadi', '35XXXXXXXXXX', 'Jantung', 'Umum', 390000, 'Lunas'),
  t('INV-003', 'Maya', '34XXXXXXXXXX', 'Kulit', 'Asuransi', 310000, 'Lunas'),
  t('INV-004', 'Tono', '36XXXXXXXXXX', 'Saraf', 'BPJS', 280000, 'Siap koding'),
  t('INV-005', 'Rina', '32XXXXXXXXXX', 'Mata', 'Umum', 165000, 'Lunas'),
]

export const tabWorklist = ['Siap bayar', 'Belum final', 'Lunas', 'BPJS ke koding']

export const ringkasanWorklist = [
  { label: 'Siap bayar', value: '18' },
  { label: 'Tagihan tertunda', value: 'Rp8.420.000' },
  { label: 'Lunas hari ini', value: '64' },
  { label: 'Pendapatan kas', value: 'Rp24.600.000' },
]

// ── BLG-02 · Detail tagihan ──────────────────────────────────────────────────
export const kategoriRincian = ['Admisi', 'Akomodasi', 'Tindakan', 'Obat', 'Penunjang']

const detailTagihan = {
  'INV-007': {
    pasien: {
      nama: 'Budi Santoso',
      info: 'Laki-laki · 45 tahun · RM 00-12-34 · BPJS Kelas 2',
      status: 'J-07 · Poli Jantung',
      identitas: 'NIK 32XXXXXXXXXX · IHS P024783755348 · ✓ Dukcapil',
      alergi: 'ALERGI: PENISILIN',
      encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
    },
    items: [
      { id: 1, kategori: 'Admisi', item: 'Administrasi', sumber: 'ADM-007', qty: 1, harga: 25000 },
      { id: 2, kategori: 'Akomodasi', item: 'Tidak ada · rawat jalan', sumber: '—', qty: 0, harga: 0 },
      { id: 3, kategori: 'Tindakan', item: 'Konsultasi spesialis', sumber: 'RJ-007', qty: 1, harga: 150000 },
      { id: 4, kategori: 'Obat', item: 'Furosemid 40 mg', sumber: 'RX-007', qty: 7, harga: 1000 },
      { id: 5, kategori: 'Penunjang', item: 'Darah lengkap', sumber: 'LAB-007', qty: 1, harga: 75000 },
      { id: 6, kategori: 'Penunjang', item: 'Thorax PA', sumber: 'RAD-007', qty: 1, harga: 100000 },
    ],
  },
  'INV-008': {
    pasien: {
      nama: 'Sari Wulandari',
      info: 'Perempuan · 32 tahun · RM 00-12-35 · Umum',
      status: 'Poli Umum',
      identitas: 'NIK 31XXXXXXXXXX · IHS P0XXXXXXXXXX · ✓ Dukcapil',
      alergi: 'ALERGI: TIDAK ADA',
      alergiTone: 'success',
      encounter: '14 Mei 2025 · dr. Rina · Encounter / Terkirim 09:05 WIB',
    },
    items: [
      { id: 1, kategori: 'Admisi', item: 'Administrasi', sumber: 'ADM-008', qty: 1, harga: 25000 },
      { id: 2, kategori: 'Akomodasi', item: 'Tidak ada · rawat jalan', sumber: '—', qty: 0, harga: 0 },
      { id: 3, kategori: 'Tindakan', item: 'Konsultasi', sumber: 'RJ-008', qty: 1, harga: 150000 },
      { id: 4, kategori: 'Obat', item: 'Amoksisilin 500 mg', sumber: 'RX-008', qty: 10, harga: 3500 },
      { id: 5, kategori: 'Penunjang', item: 'Laboratorium · darah lengkap', sumber: 'LAB-008', qty: 1, harga: 75000 },
    ],
  },
}

/** Detail tagihan per id; tagihan tanpa rincian khusus dibentuk dari baris worklist. */
export function getDetail(id = 'INV-007') {
  const row = tagihan.find((r) => r.id === id) || tagihan[0]
  const d = detailTagihan[row.id]
  if (d) return { ...row, ...d }
  const no = row.id.slice(-3)
  return {
    ...row,
    pasien: {
      nama: row.nama,
      info: `RM 00-12-${no.slice(-2)} · ${row.penjamin}`,
      status: `Poli ${row.unit}`,
      identitas: `NIK ${row.nik} · IHS P0XXXXXXXXXX · ✓ Dukcapil`,
      alergi: 'ALERGI: TIDAK ADA',
      alergiTone: 'success',
      encounter: '14 Mei 2025 · Encounter / Terkirim',
    },
    items: [
      { id: 1, kategori: 'Admisi', item: 'Administrasi', sumber: `ADM-${no}`, qty: 1, harga: 25000 },
      { id: 2, kategori: 'Akomodasi', item: 'Tidak ada · rawat jalan', sumber: '—', qty: 0, harga: 0 },
      { id: 3, kategori: 'Tindakan', item: 'Konsultasi spesialis', sumber: `RJ-${no}`, qty: 1, harga: row.total - 25000 },
    ],
  }
}

// ── BLG-03 · Deposit rawat inap ──────────────────────────────────────────────
export const pasienDeposit = {
  title: 'Contoh terpisah · Dedi Prasetyo',
  text: 'RM 00-12-37 · NIK 34XXXXXXXXXX · IHS P0XXXXXXXXXX · Umum · Melati 302-2',
}
export const riwayatDepositAwal = [
  { id: 1, tanggal: '12 Mei 14:00', transaksi: 'Deposit awal', nominal: 2000000 },
  { id: 2, tanggal: '13 Mei 08:00', transaksi: 'Biaya rawat', nominal: -750000 },
  { id: 3, tanggal: '14 Mei 08:00', transaksi: 'Biaya rawat', nominal: -500000 },
]
export const opsiKelas = ['Tidak naik kelas', 'Kelas 1 · +Rp100.000/hari', 'VIP · +Rp350.000/hari']
export const opsiMetode = ['Tunai', 'QRIS', 'Virtual Account', 'Kartu debit']
export const formDepositAwal = {
  kelasSaatIni: 'Kelas 2',
  naikKelas: 'Kelas 1 · +Rp100.000/hari',
  topup: 500000,
  metode: 'Tunai',
  alasan: 'Deposit tambahan untuk perpanjangan rawat 2 hari',
}

// ── BLG-04 & BLG-05 · Pembayaran & kwitansi ──────────────────────────────────
export const tabMetodeBayar = ['Tunai', 'QRIS', 'Virtual Account']
export const bankVa = ['BNI', 'BRI', 'Mandiri', 'BSI']

/** Rincian ringkas per tagihan untuk pembayaran & kwitansi. */
export const rincianBayar = {
  'INV-008': [
    { id: 1, layanan: 'Administrasi', jumlah: 25000 },
    { id: 2, layanan: 'Konsultasi', jumlah: 150000 },
    { id: 3, layanan: 'Obat', jumlah: 35000 },
    { id: 4, layanan: 'Laboratorium', jumlah: 75000 },
  ],
}
export const pasienBayar = {
  'INV-008': { nama: 'Sari Wulandari', identitas: 'RM 00-12-35 · NIK 31XXXXXXXXXX · IHS P0XXXXXXXXXX' },
}
export const catatanBayar = 'bukan tagihan BPJS Budi'
export const kasir = { nama: 'Dina', loket: 'Loket kasir 2' }

export const kwitansiContoh = {
  nomor: 'KWT/2025/0514/008',
  invoice: 'INV-008',
  metode: 'Tunai',
  diterima: 300000,
  kembalian: 15000,
  waktu: '14 Mei 2025 09:42 WIB',
}

// ── BLG-06 · Laporan pendapatan ──────────────────────────────────────────────
export const tabLaporan = ['Harian', 'Bulanan', 'Per unit', 'Per penjamin']
export const ringkasanLaporan = [
  { label: 'Kas hari ini', value: 'Rp24.600.000' },
  { label: 'BPJS ke koding', value: 'Rp36.800.000' },
  { label: 'Tunai / QRIS / VA', value: '64 transaksi' },
]
// Nilai grafik dalam juta rupiah
export const grafikLaporan = {
  Harian: {
    judul: 'Pendapatan harian',
    data: [
      { label: '08', value: 18 },
      { label: '09', value: 22 },
      { label: '10', value: 20 },
      { label: '11', value: 26 },
      { label: '12', value: 23 },
      { label: '13', value: 28 },
      { label: '14', value: 24.6, highlight: true },
    ],
  },
  Bulanan: {
    judul: 'Pendapatan bulanan',
    data: [
      { label: 'Jan', value: 612 },
      { label: 'Feb', value: 580 },
      { label: 'Mar', value: 655 },
      { label: 'Apr', value: 640 },
      { label: 'Mei', value: 318, highlight: true },
    ],
  },
  'Per unit': {
    judul: 'Pendapatan per unit',
    data: [
      { label: 'Rawat jalan', value: 8 },
      { label: 'Rawat inap', value: 10, highlight: true },
      { label: 'IGD', value: 4 },
      { label: 'Penunjang', value: 2.6 },
    ],
  },
  'Per penjamin': {
    judul: 'Pendapatan per penjamin',
    data: [
      { label: 'Umum', value: 17.6 },
      { label: 'Asuransi', value: 7 },
      { label: 'BPJS koding', value: 36.8, highlight: true },
    ],
  },
}
export const pendapatanUnit = [
  { id: 'rj', unit: 'Rawat jalan', umum: 6000000, asuransi: 2000000, bpjs: 10800000 },
  { id: 'ri', unit: 'Rawat inap', umum: 7000000, asuransi: 3000000, bpjs: 18000000 },
  { id: 'igd', unit: 'IGD', umum: 3000000, asuransi: 1000000, bpjs: 8000000 },
  { id: 'pj', unit: 'Penunjang', umum: 1600000, asuransi: 1000000, bpjs: 0 },
]
export const opsiUnitLaporan = ['Semua unit', 'Rawat jalan', 'Rawat inap', 'IGD', 'Penunjang']
export const opsiPenjaminLaporan = ['Semua', 'Umum', 'Asuransi', 'BPJS']
