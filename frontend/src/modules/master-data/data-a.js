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

export const pasien = [
  {
    id: '00-12-34', rm: '00-12-34', nik: '32XXXXXXXXXX', nama: 'Budi Santoso', ihs: 'IHS ✓', alergi: 'PENISILIN',
    ihsId: 'P024783755348', jk: 'Laki-laki', umur: 45, tglLahir: '14 Februari 1980', agama: 'Islam', kawin: 'Menikah',
    alamatKtp: 'Jl. Contoh No. 12, Bandung', alamatDomisili: 'Jl. Simulasi No. 8, Bandung',
    telp: '08XXXXXXXX12', email: 'budi@example.test', penjamin: 'BPJS Kelas 2',
    antrean: 'J-07 · Poli Jantung', kunjungan: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
    reaksiAlergi: 'Ruam · terkonfirmasi pasien', kontakDarurat: 'Sari (istri) 08XXXXXXXX34',
  },
  {
    id: '00-12-35', rm: '00-12-35', nik: '31XXXXXXXXXX', nama: 'Sari Wulandari', ihs: 'IHS ✓', alergi: 'Tidak ada',
    ihsId: 'P031245678901', jk: 'Perempuan', umur: 42, tglLahir: '3 Juni 1982', agama: 'Islam', kawin: 'Menikah',
    alamatKtp: 'Jl. Contoh No. 12, Bandung', alamatDomisili: 'Jl. Contoh No. 12, Bandung',
    telp: '08XXXXXXXX34', email: 'sari@example.test', penjamin: 'BPJS Kelas 2',
    antrean: 'U-03 · Poli Umum', kunjungan: '14 Mei 2025 · dr. Lina · Encounter / Terkirim 08:40 WIB',
    reaksiAlergi: '', kontakDarurat: 'Budi (suami) 08XXXXXXXX12',
  },
  {
    id: '00-12-36', rm: '00-12-36', nik: '33XXXXXXXXXX', nama: 'Rina Pertiwi', ihs: 'Antrian IHS', alergi: 'Tidak ada',
    ihsId: '', jk: 'Perempuan', umur: 36, tglLahir: '21 Agustus 1988', agama: 'Kristen', kawin: 'Menikah',
    alamatKtp: 'Jl. Melati No. 4, Cimahi', alamatDomisili: 'Jl. Melati No. 4, Cimahi',
    telp: '08XXXXXXXX56', email: 'rina@example.test', penjamin: 'Umum',
    antrean: 'IGD · Bed 3', kunjungan: '14 Mei 2025 · dr. Andi · Encounter / Antre 09:08 WIB',
    reaksiAlergi: '', kontakDarurat: 'Tono (suami) 08XXXXXXXX78',
  },
  {
    id: '00-12-37', rm: '00-12-37', nik: '34XXXXXXXXXX', nama: 'Dedi Prasetyo', ihs: 'IHS ✓', alergi: 'Lateks',
    ihsId: 'P034567890123', jk: 'Laki-laki', umur: 51, tglLahir: '9 Januari 1974', agama: 'Islam', kawin: 'Menikah',
    alamatKtp: 'Jl. Anggrek No. 20, Bandung', alamatDomisili: 'Jl. Anggrek No. 20, Bandung',
    telp: '08XXXXXXXX90', email: 'dedi@example.test', penjamin: 'Asuransi swasta',
    antrean: 'B-02 · Poli Bedah', kunjungan: '13 Mei 2025 · dr. Hendra · Encounter / Terkirim 10:20 WIB',
    reaksiAlergi: 'Gatal kontak · riwayat', kontakDarurat: 'Wati (istri) 08XXXXXXXX11',
  },
  {
    id: '00-12-38', rm: '00-12-38', nik: '35XXXXXXXXXX', nama: 'Nina Lestari', ihs: 'IHS ✓', alergi: 'Tidak ada',
    ihsId: 'P035678901234', jk: 'Perempuan', umur: 29, tglLahir: '17 Oktober 1995', agama: 'Hindu', kawin: 'Belum menikah',
    alamatKtp: 'Jl. Kenanga No. 7, Bandung', alamatDomisili: 'Jl. Kenanga No. 7, Bandung',
    telp: '08XXXXXXXX22', email: 'nina@example.test', penjamin: 'BPJS Kelas 1',
    antrean: 'A-11 · Poli Anak', kunjungan: '12 Mei 2025 · dr. Maya · Encounter / Terkirim 11:05 WIB',
    reaksiAlergi: '', kontakDarurat: 'Made (ayah) 08XXXXXXXX33',
  },
  {
    id: '00-12-39', rm: '00-12-39', nik: '36XXXXXXXXXX', nama: 'Agus Wijaya', ihs: 'Belum IHS', alergi: 'Tidak ada',
    ihsId: '', jk: 'Laki-laki', umur: 63, tglLahir: '2 Maret 1962', agama: 'Buddha', kawin: 'Menikah',
    alamatKtp: 'Jl. Dahlia No. 15, Bandung', alamatDomisili: 'Jl. Dahlia No. 15, Bandung',
    telp: '', email: '', penjamin: 'Umum',
    antrean: 'Belum ada kunjungan', kunjungan: 'Belum ada encounter',
    reaksiAlergi: '', kontakDarurat: '-',
  },
]

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

// MD-04 · Daftar Nakes — NIP/STR/SIP → Practitioner IHS. PENDING_IHS bila belum ditemukan.
export const ringkasanNakes = [
  { label: 'Total nakes', value: '192', note: 'Diperbarui 09:12 WIB' },
  { label: 'Practitioner IHS', value: '184', note: 'Terpetakan otomatis via NIK' },
  { label: 'PENDING_IHS', value: '8', note: '3 dalam proses · 5 perlu registrasi', noteTone: 'warning' },
]

export const nakes = [
  {
    id: 'N-0012', nama: 'dr. Andi Wijaya, Sp.JP', profesi: 'Dokter spesialis', unit: 'Poli Jantung',
    nik: '32XXXXXXXXXX', nip: '19800214XXXXXXX001', str: '33.1.1.401.2.XX.XXXXXX', sip: '503/SIP-DS/XXX/2024',
    strBerlaku: '12 Maret 2029', sipBerlaku: '1 Juli 2027', ihs: 'IHS ✓', ihsId: '10009880728', status: 'Aktif',
    email: 'andi@example.test', telp: '08XXXXXXXX01', jadwal: 'Senin–Kamis · 08:00–12:00',
  },
  {
    id: 'N-0013', nama: 'dr. Lina Marlina', profesi: 'Dokter umum', unit: 'Poli Umum',
    nik: '32XXXXXXXXXX', nip: '19870611XXXXXXX002', str: '33.1.1.100.1.XX.XXXXXX', sip: '503/SIP-DU/XXX/2024',
    strBerlaku: '5 Mei 2028', sipBerlaku: '5 Mei 2026', ihs: 'IHS ✓', ihsId: '10006926841', status: 'Aktif',
    email: 'lina@example.test', telp: '08XXXXXXXX02', jadwal: 'Senin–Jumat · 07:30–14:00',
  },
  {
    id: 'N-0014', nama: 'Ns. Rudi Hartono, S.Kep', profesi: 'Perawat', unit: 'IGD',
    nik: '33XXXXXXXXXX', nip: '19900302XXXXXXX003', str: '34.2.1.100.1.XX.XXXXXX', sip: '503/SIPP/XXX/2024',
    strBerlaku: 'Seumur hidup', sipBerlaku: '30 Juni 2026', ihs: 'PENDING_IHS', ihsId: '', status: 'Aktif',
    email: 'rudi@example.test', telp: '08XXXXXXXX03', jadwal: 'Shift pagi',
  },
  {
    id: 'N-0015', nama: 'Apt. Ratna Sari, S.Farm', profesi: 'Apoteker', unit: 'Farmasi rawat jalan',
    nik: '32XXXXXXXXXX', nip: '19890819XXXXXXX004', str: '35.1.1.200.1.XX.XXXXXX', sip: '503/SIPA/XXX/2024',
    strBerlaku: '19 Agustus 2028', sipBerlaku: '19 Agustus 2026', ihs: 'IHS ✓', ihsId: '10012345678', status: 'Aktif',
    email: 'ratna@example.test', telp: '08XXXXXXXX04', jadwal: 'Senin–Sabtu · 08:00–15:00',
  },
  {
    id: 'N-0016', nama: 'Nita Anggraini, A.Md.AK', profesi: 'Analis laboratorium', unit: 'Laboratorium',
    nik: '31XXXXXXXXXX', nip: '19930125XXXXXXX005', str: '36.3.1.300.1.XX.XXXXXX', sip: '503/SIK-ATLM/XXX/2024',
    strBerlaku: 'Seumur hidup', sipBerlaku: '25 Januari 2027', ihs: 'PENDING_IHS', ihsId: '', status: 'Aktif',
    email: 'nita@example.test', telp: '08XXXXXXXX05', jadwal: 'Shift siang',
  },
  {
    id: 'N-0017', nama: 'dr. Hendra Kusuma, Sp.B', profesi: 'Dokter spesialis', unit: 'Poli Bedah',
    nik: '34XXXXXXXXXX', nip: '19780907XXXXXXX006', str: '33.1.1.402.2.XX.XXXXXX', sip: '503/SIP-DS/XXX/2023',
    strBerlaku: '7 September 2027', sipBerlaku: '14 Juni 2025', ihs: 'IHS ✓', ihsId: '10004567123', status: 'SIP segera habis',
    email: 'hendra@example.test', telp: '08XXXXXXXX06', jadwal: 'Selasa & Kamis · 13:00–16:00',
  },
]

export const tabNakes = ['Identitas', 'Kredensial', 'Penugasan', 'Riwayat sinkron']

export const riwayatSinkronNakes = [
  { id: 1, waktu: '14 Mei 2025 07:15', aksi: 'Cari Practitioner by NIK', hasil: 'Ditemukan', status: 'Terkirim' },
  { id: 2, waktu: '1 Mei 2025 07:15', aksi: 'Validasi STR', hasil: 'Aktif', status: 'Terkirim' },
  { id: 3, waktu: '2 April 2025 10:02', aksi: 'Pemetaan unit → Organization', hasil: 'Terpetakan', status: 'Terkirim' },
]
