// Data mock modul IGD (IGD-01 s.d. IGD-05) — fiktif, sesuai desain Figma.

// Pasien contoh yang dibuka di layar klinis (banner pasien)
export const pasienAktif = {
  nama: 'Rina Pertiwi',
  info: 'Perempuan · 38 tahun · IGD · CITO',
  status: 'Identitas diverifikasi',
  identitas: 'RM 00-12-36 · NIK 33XXXXXXXXXX · IHS P0XXXXXXXXXX',
  alergi: 'Alergi: tidak diketahui',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

/* ---------- IGD-01 · Tracking Board ---------- */
export const ringkasanIgd = [
  { key: 'aktif', label: 'Pasien aktif', value: 12 },
  { key: 'merah', label: 'Merah', value: 2 },
  { key: 'kuning', label: 'Kuning', value: 4 },
  { key: 'observasi', label: 'Observasi', value: 3 },
]

// Kolom proses papan pelacakan. tone = warna judul kolom & status pill.
export const kolomProses = [
  { key: 'triase', label: 'Triase', tone: 'primary', titleTone: 'text' },
  { key: 'merah', label: 'Merah', tone: 'danger' },
  { key: 'kuning', label: 'Kuning', tone: 'warning' },
  { key: 'hijau', label: 'Hijau', tone: 'success' },
  { key: 'observasi', label: 'Observasi', tone: 'primary' },
  { key: 'selesai', label: 'Selesai', tone: 'primary', titleTone: 'text' },
]

export const pasienBoard = [
  { id: 'TMP-001', kolom: 'triase', nama: 'Unknown-1', info: 'TMP-001 · NIK belum ada', status: '00:03 · sementara', sementara: true },
  { id: '33-RP', kolom: 'merah', nama: 'Rina Pertiwi', info: 'NIK 33XXXXXXXXXX · Hb kritis', status: 'CITO · 00:12' },
  { id: '00-14-01', kolom: 'merah', nama: 'Rudi Saputra', info: 'RM 00-14-01 · IHS ✓', status: 'CITO · 00:08' },
  { id: '00-12-37', kolom: 'kuning', nama: 'Dedi Prasetyo', info: 'RM 00-12-37 · IHS ✓', status: '00:18' },
  { id: '00-12-39', kolom: 'kuning', nama: 'Agus Wijaya', info: 'RM 00-12-39 · IHS ✓', status: '00:10' },
  { id: '00-12-38', kolom: 'hijau', nama: 'Nina Lestari', info: 'RM 00-12-38 · IHS ✓', status: '00:22' },
  { id: '00-12-34', kolom: 'observasi', nama: 'Budi Santoso', info: 'RM 00-12-34 · IHS ✓', status: '00:42' },
  { id: '00-12-35', kolom: 'selesai', nama: 'Sari Wulandari', info: 'RM 00-12-35 · IHS ✓', status: 'Pulang · 08:58' },
]

/* ---------- IGD-02 · Form Triase ---------- */
export const triaseAwal = {
  keluhan: 'Lemas berat, pusing, pucat',
  kesadaran: 'Compos mentis',
  td: '88/60 mmHg',
  nadi: '124 x/menit',
  rr: '26 x/menit',
  spo2: '94%',
  suhu: '36,5 °C',
  waktuDatang: '14 Mei 09:00',
  dasar: 'Hipotensi dan takikardia dengan tanda gangguan perfusi. Memerlukan penilaian serta stabilisasi segera.',
}

export const opsiKesadaran = ['Compos mentis', 'Apatis', 'Somnolen', 'Sopor', 'Koma']

// Tingkat prioritas per sistem triase (PTT / ATS)
export const tingkatPrioritas = {
  Merah: { tone: 'danger', ATS: 'ATS 1', PTT: 'PTT merah', waktu: 'Segera' },
  Kuning: { tone: 'warning', ATS: 'ATS 3', PTT: 'PTT kuning', waktu: '≤ 30 menit' },
  Hijau: { tone: 'success', ATS: 'ATS 4', PTT: 'PTT hijau', waktu: '≤ 60 menit' },
}

export const checklistTriase = [
  { label: 'Airway diperiksa', done: true },
  { label: 'Breathing dinilai', done: true },
  { label: 'Circulation dinilai', done: true },
  { label: 'Konfirmasi dokter IGD', done: false },
]

/* ---------- IGD-03 · CPPT IGD ---------- */
export const soapAwal = {
  s: 'Lemas berat dan pusing sejak pagi. Riwayat perdarahan sedang ditelusuri.',
  o: 'TD 88/60 · Nadi 124 · RR 26 · SpO₂ 94% · pucat (+)',
  a: 'D64.9 · Anemia, unspecified · diagnosis kerja',
  p: 'Stabilisasi sesuai penilaian dokter. Order darah lengkap CITO, evaluasi sumber perdarahan, monitor tanda vital.',
}

export const orderPrioritas = {
  prioritas: 'CITO',
  detail: 'Darah lengkap · 58410-2 ServiceRequest SR-DEMO-021 Spesimen EDTA · 09:04',
  status: 'Terkirim ke Laboratorium',
  kritis: { title: 'Hb kritis 5,8 g/dL', text: 'Hasil 09:08 · perlu acknowledgment dokter' },
}

/* ---------- IGD-04 · Tindakan / Resusitasi ---------- */
export const waktuTindakan = { mulai: '09:02', selesai: '09:16' }

export const timResusitasi = [
  { label: 'dr. Andi · pemimpin', done: true },
  { label: 'Ns. Maya · airway', done: true },
  { label: 'Ns. Rudi · sirkulasi', done: true },
  { label: 'Ns. Nita · pencatat', done: true },
  { label: 'Konfirmasi akhir prosedur', done: false },
]

export const catatanTindakanAwal =
  'Penilaian ABC, pemantauan kontinu, akses IV dan stabilisasi sesuai instruksi dokter. Respons pasien terdokumentasi.'

export const billingTindakan = [
  { id: 1, item: '09:03 · IV set', jumlah: 1, subtotal: 25000 },
  { id: 2, item: '09:04 · NaCl 500 mL', jumlah: 1, subtotal: 20000 },
  { id: 3, item: '09:06 · Kateter IV', jumlah: 1, subtotal: 15000 },
  { id: 4, item: '09:10 · Monitoring', jumlah: 1, subtotal: 50000 },
]

/* ---------- IGD-05 · Outcome IGD ---------- */
export const tabOutcome = ['Rawat inap', 'Rujuk', 'Pulang paksa', 'Meninggal']

export const rujukanAwal = {
  rsPenerima: 'RS Rujukan Contoh',
  dokterPenerima: 'dr. Rudi · Penyakit Dalam',
  alasan: 'Kebutuhan evaluasi lanjutan',
  waktu: '14 Mei 2025 10:00',
  transportasi: 'Ambulans · pendamping perawat',
  nomor: 'VCL-DEMO-RUJ-021',
  kondisi: 'Pemantauan tanda vital kontinu. Dokumen pemeriksaan dan hasil laboratorium disertakan.',
}

// Isian tab lain (tidak digambar di Figma; disederhanakan)
export const rawatInapAwal = { ruang: 'Melati · Kelas II', dpjp: 'dr. Rudi · Penyakit Dalam', alasan: 'Anemia berat, perlu transfusi dan observasi' }
export const pulangPaksaAwal = { alasan: '', penanggungJawab: '' }
export const meninggalAwal = { waktu: '', sebab: '' }

export const checklistOutcome = [
  { label: 'RS penerima dikonfirmasi', done: true },
  { label: 'Consent rujukan ditandatangani', done: true },
  { label: 'Hasil CITO disertakan', done: true },
  { label: 'Handover SBAR lengkap', done: true },
  { label: 'Konfirmasi penutupan episode', done: false },
]

// Checklist tab lain (tidak digambar di Figma; disederhanakan)
export const checklistTabLain = {
  'Rawat inap': ['Bed ranap dikonfirmasi', 'Consent rawat inap ditandatangani', 'Handover SBAR lengkap', 'Konfirmasi penutupan episode'],
  'Pulang paksa': ['Alasan dicatat', 'Formulir pulang paksa ditandatangani', 'Edukasi risiko diberikan', 'Konfirmasi penutupan episode'],
  Meninggal: ['Waktu kematian dicatat', 'Dokumen kematian diterbitkan', 'Keluarga diberi tahu', 'Konfirmasi penutupan episode'],
}
