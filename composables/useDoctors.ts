// Master dokter dari backend (/api/v1/doctors). Baca: semua user; tambah/ubah/hapus: superadmin.
// Jadwal, cuti, reservasi & kunjungan lokal mereferensikan dokter lewat db.doctors, jadi hasil server disalin ke sana:
// dicocokkan lewat serverId lalu SIP/STR, ID lokal dipertahankan agar relasi jadwal tidak putus.
// Jalankan setelah usePolis().refresh() supaya poli server sudah punya padanan di db.polis.

export interface ApiDoctorPoli { id: string; name: string; prefix_code: string; room: string }
export interface ApiDoctor {
  id: string; name: string; specialization: string; poli: ApiDoctorPoli | null
  sip_number: string; str_number: string; ihs_number?: string; is_active: boolean
  created_at?: string; updated_at?: string
}
export interface DoctorForm { name: string; specialization: string; poli_id: string; sip_number: string; str_number: string; ihs_number: string; is_active: boolean }

export function useDoctors() {
  const { db } = useDb()
  const norm = (s: string) => (s || '').trim().toLowerCase()

  /** Semua dokter di server (semua halaman). */
  const all = async (q: { poli_id?: string; is_active?: boolean; search?: string } = {}) => {
    const out: ApiDoctor[] = []
    for (let page = 1; ; page++) {
      const r = await apiPage<ApiDoctor>('/api/v1/doctors', { query: { ...q, page, limit: 100 } })
      out.push(...r.data)
      if (!r.pagination?.has_next_page) return out
    }
  }

  /** Samakan db.doctors dengan daftar server. Dokter lokal yang tidak ada di server dinonaktifkan
   *  (atau dibuang beserta jadwal/cutinya bila belum dipakai kunjungan/reservasi). */
  const syncLocal = (list: ApiDoctor[]) => {
    const seen = new Set<string>()
    for (const s of list) {
      const pl = s.poli && (db.polis.find((p: any) => p.serverId === s.poli!.id) || db.polis.find((p: any) => norm(p.nama) === norm(s.poli!.name)))
      const data = {
        serverId: s.id, nama: s.name, spesialis: s.specialization || '', poliId: pl?.id || s.poli?.id || '',
        sip: s.sip_number, str: s.str_number, ihs: s.ihs_number || '', aktif: s.is_active,
      }
      const d = db.doctors.find((x: any) => x.serverId === s.id)
        || db.doctors.find((x: any) => !x.serverId && (norm(x.sip) === norm(s.sip_number) || norm(x.str) === norm(s.str_number)))
      if (d) { Object.assign(d, data); seen.add(d.id) } else { db.doctors.push({ id: s.id, ...data }); seen.add(s.id) }
    }
    const dipakai = (id: string) => db.visits.some((v: any) => v.doctorId === id) || db.reservations.some((r: any) => r.doctorId === id)
    const buang = new Set(db.doctors.filter((d: any) => !seen.has(d.id) && !dipakai(d.id)).map((d: any) => d.id))
    db.doctors = db.doctors
      .filter((d: any) => !buang.has(d.id))
      .map((d: any) => (seen.has(d.id) ? d : { ...d, serverId: undefined, aktif: false }))
    if (buang.size) {
      db.schedules = db.schedules.filter((s: any) => !buang.has(s.doctorId))
      db.cuti = db.cuti.filter((c: any) => !buang.has(c.doctorId))
    }
  }

  const refresh = async () => {
    const list = await all()
    syncLocal(list)
    return list
  }

  const body = (f: DoctorForm) => {
    const b: Record<string, any> = {
      name: f.name.trim(), specialization: f.specialization.trim(), poli_id: f.poli_id,
      sip_number: f.sip_number.trim(), str_number: f.str_number.trim(), is_active: f.is_active,
    }
    // IHS opsional tapi unik: string kosong jangan dikirim
    if (f.ihs_number?.trim()) b.ihs_number = f.ihs_number.trim()
    return b
  }
  const create = (f: DoctorForm) => api<ApiDoctor>('/api/v1/doctors', { method: 'POST', body: body(f) })
  const update = (id: string, f: DoctorForm) => api<ApiDoctor>(`/api/v1/doctors/${id}`, { method: 'PUT', body: body(f) })
  /** Tidak ada PATCH status: PUT dengan semua field lama + is_active baru. */
  const setStatus = (d: ApiDoctor, isActive: boolean) =>
    update(d.id, {
      name: d.name, specialization: d.specialization, poli_id: d.poli?.id || '',
      sip_number: d.sip_number, str_number: d.str_number, ihs_number: d.ihs_number || '', is_active: isActive,
    })
  const remove = (id: string) => api(`/api/v1/doctors/${id}`, { method: 'DELETE' })

  return { all, refresh, syncLocal, create, update, setStatus, remove }
}
