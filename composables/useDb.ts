// "Database internal RS" versi MVP front-end: seluruh data mock + aturan bisnis utama
// disimpan di localStorage supaya alur (loket → poli → kasir) bisa dijalankan end-to-end
// dan tersinkron antar tab (mis. layar VWR). Ganti isi action dengan panggilan API saat backend siap.
import { reactive, watch } from 'vue'

export type Role = 'fo' | 'dokter' | 'kasir' | 'mgmt' | 'it' | 'superadmin'
export type Penjamin = 'Umum' | 'BPJS' | 'Asuransi'

const KEY = 'spkd-db-v1'
export const TASK_BPJS: Record<number, string> = { 1: 'Mulai Tunggu Admisi', 2: 'Mulai Layani Admisi', 3: 'Selesai Admisi', 4: 'Mulai Tunggu Poli', 5: 'Mulai Layani Dokter', 6: 'Mulai Tunggu Farmasi', 7: 'Selesai Penyerahan Obat' }
let _db: any = null
let _loading = false

const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

function seed() {
  const t = todayStr()
  const at = (h: number, m = 0) => {
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }
  const polis = [
    { id: 'poli-pd', kode: 'PD', nama: 'Penyakit Dalam', ruang: 'Ruang 3', aktif: true },
    { id: 'poli-an', kode: 'AN', nama: 'Anak', ruang: 'Ruang 4', aktif: true },
    { id: 'poli-um', kode: 'UM', nama: 'Umum', ruang: 'Ruang 1', aktif: true },
    { id: 'poli-gg', kode: 'GG', nama: 'Gigi', ruang: 'Ruang 5', aktif: true },
  ]
  const doctors = [
    { id: 'dr-maya', nama: 'dr. Maya Putri, Sp.PD', spesialis: 'Penyakit Dalam', poliId: 'poli-pd', sip: 'SIP-PD-0192', str: 'STR-3321', ihs: 'N10000001' },
    { id: 'dr-sari', nama: 'dr. Sari Wulandari, Sp.A', spesialis: 'Anak', poliId: 'poli-an', sip: 'SIP-AN-0457', str: 'STR-5502', ihs: 'N10000002' },
    { id: 'dr-andi', nama: 'dr. Andi Pratama', spesialis: 'Umum', poliId: 'poli-um', sip: 'SIP-UM-0881', str: 'STR-7710', ihs: '' },
    { id: 'dr-raka', nama: 'drg. Raka Putra', spesialis: 'Gigi', poliId: 'poli-gg', sip: 'SIP-GG-0220', str: 'STR-1204', ihs: 'N10000004' },
    { id: 'dr-lina', nama: 'dr. Lina Hartono, Sp.PD', spesialis: 'Penyakit Dalam', poliId: 'poli-pd', sip: 'SIP-PD-0310', str: 'STR-4418', ihs: '' },
    { id: 'dr-yudha', nama: 'dr. Yudha Prakoso, Sp.PD', spesialis: 'Penyakit Dalam', poliId: 'poli-pd', sip: 'SIP-PD-0344', str: 'STR-6093', ihs: '' },
  ]
  const schedules: any[] = []
  const efektif = t.slice(0, 8) + '01'
  // Template IT-03: dr. Maya Putri Sen–Kam 08.00–12.00 (30), Jum 08.00–11.00 (24), Sab 08.00–10.00 (18), Min libur; dr. Yudha Sen–Sab 08.00–12.00 (30) sebagai pengganti.
  const tplMaya: Record<number, [string, number]> = { 1: ['12:00', 10], 2: ['12:00', 10], 3: ['12:00', 10], 4: ['12:00', 10], 5: ['11:00', 8], 6: ['10:00', 6] }
  doctors.forEach((d, i) => {
    for (let h = 0; h < 7; h++) {
      if (d.id === 'dr-maya' || d.id === 'dr-yudha') {
        const m = d.id === 'dr-maya' ? tplMaya[h] : h >= 1 && h <= 6 ? ['12:00', 10] as [string, number] : undefined
        if (!m) continue
        const [selesai, per] = m
        schedules.push({ id: `sch-${d.id}-${h}`, doctorId: d.id, hari: h, mulai: '08:00', selesai, kuota: per * 3, jkn: per * 2, mobile: per, nonMobile: per, nonJkn: per, efektif })
        continue
      }
      if (h === 0 && i > 2) continue
      if (d.id === 'dr-lina' && h % 2 === 0) continue
      const kuota = d.id === 'dr-raka' ? 10 : 15
      const jkn = d.id === 'dr-raka' ? 6 : 10
      const mobile = Math.ceil(jkn / 2)
      schedules.push({ id: `sch-${d.id}-${h}`, doctorId: d.id, hari: h, mulai: i % 2 ? '13:00' : '08:00', selesai: i % 2 ? '17:00' : '12:00', kuota, jkn, mobile, nonMobile: jkn - mobile, nonJkn: kuota - jkn, efektif })
    }
  })
  const mk = (id: string, rm: string, nik: string, nama: string, tgl: string, jk: string, hp: string, pj: Penjamin, kartu = '', alergi = '') => ({
    id, rm, nik, nama, tglLahir: tgl, jk, tempatLahir: 'Bandung', agama: 'Islam', pendidikan: 'SMA', pekerjaan: 'Swasta', statusKawin: 'Kawin', golDarah: 'O',
    hp, email: '', alamatKtp: 'Jl. Merdeka No. 12, Bandung', alamatDomisili: '', pjNama: 'Keluarga ' + nama.split(' ')[0], pjHubungan: 'Keluarga', pjHp: '0812' + hp.slice(-8),
    penjamin: pj, noKartu: kartu, asuransi: pj === 'Asuransi' ? 'Prudential' : '', noPolis: pj === 'Asuransi' ? 'POL-77821' : '', alergi, createdAt: at(7),
  })
  const patients = [
    mk('p1', '000128', '3273011205800001', 'Budi Santoso', '1980-05-12', 'L', '081211110001', 'Umum'),
    mk('p2', '000203', '3273014403900002', 'Nadia Putri', '2018-03-04', 'P', '081211110002', 'BPJS', '0001234567890', 'Penisilin'),
    mk('p3', '000174', '3273010101750003', 'Rudi Hartono', '1975-01-01', 'L', '081211110003', 'Umum'),
    mk('p4', '000098', '3273015507700004', 'Siti Aminah', '1970-07-15', 'P', '081211110004', 'BPJS', '0001234567891', 'Seafood'),
    mk('p5', '000186', '3273012309850005', 'Dewi Sari', '1985-09-23', 'P', '081211110005', 'Asuransi'),
    mk('p6', '000211', '3273010806950006', 'Ahmad Fauzi', '1995-06-08', 'L', '081211110006', 'Umum'),
    mk('p7', '000230', '3273011111660007', 'Hendra Wijaya', '1966-11-11', 'L', '081211110007', 'BPJS', '0001234567892'),
    mk('p8', '000245', '3273016502020008', 'Putri Ayu Lestari', '2002-02-25', 'P', '081211110008', 'Umum'),
  ]
  const tarif = [
    { id: 't-karcis', kode: 'ADM01', nama: 'Karcis rawat jalan', kategori: 'Administrasi', harga: { Umum: 30000, BPJS: 0, Asuransi: 35000 }, berlaku: '2026-01-01', versi: 1 },
    { id: 't-konsul-sp', kode: 'KON02', nama: 'Konsultasi dokter spesialis', kategori: 'Konsultasi', harga: { Umum: 150000, BPJS: 0, Asuransi: 175000 }, berlaku: '2026-01-01', versi: 1 },
    { id: 't-konsul-um', kode: 'KON01', nama: 'Konsultasi dokter umum', kategori: 'Konsultasi', harga: { Umum: 75000, BPJS: 0, Asuransi: 90000 }, berlaku: '2026-01-01', versi: 1 },
    { id: 't-ekg', kode: 'TND01', nama: 'EKG 12 lead', kategori: 'Tindakan', harga: { Umum: 120000, BPJS: 0, Asuransi: 140000 }, berlaku: '2026-01-01', versi: 1 },
    { id: 't-nebu', kode: 'TND02', nama: 'Nebulisasi', kategori: 'Tindakan', harga: { Umum: 85000, BPJS: 0, Asuransi: 100000 }, berlaku: '2026-01-01', versi: 1 },
    { id: 't-jahit', kode: 'TND03', nama: 'Jahit luka (per 5 cm)', kategori: 'Tindakan', harga: { Umum: 200000, BPJS: 0, Asuransi: 230000 }, berlaku: '2026-01-01', versi: 1 },
    { id: 't-scaling', kode: 'TND04', nama: 'Scaling gigi', kategori: 'Tindakan', harga: { Umum: 250000, BPJS: 0, Asuransi: 280000 }, berlaku: '2026-01-01', versi: 1 },
    { id: 't-cabut', kode: 'TND05', nama: 'Pencabutan gigi', kategori: 'Tindakan', harga: { Umum: 180000, BPJS: 0, Asuransi: 210000 }, berlaku: '2026-01-01', versi: 1 },
  ]
  const obat = [
    { id: 'o1', nama: 'Paracetamol 500 mg tab', harga: { Umum: 1500, BPJS: 0, Asuransi: 1800 } },
    { id: 'o2', nama: 'Amoxicillin 500 mg kap', harga: { Umum: 3000, BPJS: 0, Asuransi: 3500 } },
    { id: 'o3', nama: 'Amlodipine 10 mg tab', harga: { Umum: 4500, BPJS: 0, Asuransi: 5000 } },
    { id: 'o4', nama: 'Metformin 500 mg tab', harga: { Umum: 2000, BPJS: 0, Asuransi: 2400 } },
    { id: 'o5', nama: 'Omeprazole 20 mg kap', harga: { Umum: 3500, BPJS: 0, Asuransi: 4000 } },
    { id: 'o6', nama: 'Cetirizine 10 mg tab', harga: { Umum: 2500, BPJS: 0, Asuransi: 3000 } },
    { id: 'o7', nama: 'Ibuprofen 400 mg tab', harga: { Umum: 2000, BPJS: 0, Asuransi: 2400 } },
    { id: 'o8', nama: 'Sirup Paracetamol 120 mg/5 ml', harga: { Umum: 25000, BPJS: 0, Asuransi: 28000 } },
  ]
  const icd10 = [
    ['I10', 'Hipertensi esensial (primer)'], ['E11.9', 'Diabetes melitus tipe 2 tanpa komplikasi'], ['J00', 'Nasofaringitis akut (common cold)'],
    ['J06.9', 'Infeksi saluran napas atas akut'], ['K29.7', 'Gastritis, tidak spesifik'], ['A09', 'Gastroenteritis dan kolitis'],
    ['R50.9', 'Demam, tidak spesifik'], ['J45.9', 'Asma, tidak spesifik'], ['K02.1', 'Karies dentin'], ['K04.0', 'Pulpitis'],
    ['M54.5', 'Nyeri punggung bawah'], ['L30.9', 'Dermatitis, tidak spesifik'], ['N39.0', 'Infeksi saluran kemih'], ['R51', 'Sakit kepala'],
    ['E78.5', 'Hiperlipidemia, tidak spesifik'], ['B34.9', 'Infeksi virus, tidak spesifik'],
  ].map(([kode, nama]) => ({ kode, nama }))

  const visits: any[] = []
  const counters: Record<string, number> = {}
  const nextNo = (key: string) => (counters[key] = (counters[key] || 0) + 1)
  const addVisit = (patientId: string, poliId: string, doctorId: string, kanal: string, status: string, antStatus: string, jam: number, extra: any = {}) => {
    const pt = patients.find((p) => p.id === patientId)!
    const poli = polis.find((p) => p.id === poliId)!
    const n = nextNo(`${t}|${poliId}`)
    const seq = visits.length + 1
    const v: any = {
      id: 'v' + seq, noKunjungan: `RJ-${t.slice(2, 4)}${t.slice(5, 7)}-${pad(seq, 6)}`, patientId, tanggal: t, poliId, doctorId, penjamin: pt.penjamin,
      tipe: 'baru', keluhan: 'Pemeriksaan umum', pj: pt.pjNama, kanal, status,
      antreanPoli: { nomor: `${poli.kode}-${pad(n)}`, status: antStatus }, jamDaftar: at(jam), jamPanggil: null, jamMulai: null, jamSelesai: null,
      sep: pt.penjamin === 'BPJS' ? { status: 'terbit', noSep: '0301R0011026V' + pad(seq, 6), noRujukan: 'RJK-' + pad(seq, 5), noKontrol: '' } : null,
      dokumen: [], satuSehat: 'terkirim', pembatalan: null, kondisiPulang: '', caraPulang: '', tglKontrol: '', ...extra,
    }
    visits.push(v)
    return v
  }
  addVisit('p1', 'poli-pd', 'dr-maya', 'loket', 'terdaftar', 'menunggu', 8, { satuSehat: 'antrian' })
  addVisit('p2', 'poli-an', 'dr-sari', 'apm', 'terdaftar', 'menunggu', 8, { satuSehat: 'terkirim' })
  addVisit('p3', 'poli-um', 'dr-andi', 'loket', 'dilayani', 'dilayani', 8, { jamPanggil: at(8, 40), jamMulai: at(8, 45) })
  const v4 = addVisit('p4', 'poli-pd', 'dr-maya', 'apm', 'selesai', 'selesai', 7, { jamPanggil: at(7, 30), jamMulai: at(7, 35), jamSelesai: at(8, 5), satuSehat: 'antrian', caraPulang: 'pulang', kondisiPulang: 'membaik' })
  const v5 = addVisit('p5', 'poli-gg', 'dr-raka', 'reservasi', 'lunas', 'selesai', 7, { jamPanggil: at(7, 20), jamMulai: at(7, 25), jamSelesai: at(7, 50), caraPulang: 'pulang', kondisiPulang: 'sembuh' })
  addVisit('p6', 'poli-um', 'dr-andi', 'loket', 'dibatalkan', 'dilewati', 8, { pembatalan: { alasan: 'permintaan pasien', ket: 'Pasien harus kembali bekerja', peminta: 'Pasien', petugas: 'Dina Rahma', jam: at(8, 20) }, satuSehat: 'antrian' })
  addVisit('p7', 'poli-pd', 'dr-lina', 'apm', 'terdaftar', 'menunggu', 9)

  const vitals: any = { v3: [{ ver: 1, td: '130/85', nadi: 82, rr: 18, suhu: 36.8, spo2: 98, tb: 170, bb: 72, kesadaran: 'Compos mentis', nyeri: 2, risikoJatuh: 'tidak', keluhan: 'Batuk 3 hari', alergi: '', alasan: '', by: 'Dokter/Perawat', at: at(8, 42) }] }
  vitals.v4 = [{ ...vitals.v3[0], td: '150/95', keluhan: 'Pusing, tekanan darah tinggi', alergi: 'Seafood' }]
  vitals.v5 = [{ ...vitals.v3[0], keluhan: 'Gigi berlubang' }]
  const soap: any = {
    v4: { s: 'Pusing sejak 2 hari, tengkuk berat.', fisik: 'Kesadaran compos mentis, tidak ada defisit neurologis.', diagUtama: { kode: 'I10', nama: 'Hipertensi esensial (primer)' }, diagSekunder: [], asesmen: 'Hipertensi derajat 1.', p: 'Amlodipine 10 mg 1x1, kontrol 2 minggu.', tindakLanjut: 'pulang', lampiran: [], signed: true, signedAt: at(8, 3), addenda: [] },
    v5: { s: 'Gigi berlubang sisi kanan bawah.', fisik: 'Karies dentin gigi 46.', diagUtama: { kode: 'K02.1', nama: 'Karies dentin' }, diagSekunder: [], asesmen: 'Karies profunda.', p: 'Scaling dan tambal.', tindakLanjut: 'pulang', lampiran: [], signed: true, signedAt: at(7, 48), addenda: [] },
  }
  const orders: any = {
    v4: [{ id: 'od1', visitId: 'v4', jenis: 'resep', nama: 'Amlodipine 10 mg tab', refId: 'o3', dosis: '10 mg', aturan: '1 x 1 sesudah makan', jumlah: 14, racikan: false, catatan: '', pelaksana: '' }, { id: 'od2', visitId: 'v4', jenis: 'tindakan', nama: 'EKG 12 lead', refId: 't-ekg', dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '', pelaksana: 'dr. Maya Putri, Sp.PD' }],
    v5: [{ id: 'od3', visitId: 'v5', jenis: 'tindakan', nama: 'Scaling gigi', refId: 't-scaling', dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '', pelaksana: 'drg. Raka Putra' }],
  }
  const bills: any = {
    v5: { visitId: 'v5', status: 'lunas', skema: 'Asuransi', plafon: 500000, selisih: 0, diskon: { nominal: 0, alasan: '' }, manual: [], noInv: `INV/${t.replace(/-/g, '')}/0001`, finalAt: at(8), items: [], payments: [{ id: 'pay1', metode: 'Tunai', jumlah: 0, at: at(8, 5), ref: '', kasir: 'Rina Kasir' }], noKw: `KW/${t.replace(/-/g, '')}/0001` },
  }
  const reservations = [
    { id: 'r1', kode: `BK-${t.slice(2).replace(/-/g, '')}-006`, patientId: 'p8', poliId: 'poli-pd', doctorId: 'dr-maya', tanggal: t, kanal: 'loket', status: 'booked', jam: '09.30', dibuat: at(7) },
    { id: 'r2', kode: `BK-${t.slice(2).replace(/-/g, '')}-007`, patientId: 'p7', poliId: 'poli-an', doctorId: 'dr-sari', tanggal: addDays(t, 3), kanal: 'apm', status: 'booked', jam: '13.30', dibuat: at(7) },
  ]
  // Data demo IT-03 (minggu berjalan): terisi Selasa 23, Rabu 12, Jumat 6; Kamis dr. Maya cuti → dr. Yudha pengganti (terisi 8).
  const senin = addDays(t, -((new Date(t + 'T00:00:00').getDay() + 6) % 7))
  const isiSesi = (doctorId: string, tanggal: string, target: number) => {
    const dr = doctors.find((d) => d.id === doctorId)!
    const ada = visits.filter((v: any) => v.doctorId === doctorId && v.tanggal === tanggal && v.status !== 'dibatalkan').length + reservations.filter((r: any) => r.doctorId === doctorId && r.tanggal === tanggal && r.status === 'booked').length
    for (let n = ada; n < target; n++) {
      reservations.push({ id: `rd-${doctorId}-${tanggal}-${n}`, kode: `BK-${tanggal.slice(2).replace(/-/g, '')}-${doctorId.slice(3, 4)}${String(n).padStart(2, '0')}`, patientId: patients[n % patients.length].id, poliId: dr.poliId, doctorId, tanggal, kanal: n % 3 ? 'apm' : 'loket', status: 'booked', jam: `${String(8 + Math.floor((n % 12) / 3)).padStart(2, '0')}.${String((n % 3) * 20).padStart(2, '0')}`, dibuat: at(7) })
    }
  }
  isiSesi('dr-maya', addDays(senin, 1), 23)
  isiSesi('dr-maya', addDays(senin, 2), 12)
  isiSesi('dr-maya', addDays(senin, 4), 6)
  isiSesi('dr-yudha', addDays(senin, 3), 8)
  const cuti = [{ id: 'cuti-seed1', doctorId: 'dr-maya', tanggal: addDays(senin, 3), penggantiId: 'dr-yudha', alasan: 'Cuti tahunan' }]
  // Antrean loket (A-xxx)
  const loket = [
    { id: 'lk1', nomor: 'A-010', kanal: 'loket', jam: at(7, 40), status: 'selesai', loket: 1, patientId: null },
    { id: 'lk2', nomor: 'A-011', kanal: 'apm', jam: at(7, 50), status: 'selesai', loket: 2, patientId: null },
    { id: 'lk3', nomor: 'A-012', kanal: 'loket', jam: at(8, 5), status: 'dipanggil', loket: 2, patientId: null },
    { id: 'lk4', nomor: 'A-013', kanal: 'apm', jam: at(8, 10), status: 'menunggu', loket: null, patientId: null },
    { id: 'lk5', nomor: 'A-014', kanal: 'reservasi', jam: at(8, 12), status: 'menunggu', loket: null, patientId: null },
    { id: 'lk6', nomor: 'A-015', kanal: 'loket', jam: at(8, 20), status: 'menunggu', loket: null, patientId: null },
  ]
  counters[`${t}|loket`] = 15
  counters[`${t}|visit`] = visits.length
  counters[`${t}|inv`] = 1
  counters[`${t}|rsv`] = 7
  const users = [
    { id: 'u1', nama: 'Dina Rahma', username: 'fo', password: 'demo123', role: 'fo', unit: 'Loket 2 · Rawat Jalan', aktif: true, loginTerakhir: at(7), nakes: null },
    { id: 'u2', nama: 'dr. Maya Putri, Sp.PD', username: 'dokter', password: 'demo123', role: 'dokter', unit: 'Poli Penyakit Dalam', poliId: 'poli-pd', doctorId: 'dr-maya', aktif: true, loginTerakhir: at(7), nakes: 'SIP-PD-0192 / STR-3321' },
    { id: 'u3', nama: 'Rina Kasir', username: 'kasir', password: 'demo123', role: 'kasir', unit: 'Kasir Rawat Jalan', aktif: true, loginTerakhir: at(7), nakes: null },
    { id: 'u4', nama: 'Pak Sofian', username: 'manajemen', password: 'demo123', role: 'mgmt', unit: 'Manajemen RS', aktif: true, loginTerakhir: at(6), nakes: null },
    { id: 'u5', nama: 'Tim IT RS', username: 'it', password: 'demo123', role: 'it', unit: 'Instalasi SIMRS', aktif: true, loginTerakhir: at(6), nakes: null },
  ]
  const modules = ['Pendaftaran', 'Antrean', 'Poliklinik / EMR', 'Kasir', 'Laporan', 'Master data', 'Integrasi', 'Audit']
  const mx = (l: string, i = '', e = '', h = '', v = '') => ({ lihat: !!l, input: !!i, edit: !!e, hapus: !!h, verifikasi: !!v })
  const matrix: any = {
    fo: { Pendaftaran: mx('1', '1', '1', '', ''), Antrean: mx('1', '1', '1'), 'Poliklinik / EMR': mx(''), Kasir: mx(''), Laporan: mx('1'), 'Master data': mx('1'), Integrasi: mx(''), Audit: mx('') },
    dokter: { Pendaftaran: mx('1'), Antrean: mx('1', '1', '1'), 'Poliklinik / EMR': mx('1', '1', '1', '', '1'), Kasir: mx(''), Laporan: mx(''), 'Master data': mx('1'), Integrasi: mx(''), Audit: mx('') },
    kasir: { Pendaftaran: mx('1'), Antrean: mx(''), 'Poliklinik / EMR': mx(''), Kasir: mx('1', '1', '1', '', '1'), Laporan: mx('1'), 'Master data': mx('1'), Integrasi: mx(''), Audit: mx('') },
    mgmt: { Pendaftaran: mx('1'), Antrean: mx('1'), 'Poliklinik / EMR': mx(''), Kasir: mx('1'), Laporan: mx('1'), 'Master data': mx('1'), Integrasi: mx('1'), Audit: mx('1') },
    it: Object.fromEntries(modules.map((m) => [m, mx('1', '1', '1', '1', '1')])),
  }
  const devices = [
    { id: 'd1', nama: 'APM Lobi 01', tipe: 'APM', unit: 'Lobi utama', terikat: 'Loket pendaftaran', online: true, kode: '', terdaftar: true },
    { id: 'd2', nama: 'TV Loket', tipe: 'Display', unit: 'Area loket', terikat: 'VWR-01 Display Loket', online: true, kode: '', terdaftar: true },
    { id: 'd3', nama: 'TV Ruang Tunggu Poli', tipe: 'Display', unit: 'Ruang tunggu', terikat: 'VWR-02 Display Poli', online: true, kode: '', terdaftar: true },
  ]
  const outbox = [
    { id: 'ob1', at: at(7, 5), modul: 'Satu Sehat', resource: 'Patient', ref: '000128', status: 'terkirim', percobaan: 1, galat: '' },
    { id: 'ob2', at: at(8, 6), modul: 'Satu Sehat', resource: 'Encounter', ref: v4.noKunjungan, status: 'antrian', percobaan: 0, galat: '' },
    { id: 'ob3', at: at(8, 10), modul: 'Satu Sehat', resource: 'Observation', ref: 'v4', status: 'gagal', percobaan: 5, galat: '503 Service Unavailable (DLQ)' },
    { id: 'ob4', at: at(8, 3), modul: 'VClaim', resource: 'SEP', ref: 'v2', status: 'terkirim', percobaan: 1, galat: '' },
  ]
  return {
    version: 1, polis, doctors, schedules, cuti, patients, tarif, obat, icd10, visits, reservations, loket, counters, vitals, soap, orders, bills,
    users, matrix, modules, devices, outbox, audit: [] as any[], queueLog: [] as any[], lastCall: null as any, shifts: [
      { id: 'sh1', kasir: 'Rina Kasir', mulai: at(7), selesai: null, closed: false },
    ], integrasi: { satuSehat: { nama: 'Satu Sehat (FHIR)', status: 'online', mode: 'mock', tokenExpiry: at(23) }, vclaim: { nama: 'BPJS VClaim', status: 'stub', mode: 'mock', tokenExpiry: at(23) }, antrol: { nama: 'BPJS Antrol', status: 'ditunda', mode: 'mock', tokenExpiry: null } },
    notifications: [{ id: 'n1', teks: '1 pengiriman Satu Sehat masuk DLQ (Observation)', at: at(8, 10), dibaca: false }],
    seedDate: t,
  }
}

function load(): any {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d.version === 1 && d.seedDate === todayStr()) return d
    }
  } catch {}
  return seed()
}

export function useDb() {
  if (!_db) {
    _db = reactive(import.meta.client ? load() : seed())
    if (import.meta.client) {
      let timer: any
      // scope terlepas: watcher tidak ikut berhenti saat komponen pemanggil pertama dilepas (mis. halaman APM)
      effectScope(true).run(() => watch(_db, () => {
        if (_loading) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          try { localStorage.setItem(KEY, JSON.stringify(_db)) } catch {}
        }, 80)
      }, { deep: true }))
      window.addEventListener('storage', (e) => {
        if (e.key !== KEY || !e.newValue) return
        _loading = true
        try {
          const d = JSON.parse(e.newValue)
          Object.keys(d).forEach((k) => (_db[k] = d[k]))
        } finally {
          setTimeout(() => (_loading = false), 0)
        }
      })
    }
  }
  const db = _db
  const { user } = useAuth()
  // Penomoran INV/KW unik: penghitung tidak boleh di bawah nomor yang sudah terpakai hari ini (mis. dari data demo awal)
  for (const [key, field] of [['inv', 'noInv'], ['kw', 'noKw']] as const) {
    const ck = `${todayStr()}|${key}`
    const tag = todayStr().replace(/-/g, '')
    const maks = Math.max(0, ...Object.values(db.bills).map((b: any) => String(b[field] || '')).filter((n) => n.includes(`/${tag}/`)).map((n) => parseInt(n.split('/').pop() || '0', 10) || 0))
    if ((db.counters[ck] || 0) < maks) db.counters[ck] = maks
  }
  // Data demo booking Mobile JKN hari ini (kode 10 digit YYMMDD+NNNN) untuk APM-03/04/08 — simulasi lokal, bukan API BPJS.
  const tglKode = todayStr().slice(2).replace(/-/g, '')
  if (!db.reservations.some((r: any) => r.kanal === 'mobile-jkn' && r.tanggal === todayStr())) {
    db.reservations.push(
      { id: 'rj1', kode: tglKode + '0001', kodeBooking: tglKode + '0001', patientId: 'p1', poliId: 'poli-um', doctorId: 'dr-andi', tanggal: todayStr(), kanal: 'mobile-jkn', status: 'booked', jam: '13.30', dibuat: nowIso() },
      { id: 'rj2', kode: tglKode + '0007', kodeBooking: tglKode + '0007', patientId: 'p7', poliId: 'poli-um', doctorId: 'dr-andi', tanggal: todayStr(), kanal: 'mobile-jkn', status: 'booked', jam: '09.35', dibuat: nowIso() },
    )
  }

  // ---------- helper umum ----------
  const audit = (aksi: string, objek: string, alasan = '') => {
    db.audit.unshift({ id: uid('a'), at: nowIso(), user: user.value?.nama || 'Sistem', role: user.value?.role || '-', aksi, objek, alasan, ip: '10.10.1.' + (20 + (user.value?.id?.length || 0)) })
  }
  const enqueue = (resource: string, ref: string, modul = 'Satu Sehat') => {
    db.outbox.unshift({ id: uid('ob'), at: nowIso(), modul, resource, ref, status: 'antrian', percobaan: 0, galat: '' })
  }
  const nextCounter = (key: string) => (db.counters[`${todayStr()}|${key}`] = (db.counters[`${todayStr()}|${key}`] || 0) + 1)
  const poli = (id: string) => db.polis.find((p: any) => p.id === id)
  const doctor = (id: string) => db.doctors.find((d: any) => d.id === id)
  const patient = (id: string) => db.patients.find((p: any) => p.id === id)
  const visit = (id: string) => db.visits.find((v: any) => v.id === id)
  const patientOf = (v: any) => patient(v.patientId)

  // ---------- jadwal & kuota (satu sumber untuk loket / APM / reservasi) ----------
  const sessionFor = (doctorId: string, date: string) => {
    const hari = new Date(date + 'T00:00:00').getDay()
    const sch = db.schedules.find((s: any) => s.doctorId === doctorId && s.hari === hari)
    if (!sch) return null
    const cuti = db.cuti.find((c: any) => c.doctorId === doctorId && c.tanggal === date)
    const vs = db.visits.filter((v: any) => v.doctorId === doctorId && v.tanggal === date && v.status !== 'dibatalkan')
    const rs = db.reservations.filter((r: any) => r.doctorId === doctorId && r.tanggal === date && r.status === 'booked')
    const loketN = vs.filter((v: any) => v.kanal === 'loket').length
    const apmN = vs.filter((v: any) => v.kanal === 'apm').length
    const rsvN = rs.length + vs.filter((v: any) => v.kanal === 'reservasi').length
    const terisi = loketN + apmN + rsvN
    return { ...sch, cuti: cuti || null, terisiLoket: loketN, terisiApm: apmN, terisiReservasi: rsvN, terisi, sisa: cuti && !cuti.penggantiId ? 0 : Math.max(0, sch.kuota - terisi) }
  }
  const polisAktifHariIni = (date = todayStr()) =>
    db.polis.filter((p: any) => p.aktif && db.doctors.some((d: any) => d.poliId === p.id && d.aktif !== false && sessionFor(d.id, date)))
  const doctorsOfPoli = (poliId: string, date = todayStr()) =>
    db.doctors.filter((d: any) => d.poliId === poliId && d.aktif !== false).map((d: any) => ({ ...d, sesi: sessionFor(d.id, date) })).filter((d: any) => d.sesi)

  // ---------- pasien ----------
  const searchPatients = (q: string, tipe = 'auto') => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const res = db.patients.filter((p: any) => {
      if (tipe === 'nik') return p.nik === s
      if (tipe === 'bpjs') return p.noKartu === s
      if (tipe === 'rm') return p.rm === s || p.rm === s.padStart(6, '0')
      if (tipe === 'nama') return p.nama.toLowerCase().includes(s)
      return p.nik === s || p.noKartu === s || p.rm === s || p.rm === s.padStart(6, '0') || p.nama.toLowerCase().includes(s)
    })
    audit('cari pasien', `"${q}" (${tipe}) → ${res.length} hasil`)
    return res
  }
  const lastVisitOf = (patientId: string) =>
    db.visits.filter((v: any) => v.patientId === patientId && v.status !== 'dibatalkan').sort((a: any, b: any) => (b.jamDaftar > a.jamDaftar ? 1 : -1))[0]
  const createPatient = (f: any) => {
    if (!/^\d{16}$/.test(f.nik || '')) throw new Error('NIK harus 16 digit')
    const dupe = db.patients.find((p: any) => p.nik === f.nik)
    if (dupe) throw new Error(`409: NIK sudah terdaftar atas No. RM ${dupe.rm} (${dupe.nama})`)
    const sama = db.patients.find((p: any) => p.nama.toLowerCase() === (f.nama || '').toLowerCase() && p.tglLahir === f.tglLahir)
    if (sama && !f._abaikanDuplikat) throw new Error(`DUPLIKAT: nama + tanggal lahir sama dengan No. RM ${sama.rm}. Periksa kembali.`)
    const maxRm = Math.max(...db.patients.map((p: any) => parseInt(p.rm)), 0)
    const p = { alamatDomisili: '', email: '', alergi: '', noKartu: '', asuransi: '', noPolis: '', tempatLahir: '', agama: '', pendidikan: '', pekerjaan: '', statusKawin: '', golDarah: '', pjNama: '', pjHubungan: '', pjHp: '', ...f, id: uid('p'), rm: pad(maxRm + 1, 6), createdAt: nowIso() }
    delete (p as any)._abaikanDuplikat
    db.patients.push(p)
    audit('buat pasien', `RM ${p.rm} · ${p.nama}`)
    enqueue('Patient', p.rm)
    return p
  }
  const updatePatient = (id: string, f: any) => {
    const p = patient(id)
    const diff = Object.keys(f).filter((k) => p[k] !== f[k])
    Object.assign(p, f)
    if (diff.length) audit('ubah identitas', `RM ${p.rm}: ${diff.join(', ')}`)
    return p
  }
  const setAlergi = (patientId: string, alergi: string) => { patient(patientId).alergi = alergi }

  // ---------- antrean loket ----------
  const takeLoketTicket = (kanal = 'loket', patientId: string | null = null) => {
    const n = nextCounter('loket')
    const tk = { id: uid('lk'), nomor: `A-${pad(n)}`, kanal, jam: nowIso(), status: 'menunggu', loket: null, patientId }
    db.loket.push(tk)
    return tk
  }
  const loketMenunggu = () => db.loket.filter((t: any) => t.status === 'menunggu')
  const loketAktif = (noLoket: number) => db.loket.find((t: any) => t.status === 'dipanggil' && t.loket === noLoket)
  const logQ = (type: string, nomor: string, aksi: string, extra: any = {}) => {
    const e = { id: uid('q'), at: nowIso(), type, nomor, aksi, ...extra }
    db.queueLog.unshift(e)
    if (db.queueLog.length > 300) db.queueLog.length = 300
    if (aksi === 'panggil' || aksi === 'panggil ulang') db.lastCall = { ...e, ts: Date.now() }
  }
  const callNextLoket = (noLoket: number) => {
    const cur = loketAktif(noLoket)
    if (cur) throw new Error(`Loket ${noLoket} masih memanggil ${cur.nomor}. Selesai/lewati dulu.`)
    const tk = loketMenunggu().sort((a: any, b: any) => (a.jam > b.jam ? 1 : -1))[0]
    if (!tk) throw new Error('Tidak ada antrean menunggu')
    if (db.loket.some((t: any) => t.id === tk.id && t.status !== 'menunggu')) throw new Error('Nomor sudah dipanggil loket lain')
    tk.status = 'dipanggil'; tk.loket = noLoket
    logQ('loket', tk.nomor, 'panggil', { loket: noLoket })
    return tk
  }
  const recallLoket = (noLoket: number) => {
    const cur = loketAktif(noLoket)
    if (!cur) throw new Error('Tidak ada nomor yang sedang dipanggil')
    logQ('loket', cur.nomor, 'panggil ulang', { loket: noLoket })
    return cur
  }
  const skipLoket = (noLoket: number) => {
    const cur = loketAktif(noLoket)
    if (!cur) throw new Error('Tidak ada nomor yang sedang dipanggil')
    cur.status = 'dilewati'; logQ('loket', cur.nomor, 'lewati', { loket: noLoket })
  }
  const finishLoket = (noLoket: number) => {
    const cur = loketAktif(noLoket)
    if (!cur) throw new Error('Tidak ada nomor yang sedang dipanggil')
    cur.status = 'selesai'; logQ('loket', cur.nomor, 'selesai', { loket: noLoket })
  }

  // ---------- kunjungan ----------
  /** Daftarkan kunjungan. Kuota dikunci atomik (409 bila habis), 1 kunjungan aktif / pasien / poli / hari. */
  const registerVisit = (f: any) => {
    const date = f.tanggal || todayStr()
    if (!f.persetujuan) throw new Error('Persetujuan umum (general consent) wajib dicentang')
    const dup = db.visits.find((v: any) => v.patientId === f.patientId && v.poliId === f.poliId && v.tanggal === date && v.status !== 'dibatalkan')
    if (dup) throw new Error(`Pasien sudah punya kunjungan aktif di poli ini hari ini (${dup.antreanPoli.nomor})`)
    const sesi = sessionFor(f.doctorId, date)
    if (!sesi) throw new Error('Dokter tidak berpraktik pada tanggal ini')
    const fromRsv = f.kanal === 'reservasi'
    if (!fromRsv && sesi.sisa <= 0) throw new Error('409: Kuota dokter sudah habis')
    const pt = patient(f.patientId)
    const pl = poli(f.poliId)
    const seq = nextCounter('visit')
    const n = nextCounter(f.poliId)
    const v: any = {
      id: uid('v'), noKunjungan: `RJ-${date.slice(2, 4)}${date.slice(5, 7)}-${pad(seq, 6)}`, patientId: f.patientId, tanggal: date, poliId: f.poliId, doctorId: f.doctorId,
      penjamin: f.penjamin || pt.penjamin, tipe: f.tipe || 'baru', keluhan: f.keluhan || '', pj: f.pj || pt.pjNama, kanal: f.kanal || 'loket', status: 'terdaftar',
      antreanPoli: { nomor: `${pl.kode}-${pad(n)}`, status: 'menunggu' }, jamDaftar: nowIso(), jamPanggil: null, jamMulai: null, jamSelesai: null,
      sep: (f.penjamin || pt.penjamin) === 'BPJS' ? { status: 'menunggu', noSep: '', noRujukan: f.noRujukan || '', noKontrol: f.noKontrol || '' } : null,
      dokumen: f.dokumen || [], satuSehat: 'antrian', pembatalan: null, kondisiPulang: '', caraPulang: '', tglKontrol: '', persetujuan: true,
      asuransi: (f.penjamin || pt.penjamin) === 'Asuransi' ? { nama: f.asuransiNama || pt.asuransi, noPolis: f.noPolis || pt.noPolis, plafon: f.plafon || 0 } : null,
    }
    db.visits.push(v)
    if (fromRsv && f.reservasiId) { const r = db.reservations.find((x: any) => x.id === f.reservasiId); if (r) r.status = 'check-in' }
    audit('buat kunjungan', `${v.noKunjungan} · ${pt.nama} · ${v.antreanPoli.nomor}`)
    enqueue('Encounter', v.noKunjungan)
    if (v.sep) { enqueue('SEP', v.noKunjungan, 'VClaim'); setTimeout(() => processSep(v.id), 3500) }
    return v
  }
  /** Worker stub VClaim: SEP pending → terbit (poli tidak diblokir oleh SEP pending). */
  const processSep = (visitId: string) => {
    const v = visit(visitId)
    if (!v?.sep || v.sep.status !== 'menunggu') return
    v.sep.status = 'terbit'
    v.sep.noSep = '0301R0011026V' + pad(Math.floor(Math.random() * 999999), 6)
    const ob = db.outbox.find((o: any) => o.resource === 'SEP' && o.ref === v.noKunjungan && o.status === 'antrian')
    if (ob) { ob.status = 'terkirim'; ob.percobaan = 1 }
  }
  const retrySep = (visitId: string) => { const v = visit(visitId); if (v?.sep) { v.sep.status = 'menunggu'; setTimeout(() => processSep(visitId), 1500) } }
  const cekKepesertaan = (noKartu: string) => {
    if (!/^\d{13}$/.test(noKartu)) throw new Error('No. kartu BPJS harus 13 digit')
    const p = db.patients.find((x: any) => x.noKartu === noKartu)
    return { aktif: !noKartu.endsWith('0'), nama: p?.nama || 'PESERTA SIMULASI', kelas: 'Kelas ' + (1 + (parseInt(noKartu.slice(-1)) % 3)), noKartu: noKartu.slice(0, 4) + '*****' + noKartu.slice(-4) }
  }
  const cancelVisit = (visitId: string, f: { alasan: string; ket: string; peminta: string }) => {
    const v = visit(visitId)
    if (v.status !== 'terdaftar' || !['menunggu', 'dipanggil'].includes(v.antreanPoli.status)) throw new Error('Hanya kunjungan berstatus terdaftar / menunggu poli yang bisa dibatalkan')
    if ((f.ket || '').trim().length < 10) throw new Error('Keterangan wajib minimal 10 karakter')
    if (!f.alasan) throw new Error('Alasan wajib dipilih')
    v.status = 'dibatalkan'; v.antreanPoli.status = 'dilewati'
    v.pembatalan = { alasan: f.alasan, ket: f.ket, peminta: f.peminta || 'Pasien', petugas: user.value?.nama || '-', jam: nowIso() }
    if (v.sep) v.sep.status = 'ditolak'
    audit('batal kunjungan', `${v.noKunjungan} · ${v.antreanPoli.nomor}`, `${f.alasan}: ${f.ket}`)
    return v
  }

  // ---------- reservasi ----------
  const createReservation = (f: any) => {
    const t = todayStr()
    if (f.tanggal < t || f.tanggal > addDays(t, 30)) throw new Error('Tanggal reservasi maksimal 30 hari ke depan')
    if (db.reservations.some((r: any) => r.patientId === f.patientId && r.poliId === f.poliId && r.tanggal === f.tanggal && r.status === 'booked')) throw new Error('Satu reservasi per pasien per poli per tanggal')
    const s = sessionFor(f.doctorId, f.tanggal)
    if (!s) throw new Error('Dokter tidak berpraktik pada tanggal tersebut')
    if (s.sisa <= 0) throw new Error('409: Kuota dokter tanggal tersebut sudah habis')
    const seq = nextCounter('rsv')
    const r = { id: uid('r'), kode: `BK-${f.tanggal.slice(2).replace(/-/g, '')}-${pad(seq)}`, kanal: 'loket', status: 'booked', jam: s.mulai.replace(':', '.'), dibuat: nowIso(), ...f }
    db.reservations.push(r)
    audit('buat reservasi', r.kode)
    return r
  }
  const cancelReservation = (id: string) => { const r = db.reservations.find((x: any) => x.id === id); r.status = 'batal'; audit('batal reservasi', r.kode) }
  const rescheduleReservation = (id: string, tanggal: string) => {
    const r = db.reservations.find((x: any) => x.id === id)
    const s = sessionFor(r.doctorId, tanggal)
    if (!s || s.sisa <= 0) throw new Error('Kuota / jadwal dokter tidak tersedia pada tanggal itu')
    r.tanggal = tanggal; audit('jadwal ulang reservasi', r.kode)
  }
  const checkInReservation = (id: string) => {
    const r = db.reservations.find((x: any) => x.id === id)
    if (r.tanggal !== todayStr()) throw new Error('Check-in hanya pada hari H')
    const pt = patient(r.patientId)
    const v = registerVisit({ patientId: r.patientId, poliId: r.poliId, doctorId: r.doctorId, penjamin: pt.penjamin, kanal: 'reservasi', tipe: 'kontrol', keluhan: 'Reservasi ' + r.kode, persetujuan: true, reservasiId: r.id })
    return v
  }

  // ---------- check-in booking Mobile JKN / online (APM-03/04/08) ----------
  const findBooking = (kode: string) => db.reservations.find((r: any) => (r.kodeBooking || r.kode) === kode)
  /** Booked → Hadir: terbitkan kunjungan + nomor antrean poli, catat Task ID 3 (simulasi lokal). */
  const checkInBooking = (id: string) => {
    const r = db.reservations.find((x: any) => x.id === id)
    if (!r) throw new Error('Kode booking tidak ditemukan')
    if (r.status !== 'booked') throw new Error('Booking ini sudah check-in atau tidak aktif')
    const v = checkInReservation(id)
    v.kodeBooking = r.kodeBooking || r.kode
    v.viaMobileJkn = r.kanal === 'mobile-jkn'
    catatTask(v, 1); catatTask(v, 2); catatTask(v, 3)
    if (v.viaMobileJkn) enqueue('Antrol Task 3', v.kodeBooking, 'BPJS Antrol')
    return v
  }

  // ---------- poliklinik ----------
  /** Task ID BPJS Antrol (demo lokal, bukan API nyata): 3 saat terdaftar, 4 dipanggil, 5 mulai periksa, 6 resep ke farmasi. */
  const catatTask = (v: any, n: number) => {
    if (v.penjamin !== 'BPJS') return
    v.taskBpjs = v.taskBpjs || {}
    if (!v.taskBpjs[n]) v.taskBpjs[n] = nowIso()
  }
  const taskBpjs = (v: any) => {
    if (v.penjamin !== 'BPJS') return { n: 0, label: 'Tidak berlaku · non-BPJS', cls: 'b-navy' }
    const n = Math.max(3, ...Object.keys(v.taskBpjs || {}).map(Number))
    return { n, label: `Task ${n} · ${TASK_BPJS[n]}`, cls: n === 3 ? 'b-warn' : 'b-ok' }
  }
  const poliQueue = (poliId: string | null, doctorId: string | null) =>
    db.visits.filter((v: any) => v.tanggal === todayStr() && v.status !== 'dibatalkan' && (!poliId || v.poliId === poliId) && (!doctorId || v.doctorId === doctorId))
  const callPoli = (visitId: string) => {
    const v = visit(visitId)
    if (v.status === 'dibatalkan') throw new Error('Kunjungan dibatalkan')
    v.antreanPoli.status = v.antreanPoli.status === 'vital selesai' ? 'vital selesai' : 'dipanggil'
    if (!v.jamPanggil) v.jamPanggil = nowIso()
    catatTask(v, 4)
    logQ('poli', v.antreanPoli.nomor, 'panggil', { ruang: poli(v.poliId).ruang, dokter: doctor(v.doctorId).nama, poliId: v.poliId })
  }
  const recallPoli = (visitId: string) => {
    const v = visit(visitId)
    logQ('poli', v.antreanPoli.nomor, 'panggil ulang', { ruang: poli(v.poliId).ruang, dokter: doctor(v.doctorId).nama, poliId: v.poliId })
  }
  const skipPoli = (visitId: string) => { const v = visit(visitId); v.antreanPoli.status = 'dilewati'; logQ('poli', v.antreanPoli.nomor, 'lewati', { poliId: v.poliId }) }
  const startExam = (visitId: string) => {
    const v = visit(visitId)
    if (v.status === 'dibatalkan') throw new Error('Kunjungan dibatalkan')
    if (v.status === 'terdaftar') {
      v.status = 'dilayani'
      v.jamMulai = nowIso()
      if (!v.jamPanggil) v.jamPanggil = nowIso()
      if (v.antreanPoli.status !== 'vital selesai') v.antreanPoli.status = 'dilayani'
      catatTask(v, 4)
      catatTask(v, 5)
      enqueue('Encounter', v.noKunjungan)
      audit('mulai periksa', v.noKunjungan)
    }
    return v
  }
  const saveVitals = (visitId: string, f: any, alasan = '') => {
    const v = visit(visitId)
    const list = (db.vitals[visitId] = db.vitals[visitId] || [])
    if (list.length && !alasan.trim()) throw new Error('Koreksi vital sign wajib menyertakan alasan (versi baru)')
    list.push({ ...f, ver: list.length + 1, alasan, by: user.value?.nama || '-', at: nowIso() })
    if (f.alergi !== undefined && f.alergi !== null) setAlergi(v.patientId, f.alergi)
    if (v.antreanPoli.status === 'menunggu' || v.antreanPoli.status === 'dipanggil') v.antreanPoli.status = 'vital selesai'
    enqueue('Observation', v.noKunjungan)
    audit('simpan vital sign', v.noKunjungan, alasan)
  }
  const latestVitals = (visitId: string) => { const l = db.vitals[visitId]; return l?.length ? l[l.length - 1] : null }
  const emptySoap = () => ({ s: '', fisik: '', diagUtama: null, diagSekunder: [], asesmen: '', p: '', tindakLanjut: 'pulang', lampiran: [], signed: false, signedAt: null, addenda: [] })
  const getSoap = (visitId: string) => (db.soap[visitId] = db.soap[visitId] || emptySoap())
  const signSoap = (visitId: string) => {
    const s = getSoap(visitId)
    if (!s.diagUtama) throw new Error('Minimal 1 diagnosis utama sebelum tanda tangan')
    s.signed = true; s.signedAt = nowIso()
    enqueue('Condition', visit(visitId).noKunjungan)
    if (s.lampiran.length) enqueue('DocumentReference', visit(visitId).noKunjungan)
    audit('tanda tangan SOAP', visit(visitId).noKunjungan)
  }
  const hargaDari = (kind: 'tarif' | 'obat', refId: string, pj: string) => {
    const it = (kind === 'tarif' ? db.tarif : db.obat).find((x: any) => x.id === refId)
    return it ? it.harga[pj] ?? it.harga.Umum : 0
  }
  const addOrder = (visitId: string, o: any) => {
    const v = visit(visitId)
    const s = getSoap(visitId)
    if (s.signed) throw new Error('SOAP sudah ditandatangani; gunakan addendum')
    const row = { id: uid('od'), visitId, racikan: false, catatan: '', pelaksana: '', dosis: '', aturan: '', ...o }
    ;(db.orders[visitId] = db.orders[visitId] || []).push(row)
    enqueue(row.jenis === 'resep' ? 'MedicationRequest' : 'Procedure', v.noKunjungan)
    return row
  }
  const removeOrder = (visitId: string, id: string) => {
    if (getSoap(visitId).signed) throw new Error('SOAP sudah ditandatangani; order terkunci')
    db.orders[visitId] = (db.orders[visitId] || []).filter((o: any) => o.id !== id)
  }
  const closeVisit = (visitId: string, f: { kondisiPulang: string; caraPulang: string; tglKontrol?: string; doctorIdKontrol?: string }) => {
    const v = visit(visitId)
    const s = getSoap(visitId)
    if (v.status !== 'dilayani') throw new Error('Kunjungan harus berstatus dilayani')
    if (!s.diagUtama) throw new Error('Belum ada diagnosis utama')
    if (!s.signed) throw new Error('SOAP belum ditandatangani')
    if (f.caraPulang === 'kontrol ulang' && !f.tglKontrol) throw new Error('Tanggal kontrol wajib diisi')
    v.status = 'selesai'; v.antreanPoli.status = 'selesai'; v.jamSelesai = nowIso()
    v.kondisiPulang = f.kondisiPulang; v.caraPulang = f.caraPulang; v.tglKontrol = f.tglKontrol || ''
    if ((db.orders[visitId] || []).some((o: any) => o.jenis === 'resep')) catatTask(v, 6)
    ensureBill(visitId)
    enqueue('Encounter', v.noKunjungan)
    audit('tutup kunjungan', v.noKunjungan)
    if (f.caraPulang === 'kontrol ulang' && f.tglKontrol) {
      createReservation({ patientId: v.patientId, poliId: v.poliId, doctorId: f.doctorIdKontrol || v.doctorId, tanggal: f.tglKontrol, kanal: 'loket' })
    }
    return v
  }

  // ---------- tagihan ----------
  const karcisItems = (v: any) => {
    const pj = v.penjamin
    const isSp = doctor(v.doctorId)?.spesialis !== 'Umum' && doctor(v.doctorId)?.spesialis !== 'Gigi'
    const kon = isSp ? 't-konsul-sp' : 't-konsul-um'
    const mk = (tid: string, kat: string, qty = 1) => {
      const t = db.tarif.find((x: any) => x.id === tid)
      const harga = t.harga[pj] ?? t.harga.Umum
      return { id: 'auto-' + tid, kategori: kat, nama: t.nama, sumber: 'Pendaftaran', at: v.jamDaftar, tarif: harga, qty, subtotal: harga * qty, manual: false, alasan: '' }
    }
    return [mk('t-karcis', 'Administrasi'), mk(kon, 'Konsultasi')]
  }
  const orderItems = (v: any) =>
    (db.orders[v.id] || []).map((o: any) => {
      const harga = o.jenis === 'resep' ? hargaDari('obat', o.refId, v.penjamin) : hargaDari('tarif', o.refId, v.penjamin)
      return { id: 'ord-' + o.id, kategori: o.jenis === 'resep' ? 'Obat/resep' : 'Tindakan', nama: o.nama + (o.jumlah > 1 ? '' : ''), sumber: `KL-05 · ${o.jenis === 'tindakan' ? o.pelaksana || 'Dokter' : 'Dokter'}`, at: v.jamMulai || v.jamDaftar, tarif: harga, qty: o.jumlah, subtotal: harga * o.jumlah, manual: false, alasan: '' }
    })
  const ensureBill = (visitId: string) => {
    if (!db.bills[visitId]) {
      const v = visit(visitId)
      db.bills[visitId] = { visitId, status: 'draf', skema: v.penjamin === 'BPJS' ? 'BPJS' : v.penjamin === 'Asuransi' ? 'Asuransi' : 'Tunai', plafon: 0, selisih: 0, diskon: { nominal: 0, alasan: '' }, manual: [], items: [], noInv: '', finalAt: null, payments: [], noKw: '' }
    }
    return db.bills[visitId]
  }
  /** Baris tagihan: dibekukan setelah final, sebelum itu dihitung ulang dari kunjungan + order + item manual. */
  const billItems = (visitId: string) => {
    const b = db.bills[visitId]
    if (b && b.status !== 'draf') return b.items
    const v = visit(visitId)
    return [...karcisItems(v), ...orderItems(v), ...(b?.manual || [])]
  }
  const billTotals = (visitId: string) => {
    const b = db.bills[visitId]
    const items = billItems(visitId)
    const total = items.reduce((s: number, i: any) => s + i.subtotal, 0)
    const diskon = b?.diskon?.nominal || 0
    const net = Math.max(0, total - diskon)
    const skema = b?.skema || 'Tunai'
    let penjamin = 0, pasien = net, selisih = 0
    if (skema === 'BPJS') { selisih = b?.selisih || 0; penjamin = Math.max(0, net - selisih); pasien = selisih }
    else if (skema === 'Asuransi') { penjamin = Math.min(net, b?.plafon || 0); pasien = net - penjamin; selisih = pasien }
    const bayar = (b?.payments || []).reduce((s: number, p: any) => s + p.jumlah, 0)
    return { total, diskon, net, penjamin, pasien, selisih, bayar, sisa: Math.max(0, pasien - bayar) }
  }
  const tagihanList = () => db.visits.filter((v: any) => v.status !== 'dibatalkan' && (v.tanggal === todayStr()))
  const setSkema = (visitId: string, skema: string, plafon = 0, selisih = 0) => {
    const b = ensureBill(visitId)
    if (b.status !== 'draf') throw new Error('Tagihan sudah final')
    b.skema = skema; b.plafon = Number(plafon) || 0; b.selisih = Number(selisih) || 0
  }
  const addManualItem = (visitId: string, f: { nama: string; tarif: number; qty: number; alasan: string }) => {
    const b = ensureBill(visitId)
    if (b.status !== 'draf') throw new Error('Tagihan sudah final')
    if ((f.alasan || '').trim().length < 15) throw new Error('Item manual wajib alasan minimal 15 karakter')
    b.manual.push({ id: uid('mn'), kategori: 'Lainnya', nama: f.nama, sumber: `${user.value?.nama} (manual)`, at: nowIso(), tarif: Number(f.tarif), qty: Number(f.qty), subtotal: Number(f.tarif) * Number(f.qty), manual: true, alasan: f.alasan })
    audit('tambah item tagihan manual', visit(visitId).noKunjungan, f.alasan)
  }
  const setDiskon = (visitId: string, nominal: number, alasan: string) => {
    const b = ensureBill(visitId)
    if (b.status !== 'draf') throw new Error('Tagihan sudah final')
    if (nominal > 0 && alasan.trim().length < 15) throw new Error('Diskon wajib alasan minimal 15 karakter')
    b.diskon = { nominal: Number(nominal) || 0, alasan }
    audit('ubah diskon tagihan', visit(visitId).noKunjungan, alasan)
  }
  const finalizeBill = (visitId: string) => {
    const v = visit(visitId)
    if (v.status !== 'selesai') throw new Error('Hanya kunjungan status selesai yang bisa difinalkan')
    const b = ensureBill(visitId)
    if (b.status !== 'draf') return b
    b.items = JSON.parse(JSON.stringify(billItems(visitId)))
    b.status = 'final'
    b.noInv = `INV/${todayStr().replace(/-/g, '')}/${pad(nextCounter('inv'), 4)}`
    b.finalAt = nowIso()
    audit('finalkan tagihan', `${v.noKunjungan} · ${b.noInv}`)
    return b
  }
  const currentShift = () => db.shifts.find((s: any) => !s.closed && s.kasir === (user.value?.nama || 'Rina Kasir')) || db.shifts.find((s: any) => !s.closed)
  const pay = (visitId: string, parts: { metode: string; jumlah: number; ref?: string; diterima?: number; kembalian?: number }[]) => {
    const v = visit(visitId)
    const b = db.bills[visitId]
    if (!b || b.status !== 'final') throw new Error('Finalkan tagihan terlebih dahulu')
    const { sisa } = billTotals(visitId)
    const sum = parts.reduce((s, p) => s + Number(p.jumlah), 0)
    if (sum <= 0 && sisa > 0) throw new Error('Nominal bayar tidak valid')
    if (sum < sisa) throw new Error(`Pembayaran kurang ${fmtRp(sisa - sum)}`)
    let remain = sisa
    const shift = currentShift()
    parts.forEach((p) => {
      const j = Math.min(Number(p.jumlah), remain); remain -= j
      // tunai: simpan uang diterima & kembalian untuk invoice/kwitansi (KS-04)
      b.payments.push({ id: uid('pay'), metode: p.metode, jumlah: j, at: nowIso(), ref: p.ref || '', kasir: user.value?.nama || '-', shiftId: shift?.id, ...(p.metode === 'Tunai' && p.diterima ? { diterima: Number(p.diterima), kembalian: Math.max(0, Number(p.diterima) - j) } : {}) })
    })
    if (!b.payments.length) b.payments.push({ id: uid('pay'), metode: 'Tunai', jumlah: 0, at: nowIso(), ref: 'BPJS', kasir: user.value?.nama || '-', shiftId: shift?.id })
    b.status = 'lunas'; v.status = 'lunas'
    b.noKw = `KW/${todayStr().replace(/-/g, '')}/${pad(nextCounter('kw'), 4)}`
    audit('terima pembayaran', `${v.noKunjungan} · ${b.noKw}`)
    return b
  }
  const closeShift = (id: string, rekon: { tunaiTerhitung?: number; catatan?: string; selisih?: number } = {}) => {
    const s = db.shifts.find((x: any) => x.id === id)
    if (!s || s.closed) throw new Error('Shift sudah ditutup')
    s.closed = true; s.selesai = nowIso(); s.rekon = { ...rekon, total: shiftSummary(s).total }
    db.shifts.push({ id: uid('sh'), kasir: s.kasir, mulai: nowIso(), selesai: null, closed: false })
    audit('tutup shift', s.kasir, rekon.catatan || '')
  }
  const shiftSummary = (s: any) => {
    const pays = Object.values(db.bills).flatMap((b: any) => b.payments || []).filter((p: any) => p.shiftId === s.id || (!p.shiftId && s.id === 'sh1'))
    const by = (m: string) => pays.filter((p: any) => p.metode === m).reduce((a: number, p: any) => a + p.jumlah, 0)
    const n = (m: string) => pays.filter((p: any) => p.metode === m).length
    return { transaksi: pays.length, tunai: by('Tunai'), qris: by('QRIS'), va: by('VA'), total: pays.reduce((a: number, p: any) => a + p.jumlah, 0), nTunai: n('Tunai'), nQris: n('QRIS'), nVa: n('VA') }
  }

  // ---------- notifikasi / integrasi ----------
  const retryOutbox = (ids: string[]) => db.outbox.forEach((o: any) => { if (ids.includes(o.id)) { o.status = 'terkirim'; o.percobaan += 1; o.galat = '' } })
  const flushOutbox = () => {
    // simulasi worker latar: antrian → terkirim
    db.outbox.forEach((o: any) => { if (o.status === 'antrian' && Date.now() - new Date(o.at).getTime() > 8000) { o.status = 'terkirim'; o.percobaan += 1 } })
    db.visits.forEach((v: any) => { if (v.satuSehat === 'antrian' && Date.now() - new Date(v.jamDaftar).getTime() > 20000) v.satuSehat = 'terkirim' })
  }
  const resetDemo = () => { localStorage.removeItem(KEY); location.reload() }

  return {
    db, uid, audit, poli, doctor, patient, visit, patientOf,
    sessionFor, polisAktifHariIni, doctorsOfPoli,
    searchPatients, lastVisitOf, createPatient, updatePatient, setAlergi,
    takeLoketTicket, loketMenunggu, loketAktif, callNextLoket, recallLoket, skipLoket, finishLoket,
    registerVisit, processSep, retrySep, cekKepesertaan, cancelVisit,
    createReservation, cancelReservation, rescheduleReservation, checkInReservation, findBooking, checkInBooking,
    poliQueue, taskBpjs, callPoli, recallPoli, skipPoli, startExam, saveVitals, latestVitals, getSoap, signSoap, addOrder, removeOrder, closeVisit,
    hargaDari, ensureBill, billItems, billTotals, tagihanList, setSkema, addManualItem, setDiskon, finalizeBill, pay, currentShift, closeShift, shiftSummary,
    retryOutbox, flushOutbox, resetDemo,
  }
}
