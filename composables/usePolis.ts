// Master poli dari backend (/api/v1/polis). Baca: semua user; tambah/ubah/hapus: superadmin.
// Dokter, jadwal & kunjungan lokal mereferensikan poli lewat db.polis, jadi hasil server disalin ke sana:
// dicocokkan lewat serverId lalu nama, ID lokal dipertahankan agar relasi dokter tidak putus.

export interface ApiPoli { id: string; name: string; prefix_code: string; room: string; doctor_count: number; is_active: boolean; created_at?: string; updated_at?: string }
/** doctor_count tidak dikirim: dihitung server dari master dokter (read-only). */
export interface PoliForm { name: string; prefix_code: string; room: string; is_active: boolean }

export function usePolis() {
  const { db } = useDb()
  const norm = (s: string) => (s || '').trim().toLowerCase()

  /** Semua poli di server (semua halaman). */
  const all = async () => {
    const out: ApiPoli[] = []
    for (let page = 1; ; page++) {
      const r = await apiPage<ApiPoli>('/api/v1/polis', { query: { page, limit: 100 } })
      out.push(...r.data)
      if (!r.pagination?.has_next_page) return out
    }
  }

  /** Samakan db.polis dengan daftar server. Poli lokal yang tidak ada di server dinonaktifkan
   *  (atau dibuang bila tidak dipakai dokter/kunjungan) supaya tidak muncul di pendaftaran. */
  const syncLocal = (list: ApiPoli[]) => {
    const seen = new Set<string>()
    for (const s of list) {
      const data = { serverId: s.id, kode: s.prefix_code, nama: s.name, ruang: s.room || '', aktif: s.is_active, jumlahDokter: s.doctor_count }
      const p = db.polis.find((x: any) => x.serverId === s.id) || db.polis.find((x: any) => !x.serverId && norm(x.nama) === norm(s.name))
      if (p) { Object.assign(p, data); seen.add(p.id) } else { db.polis.push({ id: s.id, ...data }); seen.add(s.id) }
    }
    const dipakai = (id: string) => db.doctors.some((d: any) => d.poliId === id) || db.visits.some((v: any) => v.poliId === id)
    db.polis = db.polis
      .filter((p: any) => seen.has(p.id) || dipakai(p.id))
      .map((p: any) => (seen.has(p.id) ? p : { ...p, serverId: undefined, aktif: false }))
  }

  const refresh = async () => {
    const list = await all()
    syncLocal(list)
    return list
  }

  const body = (f: PoliForm) => ({
    name: f.name.trim(), prefix_code: f.prefix_code.trim().toUpperCase(), room: f.room.trim(), is_active: f.is_active,
  })
  const create = (f: PoliForm) => api<ApiPoli>('/api/v1/polis', { method: 'POST', body: body(f) })
  const update = (id: string, f: PoliForm) => api<ApiPoli>(`/api/v1/polis/${id}`, { method: 'PUT', body: body(f) })
  /** Tidak ada PATCH status: PUT dengan semua field lama + is_active baru. */
  const setStatus = (p: ApiPoli, isActive: boolean) =>
    update(p.id, { name: p.name, prefix_code: p.prefix_code, room: p.room, is_active: isActive })
  const remove = (id: string) => api(`/api/v1/polis/${id}`, { method: 'DELETE' })

  return { all, refresh, syncLocal, create, update, setStatus, remove }
}
