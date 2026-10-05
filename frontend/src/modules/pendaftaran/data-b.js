// Data mock — Pendaftaran bagian B (PDR-05 s.d. PDR-08)

// ---------- PDR-05 · Panel BPJS ----------
export const ringkasanBpjs = [
  { label: 'Kepesertaan', value: 'Aktif', note: 'Cek VClaim 09:10 WIB' },
  { label: 'Hak kelas', value: 'Kelas 2', note: 'PRB: tidak' },
  { label: 'Selisih biaya', value: 'Rp0', note: 'Tanpa naik kelas' },
]

export const pesertaBpjs = {
  nik: '32XXXXXXXXXX',
  noKartu: '000XXXXXXXXXX7',
  nama: 'Budi Santoso',
  faskes: 'Klinik Contoh',
  noRujukan: 'RUJ-DEMO-140525',
  noSep: 'SEP-DEMO-140525-007',
  jamSep: '09:10',
}

export const ketentuanPelayanan = 'Rujukan aktif sampai 14 Agustus 2025. Poli tujuan: Jantung. Dokter: dr. Andi.'

export const riwayatKunjungan90 = [
  { id: 1, tanggal: '12 Mei 2025', poli: 'Jantung', diagnosis: 'I50.0', sep: 'SEP-DEMO-0512', status: 'Selesai' },
  { id: 2, tanggal: '05 Mei 2025', poli: 'Jantung', diagnosis: 'I10', sep: 'SEP-DEMO-0505', status: 'Selesai' },
  { id: 3, tanggal: '10 April 2025', poli: 'Penyakit dalam', diagnosis: 'I10', sep: 'SEP-DEMO-0410', status: 'Selesai' },
]

// ---------- PDR-06 · Monitor Antrean Poli ----------
// Rekap total seluruh poli (angka awal desain)
export const rekapAntrean = { menunggu: 24, dipanggil: 4, dilayani: 8, skip: 3 }

export const monitorPoli = [
  {
    key: 'jantung',
    poli: 'Poli Jantung',
    dilayani: 'J-05',
    dilewati: ['J-06'],
    antrean: [
      { nomor: 'J-07', nama: 'Budi', tunggu: 12, nik: '32XXXXXXXXXX' },
      { nomor: 'J-08', nama: 'Agus', tunggu: 6, nik: '32XXXXXXXXXX' },
      { nomor: 'J-09', nama: 'Hana', tunggu: 2, nik: '36XXXXXXXXXX' },
    ],
  },
  {
    key: 'anak',
    poli: 'Poli Anak',
    dilayani: 'A-04',
    dilewati: ['A-03'],
    antrean: [
      { nomor: 'A-05', nama: 'Nina', tunggu: 12, nik: '31XXXXXXXXXX' },
      { nomor: 'A-06', nama: 'Raka', tunggu: 5, nik: '32XXXXXXXXXX' },
    ],
  },
  {
    key: 'saraf',
    poli: 'Poli Saraf',
    dilayani: 'S-08',
    dilewati: ['S-07'],
    antrean: [
      { nomor: 'S-09', nama: 'Dedi', tunggu: 12, nik: '31XXXXXXXXXX' },
      { nomor: 'S-10', nama: 'Wati', tunggu: 4, nik: '33XXXXXXXXXX' },
    ],
  },
]

// ---------- PDR-07 · Jadwal Dokter ----------
export const tampilanJadwal = [
  { key: 'minggu', label: 'Minggu' },
  { key: 'hari', label: 'Hari' },
  { key: 'dokter', label: 'Dokter' },
]

export const opsiPoliJadwal = ['Poli Jantung', 'Poli Anak', 'Poli Saraf', 'Poli Mata', 'Poli Penyakit Dalam']

export const periodeJadwal = '12–18 Mei 2025'
export const hariIniJadwal = 'rab'

// Slot dasar per hari · jenis: pagi (biru) | sore (hijau) | cuti (kuning)
const slotDasar = [
  { jam: '08.00–11.00', dokter: 'dr. Andi', jenis: 'pagi', terisi: 10, kuota: 20 },
  { jam: '11.00–13.00', dokter: 'dr. Ratna', jenis: 'sore', terisi: 10, kuota: 20 },
  { jam: '14.00–16.00', dokter: 'dr. Bayu', jenis: 'pagi', terisi: 10, kuota: 20 },
]
const hari = [
  { key: 'sen', label: 'Sen 12', nama: 'Senin' },
  { key: 'sel', label: 'Sel 13', nama: 'Selasa' },
  { key: 'rab', label: 'Rab 14', nama: 'Rabu' },
  { key: 'kam', label: 'Kam 15', nama: 'Kamis' },
  { key: 'jum', label: 'Jum 16', nama: 'Jumat' },
  { key: 'sab', label: 'Sab 17', nama: 'Sabtu' },
  { key: 'min', label: 'Min 18', nama: 'Minggu' },
]

export const jadwalMingguan = hari.map((h) => ({
  ...h,
  slot: slotDasar.map((s, i) => {
    const slot = { ...s, id: `${h.key}-${i}` }
    // Rabu pagi dr. Andi: kuota 15, terisi 7
    if (h.key === 'rab' && i === 0) Object.assign(slot, { terisi: 7, kuota: 15, tampilSisa: true })
    // Jumat siang dr. Ratna: cuti / blok
    if (h.key === 'jum' && i === 1) Object.assign(slot, { jenis: 'cuti', jam: 'Cuti / blok', jamAsli: '11.00–13.00' })
    return slot
  }),
}))

// ---------- PDR-08 · Daftar Booking ----------
export const rekapBooking = { total: 38, checkIn: 33, menunggu: 5 }

export const tabBooking = [
  { key: 'semua', label: 'Hari ini' },
  { key: 'menunggu', label: 'Menunggu check-in' },
  { key: 'hadir', label: 'Sudah hadir' },
  { key: 'batal', label: 'Dibatalkan' },
]

// status: hadir | menunggu | batal · prefix = huruf antrean poli
export const daftarBooking = [
  { id: 1, waktu: '09:00', nama: 'Budi', nik: '32XXXXXXXXXX', poli: 'Jantung', prefix: 'J', sumber: 'Mobile JKN', status: 'hadir', antrean: 'J-07', pasienId: 1 },
  { id: 2, waktu: '09:30', nama: 'Dedi', nik: '34XXXXXXXXXX', poli: 'Saraf', prefix: 'S', sumber: 'WhatsApp', status: 'menunggu', pasienId: 4 },
  { id: 3, waktu: '09:45', nama: 'Nina', nik: '35XXXXXXXXXX', poli: 'Mata', prefix: 'M', sumber: 'SPKD Mobile', status: 'menunggu', pasienId: 5 },
  { id: 4, waktu: '10:00', nama: 'Agus', nik: '36XXXXXXXXXX', poli: 'Jantung', prefix: 'J', sumber: 'Mobile JKN', status: 'menunggu', pasienId: 6 },
  { id: 5, waktu: '10:15', nama: 'Sari', nik: '31XXXXXXXXXX', poli: 'Anak', prefix: 'A', sumber: 'SPKD Mobile', status: 'menunggu', pasienId: 3 },
  { id: 6, waktu: '10:30', nama: 'Rudi', nik: '37XXXXXXXXXX', poli: 'Bedah', prefix: 'B', sumber: 'WhatsApp', status: 'menunggu' },
  { id: 7, waktu: '10:45', nama: 'Hana', nik: '36XXXXXXXXXX', poli: 'Jantung', prefix: 'J', sumber: 'Mobile JKN', status: 'hadir', antrean: 'J-03' },
  { id: 8, waktu: '11:00', nama: 'Raka', nik: '32XXXXXXXXXX', poli: 'Anak', prefix: 'A', sumber: 'SPKD Mobile', status: 'hadir', antrean: 'A-02' },
  { id: 9, waktu: '11:15', nama: 'Wati', nik: '33XXXXXXXXXX', poli: 'Saraf', prefix: 'S', sumber: 'WhatsApp', status: 'batal' },
]
