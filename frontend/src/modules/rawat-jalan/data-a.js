// Data mock — Rawat jalan bagian A (RJ-01 s.d. RJ-04) + data pasien bersama

/** Pasien aktif di workspace (banner pasien dipakai RJ-02 s.d. RJ-08). */
export const pasienAktif = {
  nama: 'Budi Santoso',
  info: 'Laki-laki · 45 tahun · RM 00-12-34 · BPJS Kelas 2',
  antrean: 'J-07 · Poli Jantung',
  identitas: 'NIK 32XXXXXXXXXX · IHS P024783755348 · ✓ Dukcapil',
  alergi: 'ALERGI: PENISILIN',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

/** Tab workspace pasien → route tujuan. */
export const workspaceTabs = [
  { key: 'Penilaian', label: 'Penilaian', to: '/rawat-jalan/penilaian-keperawatan' },
  { key: 'CPPT', label: 'CPPT', to: '/rawat-jalan/cppt-editor' },
  { key: 'Order', label: 'Order', to: '/rawat-jalan/order-terpadu' },
  { key: 'Hasil Penunjang', label: 'Hasil Penunjang', to: '/rawat-jalan/hasil-penunjang' },
  { key: 'Resep', label: 'Resep', to: { path: '/rawat-jalan/order-terpadu', query: { tab: 'Obat' } } },
  { key: 'Surat', label: 'Surat', to: '/rawat-jalan/surat-center' },
  { key: 'Riwayat', label: 'Riwayat', to: '/rme/timeline-pasien' },
]

/** Tanda vital terakhir. */
export const tandaVital = [
  { label: 'TD', value: '140/90', note: '↑ Pantau tekanan darah' },
  { label: 'Nadi', value: '88', note: 'x/menit' },
  { label: 'SpO₂', value: '97%', note: 'Udara ruangan' },
  { label: 'Suhu', value: '36,8°', note: '°C · 09:05 WIB' },
]

/** Ringkasan klinis & order (RJ-02, RJ-05, RJ-07). */
export const ringkasanKlinis = {
  keluhan: 'Keluhan: sesak ±2 hari, batuk',
  diagnosis:
    'Diagnosis kerja: I50.0 — Congestive heart failure Riwayat hipertensi · kontrol 12 Mei 2025 TD 140/90 · Nadi 88 · RR 22 · SpO₂ 97%',
  penilaian: { title: 'Penilaian keperawatan tersedia', text: 'Ns. Maya · 09:05 WIB · risiko jatuh rendah' },
}

export const orderTindakLanjut = {
  ringkas: '09:12 · Lab darah lengkap · Diproses 09:14 · Thorax PA · Menunggu 09:15 · Resep furosemid · Telaah',
  status: 'ServiceRequest · Terkirim 09:12',
}

// ---------- RJ-01 · Worklist Poli ----------
export const ringkasanWorklist = [
  { label: 'Pasien hari ini', value: 15 },
  { label: 'Menunggu', value: 8 },
  { label: 'Sedang dilayani', value: 1 },
  { label: 'Selesai', value: 6 },
]

export const worklist = [
  {
    id: 'J-07', antrean: 'J-07', pasien: 'Budi / 32XXXXXXXXXX', tunggu: '12 menit', petugas: 'Selesai / Menunggu', alergi: 'PENISILIN', alergiTone: 'danger',
    nama: 'Budi Santoso', info: '45 tahun · BPJS · RM 00-12-34 IHS P024783755348', keluhan: 'Sesak ±2 hari · batuk TD 140/90 · SpO₂ 97%',
  },
  {
    id: 'J-08', antrean: 'J-08', pasien: 'Agus / 36XXXXXXXXXX', tunggu: '8 menit', petugas: 'Selesai / Menunggu', alergi: 'Tidak ada',
    nama: 'Agus Pratama', info: '52 tahun · BPJS · RM 00-12-41 IHS P024783755401', keluhan: 'Nyeri dada kiri · TD 150/95 · SpO₂ 98%',
  },
  {
    id: 'J-09', antrean: 'J-09', pasien: 'Nina / 35XXXXXXXXXX', tunggu: '6 menit', petugas: 'Proses / Menunggu', alergi: 'Tidak ada',
    nama: 'Nina Lestari', info: '38 tahun · Umum · RM 00-12-47 IHS P024783755412', keluhan: 'Berdebar-debar · TD 120/80 · SpO₂ 99%',
  },
  {
    id: 'J-10', antrean: 'J-10', pasien: 'Dedi / 34XXXXXXXXXX', tunggu: '4 menit', petugas: 'Menunggu / Menunggu', alergi: 'Lateks',
    nama: 'Dedi Kurniawan', info: '60 tahun · BPJS · RM 00-12-52 IHS P024783755433', keluhan: 'Kontrol pasca rawat inap · bengkak tungkai',
  },
  {
    id: 'J-11', antrean: 'J-11', pasien: 'Rudi / 37XXXXXXXXXX', tunggu: '3 menit', petugas: 'Menunggu / Menunggu', alergi: 'Tidak ada',
    nama: 'Rudi Hartono', info: '47 tahun · Asuransi · RM 00-12-58 IHS P024783755447', keluhan: 'Kontrol hipertensi rutin',
  },
  {
    id: 'J-12', antrean: 'J-12', pasien: 'Sari / 31XXXXXXXXXX', tunggu: '2 menit', petugas: 'Menunggu / Menunggu', alergi: 'Tidak ada',
    nama: 'Sari Wulandari', info: '33 tahun · BPJS · RM 00-12-63 IHS P024783755459', keluhan: 'Sesak saat aktivitas berat',
  },
  { id: 'J-13', antrean: 'J-13', pasien: 'Hendra / 32XXXXXXXXXX', tunggu: '1 menit', petugas: 'Menunggu / Menunggu', alergi: 'Tidak ada', nama: 'Hendra Saputra', info: '55 tahun · BPJS · RM 00-12-70', keluhan: 'Kontrol obat jantung' },
  { id: 'J-14', antrean: 'J-14', pasien: 'Wati / 33XXXXXXXXXX', tunggu: '1 menit', petugas: 'Menunggu / Menunggu', alergi: 'Sulfa', nama: 'Wati Rahayu', info: '49 tahun · Umum · RM 00-12-74', keluhan: 'Pusing dan berdebar' },
  { id: 'J-15', antrean: 'J-15', pasien: 'Yoga / 36XXXXXXXXXX', tunggu: '0 menit', petugas: 'Menunggu / Menunggu', alergi: 'Tidak ada', nama: 'Yoga Prasetyo', info: '29 tahun · BPJS · RM 00-12-79', keluhan: 'Pemeriksaan EKG rujukan' },
  { id: 'J-01', antrean: 'J-01', pasien: 'Tono / 35XXXXXXXXXX', tunggu: '—', petugas: 'Selesai / Selesai', alergi: 'Tidak ada', nama: 'Tono Wijaya', info: '58 tahun · BPJS · RM 00-11-02', keluhan: 'Kontrol rutin · selesai' },
  { id: 'J-02', antrean: 'J-02', pasien: 'Lina / 34XXXXXXXXXX', tunggu: '—', petugas: 'Selesai / Selesai', alergi: 'Tidak ada', nama: 'Lina Marlina', info: '41 tahun · BPJS · RM 00-11-08', keluhan: 'Kontrol rutin · selesai' },
  { id: 'J-03', antrean: 'J-03', pasien: 'Joko / 37XXXXXXXXXX', tunggu: '—', petugas: 'Selesai / Selesai', alergi: 'Tidak ada', nama: 'Joko Susilo', info: '63 tahun · BPJS · RM 00-11-15', keluhan: 'Kontrol rutin · selesai' },
  { id: 'J-04', antrean: 'J-04', pasien: 'Maya / 31XXXXXXXXXX', tunggu: '—', petugas: 'Selesai / Selesai', alergi: 'Tidak ada', nama: 'Maya Sari', info: '36 tahun · Umum · RM 00-11-21', keluhan: 'Kontrol rutin · selesai' },
  { id: 'J-05', antrean: 'J-05', pasien: 'Bayu / 32XXXXXXXXXX', tunggu: '—', petugas: 'Selesai / Selesai', alergi: 'Tidak ada', nama: 'Bayu Aji', info: '44 tahun · BPJS · RM 00-11-30', keluhan: 'Kontrol rutin · selesai' },
  { id: 'J-06', antrean: 'J-06', pasien: 'Rina / 33XXXXXXXXXX', tunggu: '—', petugas: 'Proses / Dilayani', alergi: 'Tidak ada', nama: 'Rina Pertiwi', info: '50 tahun · BPJS · RM 00-11-36', keluhan: 'Sedang diperiksa dr. Andi' },
]

// ---------- RJ-03 · Penilaian Keperawatan ----------
export const peringatanTd = {
  title: 'Tekanan darah di atas rentang normal',
  text: 'TD 140/90 mmHg · ulangi pengukuran dan informasikan dokter.',
}

/** Isian penilaian awal, berpasangan dua kolom. */
export const penilaianAwal = [
  { key: 'keluhan', label: 'Keluhan utama', required: true, value: 'Sesak ±2 hari disertai batuk' },
  { key: 'onset', label: 'Onset / durasi', value: '12 Mei 2025 · 2 hari' },
  { key: 'fungsi', label: 'Status fungsi', value: 'Mandiri' },
  { key: 'jatuh', label: 'Risiko jatuh', value: 'Morse 20 · rendah' },
  { key: 'nyeri', label: 'Nyeri', value: '2 / 10 · dada terasa berat' },
  { key: 'edukasi', label: 'Edukasi awal', value: 'Alur pemeriksaan, pencegahan jatuh' },
  { key: 'rr', label: 'RR', required: true, value: '22 x/menit' },
  { key: 'tb', label: 'Tinggi / berat', required: true, value: '170 cm / 72 kg' },
  { key: 'bmi', label: 'BMI', value: '24,9 kg/m² · normal' },
  { key: 'kesadaran', label: 'Kesadaran', value: 'Compos mentis' },
]

export const skriningKeselamatan = [
  { label: 'Identitas NIK / RM sesuai', checked: true },
  { label: 'Alergi dicatat: PENISILIN', checked: true },
  { label: 'Pendamping tersedia', checked: true },
  { label: 'Edukasi dipahami pasien', checked: true },
  { label: 'Ulangi tekanan darah', checked: false },
]

// ---------- RJ-04 · CPPT Editor ----------
export const riwayatCppt = [
  {
    id: 1,
    label: '12 Mei 2025 · dr. Andi',
    tone: 'primary',
    text: 'S: Sesak saat aktivitas, batuk. O: TD 135/85, nadi 84, suhu 36,7. A: Suspek gagal jantung. P: Evaluasi fungsi jantung, kontrol.',
  },
  {
    id: 2,
    label: '05 Mei 2025 · dr. Andi',
    tone: 'neutral',
    text: 'S: Kontrol hipertensi. O: TD 145/90. A: I10. P: Edukasi diet rendah garam.',
  },
]

export const soapAwal = {
  s: 'Sesak ±2 hari, terutama saat beraktivitas. Batuk (+), demam (−).',
  o: 'TD 140/90 mmHg · Nadi 88/menit · RR 22 · SpO₂ 97% · Suhu 36,8 °C',
  a: 'I50.0 · Congestive heart failure',
  p: 'Lab fungsi ginjal dan elektrolit. Furosemid 40 mg 1×1, 7 hari. Edukasi pembatasan garam dan tanda bahaya. Kontrol 21 Mei.',
}

/** Daftar ICD-10 untuk autocomplete sederhana. */
export const icd10 = [
  'I50.0 · Congestive heart failure',
  'I10 · Essential (primary) hypertension',
  'I11.0 · Hypertensive heart disease with heart failure',
  'I20.9 · Angina pectoris, unspecified',
  'R06.0 · Dyspnoea',
  'R05 · Cough',
]
