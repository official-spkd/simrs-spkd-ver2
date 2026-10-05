// Data mock — Pendaftaran bagian A (PDR-01 s.d. PDR-04)

// ---------- PDR-01 · Worklist Pendaftaran ----------
export const antreanLoket = [
  { nomor: 'A-012', nama: 'Budi Santoso', loket: 'Loket 2', identitas: 'NIK 32XXXXXXXXXX · IHS ✓' },
  { nomor: 'A-013', nama: 'Sari', loket: 'Loket 1', identitas: 'NIK 31XXXXXXXXXX · IHS ✓', tunggu: 4 },
  { nomor: 'A-014', nama: 'Dedi', loket: 'Loket 2', identitas: 'NIK 35XXXXXXXXXX · IHS ✓', tunggu: 2 },
]

export const bookingMenunggu = [
  { jam: '09:30', nama: 'Dedi', poli: 'Saraf' },
  { jam: '09:45', nama: 'Nina', poli: 'Mata' },
  { jam: '10:00', nama: 'Agus', poli: 'Jantung' },
  { jam: '10:15', nama: 'Sari', poli: 'Anak' },
  { jam: '10:30', nama: 'Rudi', poli: 'Bedah' },
]

export const totalKunjunganHariIni = 142

export const kunjunganHariIni = [
  { id: 1, antrean: 'J-07', pasien: 'Budi · 00-12-34', poli: 'Jantung', status: 'Dipanggil', identitas: 'IHS ✓' },
  { id: 2, antrean: 'A-04', pasien: 'Sari · 00-12-35', poli: 'Anak', status: 'Dilayani', identitas: 'IHS ✓' },
  { id: 3, antrean: 'S-09', pasien: 'Dedi · 00-12-37', poli: 'Saraf', status: 'Menunggu', identitas: 'IHS ✓' },
  { id: 4, antrean: 'M-03', pasien: 'Nina · 00-12-38', poli: 'Mata', status: 'Menunggu', identitas: 'IHS ✓' },
  { id: 5, antrean: 'J-08', pasien: 'Agus · 00-12-39', poli: 'Jantung', status: 'Menunggu', identitas: 'Antrian IHS' },
  { id: 6, antrean: 'B-05', pasien: 'Rina · 00-12-36', poli: 'Penyakit dalam', status: 'Dilayani', identitas: 'IHS ✓' },
]

// ---------- PDR-02 · Cari Pasien ----------
export const pasienTerdaftar = [
  { id: 1, rm: '00-12-34', nik: '32XXXXXXXXXX', nama: 'Budi Santoso', umur: 45, dukcapil: '✓ Terverifikasi', ihs: '✓ P024783755348' },
  { id: 2, rm: '00-18-09', nik: '31XXXXXXXXXX', nama: 'Budi Hartono', umur: 61, dukcapil: '✓ Terverifikasi', ihs: 'Antrian' },
  { id: 3, rm: '00-12-35', nik: '31XXXXXXXXXX', nama: 'Sari Wulandari', umur: 6, dukcapil: '✓ Terverifikasi', ihs: '✓ P024783755912' },
  { id: 4, rm: '00-12-37', nik: '35XXXXXXXXXX', nama: 'Dedi Kurniawan', umur: 52, dukcapil: '✓ Terverifikasi', ihs: '✓ P024783756021' },
  { id: 5, rm: '00-12-38', nik: '33XXXXXXXXXX', nama: 'Nina Lestari', umur: 38, dukcapil: '✓ Terverifikasi', ihs: '✓ P024783756188' },
  { id: 6, rm: '00-12-39', nik: '32XXXXXXXXXX', nama: 'Agus Salim', umur: 57, dukcapil: '✓ Terverifikasi', ihs: 'Antrian' },
  { id: 7, rm: '00-12-36', nik: '33XXXXXXXXXX', nama: 'Rina Pertiwi', umur: 49, dukcapil: '✓ Terverifikasi', ihs: '✓ P024783756230' },
]

// ---------- PDR-03 · Form Pasien Baru ----------
export const langkahPasienBaru = [
  { key: 1, label: '1 · Verifikasi NIK' },
  { key: 2, label: '2 · Demografi & kontak' },
  { key: 3, label: '3 · Penjamin' },
  { key: 4, label: '4 · Kunjungan' },
]

export const pasienBaruAwal = {
  nik: '33XXXXXXXXXX',
  nama: 'Rina Pertiwi',
  tanggalLahir: '05 Juni 1987',
  jenisKelamin: 'Perempuan',
  agama: 'Islam',
  alamat: 'Jl. Contoh No. 5, Bandung',
  domisili: 'Sama dengan alamat KTP',
  telepon: '08XXXXXXXX56',
  email: 'rina@example.test',
  penjamin: 'BPJS · Kelas 2',
  noKartu: '0001XXXXXXX27',
  kontakDarurat: 'Dedi',
  hubungan: 'suami',
}

export const rmBaru = '00-12-36'

export const opsiJenisKelamin = ['Perempuan', 'Laki-laki']
export const opsiAgama = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']
export const opsiDomisili = ['Sama dengan alamat KTP', 'Berbeda dengan alamat KTP']
export const opsiPenjamin = ['BPJS · Kelas 1', 'BPJS · Kelas 2', 'BPJS · Kelas 3', 'Umum / pribadi', 'Asuransi swasta']

// ---------- PDR-04 · Form Kunjungan ----------
export const langkahKunjungan = [
  { key: 1, label: '1 Penjamin' },
  { key: 2, label: '2 Poli/Dokter' },
  { key: 3, label: '3 Tindakan Admisi' },
  { key: 4, label: '4 Ringkasan/Cetak' },
]

// Banner pasien default (Budi Santoso)
export const pasienKunjungan = {
  nama: 'Budi Santoso',
  jenisKelamin: 'Laki-laki',
  umur: 45,
  rm: '00-12-34',
  nik: '32XXXXXXXXXX',
  ihs: 'P024783755348',
  dukcapil: true,
  alergi: 'PENISILIN',
  kunjunganTerakhir: '14 Mei 2025 · dr. Andi · Encounter / Terkirim 09:12 WIB',
}

export const opsiPenjaminKunjungan = [
  { key: 'bpjs', label: 'BPJS aktif · Kelas 2', sep: 'SEP-DEMO-140525-007', prb: 'tidak', selisih: 0, ditanggung: true },
  { key: 'umum', label: 'Umum / pribadi', sep: null, prb: '-', selisih: 0, ditanggung: false },
]

export const jadwalPoli = [
  { key: 'jantung', poli: 'Poli Jantung', dokter: 'dr. Andi', jam: '09.00–11.00', sisa: 8, kuota: 15, prefix: 'J', nomor: 7, lantai: 'Lantai 2' },
  { key: 'anak', poli: 'Poli Anak', dokter: 'dr. Sinta', jam: '08.00–12.00', sisa: 5, kuota: 20, prefix: 'A', nomor: 5, lantai: 'Lantai 1' },
  { key: 'saraf', poli: 'Poli Saraf', dokter: 'dr. Hendra', jam: '10.00–13.00', sisa: 11, kuota: 15, prefix: 'S', nomor: 10, lantai: 'Lantai 2' },
  { key: 'mata', poli: 'Poli Mata', dokter: 'dr. Lestari', jam: '09.00–12.00', sisa: 6, kuota: 12, prefix: 'M', nomor: 4, lantai: 'Lantai 1' },
  { key: 'dalam', poli: 'Poli Penyakit Dalam', dokter: 'dr. Rudi', jam: '08.00–11.00', sisa: 3, kuota: 20, prefix: 'B', nomor: 6, lantai: 'Lantai 3' },
]

export const katalogAdmisi = [
  { id: 1, item: 'Administrasi', jumlah: 1, tarif: 25000, dipilih: true },
  { id: 2, item: 'Kartu kunjungan', jumlah: 1, tarif: 5000, dipilih: true },
  { id: 3, item: 'Cetak ulang kartu pasien', jumlah: 1, tarif: 10000, dipilih: false },
  { id: 4, item: 'Surat keterangan sehat', jumlah: 1, tarif: 50000, dipilih: false },
]
