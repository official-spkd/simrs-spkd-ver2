// Data mock modul Radiologi (RAD-01 s.d. RAD-05) — fiktif, sesuai desain Figma

// RAD-01 · KPI worklist
export const statWorklist = [
  { label: 'Pemeriksaan hari ini', value: 32, note: 'Diperbarui 09:12 WIB' },
  { label: 'Menunggu alat', value: 8, note: 'Diperbarui 09:12 WIB' },
  { label: 'Siap baca', value: 6, note: 'Diperbarui 09:12 WIB' },
  { label: 'Laporan final', value: 18, note: 'Diperbarui 09:12 WIB' },
]

export const tabModality = ['X-Ray 01', 'CT 01', 'USG 01', 'Semua perangkat']

// Tone warna teks per nilai kolom
export const toneDicom = { '✓ Terkirim': 'success', Antrian: 'warning' }
export const toneStatus = { Menunggu: 'warning' }

export const worklist = [
  { id: 'RAD-007', pasien: 'Budi / 32XXXXXXXXXX', pemeriksaan: 'Thorax PA', modality: 'X-Ray 01', dicom: '✓ Terkirim', status: 'Siap baca' },
  { id: 'RAD-008', pasien: 'Dedi / 34XXXXXXXXXX', pemeriksaan: 'Thorax AP', modality: 'X-Ray 01', dicom: '✓ Terkirim', status: 'Menunggu' },
  { id: 'RAD-009', pasien: 'Nina / 35XXXXXXXXXX', pemeriksaan: 'USG abdomen', modality: 'USG 01', dicom: '✓ Terkirim', status: 'Diproses' },
  { id: 'RAD-010', pasien: 'Agus / 36XXXXXXXXXX', pemeriksaan: 'CT kepala', modality: 'CT 01', dicom: 'Antrian', status: 'Menunggu' },
  { id: 'RAD-011', pasien: 'Rina / 33XXXXXXXXXX', pemeriksaan: 'Thorax AP', modality: 'X-Ray 01', dicom: '✓ Terkirim', status: 'CITO' },
  { id: 'RAD-012', pasien: 'Sari / 31XXXXXXXXXX', pemeriksaan: 'USG obstetri', modality: 'USG 01', dicom: '✓ Terkirim', status: 'Selesai' },
]

export const infoPacs = {
  title: 'PACS terhubung',
  text: '6 studi siap dilaporkan · DICOM MWL diperbarui 09:12 WIB',
}

// RAD-02 s.d. RAD-05 · banner pasien aktif
export const pasienAktif = {
  nama: 'Budi Santoso',
  info: 'Laki-laki · 45 tahun · RM 00-12-34 · BPJS Kelas 2',
  status: 'J-07 · Poli Jantung',
  identitas: 'NIK 32XXXXXXXXXX · IHS P024783755348 · ✓ Dukcapil',
  alergi: 'ALERGI: PENISILIN',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

// RAD-02 · proses pemeriksaan
export const tabPemeriksaan = ['Persiapan', 'Akuisisi', 'Dose record', 'PACS']

export const checklistPemeriksaan = [
  { label: 'Dua identitas cocok: NIK / RM', done: true },
  { label: 'Order Thorax PA diverifikasi', done: true },
  { label: 'Posisi PA dan inspirasi sesuai', done: true },
  { label: 'Proteksi radiasi sesuai prosedur', done: true },
  { label: 'Konfirmasi kualitas gambar', done: false },
]

export const isianPemeriksaan = [
  { key: 'perangkat', label: 'Perangkat', value: 'X-Ray 01 · DR' },
  { key: 'radiografer', label: 'Radiografer', value: 'Rudi' },
  { key: 'waktu', label: 'Mulai / selesai', value: '09:14 / 09:18' },
  { key: 'dap', label: 'DAP', value: '0,12 Gy·cm²' },
  { key: 'akuisisi', label: 'Jumlah akuisisi', value: '1' },
  { key: 'studyUid', label: 'Study UID', value: 'DEMO-STUDY-007' },
]

export const statusStudy = {
  badge: ['Akuisisi selesai', 'PACS · Transfer 100%'],
  detail: ['1 seri / 1 citra', 'Transfer terakhir 09:19 WIB', 'DICOM MWL cocok dengan order'],
  siap: { title: 'Studi siap dibaca', text: 'Masuk worklist radiolog setelah kualitas dikonfirmasi.' },
}

// RAD-03 · viewer
export const viewerStudi = {
  judul: 'OHIF · DEMO-STUDY-007 · Thorax PA',
  seri: 'SERIES · 1',
  thumbnailInfo: 'PA · 1 image W 1500 / C −600',
  overlay: 'Budi Santoso · RM 00-12-34 · 14 Mei 2025 · R',
  peringatan: 'CITRA ILUSTRATIF · BUKAN BUKTI DIAGNOSTIK',
  pengukuran: '42 mm',
}

// RAD-04 · reporting (templat per jenis)
export const tabTemplat = ['CXR', 'USG', 'CT']

export const laporanAwal = {
  CXR: {
    teknik: 'Thorax PA · kualitas adekuat',
    temuan:
      'Siluet jantung tampak membesar ringan. Corakan bronkovaskular meningkat. Tidak tampak efusi pleura. Struktur tulang yang tercakup tidak menunjukkan kelainan nyata.',
    kesan: 'Kardiomegali ringan. Korelasikan dengan kondisi klinis dan pemeriksaan lainnya.',
    rekomendasi: 'Korelasi klinis oleh dokter pengirim.',
  },
  USG: { teknik: '', temuan: '', kesan: '', rekomendasi: '' },
  CT: { teknik: '', temuan: '', kesan: '', rekomendasi: '' },
}

export const konteksStudi = ['RAD-007 · Thorax PA', 'Pengirim: dr. Andi', 'Klinis: sesak ±2 hari', 'Study: DEMO-STUDY-007']

export const catatanIlustratif = {
  title: 'Contoh laporan ilustratif',
  text: 'Temuan bukan interpretasi gambar pasien nyata.',
}

// RAD-05 · sign & publish
export const dokumenLaporan = {
  rs: 'RUMAH SAKIT SPKD',
  subjudul: 'Pelayanan terpadu · Dokumen simulasi / bukan dokumen resmi',
  judul: 'LAPORAN RADIOLOGI',
  identitas: [
    'Nomor: RME/2025/0514/007',
    'Nama: Budi Santoso · RM 00-12-34',
    'NIK: 32XXXXXXXXXX · IHS P024783755348',
    'Tanggal: 14 Mei 2025 · Poli Jantung · dr. Andi',
  ],
  isi: [
    'Pemeriksaan: Thorax PA. Teknik: kualitas adekuat.',
    'Temuan: Siluet jantung tampak membesar ringan. Corakan bronkovaskular meningkat. Tidak tampak efusi pleura.',
    'Kesan: Kardiomegali ringan. Korelasikan dengan kondisi klinis dan pemeriksaan lainnya.',
    'Laporan simulasi, bukan interpretasi citra pasien nyata.',
  ],
  penanggungJawab: 'dr. Andi, Sp.JP',
  esign: '✓ e-Sign BSrE · 14 Mei 2025 09:32 WIB',
  kaki: 'LOINC 18842-5 · DocumentReference · Halaman 1 dari 1',
}

export const radiolog = 'dr. Bayu, Sp.Rad'

export const checklistFinal = [
  { label: 'Identitas studi cocok', done: true },
  { label: 'Kesan wajib lengkap', done: true },
  { label: 'Konfirmasi finalisasi laporan', done: false },
]

export const pengiriman = {
  status: ['DiagnosticReport · Terkirim 09:30', 'ImagingStudy · Terkirim 09:30'],
  catatan: ['Dokter pengirim: dr. Andi', 'Tersedia di Hasil Penunjang.'],
}
