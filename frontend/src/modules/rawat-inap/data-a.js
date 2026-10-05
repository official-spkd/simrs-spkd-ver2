// Data mock — Rawat inap bagian A (RI-01 Bed Board, RI-02 Admisi Ranap, RI-03 Workspace Ranap, RI-04 Askep & IO)

// RI-01 · Ringkasan bed (nilai dasar; terisi/kosong/booking/bersih disesuaikan dengan perubahan di bed board)
export const ringkasanBed = {
  total: 24,
  terisi: 18,
  kosong: 4,
  booking: 1,
  bersih: 1,
  diperbarui: 'Diperbarui 09:12 WIB',
}

export const tabBed = [
  { key: 'melati', label: 'Lantai 3 — Melati' },
  { key: 'icu', label: 'ICU' },
  { key: 'semua', label: 'Semua status' },
  { key: 'cari', label: 'Cari bed' },
]

// Status bed → nada warna (Kosong hijau, Terisi biru, Booking kuning, Bersih-bersih merah)
export const statusBed = [
  { key: 'Kosong', tone: 'success' },
  { key: 'Terisi', tone: 'primary' },
  { key: 'Booking', tone: 'warning' },
  { key: 'Bersih-bersih', tone: 'danger' },
]

// Daftar bed yang tampil di bed board. pasien = null untuk bed tanpa pasien.
export const daftarBed = [
  { id: '301-1', unit: 'melati', status: 'Kosong', pasien: null },
  {
    id: '301-2',
    unit: 'melati',
    status: 'Terisi',
    pasien: {
      nama: 'Budi Santoso',
      identitas: 'RM 00-12-34 NIK 32XXXXXXXXXX IHS P024783755348',
      rawat: 'DPJP: dr. Andi Hari rawat: ke-3 Diagnosis: I50.0 BPJS · Kelas 2',
      alergi: 'Alergi PENISILIN',
    },
  },
  { id: '302-1', unit: 'melati', status: 'Booking', pasien: { nama: 'Nina', identitas: 'RM 00-12-38 · booking dari IGD', rawat: 'DPJP: dr. Rudi Rencana masuk: 10:00 Diagnosis: E11.9 BPJS · Kelas 2', alergi: '' } },
  { id: '303-1', unit: 'melati', status: 'Bersih-bersih', pasien: null },
  {
    id: 'ICU-1',
    unit: 'icu',
    status: 'Terisi',
    pasien: {
      nama: 'Rina Pertiwi',
      identitas: 'RM 00-12-36 NIK 33XXXXXXXXXX IHS P0XXXXXXXXXX',
      rawat: 'DPJP: dr. Andi Hari rawat: ke-1 Diagnosis: D64.9 BPJS · Kelas 1',
      alergi: '',
    },
  },
  { id: 'ICU-2', unit: 'icu', status: 'Kosong', pasien: null },
]

// Banner pasien (RI-02 & RI-03)
export const pasienBudi = {
  nama: 'Budi Santoso',
  info: 'Laki-laki · 45 tahun · RM 00-12-34 · BPJS Kelas 2',
  layanan: 'J-07 · Poli Jantung',
  identitas: 'NIK 32XXXXXXXXXX · IHS P024783755348 · ✓ Dukcapil',
  alergi: 'ALERGI: PENISILIN',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

// RI-02 · Admisi ranap
export const langkahAdmisi = [
  { key: 'kamar', no: 1, label: 'Kamar' },
  { key: 'sep', no: 2, label: 'SEP' },
  { key: 'persetujuan', no: 3, label: 'Persetujuan' },
  { key: 'gelang', no: 4, label: 'Gelang' },
]

export const admisiAwal = {
  unit: 'Melati · Lantai 3',
  bed: '301 / 301-2 · Kelas 2',
  dpjp: 'dr. Andi, Sp.JP',
  sep: 'SEP-DEMO-RI-0512',
  masuk: '12 Mei 2025 14:00',
  diagnosis: 'I50.0 · Gagal jantung',
}

export const opsiUnit = ['Melati · Lantai 3', 'Mawar · Lantai 2', 'ICU · Lantai 3']
export const opsiBed = ['301 / 301-1 · Kelas 2', '301 / 301-2 · Kelas 2', 'ICU / ICU-2 · ICU']
export const opsiDpjp = ['dr. Andi, Sp.JP', 'dr. Ratna, Sp.OG', 'dr. Rudi, Sp.PD']

export const checklistAdmisi = [
  { key: 'hak', label: 'Hak kelas BPJS sesuai', checked: true },
  { key: 'persetujuan', label: 'Persetujuan rawat inap ditandatangani', checked: true },
  { key: 'gelang', label: 'Gelang identitas belum dicetak', labelDone: 'Gelang identitas sudah dicetak', checked: false },
]

export const depositInfo = 'BPJS aktif · Kelas 2 Deposit wajib: Rp0 Selisih kelas: Rp0'

export const gelangPasien = {
  nama: 'BUDI SANTOSO',
  identitas: 'RM 00-12-34 · 14/02/1980 NIK 32XXXXXXXXXX',
  barcode: '▥▥▥▥▥▥▥▥▥',
  alergi: 'ALERGI PENISILIN',
}

// RI-03 · Workspace ranap
export const tabWorkspace = [
  { key: 'askep', label: 'Askep' },
  { key: 'io', label: 'IO & Monitoring' },
  { key: 'cppt', label: 'CPPT' },
  { key: 'terapi', label: 'Terapi' },
  { key: 'penunjang', label: 'Penunjang' },
  { key: 'pulang', label: 'Pulang' },
]

export const infoRawat = {
  title: 'Melati · 301-2 · Hari rawat ke-3',
  text: 'Masuk 12 Mei 2025 · DPJP dr. Andi · BPJS kelas 2',
}

export const vitalAwal = { td: '140/90', nadi: '88', spo2: '97', suhu: '36,8', jam: '09:05' }

export const perawatanHariIni = {
  diagnosis: 'I50.0 · Congestive heart failure',
  catatan: 'Keluhan sesak berkurang. Pemantauan cairan per shift. Diet rendah garam. Mobilisasi bertahap.',
}

export const checklistPerawatan = [
  { key: 'visite', label: 'Visite dokter 08:30 selesai', checked: true },
  { key: 'terapi', label: 'Terapi pagi diberikan', checked: true },
  { key: 'io', label: 'IO shift pagi tercatat', checked: true },
  { key: 'pulang', label: 'Rencana pulang menunggu DPJP', checked: false },
]

export const terapiAktif = [
  'Furosemid 40 mg · oral · 1×1',
  'Bisoprolol 2,5 mg · oral · 1×1',
  'Diet rendah garam',
  'Observasi TD tiap 4 jam',
]

export const cpptAwal = [
  {
    id: 1,
    waktu: '14 Mei 08:30',
    oleh: 'dr. Andi',
    soap: 'S: sesak berkurang. O: TD 140/90, ronki basal minimal. A: CHF perbaikan. P: lanjut furosemid, evaluasi IO.',
  },
  {
    id: 2,
    waktu: '13 Mei 20:00',
    oleh: 'Ns. Dewi',
    soap: 'S: tidur cukup. O: SpO₂ 96% udara ruangan. A: pola napas efektif. P: posisi semi-Fowler, pantau SpO₂.',
  },
]

export const penunjangRanap = [
  { id: 1, waktu: '13 Mei 07:10', jenis: 'Laboratorium', hasil: 'NT-proBNP 1.850 pg/mL', status: 'Final' },
  { id: 2, waktu: '12 Mei 15:30', jenis: 'Radiologi', hasil: 'Rontgen toraks: kardiomegali, kongesti ringan', status: 'Final' },
  { id: 3, waktu: '14 Mei 06:00', jenis: 'Laboratorium', hasil: 'Elektrolit (Na, K)', status: 'Diproses' },
]

// RI-04 · Askep & IO (pasien obstetri contoh)
export const pasienSari = {
  nama: 'Sari Wulandari',
  info: 'Perempuan · 29 tahun · G2P1A0 · postpartum hari 1',
  layanan: 'Identitas diverifikasi',
  identitas: 'RM 00-12-35 · NIK 31XXXXXXXXXX · IHS P0XXXXXXXXXX',
  alergi: 'Alergi: tidak diketahui',
  alergiTone: 'warning',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

export const tabAskep = [
  { key: 'askep', label: 'Askep shift' },
  { key: 'io', label: 'Intake / Output' },
  { key: 'meows', label: 'MEOWS' },
]

export const infoObstetri = {
  title: 'Pasien obstetri · postpartum hari 1',
  text: 'Sari Wulandari · contoh terpisah dari Budi · skor MEOWS hanya untuk pemantauan obstetri.',
}

// IO per jam (mL). Balance = oral + infus − urine.
export const ioAwal = [
  { jam: '07:00', oral: 100, infus: 150, urine: 150 },
  { jam: '08:00', oral: 100, infus: 100, urine: 150 },
  { jam: '09:00', oral: 100, infus: 100, urine: 200 },
]

export const meowsAwal = [
  { label: '03', value: 1 },
  { label: '04', value: 2 },
  { label: '05', value: 1 },
  { label: '06', value: 1 },
  { label: '07', value: 2 },
  { label: '08', value: 1 },
  { label: '09', value: 1 },
]

export const ambangMeows = 3

export const asuhanAwal = {
  diagnosis: 'Nyeri akut terkait proses persalinan',
  intervensi: 'Pantau nyeri, posisi nyaman, evaluasi luka. Nyeri 2/10 setelah intervensi.',
}

export const observasiAwal = { td: '118/76', nadi: '86', rr: '18', suhu: '36,8', spo2: '98' }
export const petugasShift = 'Ns. Maya · shift 07.00–14.00'
