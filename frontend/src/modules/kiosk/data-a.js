// Data mock — Anjungan mandiri bagian A (KSK-01..04)
import { ScanLine, UserRoundPlus, ListOrdered, Wallet } from 'lucide-vue-next'

export const teksKaki = 'Sesi terlindungi · Koneksi Satu Sehat aktif · Data contoh disamarkan'

// KSK-01 · Selamat datang
export const sambutan = {
  judul: 'Pelayanan lebih mudah, mulai dari sini.',
  subjudul: 'Check-in, daftar, dan bayar secara mandiri.',
  video: { label: 'Panduan penggunaan', durasi: '01:24', langkah: 6 },
}

export const langkahSambutan = [
  { judul: '1. Kenali identitas', teks: 'Gunakan QR, kartu BPJS, atau NIK.' },
  { judul: '2. Pilih layanan', teks: 'Konfirmasi dan cetak antrean Anda.' },
]

// KSK-02 · Menu utama (kunci `aksi`: 'info' membuka dialog antrean)
export const menuLayanan = [
  { key: 'checkin', icon: ScanLine, judul: 'Check-in', teks: 'Sudah punya jadwal kunjungan', to: '/kiosk/identifikasi' },
  { key: 'baru', icon: UserRoundPlus, judul: 'Pasien Baru', teks: 'Daftar pertama kali di RS SPKD', to: '/kiosk/pasien-baru' },
  { key: 'antrean', icon: ListOrdered, judul: 'Info Antrean', teks: 'Lihat nomor yang sedang dilayani', aksi: 'info' },
  { key: 'bayar', icon: Wallet, judul: 'Pembayaran', teks: 'Lihat tagihan dan bayar QRIS', to: '/kiosk/pembayaran' },
]

export const jamLayanan = 'Layanan tersedia 07.00–20.00 WIB'

// Antrean yang sedang dilayani (dialog Info Antrean)
export const antreanBerjalan = [
  { loket: 'Poli Penyakit Dalam', nomor: 'PD-07', menunggu: 5 },
  { loket: 'Poli Anak', nomor: 'A-12', menunggu: 3 },
  { loket: 'Poli Jantung', nomor: 'J-04', menunggu: 8 },
  { loket: 'Farmasi', nomor: 'F-21', menunggu: 6 },
  { loket: 'Kasir', nomor: 'K-09', menunggu: 2 },
]

// KSK-03 · Identifikasi
export const contohNik = '3201234567890001'
export const panjangNik = 16

// KSK-04 · Pasien hasil identifikasi
export const pasienKiosk = {
  nama: 'Budi Santoso',
  tanggalLahir: '14 Februari 1980',
  jenisKelamin: 'Laki-laki',
  noRm: '00-12-34',
  nik: '3201234567890001',
  ihs: 'P024783755348',
}
