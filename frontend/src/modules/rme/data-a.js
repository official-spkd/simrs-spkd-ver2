// Data mock modul RME (RME-01 s.d. RME-04)

export const pasienAktif = {
  nama: 'Budi Santoso',
  info: 'Laki-laki · 45 tahun · RM 00-12-34 · BPJS Kelas 2',
  antrean: 'J-07 · Poli Jantung',
  identitas: 'NIK 32XXXXXXXXXX · IHS P024783755348 · ✓ Dukcapil',
  alergi: 'ALERGI: PENISILIN',
  encounter: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

/* ---------- RME-01 · Timeline Pasien ---------- */
export const tabEpisode = ['Semua episode', 'Rawat jalan', 'Rawat inap', 'IGD']

export const nadaJenis = { 'Rawat jalan': 'primary', 'Rawat inap': 'primary', IGD: 'warning' }

export const episode = [
  { id: 'EP-0505', jenis: 'Rawat jalan', tanggal: '05 Mei', ringkasan: 'I10 · dr. Andi', status: '2025 · IHS ✓ RME lengkap · Ditandatangani' },
  { id: 'EP-0510', jenis: 'IGD', tanggal: '10 Mei', ringkasan: 'Sesak · stabilisasi', status: '2025 · IHS ✓ RME lengkap · Ditandatangani' },
  { id: 'EP-0512', jenis: 'Rawat inap', tanggal: '12–14 Mei', ringkasan: 'I50.0 · Melati', status: '2025 · IHS ✓ RME lengkap · Ditandatangani' },
  { id: 'EP-0514', jenis: 'Rawat jalan', tanggal: '14 Mei', ringkasan: 'I50.0 · Poli Jantung', status: '2025 · IHS ✓ RME lengkap · Ditandatangani' },
]

// Dokumen per episode (id dokumen dipakai Document Viewer lewat ?id=)
export const dokumenEpisode = {
  'EP-0514': [
    { id: 'DOC-DEMO-001', dokumen: 'CPPT SOAP', jenis: '11506-3', penulis: 'dr. Andi', waktu: '14 Mei 09:12', status: 'e-Sign ✓' },
    { id: 'DOC-DEMO-002', dokumen: 'Hasil laboratorium', jenis: '11502-2', penulis: 'Nita, A.Md.AK', waktu: '14 Mei 09:24', status: 'e-Sign ✓' },
    { id: 'DOC-DEMO-003', dokumen: 'Surat kontrol', jenis: 'LOINC · tipe lokal', penulis: 'dr. Andi', waktu: '14 Mei 09:32', status: 'e-Sign ✓' },
    { id: 'DOC-DEMO-004', dokumen: 'Resep', jenis: 'MedicationRequest', penulis: 'dr. Andi', waktu: '14 Mei 09:15', status: 'Terkirim' },
  ],
  'EP-0512': [
    { id: 'DOC-DEMO-007', dokumen: 'Resume medis', jenis: '18842-5', penulis: 'dr. Andi', waktu: '14 Mei 09:32', status: 'e-Sign ✓' },
    { id: 'DOC-DEMO-005', dokumen: 'CPPT SOAP', jenis: '11506-3', penulis: 'dr. Andi', waktu: '12 Mei 14:30', status: 'e-Sign ✓' },
    { id: 'DOC-DEMO-006', dokumen: 'Persetujuan rawat inap', jenis: 'Consent', penulis: 'Ns. Maya', waktu: '12 Mei 14:10', status: 'e-Sign ✓' },
  ],
  'EP-0510': [
    { id: 'DOC-DEMO-008', dokumen: 'Triase IGD', jenis: '54094-8', penulis: 'Ns. Rina', waktu: '10 Mei 21:05', status: 'e-Sign ✓' },
    { id: 'DOC-DEMO-009', dokumen: 'CPPT SOAP', jenis: '11506-3', penulis: 'dr. Sari', waktu: '10 Mei 21:20', status: 'e-Sign ✓' },
  ],
  'EP-0505': [
    { id: 'DOC-DEMO-010', dokumen: 'CPPT SOAP', jenis: '11506-3', penulis: 'dr. Andi', waktu: '05 Mei 10:02', status: 'e-Sign ✓' },
    { id: 'DOC-DEMO-011', dokumen: 'Resep', jenis: 'MedicationRequest', penulis: 'dr. Andi', waktu: '05 Mei 10:10', status: 'Terkirim' },
  ],
}

export const logAkses = [
  { waktu: '14 Mei 2025 09:35', pengguna: 'dr. Andi', peran: 'Dokter DPJP', aksi: 'Membuka Resume medis' },
  { waktu: '14 Mei 2025 09:32', pengguna: 'dr. Andi', peran: 'Dokter DPJP', aksi: 'Menandatangani Surat kontrol' },
  { waktu: '14 Mei 2025 09:24', pengguna: 'Nita, A.Md.AK', peran: 'Analis lab', aksi: 'Mengunggah Hasil laboratorium' },
  { waktu: '14 Mei 2025 09:12', pengguna: 'dr. Andi', peran: 'Dokter DPJP', aksi: 'Menandatangani CPPT SOAP' },
]

/* ---------- RME-02 · Document Viewer ---------- */
export const dokumenDefault = 'DOC-DEMO-007'

const pengesahan = {
  jabatan: 'Dokter penanggung jawab',
  nama: 'dr. Andi, Sp.JP',
}

export const dokumen = {
  'DOC-DEMO-007': {
    judul: 'Resume medis',
    loinc: '18842-5',
    jenis: 'discharge summary',
    penulis: 'dr. Andi',
    waktu: '14 Mei 2025 09:32 WIB',
    timestamp: '09:32:14 WIB',
    nomor: 'RME/2025/0514/007',
    tanggal: '14 Mei 2025 · Poli Jantung · dr. Andi',
    isi: [
      'Diagnosis utama: I50.0 — Congestive heart failure. Pasien datang dengan keluhan sesak ±2 hari disertai batuk. Pemeriksaan: TD 140/90 mmHg, nadi 88/menit, suhu 36,8 °C. Dilakukan evaluasi klinis dan pemeriksaan penunjang sesuai indikasi.',
      'Terapi pulang: furosemid 40 mg, 1×1 selama 7 hari. Edukasi kepatuhan obat dan tanda bahaya diberikan kepada pasien. Kontrol 21 Mei 2025 di Poli Jantung.',
      'Pasien dan keluarga telah memahami informasi serta instruksi tindak lanjut.',
    ],
    pengesahan,
  },
  'DOC-DEMO-001': {
    judul: 'CPPT SOAP',
    loinc: '11506-3',
    jenis: 'progress note',
    penulis: 'dr. Andi',
    waktu: '14 Mei 2025 09:12 WIB',
    timestamp: '09:12:40 WIB',
    nomor: 'RME/2025/0514/001',
    tanggal: '14 Mei 2025 · Poli Jantung · dr. Andi',
    isi: [
      'S: Sesak berkurang, batuk masih ada terutama malam hari. O: TD 140/90 mmHg, nadi 88/menit, SpO₂ 97%.',
      'A: I50.0 — Congestive heart failure, perbaikan. P: Lanjut furosemid 40 mg 1×1, evaluasi elektrolit, kontrol 7 hari.',
    ],
    pengesahan,
  },
  'DOC-DEMO-002': {
    judul: 'Hasil laboratorium',
    loinc: '11502-2',
    jenis: 'laboratory report',
    penulis: 'Nita, A.Md.AK',
    waktu: '14 Mei 2025 09:24 WIB',
    timestamp: '09:24:05 WIB',
    nomor: 'RME/2025/0514/002',
    tanggal: '14 Mei 2025 · Laboratorium · Nita, A.Md.AK',
    isi: [
      'Hemoglobin 13,8 g/dL · Leukosit 8.200/µL · Natrium 136 mmol/L · Kalium 3,9 mmol/L · Kreatinin 1,1 mg/dL.',
      'Seluruh nilai dalam rentang rujukan. Hasil telah divalidasi dokter penanggung jawab laboratorium.',
    ],
    pengesahan: { jabatan: 'Penanggung jawab laboratorium', nama: 'Nita, A.Md.AK' },
  },
  'DOC-DEMO-003': {
    judul: 'Surat kontrol',
    loinc: 'tipe lokal',
    jenis: 'surat kontrol',
    penulis: 'dr. Andi',
    waktu: '14 Mei 2025 09:32 WIB',
    timestamp: '09:32:02 WIB',
    nomor: 'RME/2025/0514/003',
    tanggal: '14 Mei 2025 · Poli Jantung · dr. Andi',
    isi: ['Pasien dijadwalkan kontrol kembali pada 21 Mei 2025 di Poli Jantung untuk evaluasi terapi gagal jantung.'],
    pengesahan,
  },
  'DOC-DEMO-004': {
    judul: 'Resep',
    loinc: 'MedicationRequest',
    jenis: 'resep elektronik',
    penulis: 'dr. Andi',
    waktu: '14 Mei 2025 09:15 WIB',
    timestamp: '09:15:21 WIB',
    nomor: 'RME/2025/0514/004',
    tanggal: '14 Mei 2025 · Poli Jantung · dr. Andi',
    isi: ['R/ Furosemid 40 mg No. VII · S 1×1 pagi hari.', 'Resep terkirim ke Farmasi Rawat Jalan.'],
    pengesahan,
  },
}

/* ---------- RME-03 · Consent Center ---------- */
export const daftarPersetujuan = [
  { id: 'CS-01', persetujuan: 'Rawat inap', episode: '12 Mei · Melati', pemberi: 'Budi Santoso', waktu: '12 Mei 14:10', status: 'Ditandatangani', ttd: true },
  { id: 'CS-02', persetujuan: 'Tindakan medis', episode: '12 Mei · Jantung', pemberi: 'Budi Santoso', waktu: '12 Mei 15:00', status: 'Ditandatangani', ttd: true },
  { id: 'CS-03', persetujuan: 'Penolakan tindakan', episode: 'Template tersedia', pemberi: 'Belum diajukan', waktu: '—', status: 'Tidak digunakan', ttd: false },
  { id: 'CS-04', persetujuan: 'Operasi', episode: 'Template tersedia', pemberi: 'Belum diajukan', waktu: '—', status: 'Tidak digunakan', ttd: false },
]

export const teksPersetujuan =
  'Pasien telah mendapat penjelasan mengenai tujuan, manfaat, risiko, alternatif, dan pembiayaan perawatan. Persetujuan diberikan tanpa paksaan.'

export const butirPersetujuan = [
  'Identitas pasien terverifikasi',
  'Penjelasan dokter dipahami',
  'Saksi: Ns. Maya',
  'Konfirmasi tanda tangan tablet',
]

/* ---------- RME-04 · Kelengkapan RME ---------- */
export const elemenWajib = [
  { id: 'E01', elemen: 'Identitas', status: '✓ Lengkap', pj: 'Loket 2' },
  ...[
    'Anamnesis',
    'Pemeriksaan fisik',
    'Diagnosis',
    'Rencana',
    'Terapi',
    'Tindakan',
    'Penunjang',
    'CPPT',
    'Consent',
    'Resume',
    'Instruksi pulang',
    'Tanda tangan',
    'Waktu pelayanan',
  ].map((elemen, i) => ({ id: `E${String(i + 2).padStart(2, '0')}`, elemen, status: '✓ Lengkap', pj: 'dr. Andi / Ns. Maya' })),
]

export const ringkasanKelengkapan = {
  dokumenTtd: '6 / 6',
  tanggal: '14 Mei 2025',
}
