// Data mock — Laboratorium bagian A (LAB-01 s.d. LAB-05)

// LAB-01 · KPI worklist
export const ringkasanLab = [
  { label: 'Order hari ini', value: 48, note: 'Diperbarui 09:12 WIB' },
  { label: 'Menunggu spesimen', value: 8, note: 'Diperbarui 09:12 WIB' },
  { label: 'Menunggu validasi', value: 6, note: 'Diperbarui 09:12 WIB' },
  { label: 'CITO', value: 2, note: 'Diperbarui 09:12 WIB' },
]

// Tab worklist → kelompok status order
export const tabWorklist = [
  { key: 'spesimen', label: 'Menunggu Spesimen' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'validasi', label: 'Menunggu Validasi' },
  { key: 'selesai', label: 'Selesai' },
]

// Order laboratorium (kelompok = tab tempat order tampil)
export const orderLab = [
  { id: 'LAB-021', order: 'LAB-021 / 09:04', pasien: 'Rina / 33XXXXXXXXXX', pemeriksaan: 'Darah lengkap', unit: 'IGD / dr. Andi', prioritas: 'CITO', status: 'Nilai kritis', kelompok: 'validasi' },
  { id: 'LAB-007', order: 'LAB-007 / 09:12', pasien: 'Budi / 32XXXXXXXXXX', pemeriksaan: 'Darah / elektrolit', unit: 'Jantung / dr. Andi', prioritas: 'Rutin', status: 'Selesai', kelompok: 'selesai' },
  { id: 'LAB-022', order: 'LAB-022 / 09:05', pasien: 'Dedi / 34XXXXXXXXXX', pemeriksaan: 'Fungsi ginjal', unit: 'Melati / dr. Rudi', prioritas: 'Rutin', status: 'Validasi', kelompok: 'validasi' },
  { id: 'LAB-023', order: 'LAB-023 / 09:06', pasien: 'Nina / 35XXXXXXXXXX', pemeriksaan: 'Glukosa', unit: 'Dalam / dr. Rudi', prioritas: 'Rutin', status: 'Diproses', kelompok: 'diproses' },
  { id: 'LAB-024', order: 'LAB-024 / 09:07', pasien: 'Agus / 36XXXXXXXXXX', pemeriksaan: 'Lipid', unit: 'Jantung / dr. Andi', prioritas: 'Rutin', status: 'Menunggu', kelompok: 'spesimen' },
  { id: 'LAB-025', order: 'LAB-025 / 09:08', pasien: 'Sari / 31XXXXXXXXXX', pemeriksaan: 'Darah lengkap', unit: 'Obgyn / dr. Ratna', prioritas: 'Rutin', status: 'Diproses', kelompok: 'diproses' },
  { id: 'LAB-026', order: 'LAB-026 / 09:09', pasien: 'Wati / 32XXXXXXXXXX', pemeriksaan: 'HbA1c', unit: 'Dalam / dr. Rudi', prioritas: 'Rutin', status: 'Menunggu', kelompok: 'spesimen' },
  { id: 'LAB-027', order: 'LAB-027 / 09:10', pasien: 'Yusuf / 33XXXXXXXXXX', pemeriksaan: 'Troponin I', unit: 'IGD / dr. Andi', prioritas: 'CITO', status: 'Menunggu', kelompok: 'spesimen' },
  { id: 'LAB-019', order: 'LAB-019 / 08:40', pasien: 'Lina / 31XXXXXXXXXX', pemeriksaan: 'Urin lengkap', unit: 'Anak / dr. Ratna', prioritas: 'Rutin', status: 'Selesai', kelompok: 'selesai' },
]

// Pasien aktif (banner)
export const pasienLab = {
  nama: 'Rina Pertiwi',
  info: 'Perempuan · 38 tahun · IGD · CITO',
  identitas: 'RM 00-12-36 · NIK 33XXXXXXXXXX · IHS P0XXXXXXXXXX',
  alergi: 'Alergi: tidak diketahui',
  kunjungan: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
  verifikasi: 'Identitas diverifikasi',
}

// LAB-02 · Spesimen
export const tabSpesimen = ['Registrasi', 'Pengambilan', 'Kualitas', 'LIS']

export const spesimenAwal = {
  kode: 'LAB-DEMO-021',
  nomor: 'SP-250514-021',
  jenis: 'Darah vena · EDTA',
  volume: '3 mL',
  pengambil: 'Ns. Maya',
  waktuAmbil: '14 Mei 09:04 WIB',
  waktuTerima: '14 Mei 09:06 WIB',
}

export const jenisSampel = ['Darah vena · EDTA', 'Darah vena · Serum', 'Darah vena · Citrat', 'Urin sewaktu', 'Darah kapiler']

export const cekKualitas = [
  { key: 'label', label: 'Label cocok dengan dua identitas', ok: true },
  { key: 'volume', label: 'Volume mencukupi', ok: true },
  { key: 'hemolisis', label: 'Tidak hemolisis / beku', ok: true },
  { key: 'akhir', label: 'Konfirmasi kualitas akhir', ok: false },
]

export const labelBarcode = {
  nama: 'RINA PERTIWI · RM 00-12-36',
  detail: 'NIK 33XXXXXXXXXX SP-250514-021 · EDTA · CITO 14 Mei 2025 09:04 WIB',
  lis: 'LIS · Sampel diterima 09:06',
}

// LAB-03/04 · Hasil alat (auto-import ASTM / HL7), kode LOINC per parameter
export const alatLab = 'Hematology Analyzer 01'

export const hasilAlat = [
  { id: 'hb', parameter: 'Hemoglobin · 718-7', nama: 'Hemoglobin', loinc: '718-7', hasil: '5,8', unit: 'g/dL', rujukan: '12–16', flag: 'Kritis ↓' },
  { id: 'ht', parameter: 'Hematokrit · 4544-3', nama: 'Hematokrit', loinc: '4544-3', hasil: '18', unit: '%', rujukan: '36–46', flag: 'Rendah' },
  { id: 'leu', parameter: 'Leukosit · 6690-2', nama: 'Leukosit', loinc: '6690-2', hasil: '8,1', unit: '10³/µL', rujukan: '4–10', flag: 'Normal' },
  { id: 'trom', parameter: 'Trombosit · 777-3', nama: 'Trombosit', loinc: '777-3', hasil: '210', unit: '10³/µL', rujukan: '150–400', flag: 'Normal' },
  { id: 'mcv', parameter: 'MCV · 787-2', nama: 'MCV', loinc: '787-2', hasil: '72', unit: 'fL', rujukan: '80–100', flag: 'Rendah' },
]

export const nilaiKritis = {
  judul: 'Nilai kritis: Hemoglobin 5,8 g/dL',
  teks: 'Ambang kritis Hb <7 g/dL · Pasien Rina Pertiwi · Order CITO LAB-021',
  ringkas: 'Hb 5,8 g/dL · Rina Pertiwi',
}

export const trenHb = {
  catatan: 'Hb: 7,8 → 6,2 → 5,8 g/dL · Ambang kritis <7',
  titik: [
    { label: '05 Mei', value: 7.8 },
    { label: '12 Mei', value: 6.2 },
    { label: '14 Mei', value: 5.8 },
  ],
  ambang: 7,
}

export const koreksiAwal = {
  parameter: 'Catatan morfologi',
  hasil: 'Eritrosit mikrositik',
  alasan: 'Konfirmasi apusan darah oleh analis',
  audit: 'Hasil auto-import 09:08 · ID alat HA-DEMO-01 · audit tersedia',
}

export const kontrolKualitas = {
  status: 'QC alat lulus · 07:00',
  detail: 'Operator: Nita, A.Md.AK Spesimen: SP-250514-021 Tidak hemolisis / beku',
}

// LAB-04 · Form notifikasi nilai kritis
export const notifikasiAwal = {
  dokter: 'dr. Andi · IGD',
  penerima: 'dr. Andi',
  waktu: '14 Mei 2025 09:10 WIB',
  kanal: 'Telepon · read-back',
  readback: 'Dokter mengulangi hasil Hb 5,8 g/dL dengan benar. Akan mengevaluasi segera.',
  pin: '',
}

export const kanalNotifikasi = ['Telepon · read-back', 'Notifikasi HP dokter + pop-up', 'Langsung (tatap muka)']

// LAB-05 · Terbitkan hasil
export const laporan = {
  pasien: 'Rina Pertiwi · RM 00-12-36',
  detail: 'NIK 33XXXXXXXXXX · IHS P0XXXXXXXXXX LAB-021 · EDTA · 14 Mei 2025',
  komunikasi: 'dr. Andi · telepon read-back · 09:10 WIB',
  tandaTangan: '✓ Ditandatangani Nita · BSrE 09:12',
}

export const statusSatuSehat = [
  { label: 'DiagnosticReport', status: 'Terkirim 09:12', tone: 'success' },
  { label: 'Observation LOINC', status: 'Terkirim', tone: 'success' },
  { label: 'DocumentReference', status: 'Antrian', tone: 'warning' },
]
