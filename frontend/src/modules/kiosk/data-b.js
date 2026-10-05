// Data mock — Anjungan mandiri bagian B (KSK-05 s.d. KSK-08)

// Pasien yang sedang check-in (hasil identifikasi KSK-03/04)
export const pasienCheckin = {
  nama: 'Budi Santoso',
  nik: '32XXXXXXXXXX',
  ihs: 'P024783755348',
  ihsAktif: true,
}

// Booking hari ini (KSK-05)
export const bookingHariIni = {
  poli: 'jantung',
  tanggal: '14 Mei 2025',
  jam: '09.00–11.00',
  penjamin: 'BPJS aktif · Kelas 2',
}

// Daftar poli + jadwal dokter hari ini. `ikon` dipetakan ke komponen lucide di view.
export const daftarPoli = [
  { key: 'jantung', nama: 'Poli Jantung', dokter: 'dr. Andi', jam: '09.00–11.00', sisa: 8, kuota: 15, prefix: 'J', lokasi: 'Lantai 2, Ruang 3', dilayani: 'J-05', tunggu: 15, ikon: null },
  { key: 'anak', nama: 'Poli Anak', dokter: 'dr. Ratna', jam: '08.00–12.00', sisa: 10, kuota: 20, prefix: 'A', lokasi: 'Lantai 1, Ruang 2', dilayani: 'A-09', tunggu: 10, ikon: 'baby' },
  { key: 'saraf', nama: 'Poli Saraf', dokter: 'dr. Bayu', jam: '10.00–13.00', sisa: 6, kuota: 15, prefix: 'S', lokasi: 'Lantai 2, Ruang 5', dilayani: 'S-03', tunggu: 20, ikon: 'brain' },
  { key: 'mata', nama: 'Poli Mata', dokter: 'dr. Nina', jam: '08.00–11.00', sisa: 8, kuota: 20, prefix: 'M', lokasi: 'Lantai 1, Ruang 6', dilayani: 'M-11', tunggu: 12, ikon: 'eye' },
  { key: 'dalam', nama: 'Penyakit Dalam', dokter: 'dr. Rudi', jam: '09.00–12.00', sisa: 4, kuota: 15, prefix: 'D', lokasi: 'Lantai 3, Ruang 1', dilayani: 'D-08', tunggu: 25, ikon: 'stethoscope' },
]

// Tagihan contoh (KSK-07)
export const tagihan = {
  label: 'Contoh tagihan umum',
  nama: 'Sari Wulandari',
  rm: '00-12-35',
  nik: '31XXXXXXXXXX',
  ihs: 'P0XXXXXXXXXX',
  kode: 'DEMO-0514-008',
  batasDetik: 299, // 04:59
  rincian: [
    { label: 'Administrasi', nilai: 25000 },
    { label: 'Konsultasi', nilai: 150000 },
    { label: 'Obat', nilai: 35000 },
    { label: 'Laboratorium', nilai: 75000 },
  ],
}

// Pola QR ilustrasi 13×13 (bukan QR asli) — sesuai bentuk di desain
export const ukuranQr = 13
export function modulQrAktif(baris, kolom) {
  const r = baris % 3
  if (r === 2) return true
  if (r === 0) return kolom % 3 !== 0
  return kolom % 3 !== 1
}

// Pasien baru (KSK-08) — hasil pencocokan Dukcapil (mock)
export const pasienBaru = {
  nik: '33XXXXXXXXXX',
  nama: 'Rina Pertiwi',
  lahir: '05 Juni 1987',
  kelamin: 'Perempuan',
  alamat: 'Jl. Contoh No. 5, Bandung',
  hp: '08XXXXXXXX56',
  rmBaru: '00-12-36',
  antreanRegistrasi: 'R-14',
}

export const langkahPasienBaru = ['NIK', 'Identitas', 'Foto', 'Cetak RM']

export const teksKaki = 'Sesi terlindungi · Koneksi Satu Sehat aktif · Data contoh disamarkan'
