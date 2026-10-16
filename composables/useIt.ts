// Data & aksi modul IT / Superadmin yang belum punya endpoint backend (IT-03..IT-08): simulasi lokal di useDb.
// Data tambahan dibuat sekali lewat migrasi (db.itDemo) agar data hari ini yang sudah tersimpan tetap terbawa.
const randCode = (n: number, alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789') =>
  Array.from({ length: n }, () => alpha[Math.floor(Math.random() * alpha.length)]).join('')

/** Sub-spesialis HFIS contoh per kode poli SIMRS (bukan master resmi BPJS). */
const SUB_HFIS: Record<string, { kode: string; nama: string }> = {
  PD: { kode: 'INT', nama: 'Dalam' }, AN: { kode: 'ANA', nama: 'Anak' }, UM: { kode: 'UMU', nama: 'Umum' }, GG: { kode: 'GIG', nama: 'Gigi' },
}
export const subHfisOf = (p: any) => SUB_HFIS[p?.kode] || { kode: (p?.kode || 'XXX').padEnd(3, 'X').slice(0, 3), nama: p?.nama || '-' }
export const ASAL_OUTBOX: Record<string, string> = { Patient: 'FO', SEP: 'FO', Encounter: 'KL', Observation: 'KL', Condition: 'KL', DocumentReference: 'KL' }
export const asalOutbox = (o: any) => ASAL_OUTBOX[o.resource] || (o.modul === 'BPJS Antrol' ? 'FO' : 'KL')
/** Objek outbox yang mudah dibaca: no. kunjungan atau RM pasien. */
export const objekOutbox = (o: any) => (/^\d{6}$/.test(o.ref) ? 'RM ' + o.ref : o.ref)
/** Latency mock stabil per kunci (ms). */
const latency = (key: string) => 120 + ([...key].reduce((s, c) => s + c.charCodeAt(0), 0) % 110)

function migrasi(db: any) {
  // ref outbox lama berisi ID kunjungan internal (mis. "v2") → no. kunjungan agar terbaca di IT-05
  db.outbox.forEach((o: any) => { const v = /^v\d+$/.test(o.ref) && db.visits.find((x: any) => x.id === o.ref); if (v) o.ref = v.noKunjungan })
  if (db.itDemo >= 1) return
  const at = (h: number, m = 0, s = 0) => { const d = new Date(); d.setHours(h, m, s, 0); return d.toISOString() }
  const vs = db.visits.filter((v: any) => v.tanggal === todayStr())

  // IT-05: DLQ contoh sesuai alur — Condition dengan encounter belum ada, Patient gagal karena token kedaluwarsa
  const ob3 = db.outbox.find((o: any) => o.id === 'ob3')
  if (ob3) Object.assign(ob3, { resource: 'Condition', ref: vs.find((v: any) => v.id === 'v4')?.noKunjungan || ob3.ref, galat: 'HTTP 422 · Referensi encounter tidak ditemukan.' })
  const pt = db.patients.find((p: any) => p.id === 'p6') || db.patients[0]
  if (pt && !db.outbox.some((o: any) => o.id === 'ob5')) db.outbox.push({ id: 'ob5', at: at(8, 6, 18), modul: 'Satu Sehat', resource: 'Patient', ref: pt.rm, status: 'gagal', percobaan: 5, galat: 'HTTP 401 · Token kedaluwarsa saat pengiriman.' })

  // IT-05 Antrol V2: satu kunjungan BPJS contoh dengan Task 1–6 (Task 6 gagal timeout mock)
  db.antrol = db.antrol || {}
  const vb = vs.find((v: any) => v.penjamin === 'BPJS' && ['selesai', 'lunas'].includes(v.status)) || vs.find((v: any) => v.penjamin === 'BPJS')
  if (vb) {
    const base = new Date(vb.jamDaftar).getTime()
    const off = [0, 2, 16, 20, 28, 45]
    vb.taskBpjs = vb.taskBpjs || {}
    off.forEach((m, i) => { if (!vb.taskBpjs[i + 1]) vb.taskBpjs[i + 1] = new Date(base - 16 * 60000 + m * 60000).toISOString() })
    vb.kodeBooking = vb.kodeBooking || todayStr().slice(2).replace(/-/g, '') + vb.noKunjungan.slice(-4)
    db.antrol[vb.id] = { 6: { status: 'gagal', latency: 5000, galat: 'timeout' } }
  }

  // IT-03: kuota 3 kanal (JKN Mobile / JKN Non-Mobile / Non-JKN) + tanggal efektif
  db.schedules.forEach((s: any) => {
    if (s.mobile != null) return
    s.mobile = Math.floor(s.jkn / 2); s.nonMobile = s.jkn - s.mobile; s.nonJkn = s.kuota - s.jkn
    s.efektif = todayStr().slice(0, 8) + '01'
  })
  db.jadwalSync = { at: at(9, 10, 8), status: 'berhasil' }

  // IT-04: versi tarif global
  db.tarifVersi = db.tarifVersi || { versi: '1.3', efektif: todayStr().slice(0, 8) + '01', riwayat: [{ versi: '1.2', efektif: '2026-07-01', at: '2026-06-25T03:00:00.000Z', user: 'Tim IT RS', ket: 'Penyesuaian tarif tindakan' }] }

  // IT-07: perangkat sesuai Figma (2 APM, 3 display) + terakhir terlihat
  const nama: Record<string, any> = {
    d1: { nama: 'APM Lobi 01', unit: 'Lobi utama', terikat: 'Registrasi RJ' },
    d2: { nama: 'VWR Lobi 01', unit: 'Lobi utama', terikat: 'Papan Loket 1–3' },
    d3: { nama: 'VWR Poli 01', unit: 'Koridor timur', terikat: 'Papan PD / Anak' },
  }
  db.devices.forEach((d: any) => { if (nama[d.id]) Object.assign(d, nama[d.id]); d.lastSeen = d.online ? nowIso() : at(8, 42, 16) })
  if (!db.devices.some((d: any) => d.id === 'd4')) db.devices.push({ id: 'd4', nama: 'APM Lobi 02', tipe: 'APM', unit: 'Lobi utama', terikat: 'Registrasi RJ', online: false, kode: '', terdaftar: true, lastSeen: at(8, 42, 16) })
  if (!db.devices.some((d: any) => d.id === 'd5')) db.devices.push({ id: 'd5', nama: 'VWR Poli 02', tipe: 'Display', unit: 'Koridor barat', terikat: 'Papan Umum / Gigi', online: true, kode: '', terdaftar: true, lastSeen: nowIso() })

  // IT-08: konfigurasi BPJS demo + snapshot master HFIS (satu dokter sengaja belum ada di master)
  const docs = db.doctors.filter((d: any) => d.aktif !== false)
  const dm = docs.slice(0, Math.max(0, docs.length - 1)).map((d: any, i: number) => ({ kode: String(123456 + i), nama: d.nama, sub: subHfisOf(db.polis.find((p: any) => p.id === d.poliId)).kode, doctorId: d.id }))
  db.hfis = {
    config: { consId: 'DEMO-001', secret: 'demo-secret-key-01', userKey: 'demo-user-key-001', radius: 500, baseUrl: 'https://apijkn.bpjs-kesehatan.go.id/antreanrs' },
    lastSync: at(9, 5), lastTest: null as any,
    master: { sub: db.polis.map((p: any) => subHfisOf(p)), dokter: dm },
    map: Object.fromEntries(dm.map((m: any) => [m.doctorId, { sub: m.sub, dokter: m.kode }])),
  }

  // IT-06: jejak login pagi ini (audit append-only)
  const u = db.users
  const log = [
    { at: at(8, 15), user: u.find((x: any) => x.role === 'dokter')?.nama || 'Dokter', role: 'dokter', aksi: 'login', objek: 'dokter', alasan: 'Login berhasil · Poli PD', ip: '10.10.2.21' },
    { at: at(8, 5), user: 'Tim IT RS', role: 'it', aksi: 'login', objek: 'it', alasan: 'Login berhasil · Sistem', ip: '10.10.4.10' },
    { at: at(7, 0, 12), user: 'Dina Rahma', role: 'fo', aksi: 'login', objek: 'fo', alasan: 'Login berhasil · Loket 2', ip: '10.10.1.22' },
  ]
  log.forEach((a, i) => db.audit.push({ id: 'a-seed' + i, ...a }))
  db.audit.sort((a: any, b: any) => (a.at < b.at ? 1 : -1))

  // IT-01: matriks izin 5 role × 7 modul (Figma). Huruf: L I E H V; `cat` = cakupan terbatas (mis. "ringkasan").
  const mx = (k: string, cat = '') => ({ lihat: k.includes('L'), input: k.includes('I'), edit: k.includes('E'), hapus: k.includes('H'), verifikasi: k.includes('V'), cat })
  const M: Record<string, [string, string][]> = {
    'Pasien & pendaftaran': [['LIEV', ''], ['L', ''], ['L', ''], ['L', ''], ['L', '']],
    'Antrean & reservasi': [['LIEH', ''], ['LIE', ''], ['', ''], ['L', ''], ['LE', '']],
    'Klinis / SOAP': [['', ''], ['LIEV', ''], ['L', 'ringkasan'], ['', ''], ['', '']],
    'Tagihan & pembayaran': [['', ''], ['L', 'item Plan'], ['LIEV', ''], ['L', 'rekap'], ['L', 'tarif']],
    'Laporan operasional': [['', ''], ['', ''], ['L', 'shift'], ['L', ''], ['L', '']],
    'Master / user / perangkat': [['', ''], ['', ''], ['', ''], ['', ''], ['LIEHV', '']],
    'Integrasi / audit': [['L', 'status'], ['L', 'status'], ['L', 'status'], ['L', 'ringkasan'], ['LV', 'audit']],
  }
  db.modules = Object.keys(M)
  db.matrix = Object.fromEntries(['fo', 'dokter', 'kasir', 'mgmt', 'it'].map((r, i) => [r, Object.fromEntries(db.modules.map((m: string) => [m, mx(M[m][i][0], M[m][i][1])]))]))
  db.itDemo = 1
}

export function useIt() {
  const { db, audit, uid, doctor, poli, patient, flushOutbox } = useDb()
  migrasi(db)

  // ---------- IT-05 Status integrasi ----------
  const hariIni = (o: any) => new Date(o.at).toDateString() === new Date().toDateString()
  const ringkasSs = () => {
    const o = db.outbox.filter((x: any) => x.modul === 'Satu Sehat' && hariIni(x))
    const kirim = o.filter((x: any) => x.status === 'terkirim')
    return {
      total: o.length, terkirim: kirim.length, antrian: o.filter((x: any) => x.status === 'antrian').length, gagal: o.filter((x: any) => x.status === 'gagal').length,
      terakhir: kirim.map((x: any) => x.sentAt || x.at).sort().pop() || null,
    }
  }
  const retry = (ids: string[]) => {
    let n = 0
    db.outbox.forEach((o: any) => {
      if (!ids.includes(o.id) || o.status === 'terkirim') return
      o.status = 'terkirim'; o.percobaan = Math.min(5, o.percobaan + 1); o.galat = ''; o.sentAt = nowIso(); n++
    })
    if (n) audit('kirim ulang outbox', `${n} paket`, 'Retry manual IT · idempoten per resource')
    return n
  }
  const ujiKoneksi = () => {
    db.integrasi.satuSehat.lastTest = nowIso()
    audit('uji koneksi integrasi', 'Satu Sehat · VClaim · Antrol', 'Mode mock · respons simulasi 200')
    return { ms: latency(nowIso()) }
  }
  const segarkan = () => flushOutbox()

  /** Timeline Task ID 1–7 Antrol V2 untuk satu kunjungan BPJS (simulasi lokal). */
  const antrolTasks = (v: any) => Object.keys(TASK_BPJS).map(Number).map((n) => {
    const t = v.taskBpjs?.[n]
    const log = db.antrol?.[v.id]?.[n]
    if (!t) return { n, nama: TASK_BPJS[n], at: null, status: 'belum', label: 'Belum terjadi', latency: '—' }
    const gagal = log?.status === 'gagal'
    return { n, nama: TASK_BPJS[n], at: t, status: gagal ? 'gagal' : 'terkirim', label: gagal ? 'Gagal · DLQ mock' : 'Terkirim · mock', latency: gagal ? `${log.latency} ms · ${log.galat}` : `${log?.latency || latency(v.id + n)} ms` }
  })
  const retryTask = (v: any, n: number) => {
    if (!v.taskBpjs?.[n]) throw new Error(`Task ID ${n} belum terjadi: tidak ada yang dikirim ulang`)
    db.antrol = db.antrol || {}
    db.antrol[v.id] = { ...(db.antrol[v.id] || {}), [n]: { status: 'terkirim', latency: latency(nowIso()), at: nowIso() } }
    audit('retry Task ID Antrol', `${v.kodeBooking || v.noKunjungan} · Task ${n}`, 'Mock · idempoten per booking + Task ID')
  }
  const antrolJson = (v: any) => {
    const p = patient(v.patientId)
    return JSON.stringify({
      mode: 'MOCK', pasien: maskNama(p?.nama || ''), rm: p?.rm, kunjungan: v.noKunjungan,
      events: antrolTasks(v).map((t) => ({ kodebooking: v.kodeBooking || v.noKunjungan, taskid: t.n, waktu: t.at ? new Date(t.at).getTime() : null, status: t.label })),
    }, null, 2)
  }

  // ---------- IT-03 Jadwal & kuota (3 kanal) ----------
  const saveTemplate = (f: any) => {
    const mobile = Number(f.mobile), nonMobile = Number(f.nonMobile), nonJkn = Number(f.nonJkn), hari = Number(f.hari)
    if (!f.doctorId) throw new Error('Dokter wajib dipilih')
    if (!(hari >= 0 && hari <= 6)) throw new Error('Hari tidak valid')
    if (!f.mulai || !f.selesai || f.mulai >= f.selesai) throw new Error('Jam selesai harus setelah jam mulai')
    if ([mobile, nonMobile, nonJkn].some((n) => !(n >= 0) || !Number.isInteger(n))) throw new Error('Kuota per kanal harus bilangan bulat ≥ 0')
    const kuota = mobile + nonMobile + nonJkn
    if (kuota < 1) throw new Error('Total kuota minimal 1')
    if (!f.efektif) throw new Error('Tanggal efektif wajib diisi')
    if (db.schedules.some((s: any) => s.doctorId === f.doctorId && s.hari === hari && s.id !== f.id)) throw new Error(`Dokter sudah punya template hari ${hariNama(hari)}`)
    const terisi = useAdmin().maxTerisi(f.doctorId, hari)
    if (kuota < terisi) throw new Error(`Total kuota tidak boleh kurang dari ${terisi} (sudah terisi)`)
    const data = { doctorId: f.doctorId, hari, mulai: f.mulai, selesai: f.selesai, kuota, jkn: mobile + nonMobile, mobile, nonMobile, nonJkn, efektif: f.efektif }
    const ket = `${doctor(f.doctorId)?.nama} · ${hariNama(hari)} ${f.mulai}-${f.selesai} · kuota ${kuota} (${mobile}/${nonMobile}/${nonJkn})`
    let s = db.schedules.find((x: any) => x.id === f.id)
    if (s) { Object.assign(s, data); audit('ubah template jadwal', ket, `efektif ${f.efektif}`) } else {
      s = { id: uid('sch-'), ...data }
      db.schedules.push(s)
      audit('tambah template jadwal', ket, `efektif ${f.efektif}`)
    }
    db.jadwalSync = { at: db.jadwalSync?.at || null, status: 'menunggu' }
    db.outbox.unshift({ id: uid('ob'), at: nowIso(), modul: 'BPJS HFIS', resource: 'Jadwal dokter', ref: doctor(f.doctorId)?.nama, status: 'antrian', percobaan: 0, galat: '' })
    return s
  }
  const syncHfisJadwal = () => {
    db.outbox.forEach((o: any) => { if (o.modul === 'BPJS HFIS' && o.status !== 'terkirim') { o.status = 'terkirim'; o.percobaan += 1; o.sentAt = nowIso() } })
    db.jadwalSync = { at: nowIso(), status: 'berhasil' }
    audit('sync jadwal ke BPJS HFIS', `${db.schedules.length} template`, 'Mock · tanpa request ke BPJS')
  }

  // ---------- IT-04 Tarif & penjamin ----------
  const versiBaru = (efektif: string, ket: string, duplikat = false) => {
    if (!efektif) throw new Error('Tanggal efektif wajib diisi')
    const tv = db.tarifVersi
    if (efektif < tv.efektif) throw new Error('Tanggal efektif versi baru tidak boleh sebelum versi aktif')
    const [ma, mi] = tv.versi.split('.').map(Number)
    tv.riwayat.unshift({ versi: tv.versi, efektif: tv.efektif, at: nowIso(), user: useAuth().user.value?.nama, ket: tv.ket || '' })
    tv.versi = `${ma}.${mi + 1}`; tv.efektif = efektif; tv.ket = ket
    audit(duplikat ? 'duplikasi versi tarif' : 'buat versi tarif', `v${tv.versi}`, `efektif ${efektif}${ket ? ' · ' + ket : ''}`)
    return tv.versi
  }
  const setTarifPj = (id: string, pj: string, f: { harga: number; efektif: string; nama: string; kategori?: string }) => {
    const t = db.tarif.find((x: any) => x.id === id) || db.obat.find((x: any) => x.id === id)
    if (!t) throw new Error('Tarif tidak ditemukan')
    const harga = Number(f.harga)
    if (!(harga >= 0)) throw new Error('Tarif tidak valid')
    if (!f.nama.trim()) throw new Error('Nama layanan wajib diisi')
    if (!f.efektif) throw new Error('Tanggal efektif wajib diisi')
    if (f.efektif > todayStr()) throw new Error('Tanggal efektif di masa depan belum didukung: buat versi baru')
    if ((t.harga[pj] ?? 0) !== harga) {
      t.riwayat = [...(t.riwayat || []), { versi: t.versi || 1, berlaku: t.berlaku || '2026-01-01', harga: { ...t.harga } }]
      t.versi = (t.versi || 1) + 1
      t.harga = { ...t.harga, [pj]: harga }
      t.berlaku = f.efektif
      audit('ubah tarif', `${t.nama} · ${pj} → ${fmtRp(harga)}`, `efektif ${f.efektif} · tagihan final tidak berubah`)
    }
    if (t.nama !== f.nama.trim()) { audit('ubah nama layanan', `${t.nama} → ${f.nama.trim()}`); t.nama = f.nama.trim() }
    if (f.kategori && t.kategori && t.kategori !== f.kategori) t.kategori = f.kategori
    return t
  }
  const toggleTarifPj = (id: string, pj: string) => {
    const t = db.tarif.find((x: any) => x.id === id) || db.obat.find((x: any) => x.id === id)
    if (!t) throw new Error('Tarif tidak ditemukan')
    t.nonaktif = { ...(t.nonaktif || {}), [pj]: !t.nonaktif?.[pj] }
    audit(t.nonaktif[pj] ? 'nonaktifkan tarif' : 'aktifkan tarif', `${t.nama} · ${pj}`)
    return !t.nonaktif[pj]
  }

  // ---------- IT-07 Perangkat ----------
  const registerDevice = (f: any) => {
    if (!(f.nama || '').trim()) throw new Error('Nama perangkat wajib diisi')
    if (!f.tipe) throw new Error('Tipe perangkat wajib dipilih')
    if (!(f.unit || '').trim()) throw new Error('Unit / lokasi wajib diisi')
    if (!f.terikat) throw new Error('Papan antrean terikat wajib dipilih')
    if (db.devices.some((d: any) => d.nama.toLowerCase() === f.nama.trim().toLowerCase())) throw new Error('Nama perangkat sudah dipakai')
    const d = { id: uid('d'), nama: f.nama.trim(), tipe: f.tipe, unit: f.unit.trim(), terikat: f.terikat, online: false, terdaftar: false, kode: 'SPKD-' + randCode(4), kodeExp: new Date(Date.now() + 10 * 60000).toISOString(), lastSeen: null }
    db.devices.push(d)
    audit('daftarkan perangkat', `${d.nama} (${d.tipe}) → ${d.terikat}`, 'Kode sekali pakai berlaku 10 menit')
    return d
  }
  const kodeBaru = (id: string) => {
    const d = db.devices.find((x: any) => x.id === id)
    if (!d || d.terdaftar) throw new Error('Perangkat sudah aktif')
    d.kode = 'SPKD-' + randCode(4); d.kodeExp = new Date(Date.now() + 10 * 60000).toISOString()
    audit('terbitkan kode perangkat baru', d.nama)
    return d.kode
  }
  const aktivasi = (id: string, kode: string) => {
    const d = db.devices.find((x: any) => x.id === id)
    if (!d || d.terdaftar) throw new Error('Perangkat tidak menunggu aktivasi')
    if (!d.kodeExp || d.kodeExp < nowIso()) throw new Error('Kode kedaluwarsa (berlaku 10 menit). Buat kode baru.')
    if (d.kode !== (kode || '').trim().toUpperCase()) throw new Error('Kode registrasi salah')
    Object.assign(d, { terdaftar: true, online: true, kode: '', kodeExp: null, lastSeen: nowIso() })
    audit('aktivasi perangkat', d.nama, 'Kode ditukar dengan token perangkat')
    return d
  }
  const cabut = (id: string) => {
    const d = db.devices.find((x: any) => x.id === id)
    if (!d) throw new Error('Perangkat tidak ditemukan')
    Object.assign(d, { terdaftar: false, online: false, kode: '', kodeExp: null })
    audit('cabut akses perangkat', d.nama, 'Token perangkat diputus')
    return d
  }
  /** Heartbeat simulasi: perangkat online diperbarui "terakhir terlihat"-nya. */
  const heartbeat = () => db.devices.forEach((d: any) => { if (d.terdaftar && d.online) d.lastSeen = nowIso() })

  // ---------- IT-08 Mapping HFIS ----------
  const hfisRows = () => db.doctors.filter((d: any) => d.aktif !== false).map((d: any, i: number) => {
    const p = poli(d.poliId)
    const sub = subHfisOf(p)
    const m = db.hfis.map[d.id]
    const md = m && db.hfis.master.dokter.find((x: any) => x.kode === m.dokter)
    const cocok = !!(m && md && md.sub === m.sub && m.sub === sub.kode)
    return { d, kodeD: 'D-' + String(i + 1).padStart(3, '0'), poli: p, subSimrs: 'SUB-' + sub.kode, sub, map: m, md, status: !m ? 'perlu' : cocok ? 'cocok' : 'tidak' }
  })
  const simpanMapping = (doctorId: string, sub: string, dokter: string) => {
    const d = doctor(doctorId)
    if (!sub || !dokter) throw new Error('Subspesialis dan dokter HFIS wajib dipilih')
    const md = db.hfis.master.dokter.find((x: any) => x.kode === dokter)
    if (!md) throw new Error('Kode dokter tidak ada di master HFIS. Jalankan Sync Master HFIS.')
    if (md.sub !== sub) throw new Error('Dokter HFIS tidak berada di subspesialis yang dipilih')
    if (sub !== subHfisOf(poli(d.poliId)).kode) throw new Error('Subspesialis HFIS tidak cocok dengan poli dokter di SIMRS')
    const dup = Object.entries(db.hfis.map).find(([k, v]: any) => k !== doctorId && v.dokter === dokter)
    if (dup) throw new Error(`Kode dokter ${dokter} sudah dipetakan ke ${doctor(dup[0])?.nama}`)
    db.hfis.map[doctorId] = { sub, dokter }
    audit('simpan mapping HFIS', `${d.nama} → ${sub} · ${dokter}`, 'Simulasi lokal')
  }
  const syncMasterHfis = () => {
    const ada = new Set(db.hfis.master.dokter.map((x: any) => x.doctorId))
    let n = 0
    db.doctors.filter((d: any) => d.aktif !== false && !ada.has(d.id)).forEach((d: any) => {
      db.hfis.master.dokter.push({ kode: String(123456 + db.hfis.master.dokter.length), nama: d.nama, sub: subHfisOf(poli(d.poliId)).kode, doctorId: d.id }); n++
    })
    db.polis.forEach((p: any) => { const s = subHfisOf(p); if (!db.hfis.master.sub.some((x: any) => x.kode === s.kode)) db.hfis.master.sub.push(s) })
    db.hfis.lastSync = nowIso()
    audit('sync master HFIS', `${db.hfis.master.dokter.length} dokter · ${db.hfis.master.sub.length} subspesialis`, 'Mock · snapshot lokal')
    return n
  }
  const tesHfis = () => {
    db.hfis.lastTest = nowIso()
    audit('tes koneksi API BPJS', 'Antrol V2', 'Mock · respons simulasi 200')
  }

  return {
    ringkasSs, retry, ujiKoneksi, segarkan, antrolTasks, retryTask, antrolJson,
    saveTemplate, syncHfisJadwal, versiBaru, setTarifPj, toggleTarifPj,
    registerDevice, kodeBaru, aktivasi, cabut, heartbeat,
    hfisRows, simpanMapping, syncMasterHfis, tesHfis,
  }
}
