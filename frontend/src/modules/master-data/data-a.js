// Data mock — Master data bagian A (MD-01..MD-05). Semua identitas fiktif.

// MD-01 · Beranda Master
export const ringkasanMaster = [
  { label: 'Pasien terdaftar', value: '24.680', note: '98,7% memiliki IHS' },
  { label: 'Nakes ter-IHS', value: '184 / 192', note: '8 perlu tindak lanjut' },
  { label: 'Terminologi', value: '5 / 5', note: 'Seluruh set mutakhir' },
  { label: 'Ruang terpetakan', value: '126', note: 'Organization / Location ✓' },
]

export const registrasiMingguIni = [
  { label: '08 Mei', value: 35 },
  { label: '09 Mei', value: 50 },
  { label: '10 Mei', value: 42 },
  { label: '11 Mei', value: 65 },
  { label: '12 Mei', value: 60 },
  { label: '13 Mei', value: 78 },
  { label: '14 Mei', value: 70, highlight: true },
]

export const kualitasMaster = [
  { id: 'nik', label: 'NIK pasien tervalidasi', done: true },
  { id: 'tarif', label: 'Tarif versi 2025.05 aktif', done: true },
  { id: 'kfa', label: 'KFA 98% terpetakan', done: true },
  { id: 'telp', label: 'Lengkapi 14 nomor telepon pasien', done: false },
]

// Dipakai juga oleh MD-09 · Terminologi Sync
export const sinkronTerminologi = [
  { id: 'icd10', valueSet: 'ICD-10', lokal: '2019', remote: '2019', terakhir: '14 Mei 2025 07:00', status: 'Terkirim' },
  { id: 'icd9', valueSet: 'ICD-9-CM', lokal: '2010', remote: '2010', terakhir: '14 Mei 2025 07:00', status: 'Terkirim' },
  { id: 'loinc', valueSet: 'LOINC', lokal: '2.78', remote: '2.78', terakhir: '14 Mei 2025 07:02', status: 'Terkirim' },
  { id: 'kfa', valueSet: 'KFA', lokal: '2025.05', remote: '2025.05', terakhir: '14 Mei 2025 07:03', status: 'Terkirim' },
  { id: 'snomed', valueSet: 'SNOMED CT', lokal: '2025.03', remote: '2025.03', terakhir: '14 Mei 2025 07:04', status: 'Terkirim' },
]

// MD-02 · Daftar Pasien
export const ringkasanPasien = [
  { label: 'Total pasien', value: '24.680', note: 'Diperbarui 09:12 WIB' },
  { label: 'IHS terpetakan', value: '24.359', note: 'Diperbarui 09:12 WIB' },
  { label: 'Perlu verifikasi', value: '321', note: 'Diperbarui 09:12 WIB' },
]

// alergiKritis = ditampilkan merah di daftar & banner.
export const pasien = [
  {
    id: '00-12-34', rm: '00-12-34', nik: '32XXXXXXXXXX', nama: 'Budi Santoso', ihs: 'IHS ✓', alergi: 'PENISILIN', alergiKritis: true,
    ihsId: 'P024783755348', jk: 'Laki-laki', umur: 45, tglLahir: '14 Februari 1980', agama: 'Islam', kawin: 'Menikah',
    alamatKtp: 'Jl. Contoh No. 12, Bandung', alamatDomisili: 'Jl. Simulasi No. 8, Bandung',
    telp: '08XXXXXXXX12', email: 'budi@example.test', penjamin: 'BPJS Kelas 2',
    antrean: 'J-07 · Poli Jantung', kunjungan: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
    reaksiAlergi: 'Ruam · terkonfirmasi pasien', kontakDarurat: 'Sari (istri) 08XXXXXXXX34', patientStatus: 'Patient · Terkirim 09:10',
  },
  {
    id: '00-12-35', rm: '00-12-35', nik: '31XXXXXXXXXX', nama: 'Sari Wulandari', ihs: 'IHS ✓', alergi: 'Tidak ada',
    ihsId: 'P031245678901', jk: 'Perempuan', umur: 42, tglLahir: '3 Juni 1982', agama: 'Islam', kawin: 'Menikah',
    alamatKtp: 'Jl. Contoh No. 12, Bandung', alamatDomisili: 'Jl. Contoh No. 12, Bandung',
    telp: '08XXXXXXXX34', email: 'sari@example.test', penjamin: 'BPJS Kelas 2',
    antrean: 'U-03 · Poli Umum', kunjungan: '14 Mei 2025 · dr. Lina · Encounter / Terkirim 08:40 WIB',
    reaksiAlergi: '', kontakDarurat: 'Budi (suami) 08XXXXXXXX12', patientStatus: 'Patient · Terkirim 08:38',
  },
  {
    id: '00-12-36', rm: '00-12-36', nik: '33XXXXXXXXXX', nama: 'Rina Pertiwi', ihs: 'Antrian IHS', alergi: 'Tidak ada',
    ihsId: '', jk: 'Perempuan', umur: 36, tglLahir: '21 Agustus 1988', agama: 'Kristen', kawin: 'Menikah',
    alamatKtp: 'Jl. Melati No. 4, Cimahi', alamatDomisili: 'Jl. Melati No. 4, Cimahi',
    telp: '08XXXXXXXX56', email: 'rina@example.test', penjamin: 'Umum',
    antrean: 'IGD · Bed 3', kunjungan: '14 Mei 2025 · dr. Andi · Encounter / Antrian 09:08 WIB',
    reaksiAlergi: '', kontakDarurat: 'Tono (suami) 08XXXXXXXX78', patientStatus: 'Patient · Antrian',
  },
  {
    id: '00-12-37', rm: '00-12-37', nik: '34XXXXXXXXXX', nama: 'Dedi Prasetyo', ihs: 'IHS ✓', alergi: 'Lateks',
    ihsId: 'P034567890123', jk: 'Laki-laki', umur: 51, tglLahir: '9 Januari 1974', agama: 'Islam', kawin: 'Menikah',
    alamatKtp: 'Jl. Anggrek No. 20, Bandung', alamatDomisili: 'Jl. Anggrek No. 20, Bandung',
    telp: '08XXXXXXXX90', email: 'dedi@example.test', penjamin: 'Asuransi swasta',
    antrean: 'B-02 · Poli Bedah', kunjungan: '13 Mei 2025 · dr. Hendra · Encounter / Terkirim 10:20 WIB',
    reaksiAlergi: 'Gatal kontak · riwayat', kontakDarurat: 'Wati (istri) 08XXXXXXXX11', patientStatus: 'Patient · Terkirim 10:18',
  },
  {
    id: '00-12-38', rm: '00-12-38', nik: '35XXXXXXXXXX', nama: 'Nina Lestari', ihs: 'IHS ✓', alergi: 'Tidak ada',
    ihsId: 'P035678901234', jk: 'Perempuan', umur: 29, tglLahir: '17 Oktober 1995', agama: 'Hindu', kawin: 'Belum menikah',
    alamatKtp: 'Jl. Kenanga No. 7, Bandung', alamatDomisili: 'Jl. Kenanga No. 7, Bandung',
    telp: '08XXXXXXXX22', email: 'nina@example.test', penjamin: 'BPJS Kelas 1',
    antrean: 'A-11 · Poli Anak', kunjungan: '12 Mei 2025 · dr. Ratna · Encounter / Terkirim 11:05 WIB',
    reaksiAlergi: '', kontakDarurat: 'Made (ayah) 08XXXXXXXX33', patientStatus: 'Patient · Terkirim 11:02',
  },
  {
    id: '00-12-39', rm: '00-12-39', nik: '36XXXXXXXXXX', nama: 'Agus Wijaya', ihs: 'Belum IHS', alergi: 'Tidak ada',
    ihsId: '', jk: 'Laki-laki', umur: 63, tglLahir: '2 Maret 1962', agama: 'Buddha', kawin: 'Menikah',
    alamatKtp: 'Jl. Dahlia No. 15, Bandung', alamatDomisili: 'Jl. Dahlia No. 15, Bandung',
    telp: '', email: '', penjamin: 'Umum',
    antrean: 'Belum ada kunjungan', kunjungan: 'Belum ada encounter',
    reaksiAlergi: '', kontakDarurat: '-', patientStatus: 'Patient · Belum dikirim',
  },
]

// MD-03 · Detail Pasien
export const tabPasien = ['Demografi', 'Kontak', 'Penjamin', 'Alergi-Riwayat', 'Dokumen']

export const kelengkapanPasien = [
  { id: 'ktp', label: 'KTP terunggah', done: true },
  { id: 'penjamin', label: 'Penjamin terverifikasi', done: true },
  { id: 'consent', label: 'Dokumen persetujuan data', done: false },
]

export const riwayatKunjungan = [
  { id: 1, tanggal: '14 Mei 2025', layanan: 'Poli Jantung', dokter: 'dr. Andi', status: 'Terkirim' },
  { id: 2, tanggal: '2 April 2025', layanan: 'Laboratorium', dokter: 'dr. Andi', status: 'Terkirim' },
  { id: 3, tanggal: '11 Maret 2025', layanan: 'Poli Umum', dokter: 'dr. Lina', status: 'Terkirim' },
]

export const dokumenPasien = [
  { id: 1, nama: 'KTP', jenis: 'Identitas', diunggah: '14 Mei 2025 09:05', status: 'Terverifikasi' },
  { id: 2, nama: 'Kartu BPJS', jenis: 'Penjamin', diunggah: '14 Mei 2025 09:06', status: 'Terverifikasi' },
  { id: 3, nama: 'Persetujuan pemrosesan data', jenis: 'Consent', diunggah: '-', status: 'Belum ada' },
]

// MD-04 · Daftar Nakes — NIK → Practitioner IHS. kategori: ada | proses | belum
export const tabNakes = [
  { key: 'semua', label: 'Semua nakes · 192' },
  { key: 'ada', label: 'IHS ada · 184' },
  { key: 'proses', label: 'Proses · 3' },
  { key: 'belum', label: 'Belum IHS · 5' },
]

export const nakes = [
  {
    id: 'N-001', nama: 'dr. Andi, Sp.JP', nik: '32XXXXXXXXXX', unit: 'Jantung', strSip: 'STR aktif · SIP 2027',
    statusIhs: 'Ada · IHS ✓', kategori: 'ada', ihsId: '10009880728',
    str: 'STR-DEMO-011', strBerlaku: '12 Maret 2029', sip: 'SIP-DEMO-011', sipBerlaku: '1 Juli 2027',
    spesialisasi: 'Jantung dan pembuluh darah', unitPenempatan: 'Poli Jantung', percobaan: '1 Mei 07:15 · terdaftar',
  },
  {
    id: 'N-002', nama: 'dr. Ratna, Sp.A', nik: '31XXXXXXXXXX', unit: 'Anak', strSip: 'STR aktif · SIP 2026',
    statusIhs: 'Ada · IHS ✓', kategori: 'ada', ihsId: '10006926841',
    str: 'STR-DEMO-024', strBerlaku: '5 Mei 2028', sip: 'SIP-DEMO-024', sipBerlaku: '5 Mei 2026',
    spesialisasi: 'Anak', unitPenempatan: 'Poli Anak', percobaan: '1 Mei 07:15 · terdaftar',
  },
  {
    id: 'N-003', nama: 'Ns. Maya', nik: '33XXXXXXXXXX', unit: 'Melati', strSip: 'STR aktif · SIP 2026',
    statusIhs: 'Proses · Antrian', kategori: 'proses', ihsId: '',
    str: 'STR-DEMO-031', strBerlaku: 'Seumur hidup', sip: 'SIP-DEMO-031', sipBerlaku: '30 Juni 2026',
    spesialisasi: 'Keperawatan', unitPenempatan: 'Rawat inap Melati', percobaan: '14 Mei 08:40 · dalam antrian',
  },
  {
    id: 'N-004', nama: 'dr. Bayu, Sp.Rad', nik: '34XXXXXXXXXX', unit: 'Radiologi', strSip: 'STR aktif · SIP 2027',
    statusIhs: 'Belum IHS', kategori: 'belum', ihsId: '',
    str: 'STR-DEMO-042', strBerlaku: '20 Juli 2027', sip: 'SIP-DEMO-042', sipBerlaku: '20 Juli 2027',
    spesialisasi: 'Radiologi', unitPenempatan: 'Instalasi Radiologi', percobaan: '14 Mei 09:06 · belum terdaftar',
  },
  {
    id: 'N-005', nama: 'Apt. Rudi', nik: '35XXXXXXXXXX', unit: 'Farmasi', strSip: 'STR aktif · SIP 2028',
    statusIhs: 'Ada · IHS ✓', kategori: 'ada', ihsId: '10012345678',
    str: 'STR-DEMO-053', strBerlaku: '19 Agustus 2028', sip: 'SIP-DEMO-053', sipBerlaku: '19 Agustus 2028',
    spesialisasi: 'Farmasi klinik', unitPenempatan: 'Farmasi rawat jalan', percobaan: '1 Mei 07:16 · terdaftar',
  },
  {
    id: 'N-006', nama: 'Nita, A.Md.AK', nik: '36XXXXXXXXXX', unit: 'Laboratorium', strSip: 'STR aktif · SIP 2027',
    statusIhs: 'Ada · IHS ✓', kategori: 'ada', ihsId: '10004567123',
    str: 'STR-DEMO-064', strBerlaku: 'Seumur hidup', sip: 'SIP-DEMO-064', sipBerlaku: '25 Januari 2027',
    spesialisasi: 'Teknologi laboratorium medik', unitPenempatan: 'Laboratorium', percobaan: '1 Mei 07:16 · terdaftar',
  },
]

// MD-05 · Detail Nakes
export const tabDetailNakes = ['Identitas', 'STR & SIP', 'Penempatan', 'Mapping IHS']
export const nakesDefaultId = 'N-004' // dr. Bayu — contoh PENDING_IHS pada desain

export const panduanIhs =
  '1. Daftar di Portal Satu Sehat SDMK. 2. Verifikasi identitas dan STR. 3. Setelah terdaftar, ulangi Cek IHS.'
