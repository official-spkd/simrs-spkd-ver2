// Kunjungan dari backend (/api/v1/visits, khusus role front_office).
// Backend baru menyediakan buat/daftar/detail — belum ada endpoint ubah status — jadi hasilnya disalin ke
// db.visits dan alur lanjutan (panggil poli, SOAP, kasir, batal) masih berjalan lokal di atas salinan itu.
// Poli & dokter di respons berupa objek { id, name, ... }; dicocokkan ke master lokal lewat serverId, cadangan nama.

const PENJAMIN_API: Record<string, string> = { Umum: 'umum', BPJS: 'bpjs', Asuransi: 'asuransi' }
const PENJAMIN: Record<string, string> = { umum: 'Umum', bpjs: 'BPJS', asuransi: 'Asuransi' }
const STATUS: Record<string, string> = { Registered: 'terdaftar', Served: 'dilayani', Completed: 'selesai', Paid: 'lunas', Cancelled: 'dibatalkan' }
const STATUS_API: Record<string, string> = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [v, k]))
const ANTRE: Record<string, string> = { Waiting: 'menunggu', Called: 'dipanggil', Skipped: 'dilewati', Done: 'selesai' }

export function useVisits() {
  const { db, poli, doctor } = useDb()
  const norm = (s: string) => (s || '').trim().toLowerCase()
  const poliOf = (r: any) => (r.poli?.id && db.polis.find((p: any) => p.serverId === r.poli.id)) || db.polis.find((p: any) => norm(p.nama) === norm(r.poli?.name))
  const doctorOf = (r: any) => (r.doctor?.id && db.doctors.find((d: any) => d.serverId === r.doctor.id)) || db.doctors.find((d: any) => norm(d.nama) === norm(r.doctor?.name))

  /** Pasien yang belum ada di cache: simpan ringkasan dari kunjungan agar PatientBanner & daftar bisa menampilkan. */
  const cachePatient = (r: any) => {
    if (!r.patient?.id || db.patients.some((p: any) => p.id === r.patient.id)) return
    db.patients.push({
      id: r.patient.id, rm: rmOf(r.patient.medical_record_number), nik: r.patient.nik, nama: r.patient.full_name,
      tglLahir: (r.patient.birth_date || '').slice(0, 10), jk: r.patient.gender === 'Female' ? 'P' : 'L', hp: r.patient.phone || '',
      golDarah: r.patient.blood_type || '', alergi: r.allergies || '', penjamin: PENJAMIN[r.penjamin] || 'Umum', noKartu: r.bpjs_card_number || '',
    })
  }

  /** Bentuk tampilan langsung dari respons server (tanpa menyaring poli/dokter, status = status server). */
  const view = (r: any) => {
    return {
      id: r.id,
      tanggal: (r.visit_date || '').slice(0, 10),
      nomor: r.queue_number,
      // nomor antrean poli dihitung per poli (tiap poli mulai 001) → tampilkan dengan kode poli
      nomorPoli: r.poli?.prefix_code ? `${r.poli.prefix_code}-${r.queue_number}` : r.queue_number,
      patientId: r.patient?.id || '',
      rm: rmOf(r.patient?.medical_record_number),
      nama: r.patient?.full_name || '(pasien tidak ditemukan)',
      poliNama: r.poli?.name || '',
      dokterNama: r.doctor?.name || '',
      penjamin: PENJAMIN[r.penjamin] || r.penjamin,
      tipe: r.visit_type,
      status: STATUS[r.visit_status] || r.visit_status,
      antre: ANTRE[r.queue_status] || r.queue_status,
      satuSehat: r.satu_sehat_status === 'Sent' ? 'terkirim' : 'belum dikirim',
      keluhan: r.chief_complaint || '',
      pj: r.responsible_person || '',
      alergi: r.allergies || '',
      bpjs: r.bpjs_card_number || '', noRujukan: r.fktp_referral_number || '', noKontrol: r.control_letter_number || '',
      asuransi: r.insurance_name || '', noPolis: r.policy_number || '', plafon: r.coverage_limit || 0, disetujui: !!r.is_approved,
      dokumen: r.document_type || '',
      dibuat: r.created_at,
      diMaster: !!poliOf(r) && !!doctorOf(r),
    }
  }

  /** Salin satu kunjungan server ke db.visits. Field alur lokal (jam, SOAP, pembatalan, dll.) dipertahankan.
   *  Mengembalikan null bila nama poli/dokter tidak ada di master lokal (halaman poli/kasir butuh keduanya valid). */
  const cache = (r: any) => {
    cachePatient(r)
    const pl = poliOf(r)
    const dr = doctorOf(r)
    if (!pl || !dr) return null
    const old = db.visits.find((v: any) => v.id === r.id)
    const penjamin = PENJAMIN[r.penjamin] || 'Umum'
    const fromServer = {
      id: r.id,
      noKunjungan: `RJ-${r.visit_date.slice(2, 4)}${r.visit_date.slice(5, 7)}-${pl.kode}${r.queue_number}`,
      // Respons bisa tanpa data pasien (mis. pasien sudah dihapus); jangan timpa ID yang sudah diketahui.
      patientId: r.patient?.id || old?.patientId,
      tanggal: (r.visit_date || '').slice(0, 10),
      poliId: pl.id,
      doctorId: dr.id,
      poliNama: r.poli?.name || pl.nama,
      dokterNama: r.doctor?.name || dr.nama,
      penjamin,
      tipe: r.visit_type,
      keluhan: r.chief_complaint || '',
      pj: r.responsible_person || '',
      satuSehatServer: r.satu_sehat_status,
      server: true,
    }
    if (old) {
      Object.assign(old, fromServer)
      // Status lokal boleh lebih maju (mis. sudah dipanggil di poli) karena server belum bisa diubah statusnya.
      if (r.visit_status !== 'Registered') old.status = STATUS[r.visit_status] || old.status
      if (r.queue_status !== 'Waiting') old.antreanPoli.status = ANTRE[r.queue_status] || old.antreanPoli.status
      return old
    }
    const v: any = {
      ...fromServer,
      kanal: 'loket',
      status: STATUS[r.visit_status] || 'terdaftar',
      antreanPoli: { nomor: `${pl.kode}-${r.queue_number}`, status: ANTRE[r.queue_status] || 'menunggu' },
      jamDaftar: r.created_at, jamPanggil: null, jamMulai: null, jamSelesai: null,
      sep: penjamin === 'BPJS' ? { status: 'menunggu', noSep: '', noRujukan: r.fktp_referral_number || '', noKontrol: r.control_letter_number || '' } : null,
      asuransi: penjamin === 'Asuransi' ? { nama: r.insurance_name || '', noPolis: r.policy_number || '', plafon: r.coverage_limit || 0, disetujui: !!r.is_approved } : null,
      dokumen: r.document_type ? [{ jenis: r.document_type, nama: r.document_type }] : [],
      satuSehat: r.satu_sehat_status === 'Sent' ? 'terkirim' : 'antrian',
      pembatalan: null, kondisiPulang: '', caraPulang: '', tglKontrol: '', persetujuan: true,
    }
    db.visits.push(v)
    return v
  }

  const summary = (r: any) => ({
    id: r.id,
    noKunjungan: `RJ-${r.visit_date.slice(2, 4)}${r.visit_date.slice(5, 7)}-${r.queue_number}`,
    patientId: r.patient?.id,
    tanggal: (r.visit_date || '').slice(0, 10),
    poliId: '', doctorId: '', poliNama: r.poli?.name || '', dokterNama: r.doctor?.name || '',
    status: STATUS[r.visit_status] || r.visit_status,
    jamDaftar: r.created_at,
    readonly: true,
  })

  const toApi = (f: any) => {
    const pt = db.patients.find((p: any) => p.id === f.patientId)
    const body: Record<string, any> = {
      patient_id: f.patientId,
      visit_date: f.tanggal || todayStr(),
      poli_id: poli(f.poliId)?.serverId,
      doctor_id: doctor(f.doctorId)?.serverId,
      penjamin: PENJAMIN_API[f.penjamin] || 'umum',
      visit_type: f.tipe || 'baru',
      chief_complaint: f.keluhan,
      responsible_person: f.pj,
      allergies: pt?.alergi || '',
    }
    if (f.dokumen?.length) body.document_type = f.dokumen[0].jenis.slice(0, 50)
    // Field BPJS / asuransi hanya boleh dikirim untuk penjamin yang sesuai (server menolak bila tidak).
    if (f.penjamin === 'BPJS') {
      body.bpjs_card_number = f.noKartu
      if (f.noRujukan) body.fktp_referral_number = f.noRujukan
      if (f.noKontrol) body.control_letter_number = f.noKontrol
    }
    if (f.penjamin === 'Asuransi') {
      body.insurance_name = f.asuransiNama
      body.policy_number = f.noPolis
      body.coverage_limit = Number(f.plafon) || 0
      if (f.disetujui != null) body.is_approved = !!f.disetujui
    }
    return body
  }

  const create = async (f: any) => {
    if (!isServerId(f.patientId)) throw new Error('Pasien ini data contoh lokal dan belum ada di server. Daftarkan pasien lewat menu Pasien Baru.')
    if (!poli(f.poliId)?.serverId) throw new Error('Poli ini data contoh lokal dan belum ada di server. Tambahkan poli lewat Master Poli & Dokter.')
    if (!doctor(f.doctorId)?.serverId) throw new Error('Dokter ini data contoh lokal dan belum ada di server. Tambahkan dokter lewat Master Poli & Dokter.')
    const v = cache(await api('/api/v1/visits', { method: 'POST', body: toApi(f) }))
    if (!v) throw new Error('Kunjungan tersimpan di server, tetapi nama poli/dokter tidak cocok dengan master lokal')
    if (f.dokumen?.length) v.dokumen = f.dokumen.slice()
    return v
  }

  const list = async (q: { date?: string; search?: string; status?: string; page?: number; limit?: number } = {}) => {
    const res = await apiPage('/api/v1/visits', {
      query: { date: q.date, search: q.search?.trim(), visit_status: q.status ? STATUS_API[q.status] : '', page: q.page || 1, limit: q.limit || 100 },
    })
    const rows = res.data.map((r) => cache(r))
    // Kunjungan yang poli/dokternya tidak ada di master lokal: tidak disalin ke cache, hanya diringkas untuk tampilan baca-saja.
    const unmatched = res.data.filter((_, i) => !rows[i]).map(summary)
    return { rows: rows.filter(Boolean), skipped: unmatched.length, unmatched, pagination: res.pagination }
  }

  /** Untuk tabel: satu halaman langsung dari server. Kunjungan yang cocok master juga disalin ke cache (untuk poli/kasir). */
  /** poli = ID poli server (poli_id). */
  const listView = async (q: { date?: string; poli?: string; status?: string; search?: string; page?: number; limit?: number } = {}) => {
    const res = await apiPage('/api/v1/visits', {
      query: { date: q.date, poli_id: q.poli, search: q.search?.trim(), visit_status: q.status ? STATUS_API[q.status] : '', page: q.page || 1, limit: q.limit || 10 },
    })
    res.data.forEach((r) => cache(r))
    return { rows: res.data.map(view), pagination: res.pagination }
  }

  /** Ambil semua kunjungan satu tanggal (semua halaman) ke cache lokal. */
  const syncDate = async (date = todayStr()) => {
    const out: any[] = []
    let skipped = 0
    for (let page = 1; page <= 20; page++) {
      const r = await list({ date, page, limit: 100 })
      out.push(...r.rows)
      skipped += r.skipped
      if (!r.pagination?.has_next_page) break
    }
    return { rows: out, skipped }
  }

  const get = async (id: string) => cache(await api(`/api/v1/visits/${id}`))

  return { create, list, listView, syncDate, get }
}
