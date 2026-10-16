// Alur klinis Dokter / Perawat lewat backend (/api/v1/examinations): worklist, panggil / lewati / mulai periksa,
// vital sign berversi, SOAP (draf, tanda tangan, addendum), lampiran (/api/v1/files), tutup kunjungan, riwayat.
// Server adalah sumber kebenaran. Hasilnya disalin ke db lokal (useDb) karena kasir, layar antrean, dan order
// resep/tindakan (KL-05) masih membaca dari sana; aksi lokal dipanggil setelah server berhasil hanya untuk efek
// sampingnya (log layar antrean, Task ID BPJS demo, outbox Satu Sehat demo, tagihan, reservasi kontrol).

const STATUS: Record<string, string> = { Registered: 'terdaftar', Served: 'dilayani', Completed: 'selesai', Paid: 'lunas', Cancelled: 'dibatalkan' }
const ANTRE: Record<string, string> = { Waiting: 'menunggu', Called: 'dipanggil', Skipped: 'dilewati', Examining: 'dilayani', Done: 'selesai' }
const PENJAMIN: Record<string, string> = { umum: 'Umum', bpjs: 'BPJS', asuransi: 'Asuransi' }
const KESADARAN: Record<string, string> = { compos_mentis: 'Compos mentis', apathy: 'Apatis', delirium: 'Delirium', somnolence: 'Somnolen', stupor: 'Sopor', coma: 'Koma' }
const JATUH: Record<string, string> = { low: 'rendah', moderate: 'sedang', high: 'tinggi' }
const TINDAK: Record<string, string> = { discharge: 'pulang', outpatient_followup: 'kontrol', refer_inpatient: 'rawat inap', refer_icu: 'ICU' }
const KONDISI: Record<string, string> = { recovered: 'sembuh', improved: 'membaik', unchanged: 'tetap' }
const CARA: Record<string, string> = { home: 'pulang', follow_up: 'kontrol ulang', referred: 'rujuk RS lain', inpatient: 'rawat inap' }
const balik = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]))

/** Pesan galat server → Bahasa Indonesia untuk petugas. */
const PESAN: Record<string, string> = {
  'your account is not linked to a doctor record': 'Akun ini belum terhubung ke data dokter. Hubungi IT.',
  'this visit belongs to another doctor': 'Kunjungan ini milik dokter lain',
  'the visit is cancelled': 'Kunjungan sudah dibatalkan',
  "only today's visits can be called or examined": 'Hanya kunjungan hari ini yang dapat dipanggil atau diperiksa',
  'the patient can only be called before the examination starts': 'Pasien hanya dapat dipanggil sebelum pemeriksaan dimulai',
  'the patient has not been called': 'Pasien belum dipanggil',
  'the examination has already started': 'Pemeriksaan sudah dimulai',
  'the examination has not been started': 'Mulai periksa terlebih dahulu',
  'the visit is already closed': 'Kunjungan sudah ditutup',
  'the soap note must be finalized before the visit can be closed': 'SOAP harus ditandatangani sebelum kunjungan ditutup',
  'the soap note is finalized and can no longer be changed': 'SOAP sudah ditandatangani dan terkunci',
  'the record was changed by someone else; reload and try again': 'Data diubah dari perangkat lain. Muat ulang lalu coba lagi.',
  'the visit was changed by someone else; reload and try again': 'Status kunjungan berubah dari perangkat lain. Muat ulang lalu coba lagi.',
  'nothing changed; there is no new version to save': 'Tidak ada perubahan untuk disimpan sebagai versi baru',
  'change_reason is required when changing saved vital signs': 'Koreksi vital sign wajib menyertakan alasan',
  'systolic_bp must be greater than diastolic_bp': 'Sistol harus lebih besar dari diastol',
  'height_cm and weight_kg are required for a first visit': 'Pasien baru: tinggi dan berat badan wajib diisi',
  'height_cm and weight_kg must be sent together': 'Tinggi dan berat badan diisi bersamaan',
  'control_date must be after today': 'Tanggal kontrol harus setelah hari ini',
  'primary_diagnosis is required when secondary_diagnoses are sent': 'Isi diagnosis utama sebelum diagnosis sekunder',
  'discharge_method follow_up needs a control_date in the soap note': 'Cara pulang "kontrol ulang" butuh tanggal kontrol di SOAP',
}
const MISSING: Record<string, string> = {
  vital_signs: 'vital sign', subjective: 'S · keluhan', plan: 'P · rencana', primary_diagnosis: 'diagnosis utama',
  follow_up: 'tindak lanjut', control_date: 'tanggal kontrol', referral_notes: 'catatan rujukan',
}
export const pesanKlinis = (e: any) => {
  const m = String(e?.message || e)
  if (m.startsWith('cannot finalize, missing: ')) {
    return 'SOAP belum lengkap: ' + m.slice(26).split(', ').map((k) => MISSING[k] || k).join(', ')
  }
  return PESAN[m] || m
}

export function useKlinis() {
  const { db, visit, setAlergi, callPoli, recallPoli, skipPoli, startExam, getSoap, signSoap, closeVisit } = useDb()
  const norm = (s: string) => (s || '').trim().toLowerCase()
  // Master poli/dokter dimuat layout secara async; bila kunjungan tiba lebih dulu, catat poli/dokternya dari
  // ringkasan kunjungan (ID = ID server, sama seperti usePolis/useDoctors) — refresh master nanti melengkapinya.
  const poliOf = (s: any) => {
    const p = (s.poli_id && db.polis.find((x: any) => x.serverId === s.poli_id)) || db.polis.find((x: any) => norm(x.nama) === norm(s.poli))
    if (p || !s.poli_id) return p
    const baru = { id: s.poli_id, serverId: s.poli_id, kode: s.poli_prefix || '', nama: s.poli, ruang: '', aktif: true }
    db.polis.push(baru)
    return baru
  }
  const doctorOf = (s: any, poliId: string) => {
    const d = (s.doctor_id && db.doctors.find((x: any) => x.serverId === s.doctor_id)) || db.doctors.find((x: any) => norm(x.nama) === norm(s.doctor))
    if (d || !s.doctor_id) return d
    const baru = { id: s.doctor_id, serverId: s.doctor_id, nama: s.doctor, spesialis: '', poliId, sip: '', str: '', ihs: '', aktif: true }
    db.doctors.push(baru)
    return baru
  }

  // Efek samping lokal setelah server berhasil; kegagalannya tidak boleh menutupi hasil server.
  const efek = (fn: () => any) => { try { fn() } catch {} }

  const call = async <T = any>(path: string, opts: any = {}): Promise<T> => {
    try { return await api<T>(path, opts) } catch (e: any) { throw new ApiError(pesanKlinis(e), e?.status ?? 0) }
  }

  const cachePatient = (s: any) => {
    const p = s.patient
    if (!p?.id) return
    const fromServer = {
      id: p.id, rm: rmOf(p.medical_record_number), nik: p.nik || '', nama: p.full_name, tglLahir: (p.birth_date || '').slice(0, 10),
      jk: p.gender === 'Female' ? 'P' : 'L', alergi: s.allergies || p.allergies || '',
    }
    const old = db.patients.find((x: any) => x.id === p.id)
    if (old) Object.assign(old, fromServer)
    else db.patients.push({ ...fromServer, penjamin: PENJAMIN[s.penjamin] || 'Umum', hp: '', golDarah: '', noKartu: '' })
  }

  /** Salin ringkasan kunjungan server (VisitSummary) ke db.visits. null hanya untuk kunjungan lama tanpa poli/dokter terkelola. */
  const cacheVisit = (s: any, hasVitals?: boolean) => {
    const pl = poliOf(s)
    const dr = pl && doctorOf(s, pl.id)
    if (!pl || !dr || !s.patient?.id) return null
    cachePatient(s)
    const old = db.visits.find((v: any) => v.id === s.id)
    const vital = hasVitals ?? !!(old && db.vitals[s.id]?.length)
    let antre = ANTRE[s.poli_queue_status] || 'menunggu'
    // "vital selesai" = pengkajian awal sudah diisi, pasien belum diperiksa
    if (s.visit_status === 'Registered' && vital && (antre === 'menunggu' || antre === 'dipanggil')) antre = 'vital selesai'
    const nomor = `${s.poli_prefix || pl.kode}-${s.queue_number}`
    const fromServer = {
      id: s.id, patientId: s.patient.id, tanggal: s.visit_date, poliId: pl.id, doctorId: dr.id,
      poliNama: s.poli || pl.nama, dokterNama: s.doctor || dr.nama, penjamin: PENJAMIN[s.penjamin] || 'Umum', tipe: s.visit_type,
      keluhan: s.chief_complaint || '', status: STATUS[s.visit_status] || s.visit_status,
      jamDaftar: s.registered_at, jamPanggil: s.poli_called_at, jamMulai: s.exam_started_at, jamSelesai: s.closed_at,
      kondisiPulang: KONDISI[s.discharge_condition] || '', caraPulang: CARA[s.discharge_method] || '', server: true,
    }
    if (old) {
      Object.assign(old, fromServer)
      old.antreanPoli = { ...(old.antreanPoli || {}), nomor, status: antre, server: s.poli_queue_status }
      return old
    }
    const v: any = {
      ...fromServer,
      noKunjungan: `RJ-${s.visit_date.slice(2, 4)}${s.visit_date.slice(5, 7)}-${pl.kode}${s.queue_number}`,
      kanal: 'loket', pj: '', antreanPoli: { nomor, status: antre, server: s.poli_queue_status },
      sep: null, asuransi: null, dokumen: [], satuSehat: 'antrian', pembatalan: null, tglKontrol: '', persetujuan: true,
    }
    db.visits.push(v)
    return v
  }

  // ---------- worklist ----------
  const syncWorklist = async (date = todayStr()) => {
    const out: any[] = []
    let skipped = 0
    for (let page = 1; page <= 20; page++) {
      let r
      try { r = await apiPage('/api/v1/examinations', { query: { date, page, limit: 100 } }) } catch (e: any) { throw new ApiError(pesanKlinis(e), e?.status ?? 0) }
      for (const row of r.data) {
        const v = cacheVisit(row, row.has_vital_signs)
        if (!v) { skipped++; continue }
        if (row.soap_status) getSoap(v.id).signed = row.soap_status === 'final'
        out.push(v)
      }
      if (!r.pagination?.has_next_page) break
    }
    return { rows: out, skipped }
  }

  // ---------- antrean poli ----------
  const panggil = async (id: string) => { const s = await call(`/api/v1/examinations/${id}/call`, { method: 'POST' }); efek(() => callPoli(id)); return cacheVisit(s) }
  const panggilUlang = async (id: string) => { const s = await call(`/api/v1/examinations/${id}/recall`, { method: 'POST' }); efek(() => recallPoli(id)); return cacheVisit(s) }
  const lewati = async (id: string) => { const s = await call(`/api/v1/examinations/${id}/skip`, { method: 'POST' }); efek(() => skipPoli(id)); return cacheVisit(s) }
  const mulaiPeriksa = async (id: string) => { const s = await call(`/api/v1/examinations/${id}/start`, { method: 'POST' }); efek(() => startExam(id)); return cacheVisit(s) }

  // ---------- vital sign ----------
  const vitalLokal = (r: any, ver: number, alasan = '', at = '') => ({
    td: `${r.systolic_bp}/${r.diastolic_bp}`, nadi: r.pulse, rr: r.respiratory_rate, suhu: r.temperature, spo2: r.spo2,
    tb: r.height_cm ?? null, bb: r.weight_kg ?? null, bmi: r.bmi ?? null,
    kesadaran: KESADARAN[r.consciousness] || r.consciousness, nyeri: r.pain_score,
    risikoJatuh: r.fall_risk ? 'ya' : 'tidak', levelJatuh: JATUH[r.fall_risk_level] || '',
    keluhan: r.chief_complaint, alergi: r.no_known_allergies ? '' : r.allergies, flags: r.flags || [],
    waktu: r.measured_at, ver, alasan, by: '', at: at || r.updated_at, serverVersion: r.version,
  })

  /** Simpan vital + riwayat versinya ke db.vitals (versi lama hanya ringkasan; versi terakhir lengkap). */
  const cacheVitals = async (visitId: string, latest: any) => {
    if (!latest) { delete db.vitals[visitId]; return }
    let versions: any[] = []
    try { versions = await call<any[]>(`/api/v1/examinations/${visitId}/vital-signs/versions`) } catch {}
    const asc = [...(versions || [])].sort((a, b) => a.version - b.version)
    const last = asc[asc.length - 1]
    db.vitals[visitId] = [
      ...asc.slice(0, -1).map((x) => ({ ver: x.version + 1, alasan: x.change_reason || '', by: '', at: x.changed_at })),
      vitalLokal(latest, latest.version + 1, last?.change_reason || '', last?.changed_at),
    ]
    const v = visit(visitId)
    if (v) setAlergi(v.patientId, db.vitals[visitId].at(-1).alergi || '')
  }

  /** version = versi server yang sedang dikoreksi (vital pertama berversi 0), atau 0 untuk pencatatan baru. */
  const vitalApi = (f: any, version: number, alasan?: string) => {
    const [sis, dia] = String(f.td).split('/').map((x) => Number(x.trim()))
    const alergi = String(f.alergi || '').trim()
    const ya = f.risikoJatuh === 'ya'
    const body: Record<string, any> = {
      systolic_bp: sis, diastolic_bp: dia, pulse: Number(f.nadi), respiratory_rate: Number(f.rr), temperature: Number(f.suhu), spo2: Number(f.spo2),
      consciousness: balik(KESADARAN)[f.kesadaran] || 'compos_mentis', pain_score: Number(f.nyeri) || 0,
      fall_risk: ya, chief_complaint: String(f.keluhan || '').trim(), version,
    }
    if (f.tb && f.bb) { body.height_cm = Number(f.tb); body.weight_kg = Number(f.bb) }
    if (ya) body.fall_risk_level = balik(JATUH)[f.levelJatuh] || 'low'
    if (alergi && !/^tidak( ada)?$/i.test(alergi)) body.allergies = alergi
    else body.no_known_allergies = true
    if (alasan !== undefined) body.change_reason = alasan.trim()
    return body
  }

  const simpanVital = async (visitId: string, f: any, alasan = '') => {
    const latest = db.vitals[visitId]?.at(-1)
    if (latest && !alasan.trim()) throw new Error('Koreksi vital sign wajib menyertakan alasan (versi baru)')
    const body = latest ? vitalApi(f, latest.serverVersion ?? 0, alasan) : vitalApi(f, 0)
    const r = await call(`/api/v1/examinations/${visitId}/vital-signs`, { method: 'PUT', body })
    await cacheVitals(visitId, r)
    const v = visit(visitId)
    if (v?.status === 'terdaftar' && ['menunggu', 'dipanggil'].includes(v.antreanPoli.status)) v.antreanPoli.status = 'vital selesai'
    return r
  }

  // ---------- SOAP ----------
  /** isi=false hanya memperbarui metadata (versi, status, addendum): dipakai setelah simpan draf supaya
   *  ketikan yang masuk selama permintaan berjalan tidak tertimpa. */
  const soapLokal = (visitId: string, r: any, isi = true) => {
    const s = getSoap(visitId)
    const d = r.assessment || {}
    Object.assign(s, {
      signed: r.status === 'final', signedAt: r.finalized_at, serverVersion: r.version,
      addenda: (r.addenda || []).map((a: any) => ({ teks: a.content, at: a.created_at, by: '' })),
    })
    if (!isi) return s
    Object.assign(s, {
      s: r.subjective || '', fisik: r.objective?.findings || '', asesmen: d.notes || '', p: r.plan || '',
      diagUtama: d.primary_diagnosis ? { kode: d.primary_diagnosis.icd10_code, nama: d.primary_diagnosis.name } : null,
      diagSekunder: (d.secondary_diagnoses || []).map((x: any) => ({ kode: x.icd10_code, nama: x.name })),
      tindakLanjut: TINDAK[r.follow_up] || 'pulang', tglKontrol: r.control_date || '', catatanRujukan: r.referral_notes || '',
    })
    const v = visit(visitId)
    if (v) v.tglKontrol = s.tglKontrol
    return s
  }

  const soapApi = (s: any) => {
    const tl = balik(TINDAK)[s.tindakLanjut] || 'discharge'
    const body: Record<string, any> = {
      subjective: s.s || '', objective_findings: s.fisik || '', assessment_notes: s.asesmen || '', plan: s.p || '',
      follow_up: tl, secondary_diagnoses: (s.diagSekunder || []).map((d: any) => ({ icd10_code: d.kode, name: d.nama })),
      version: s.serverVersion ?? 0,
    }
    if (s.diagUtama) body.primary_diagnosis = { icd10_code: s.diagUtama.kode, name: s.diagUtama.nama }
    if (tl === 'outpatient_followup' && s.tglKontrol) body.control_date = s.tglKontrol
    if ((tl === 'refer_inpatient' || tl === 'refer_icu') && s.catatanRujukan?.trim()) body.referral_notes = s.catatanRujukan.trim()
    return body
  }

  const simpanSoap = async (visitId: string) =>
    soapLokal(visitId, await call(`/api/v1/examinations/${visitId}/soap-note`, { method: 'PUT', body: soapApi(getSoap(visitId)) }), false)

  const tandaTangan = async (visitId: string) => {
    await simpanSoap(visitId)
    const r = await call(`/api/v1/examinations/${visitId}/soap-note/finalize`, { method: 'POST' })
    getSoap(visitId).signed = false
    efek(() => signSoap(visitId))
    return soapLokal(visitId, r)
  }

  const addendum = async (visitId: string, teks: string) =>
    soapLokal(visitId, await call(`/api/v1/examinations/${visitId}/soap-note/addenda`, { method: 'POST', body: { content: teks.trim() } }))

  // ---------- lampiran (presigned URL ke MinIO; API tidak membawa isi berkas) ----------
  const lampiranLokal = (f: any) => ({ id: f.id, nama: f.file_name, tipe: f.content_type, ukuran: f.size_bytes, at: f.uploaded_at || f.created_at, status: f.status })

  const muatLampiran = async (visitId: string) => {
    let rows: any[] = []
    try {
      rows = (await apiPage('/api/v1/files', { query: { resource_type: 'soap_note', resource_id: visitId, limit: 100 } })).data
    } catch (e: any) {
      if (e?.status === 404) return null // unggah berkas belum diaktifkan di server (MINIO_ENDPOINT kosong)
      throw new ApiError(pesanKlinis(e), e?.status ?? 0)
    }
    getSoap(visitId).lampiran = rows.filter((f) => f.status === 'uploaded').map(lampiranLokal)
    return getSoap(visitId).lampiran
  }

  const unggah = async (visitId: string, file: File) => {
    let r
    try {
      r = await api('/api/v1/files/uploads', {
        method: 'POST', body: { resource_type: 'soap_note', resource_id: visitId, file_name: file.name, content_type: file.type, size_bytes: file.size },
      })
    } catch (e: any) {
      throw new ApiError(e?.status === 404 ? 'Unggah lampiran belum diaktifkan di server (penyimpanan berkas / MinIO belum dikonfigurasi)' : pesanKlinis(e), e?.status ?? 0)
    }
    // isi berkas langsung ke penyimpanan lewat URL bertanda tangan; API hanya mencatat metadata
    const put = await fetch(r.upload.url, { method: r.upload.method || 'PUT', headers: r.upload.headers || {}, body: file })
    if (!put.ok) throw new Error(`Gagal mengunggah ${file.name} ke penyimpanan (${put.status})`)
    const done = await call(`/api/v1/files/${r.file.id}/complete`, { method: 'POST' })
    getSoap(visitId).lampiran.push(lampiranLokal(done))
  }

  const bukaLampiran = async (id: string) => window.open((await call(`/api/v1/files/${id}/download-url`)).url, '_blank', 'noopener')

  const hapusLampiran = async (visitId: string, id: string) => {
    await call(`/api/v1/files/${id}`, { method: 'DELETE' })
    getSoap(visitId).lampiran = getSoap(visitId).lampiran.filter((l: any) => l.id !== id)
  }

  // ---------- workspace ----------
  /** Muat satu kunjungan (status, vital, SOAP, lampiran) dari server ke cache lokal. */
  const muat = async (visitId: string) => {
    const r = await call(`/api/v1/examinations/${visitId}`)
    const v = cacheVisit(r.visit, !!r.vital_signs)
    if (!v) throw new Error('Kunjungan lama ini tidak memiliki poli/dokter terdaftar.')
    await cacheVitals(visitId, r.vital_signs)
    if (r.soap_note) soapLokal(visitId, r.soap_note)
    else Object.assign(getSoap(visitId), { serverVersion: 0, signed: false })
    try { await muatLampiran(visitId) } catch {}
    return v
  }

  // ---------- tutup kunjungan ----------
  const tutup = async (visitId: string, f: { kondisiPulang: string; caraPulang: string; doctorIdKontrol?: string }) => {
    const s = await call(`/api/v1/examinations/${visitId}/close`, {
      method: 'POST', body: { discharge_condition: balik(KONDISI)[f.kondisiPulang], discharge_method: balik(CARA)[f.caraPulang] },
    })
    // efek samping lokal: tagihan ke kasir, reservasi kontrol, Task 6 BPJS (demo), outbox Satu Sehat (demo).
    // Kunjungan sudah ditutup di server; kegagalan lokal (mis. dokter belum punya jadwal praktik lokal sehingga
    // reservasi kontrol tidak bisa dibuat) dikembalikan sebagai peringatan, bukan galat.
    let peringatan = ''
    try { closeVisit(visitId, { ...f, tglKontrol: getSoap(visitId).tglKontrol }) } catch (e: any) { peringatan = e.message }
    return { visit: cacheVisit(s, true), peringatan }
  }

  // ---------- riwayat ----------
  const riwayat = async (visitId: string) => {
    const out: any[] = []
    for (let page = 1; page <= 10; page++) {
      let r
      try { r = await apiPage(`/api/v1/examinations/${visitId}/history`, { query: { page, limit: 100 } }) } catch (e: any) { throw new ApiError(pesanKlinis(e), e?.status ?? 0) }
      out.push(...r.data.map((h: any) => ({
        id: h.visit.id, tanggal: h.visit.visit_date, status: STATUS[h.visit.visit_status] || h.visit.visit_status,
        nomor: `${h.visit.poli_prefix}-${h.visit.queue_number}`, poliId: h.visit.poli_id, poli: h.visit.poli, dokter: h.visit.doctor,
        jamDaftar: h.visit.registered_at, jamSelesai: h.visit.closed_at,
        kondisiPulang: KONDISI[h.visit.discharge_condition] || '', caraPulang: CARA[h.visit.discharge_method] || '',
        soap: h.soap_note ? {
          s: h.soap_note.subjective, fisik: h.soap_note.objective?.findings || '', asesmen: h.soap_note.assessment?.notes || '', p: h.soap_note.plan,
          vital: h.soap_note.objective?.vital_signs,
          diagUtama: h.soap_note.assessment?.primary_diagnosis ? { kode: h.soap_note.assessment.primary_diagnosis.icd10_code, nama: h.soap_note.assessment.primary_diagnosis.name } : null,
          diagSekunder: (h.soap_note.assessment?.secondary_diagnoses || []).map((x: any) => ({ kode: x.icd10_code, nama: x.name })),
          tglKontrol: h.soap_note.control_date || '', signedAt: h.soap_note.finalized_at,
          addenda: (h.soap_note.addenda || []).map((a: any) => ({ teks: a.content, at: a.created_at })),
        } : null,
        lampiran: (h.attachments || []).map((a: any) => ({ nama: a.file_name, ukuran: a.size_bytes })),
      })))
      if (!r.pagination?.has_next_page) break
    }
    return out
  }

  return {
    syncWorklist, panggil, panggilUlang, lewati, mulaiPeriksa, simpanVital, simpanSoap, tandaTangan, addendum,
    muatLampiran, unggah, bukaLampiran, hapusLampiran, muat, tutup, riwayat,
  }
}
