// Data mock — Rawat jalan bagian B (RJ-05 s.d. RJ-08)

// ---------- RJ-05 · Order Terpadu ----------
export const orderSubjudul = 'Budi Santoso · RM 00-12-34 · dr. Andi · 14 Mei 2025'

export const orderTabs = ['Lab', 'Radiologi', 'Obat']

/** Katalog item per jenis order (pencarian "item / paket / kode"). */
export const katalogOrder = [
  { id: 'obt-1', jenis: 'Obat', item: 'Furosemid 40 mg tablet', kode: 'KFA-DEMO-001', aturan: '1×1 · 7 hari', jumlah: '7 tablet' },
  { id: 'obt-2', jenis: 'Obat', item: 'Spironolakton 25 mg tablet', kode: 'KFA-DEMO-014', aturan: '1×1 · 7 hari', jumlah: '7 tablet' },
  { id: 'obt-3', jenis: 'Obat', item: 'Amoksisilin 500 mg kapsul', kode: 'KFA-DEMO-020', aturan: '3×1 · 5 hari', jumlah: '15 kapsul', penisilin: true },
  { id: 'lab-1', jenis: 'Lab', item: 'Darah lengkap', kode: 'LOINC 58410-2', aturan: 'Rutin', jumlah: '1 paket' },
  { id: 'lab-2', jenis: 'Lab', item: 'Kreatinin / Kalium', kode: '2160-0 / 2823-3', aturan: 'Rutin', jumlah: '2 item' },
  { id: 'lab-3', jenis: 'Lab', item: 'NT-proBNP', kode: 'LOINC 33762-6', aturan: 'CITO', jumlah: '1 item' },
  { id: 'rad-1', jenis: 'Radiologi', item: 'Thorax PA', kode: 'LOINC 36643-5', aturan: 'Rutin', jumlah: '1 pemeriksaan' },
  { id: 'rad-2', jenis: 'Radiologi', item: 'Ekokardiografi', kode: 'LOINC 34552-0', aturan: 'Terjadwal', jumlah: '1 pemeriksaan' },
]

/** Item yang sudah terpilih di keranjang order (urutan sesuai desain). */
export const orderTerpilihAwal = ['obt-1', 'lab-1', 'lab-2']

export const ruteObat = ['Oral', 'Intravena', 'Intramuskular', 'Sublingual', 'Topikal']
export const waktuPemberian = ['Pagi setelah makan', 'Pagi sebelum makan', 'Siang setelah makan', 'Malam setelah makan', 'Sebelum tidur']

// ---------- RJ-06 · Hasil Penunjang ----------
export const orderPasien = [
  { label: 'Darah lengkap · Selesai', tone: 'success', text: '14 Mei 09:20 · dr. Andi LOINC 58410-2' },
  { label: 'Elektrolit · Selesai', tone: 'success', text: '14 Mei 09:20 · Na / K' },
  { label: 'Thorax PA · Siap baca', tone: 'primary', text: '' },
]

export const trenHb = [
  { label: '05 Mei', value: 12.8 },
  { label: '12 Mei', value: 13.1 },
  { label: '14 Mei', value: 13.4 },
]

export const hasilLab = [
  { id: 1, parameter: 'Hemoglobin', hasil: '13,4', satuan: 'g/dL', rujukan: '13–17', status: 'Normal' },
  { id: 2, parameter: 'Leukosit', hasil: '7,2', satuan: '10³/µL', rujukan: '4–10', status: 'Normal' },
  { id: 3, parameter: 'Trombosit', hasil: '240', satuan: '10³/µL', rujukan: '150–400', status: 'Normal' },
  { id: 4, parameter: 'Natrium', hasil: '138', satuan: 'mmol/L', rujukan: '135–145', status: 'Normal' },
  { id: 5, parameter: 'Kalium', hasil: '3,8', satuan: 'mmol/L', rujukan: '3,5–5,1', status: 'Normal' },
  { id: 6, parameter: 'Kreatinin', hasil: '1,0', satuan: 'mg/dL', rujukan: '0,7–1,3', status: 'Normal' },
]

export const laporanRadiologi = {
  judul: 'Thorax PA · 14 Mei 2025 09:40',
  temuan: 'Kardiomegali ringan (CTR 0,55). Tidak tampak infiltrat. Sinus kostofrenikus tajam.',
  kesan: 'Kardiomegali ringan, paru dalam batas normal.',
  radiolog: 'dr. Sinta, Sp.Rad',
}

export const diagnosticReport = {
  title: 'DiagnosticReport · Terkirim 09:24 WIB',
  text: 'Hasil ditandatangani analis Nita dan tersedia untuk telaah dokter.',
}

// ---------- RJ-07 · Tutup Kunjungan ----------
export const tutupAwal = {
  diagnosis: 'I50.0 · Congestive heart failure',
  statusPulang: 'Pulang · kondisi stabil',
  kontrol: '21 Mei 2025 · Poli Jantung',
  instruksi: 'Minum obat sesuai resep. Kembali ke IGD bila sesak memberat.',
}

export const opsiStatusPulang = [
  'Pulang · kondisi stabil',
  'Dirujuk ke RS lain',
  'Rawat inap',
  'Pulang atas permintaan sendiri',
  'Meninggal',
]

// ---------- RJ-08 · Surat Center ----------
export const templateSurat = {
  Kontrol: {
    judul: 'SURAT KONTROL',
    nomor: 'RME/2025/0514/007',
    loinc: 'LOINC 18842-5',
  },
  Sakit: {
    judul: 'SURAT KETERANGAN SAKIT',
    nomor: 'RME/2025/0514/008',
    loinc: 'LOINC 64290-0',
  },
  Rujukan: {
    judul: 'SURAT RUJUKAN',
    nomor: 'RME/2025/0514/009',
    loinc: 'LOINC 57133-1',
  },
  Sehat: {
    judul: 'SURAT KETERANGAN SEHAT',
    nomor: 'RME/2025/0514/010',
    loinc: 'LOINC 11488-4',
  },
}

export const suratAwal = {
  tanggal: '2025-05-21',
  poli: 'Poli Jantung',
  catatan: 'Evaluasi terapi dan hasil penunjang',
}

export const opsiPoli = ['Poli Jantung', 'Poli Penyakit Dalam', 'Poli Paru', 'Poli Saraf']
