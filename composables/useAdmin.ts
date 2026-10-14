// Aksi master data & administrasi (modul IT / Superadmin). Memakai useDb; semua perubahan di-audit.
const randCode = (n: number, alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789') =>
  Array.from({ length: n }, () => alpha[Math.floor(Math.random() * alpha.length)]).join('')

export function useAdmin() {
  const { db, audit, uid, sessionFor, visit, patient, poli, doctor } = useDb()
  const { user } = useAuth()

  // ---------- IT-01 user & role ----------
  const saveUser = (f: any) => {
    const nama = (f.nama || '').trim()
    const username = (f.username || '').trim().toLowerCase()
    if (!nama) throw new Error('Nama wajib diisi')
    if (!/^[a-z0-9._-]{3,20}$/.test(username)) throw new Error('Username 3-20 karakter (huruf kecil, angka, titik, strip)')
    if (!f.role) throw new Error('Role wajib dipilih')
    if (db.users.some((u: any) => u.username === username && u.id !== f.id)) throw new Error('Username sudah dipakai')
    let unit = (f.unit || '').trim()
    let nakes: string | null = null
    if (f.role === 'dokter') {
      if (!f.poliId) throw new Error('Dokter/perawat wajib dipetakan ke poli')
      if (!(f.sip || '').trim() || !(f.str || '').trim()) throw new Error('Data nakes (SIP dan STR) wajib diisi untuk role dokter')
      nakes = `${f.sip.trim()} / ${f.str.trim()}`
      unit = 'Poli ' + (poli(f.poliId)?.nama || '')
    } else if (!unit) throw new Error('Unit kerja wajib diisi')
    const base: any = { nama, username, role: f.role, unit, poliId: f.role === 'dokter' ? f.poliId : undefined, doctorId: f.role === 'dokter' ? f.doctorId || undefined : undefined, nakes }
    if (f.id) {
      const u = db.users.find((x: any) => x.id === f.id)
      if (!u) throw new Error('User tidak ditemukan')
      if (u.id === user.value?.id && f.role !== u.role) throw new Error('Tidak dapat mengubah role akun yang sedang dipakai')
      const diff = ['nama', 'username', 'role', 'unit'].filter((k) => u[k] !== base[k])
      Object.assign(u, base)
      audit('ubah user', `${u.username}${diff.length ? ' (' + diff.join(', ') + ')' : ''}`)
      return { user: u, tempPassword: '' }
    }
    const tempPassword = 'Tmp-' + randCode(6)
    const u = { id: uid('u'), ...base, password: tempPassword, aktif: true, loginTerakhir: null }
    db.users.push(u)
    audit('tambah user', `${u.username} · role ${u.role}`)
    return { user: u, tempPassword }
  }
  const toggleUser = (id: string) => {
    const u = db.users.find((x: any) => x.id === id)
    if (!u) throw new Error('User tidak ditemukan')
    if (u.aktif) {
      if (u.id === user.value?.id) throw new Error('Tidak dapat menonaktifkan akun yang sedang dipakai')
      if (u.role === 'it' && db.users.filter((x: any) => x.role === 'it' && x.aktif).length <= 1) throw new Error('Minimal satu akun IT harus aktif')
    }
    u.aktif = !u.aktif
    audit(u.aktif ? 'aktifkan user' : 'nonaktifkan user', u.username)
    return u
  }
  const resetPassword = (id: string) => {
    const u = db.users.find((x: any) => x.id === id)
    if (!u) throw new Error('User tidak ditemukan')
    const pw = 'Tmp-' + randCode(6)
    u.password = pw
    audit('reset password', u.username)
    return pw
  }
  const setMatrix = (role: string, modul: string, key: string, val: boolean) => {
    if (role === 'it') throw new Error('Hak akses Superadmin tidak dapat diubah')
    const row = db.matrix[role]?.[modul]
    if (!row) throw new Error('Role/modul tidak dikenal')
    if (key !== 'lihat' && val && !row.lihat) row.lihat = true
    row[key] = val
    if (key === 'lihat' && !val) { row.input = false; row.edit = false; row.hapus = false; row.verifikasi = false }
    audit('ubah matriks akses', `${role} · ${modul} · ${key}=${val ? 'ya' : 'tidak'}`)
  }

  // ---------- IT-02 poli & dokter ----------
  const poliTerpakai = (id: string) => db.visits.some((v: any) => v.poliId === id)
  const doctorTerpakai = (id: string) => db.visits.some((v: any) => v.doctorId === id)
  const savePoli = (f: any) => {
    const kode = (f.kode || '').trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(kode)) throw new Error('Kode prefix antrean harus 2 huruf (mis. PD)')
    if (!(f.nama || '').trim()) throw new Error('Nama poli wajib diisi')
    if (db.polis.some((p: any) => p.kode === kode && p.id !== f.id)) throw new Error(`Kode ${kode} sudah dipakai poli lain`)
    if (f.id) {
      const p = poli(f.id)
      if (p.kode !== kode && poliTerpakai(p.id)) throw new Error('Kode prefix tidak dapat diubah: sudah dipakai penomoran kunjungan')
      Object.assign(p, { kode, nama: f.nama.trim(), ruang: (f.ruang || '').trim(), aktif: !!f.aktif })
      audit('ubah poli', `${p.kode} · ${p.nama}`)
      return p
    }
    const p = { id: 'poli-' + kode.toLowerCase(), kode, nama: f.nama.trim(), ruang: (f.ruang || '').trim(), aktif: !!f.aktif }
    db.polis.push(p)
    audit('tambah poli', `${p.kode} · ${p.nama}`)
    return p
  }
  const deletePoli = (id: string) => {
    const p = poli(id)
    if (poliTerpakai(id)) throw new Error('Poli sudah dipakai kunjungan: tidak bisa dihapus, nonaktifkan saja')
    if (db.doctors.some((d: any) => d.poliId === id)) throw new Error('Masih ada dokter di poli ini: pindahkan/hapus dokter dahulu atau nonaktifkan poli')
    db.polis = db.polis.filter((x: any) => x.id !== id)
    audit('hapus poli', `${p.kode} · ${p.nama}`)
  }
  const saveDoctor = (f: any) => {
    if (!(f.nama || '').trim()) throw new Error('Nama dokter wajib diisi')
    if (!f.poliId) throw new Error('Poli wajib dipilih')
    if (!(f.sip || '').trim() || !(f.str || '').trim()) throw new Error('SIP dan STR wajib diisi')
    if (db.doctors.some((d: any) => d.id !== f.id && d.str.toLowerCase() === f.str.trim().toLowerCase())) throw new Error('No. STR sudah terdaftar atas dokter lain')
    const data = { nama: f.nama.trim(), spesialis: (f.spesialis || '').trim(), poliId: f.poliId, sip: f.sip.trim(), str: f.str.trim(), ihs: (f.ihs || '').trim() }
    if (f.id) {
      const d = doctor(f.id)
      if (d.poliId !== data.poliId && doctorTerpakai(d.id)) throw new Error('Dokter sudah punya riwayat kunjungan: poli tidak dapat dipindah')
      Object.assign(d, data)
      audit('ubah dokter', d.nama)
      return d
    }
    const d = { id: uid('dr-'), ...data }
    db.doctors.push(d)
    audit('tambah dokter', d.nama)
    return d
  }
  const deleteDoctor = (id: string) => {
    const d = doctor(id)
    if (doctorTerpakai(id)) throw new Error('Dokter sudah dipakai kunjungan: tidak bisa dihapus')
    if (db.reservations.some((r: any) => r.doctorId === id && r.status === 'booked')) throw new Error('Masih ada reservasi aktif untuk dokter ini')
    db.doctors = db.doctors.filter((x: any) => x.id !== id)
    db.schedules = db.schedules.filter((s: any) => s.doctorId !== id)
    db.cuti = db.cuti.filter((c: any) => c.doctorId !== id)
    audit('hapus dokter', d.nama)
  }

  // ---------- IT-03 jadwal ----------
  /** Jumlah terisi terbesar pada hari-dalam-minggu tertentu selama 30 hari ke depan (kuota tidak boleh di bawah ini). */
  const maxTerisi = (doctorId: string, hari: number) => {
    let m = 0
    const t = todayStr()
    for (let i = 0; i <= 30; i++) {
      const d = addDays(t, i)
      if (new Date(d + 'T00:00:00').getDay() !== hari) continue
      const s = sessionFor(doctorId, d)
      if (s) m = Math.max(m, s.terisi)
    }
    return m
  }
  const saveSchedule = (f: any) => {
    const kuota = Number(f.kuota), jkn = Number(f.jkn), hari = Number(f.hari)
    if (!f.doctorId) throw new Error('Dokter wajib dipilih')
    if (!(hari >= 0 && hari <= 6)) throw new Error('Hari tidak valid')
    if (!f.mulai || !f.selesai || f.mulai >= f.selesai) throw new Error('Jam selesai harus setelah jam mulai')
    if (!(kuota >= 1)) throw new Error('Kuota total minimal 1')
    if (!(jkn >= 0 && jkn <= kuota)) throw new Error('Porsi JKN tidak boleh melebihi kuota total')
    if (db.schedules.some((s: any) => s.doctorId === f.doctorId && s.hari === hari && s.id !== f.id)) throw new Error('Dokter sudah punya jadwal pada hari tersebut')
    const terisi = maxTerisi(f.doctorId, hari)
    if (kuota < terisi) throw new Error(`Kuota tidak boleh di bawah jumlah terisi (${terisi})`)
    if (f.id) {
      const s = db.schedules.find((x: any) => x.id === f.id)
      Object.assign(s, { doctorId: f.doctorId, hari, mulai: f.mulai, selesai: f.selesai, kuota, jkn })
      audit('ubah jadwal', `${doctor(s.doctorId).nama} · ${hariNama(hari)} ${f.mulai}-${f.selesai} · kuota ${kuota}`)
      return s
    }
    const s = { id: uid('sch-'), doctorId: f.doctorId, hari, mulai: f.mulai, selesai: f.selesai, kuota, jkn }
    db.schedules.push(s)
    audit('tambah jadwal', `${doctor(s.doctorId).nama} · ${hariNama(hari)} ${f.mulai}-${f.selesai} · kuota ${kuota}`)
    return s
  }
  const deleteSchedule = (id: string) => {
    const s = db.schedules.find((x: any) => x.id === id)
    if (!s) throw new Error('Jadwal tidak ditemukan')
    const terisi = maxTerisi(s.doctorId, s.hari)
    if (terisi > 0) throw new Error(`Jadwal tidak bisa dihapus: sudah ada ${terisi} pasien/reservasi terdaftar`)
    db.schedules = db.schedules.filter((x: any) => x.id !== id)
    audit('hapus jadwal', `${doctor(s.doctorId).nama} · ${hariNama(s.hari)}`)
  }
  const addCuti = (f: any) => {
    if (!f.doctorId || !f.tanggal) throw new Error('Dokter dan tanggal wajib diisi')
    if (f.tanggal < todayStr()) throw new Error('Tanggal cuti tidak boleh di masa lalu')
    if ((f.alasan || '').trim().length < 5) throw new Error('Alasan cuti wajib diisi (min. 5 karakter)')
    if (db.cuti.some((c: any) => c.doctorId === f.doctorId && c.tanggal === f.tanggal)) throw new Error('Cuti pada tanggal tersebut sudah tercatat')
    const s = sessionFor(f.doctorId, f.tanggal)
    if (!s) throw new Error('Dokter tidak punya jadwal pada tanggal tersebut')
    if (f.penggantiId) {
      if (f.penggantiId === f.doctorId) throw new Error('Dokter pengganti tidak boleh sama')
      if (!sessionFor(f.penggantiId, f.tanggal)) throw new Error('Dokter pengganti tidak berpraktik pada tanggal tersebut')
    } else if (s.terisi > 0) throw new Error(`Sudah ada ${s.terisi} pasien/reservasi pada tanggal itu: pilih dokter pengganti`)
    const c = { id: uid('cuti'), doctorId: f.doctorId, tanggal: f.tanggal, penggantiId: f.penggantiId || '', alasan: f.alasan.trim() }
    db.cuti.push(c)
    audit('catat cuti dokter', `${doctor(c.doctorId).nama} · ${c.tanggal}`, c.alasan)
    return c
  }
  const removeCuti = (id: string) => {
    const c = db.cuti.find((x: any) => x.id === id)
    if (!c) return
    db.cuti = db.cuti.filter((x: any) => x.id !== id)
    audit('batalkan cuti dokter', `${doctor(c.doctorId)?.nama} · ${c.tanggal}`)
  }

  // ---------- IT-04 tarif ----------
  const PJ = ['Umum', 'BPJS', 'Asuransi']
  /** Daftar layanan gabungan: tarif (karcis/konsultasi/tindakan) + obat. */
  const layananList = () => [
    ...db.tarif.map((t: any) => ({ ...t, src: 'tarif' })),
    ...db.obat.map((o: any, i: number) => ({ kode: 'OBT' + String(i + 1).padStart(2, '0'), kategori: 'Obat', berlaku: '2026-01-01', versi: 1, ...o, src: 'obat' })),
  ]
  const saveTarif = (f: any) => {
    const harga: any = {}
    PJ.forEach((p) => {
      const n = Number(f.harga?.[p])
      if (!(n >= 0) || isNaN(n)) throw new Error(`Harga ${p} tidak valid`)
      harga[p] = n
    })
    if (!(f.nama || '').trim()) throw new Error('Nama layanan wajib diisi')
    if (!f.berlaku) throw new Error('Tanggal berlaku wajib diisi')
    const src = f.src === 'obat' ? 'obat' : 'tarif'
    const list = src === 'obat' ? db.obat : db.tarif
    if (f.id) {
      const t = list.find((x: any) => x.id === f.id)
      if (!t) throw new Error('Layanan tidak ditemukan')
      const berubah = PJ.some((p) => (t.harga[p] ?? 0) !== harga[p])
      if (berubah) {
        const prev = t.berlaku || '2026-01-01'
        if (f.berlaku < prev) throw new Error('Tanggal berlaku versi baru tidak boleh lebih awal dari versi sebelumnya')
        if (f.berlaku > todayStr()) throw new Error('Tanggal berlaku tidak boleh di masa depan pada prototipe ini (tarif langsung aktif)')
        t.riwayat = [...(t.riwayat || []), { versi: t.versi || 1, berlaku: prev, harga: { ...t.harga } }]
        t.versi = (t.versi || 1) + 1
        t.berlaku = f.berlaku
        t.harga = harga
        audit('ubah tarif (versi baru)', `${t.nama} v${t.versi}`, `berlaku ${f.berlaku}`)
      }
      if (t.nama !== f.nama.trim()) { audit('ubah nama layanan', `${t.nama} → ${f.nama.trim()}`); t.nama = f.nama.trim() }
      if (src === 'tarif') {
        if (f.kategori) t.kategori = f.kategori
      }
      return { item: t, versiBaru: berubah }
    }
    if (src === 'tarif') {
      if (!(f.kode || '').trim()) throw new Error('Kode layanan wajib diisi')
      if (db.tarif.some((x: any) => x.kode.toLowerCase() === f.kode.trim().toLowerCase())) throw new Error('Kode layanan sudah dipakai')
    }
    const item: any = { id: uid(src === 'obat' ? 'o' : 't-'), nama: f.nama.trim(), harga, berlaku: f.berlaku, versi: 1, riwayat: [] }
    if (src === 'tarif') { item.kode = f.kode.trim().toUpperCase(); item.kategori = f.kategori || 'Tindakan' }
    list.push(item)
    audit('tambah tarif', `${item.nama} v1`)
    return { item, versiBaru: false }
  }
  const deleteTarif = (src: string, id: string) => {
    const used = Object.values(db.orders).some((arr: any) => (arr as any[]).some((o: any) => o.refId === id)) || id.startsWith('t-karcis') || id.startsWith('t-konsul')
    if (used) throw new Error('Layanan sudah dipakai order/tagihan: tidak bisa dihapus (ubah harga sebagai versi baru)')
    const list = src === 'obat' ? 'obat' : 'tarif'
    const it = db[list].find((x: any) => x.id === id)
    db[list] = db[list].filter((x: any) => x.id !== id)
    audit('hapus tarif', it?.nama || id)
  }

  // ---------- IT-05 integrasi ----------
  const setIntegrasiMode = (key: string, mode: string) => {
    db.integrasi[key].mode = mode
    audit('ubah mode integrasi', `${db.integrasi[key].nama} → ${mode}`)
  }
  const refreshToken = (key: string) => {
    db.integrasi[key].tokenExpiry = new Date(Date.now() + 3600 * 1000).toISOString()
    audit('perbarui token integrasi', db.integrasi[key].nama)
  }
  const resendOutbox = (ids: string[]) => {
    const { retryOutbox } = useDb()
    retryOutbox(ids)
    audit('kirim ulang outbox', `${ids.length} item`)
  }
  /** Payload simulasi FHIR / VClaim dari baris outbox. */
  const payloadOf = (o: any) => {
    const v = db.visits.find((x: any) => x.noKunjungan === o.ref || x.id === o.ref)
    const p = v ? patient(v.patientId) : db.patients.find((x: any) => x.rm === o.ref)
    const subject = p ? { reference: `Patient/${p.rm}`, display: p.nama } : undefined
    const base: any = { resourceType: o.resource }
    switch (o.resource) {
      case 'Patient':
        return { ...base, identifier: [{ system: 'https://fhir.kemkes.go.id/id/nik', value: p?.nik || '' }, { system: 'urn:rs:spkd:rm', value: p?.rm || o.ref }], name: [{ text: p?.nama || '' }], gender: p?.jk === 'L' ? 'male' : 'female', birthDate: p?.tglLahir || '' }
      case 'Encounter':
        return { ...base, status: v?.status === 'selesai' || v?.status === 'lunas' ? 'finished' : v?.status === 'dilayani' ? 'in-progress' : 'arrived', class: { code: 'AMB', display: 'ambulatory' }, subject, participant: v ? [{ individual: { display: doctor(v.doctorId)?.nama } }] : [], serviceProvider: { display: 'RS SPKD' }, period: { start: v?.jamDaftar } }
      case 'Observation':
        return { ...base, status: 'final', category: [{ coding: [{ code: 'vital-signs' }] }], subject, valueString: JSON.stringify(v ? db.vitals[v.id]?.slice(-1)[0] || {} : {}) }
      case 'Condition':
        return { ...base, clinicalStatus: { coding: [{ code: 'active' }] }, code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: v ? db.soap[v.id]?.diagUtama?.kode : '' }] }, subject }
      case 'SEP':
        return { request: { t_sep: { noKartu: p?.noKartu || '', tglSep: v?.tanggal, ppkPelayanan: 'SPKD', jnsPelayanan: '2', rujukan: { noRujukan: v?.sep?.noRujukan || '' }, poli: { tujuan: v ? poli(v.poliId)?.kode : '' } } } }
      default:
        return { ...base, subject, ref: o.ref, status: 'active' }
    }
  }

  // ---------- IT-07 perangkat ----------
  const registerDevice = (f: any) => {
    if (!(f.nama || '').trim()) throw new Error('Nama perangkat wajib diisi')
    if (!f.tipe) throw new Error('Tipe perangkat wajib dipilih')
    if (!(f.unit || '').trim()) throw new Error('Unit/lokasi wajib diisi')
    if (!f.terikat) throw new Error('Perangkat harus terikat ke papan antrean tertentu')
    if (db.devices.some((d: any) => d.nama.toLowerCase() === f.nama.trim().toLowerCase())) throw new Error('Nama perangkat sudah dipakai')
    const d = { id: uid('d'), nama: f.nama.trim(), tipe: f.tipe, unit: f.unit.trim(), terikat: f.terikat, online: false, kode: randCode(8), terdaftar: false }
    db.devices.push(d)
    audit('daftarkan perangkat', `${d.nama} (${d.tipe}) → ${d.terikat}`)
    return d
  }
  const activateDevice = (id: string, kode: string) => {
    const d = db.devices.find((x: any) => x.id === id)
    if (!d || d.terdaftar) throw new Error('Perangkat tidak menunggu aktivasi')
    if (!d.kode || d.kode !== (kode || '').trim().toUpperCase()) throw new Error('Kode pendaftaran salah')
    d.terdaftar = true; d.online = true; d.kode = ''
    audit('aktivasi perangkat', d.nama)
    return d
  }
  const revokeDevice = (id: string) => {
    const d = db.devices.find((x: any) => x.id === id)
    if (!d) throw new Error('Perangkat tidak ditemukan')
    d.terdaftar = false; d.online = false; d.kode = ''
    audit('cabut perangkat', d.nama)
    return d
  }
  const reissueDeviceCode = (id: string) => {
    const d = db.devices.find((x: any) => x.id === id)
    if (!d || d.terdaftar) throw new Error('Perangkat masih terdaftar')
    d.kode = randCode(8)
    audit('terbitkan kode perangkat baru', d.nama)
    return d.kode
  }
  const toggleOnline = (id: string) => {
    const d = db.devices.find((x: any) => x.id === id)
    if (!d?.terdaftar) throw new Error('Perangkat belum terdaftar')
    d.online = !d.online
  }

  return {
    saveUser, toggleUser, resetPassword, setMatrix,
    poliTerpakai, doctorTerpakai, savePoli, deletePoli, saveDoctor, deleteDoctor,
    maxTerisi, saveSchedule, deleteSchedule, addCuti, removeCuti,
    layananList, saveTarif, deleteTarif,
    setIntegrasiMode, refreshToken, resendOutbox, payloadOf,
    registerDevice, activateDevice, revokeDevice, reissueDeviceCode, toggleOnline,
    visit,
  }
}
