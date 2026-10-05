// Data mock — Rawat inap bagian B (RI-05 Instruksi Medis, RI-06 Resume Pulang, RI-07 MPP Dashboard)

// Banner pasien (dipakai RI-05 & RI-06)
export const pasienRanap = {
  nama: 'Budi Santoso',
  info: 'Laki-laki · 45 tahun · RM 00-12-34 · BPJS Kelas 2',
  layanan: 'J-07 · Poli Jantung',
  identitas: 'NIK 32XXXXXXXXXX · IHS P024783755348 · ✓ Dukcapil',
  alergi: 'ALERGI: PENISILIN',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

// RI-05 · Instruksi medis DPJP (status: baru | diakui)
export const instruksiMedis = [
  {
    id: 1,
    waktu: '09:10',
    jenis: 'Observasi',
    isi: 'Pantau TD tiap 4 jam. Catat intake-output setiap shift.',
    dokter: 'dr. Andi',
    status: 'baru',
    diakuiOleh: '',
  },
  {
    id: 2,
    waktu: '08:30',
    jenis: 'Terapi',
    isi: 'Furosemid 40 mg oral 1×1. Evaluasi respons diuresis.',
    dokter: 'dr. Andi',
    status: 'baru',
    diakuiOleh: '',
  },
  {
    id: 3,
    waktu: '12 Mei 15:00',
    jenis: 'Diet',
    isi: 'Diet rendah garam. Edukasi pembatasan cairan sesuai instruksi DPJP.',
    dokter: 'dr. Andi',
    status: 'diakui',
    diakuiOleh: 'Diakui Ns. Maya · 15:12',
  },
]

export const catatanHandoverAwal = 'Terapi pagi diberikan, IO dimonitor. Pasien stabil.'

// RI-06 · Isian awal resume pulang (terisi otomatis dari rekam medis)
export const resumeAwal = {
  diagnosis: 'I50.0',
  periode: '12–14 Mei 2025',
  kondisi: 'Stabil',
  kontrol: '21 Mei · Poli Jantung',
  obat: 'Furosemid 40 mg 1×1, 7 hari. Diet rendah garam.',
  pin: '123456',
}

export const kondisiPulangOpsi = ['Stabil', 'Membaik', 'Pulang atas permintaan sendiri', 'Dirujuk / transfer', 'Meninggal']

export const checklistResume = [
  { key: 'diagnosis', label: 'Diagnosis final tersedia', checked: true },
  { key: 'terapi', label: 'Terapi pulang sesuai resep', checked: true },
  { key: 'edukasi', label: 'Edukasi diterima keluarga', checked: true },
  { key: 'dpjp', label: 'Konfirmasi DPJP', checked: false },
]

export const dokumenResume = {
  rs: 'RUMAH SAKIT SPKD',
  subRs: 'Pelayanan terpadu · Dokumen simulasi / bukan dokumen resmi',
  judul: 'RESUME PULANG',
  identitas:
    'Nomor: RME/2025/0514/007Nama: Budi Santoso · RM 00-12-34 NIK: 32XXXXXXXXXX · IHS P024783755348 Tanggal: 14 Mei 2025 · Poli Jantung · dr. Andi',
  ringkasan:
    'Diagnosis utama: I50.0 — Congestive heart failure. Pasien datang dengan keluhan sesak ±2 hari disertai batuk. Pemeriksaan: TD 140/90 mmHg, nadi 88/menit, suhu 36,8 °C. Dilakukan evaluasi klinis dan pemeriksaan penunjang sesuai indikasi.',
  penutup: 'Pasien dan keluarga telah memahami informasi serta instruksi tindak lanjut.',
  dpjp: 'dr. Andi, Sp.JP',
  esign: '✓ e-Sign BSrE · 14 Mei 2025 09:32 WIB',
  kaki: 'LOINC 18842-5 · DocumentReference · Halaman 1 dari 1',
}

// RI-07 · MPP Dashboard
export const unitMpp = [
  { key: 'Melati', label: 'Melati' },
  { key: 'Mawar', label: 'Mawar' },
  { key: 'ICU', label: 'ICU' },
  { key: 'Semua', label: 'Semua unit' },
]

export const pasienMpp = [
  { id: 1, unit: 'Melati', pasien: 'Budi / 00-12-34', diagnosis: 'I50.0', hari: 3, dpjp: 'dr. Andi', status: 'Stabil', handover: 'Siap pulang' },
  { id: 2, unit: 'Melati', pasien: 'Rina / 00-12-36', diagnosis: 'D64.9', hari: 1, dpjp: 'dr. Andi', status: 'Kritis · ICU', handover: 'Prioritas' },
  { id: 3, unit: 'Melati', pasien: 'Sari / 00-12-35', diagnosis: 'Z39.0', hari: 2, dpjp: 'dr. Ratna', status: 'Stabil', handover: 'Selesai' },
  { id: 4, unit: 'Melati', pasien: 'Dedi / 00-12-37', diagnosis: 'J18.9', hari: 4, dpjp: 'dr. Rudi', status: 'Observasi', handover: 'Selesai' },
  { id: 5, unit: 'Melati', pasien: 'Nina / 00-12-38', diagnosis: 'E11.9', hari: 2, dpjp: 'dr. Rudi', status: 'Stabil', handover: 'Menunggu' },
  { id: 6, unit: 'Melati', pasien: 'Agus / 00-12-39', diagnosis: 'I10', hari: 3, dpjp: 'dr. Andi', status: 'Stabil', handover: 'Selesai' },
  { id: 7, unit: 'Mawar', pasien: 'Wati / 00-12-41', diagnosis: 'K35.8', hari: 2, dpjp: 'dr. Rudi', status: 'Stabil', handover: 'Selesai' },
  { id: 8, unit: 'Mawar', pasien: 'Joko / 00-12-42', diagnosis: 'N39.0', hari: 5, dpjp: 'dr. Ratna', status: 'Observasi', handover: 'Menunggu' },
  { id: 9, unit: 'Mawar', pasien: 'Lina / 00-12-43', diagnosis: 'O80', hari: 1, dpjp: 'dr. Ratna', status: 'Stabil', handover: 'Siap pulang' },
  { id: 10, unit: 'ICU', pasien: 'Hadi / 00-12-44', diagnosis: 'I21.9', hari: 2, dpjp: 'dr. Andi', status: 'Kritis · ICU', handover: 'Prioritas' },
  { id: 11, unit: 'ICU', pasien: 'Tono / 00-12-45', diagnosis: 'A41.9', hari: 6, dpjp: 'dr. Rudi', status: 'Observasi', handover: 'Selesai' },
]

export const ringkasanMpp = [
  { label: 'Pasien Melati', value: 18, note: 'Diperbarui 09:12 WIB' },
  { label: 'Kritis', value: 1, note: 'Diperbarui 09:12 WIB' },
  { label: 'Rencana pulang', value: 3, note: 'Diperbarui 09:12 WIB' },
  { label: 'Handover selesai', value: '16 / 18', note: 'Diperbarui 09:12 WIB' },
]

export const prioritasHandover = {
  title: 'Prioritas handover',
  text: 'Rina: anemia berat / Hb 5,8 g/dL · hasil kritis sudah disampaikan ke DPJP.',
}
