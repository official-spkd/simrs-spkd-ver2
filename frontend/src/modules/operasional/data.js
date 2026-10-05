// Data mock — Beranda operasional (SHL-02)
export const ringkasan = [
  { label: 'Kunjungan hari ini', value: 142, note: '24 pasien menunggu' },
  { label: 'Pasien rawat inap', value: 78, note: '100 bed tersedia' },
  { label: 'Resep aktif', value: 23, note: '6 menunggu telaah' },
  { label: 'Order penunjang', value: 36, note: '2 CITO' },
]

export const kunjunganPerJam = [
  { label: '07', value: 18 },
  { label: '08', value: 32 },
  { label: '09', value: 45 },
  { label: '10', value: 21 },
  { label: '11', value: 12 },
  { label: '12', value: 8 },
  { label: '13', value: 6, highlight: true },
]

export const notifikasiPrioritas = [
  { tone: 'danger', title: 'Hb kritis · Rina Pertiwi', text: '5,8 g/dL · dr. Andi · 09:08 WIB', to: '/laboratorium' },
  { tone: 'warning', title: '6 resep perlu telaah', text: 'Farmasi rawat jalan · resep tertua 18 menit', to: '/farmasi' },
  { tone: 'danger', title: '14 pesan gagal terkirim', text: 'Integration Hub · tinjau DLQ', to: '/integration-hub' },
]

export const aktivitas = [
  { id: 1, waktu: '09:12', layanan: 'CPPT · Poli Jantung', pasien: 'Budi · NIK 32XXXXXXXXXX', petugas: 'dr. Andi', status: 'Draft' },
  { id: 2, waktu: '09:10', layanan: 'Check-in · J-07', pasien: 'Budi · IHS ✓', petugas: 'Loket 2', status: 'Terkirim' },
  { id: 3, waktu: '09:08', layanan: 'Laboratorium CITO', pasien: 'Rina · NIK 33XXXXXXXXXX', petugas: 'Analis Nita', status: 'Kritis' },
  { id: 4, waktu: '09:05', layanan: 'Obat diserahkan', pasien: 'Sari · NIK 31XXXXXXXXXX', petugas: 'Apt. Ratna', status: 'Selesai' },
]
