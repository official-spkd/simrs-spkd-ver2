// Antrean loket dari backend (/api/v1/counters khusus front_office; /api/v1/queues front_office & dokter —
// dokter selalu hanya mendapat pasiennya sendiri, front_office boleh menyaring lewat doctor_id).
// Tiket loket diterbitkan server saat kunjungan didaftarkan (POST /api/v1/visits) — tidak ada endpoint ambil nomor.
// Alur: WAITING -next-> CALLING -serve-> SERVING -complete-> COMPLETED; CALLING -skip-> SKIPPED; recall = bunyikan bel lagi.
// Semua tampilan dibatasi ke tanggal hari ini (queue_date). Tiket hari sebelumnya yang masih dipegang loket
// ditandai "tertinggal": tidak ditampilkan sebagai panggilan aktif, tetapi harus diselesaikan/dilewati agar loket bebas.

/** poli/doctor di respons berupa objek { id, name, ... }. */
const nama = (x: any) => (typeof x === 'string' ? x : x?.name || '')

const STATUS: Record<string, string> = { WAITING: 'menunggu', CALLING: 'dipanggil', SERVING: 'dilayani', COMPLETED: 'selesai', SKIPPED: 'dilewati' }
const LOKET_KEY = 'spkd-loket'

/** "A001" → "A-001" */
export const fmtNomorLoket = (n?: string | null) => (n ? n.replace(/^([A-Za-z]+)-?(\d+)$/, '$1-$2') : '-')

/** Bentuk tampilan tiket. */
const view = (q: any) => q && {
  id: q.id,
  nomor: fmtNomorLoket(q.queue_number),
  // queue_date bisa "YYYY-MM-DD" atau timestamp (UTC) — timestamp dikonversi ke tanggal lokal
  tanggal: (q.queue_date || '').length > 10 ? dateOf(q.queue_date) : q.queue_date || '',
  status: STATUS[q.status] || q.status,
  raw: q.status as string,
  loketId: q.counter?.id || '',
  loketNama: q.counter?.name || '',
  nama: q.patient?.full_name || '',
  rm: rmOf(q.patient?.medical_record_number),
  poli: nama(q.poli),
  poliId: q.poli?.id || '',
  dokter: nama(q.doctor),
  dokterId: q.doctor?.id || '',
  nomorPoli: q.poli_queue_number || '',
  visitId: q.visit_id || '',
  dipanggil: q.call_count || 0,
  jam: q.created_at,
  // waktu aksi terakhir, untuk log
  aksiAt: q.completed_at || q.skipped_at || q.serving_started_at || q.last_called_at || q.called_at || q.created_at,
}

export function useCounters() {
  const lokets = useState<any[]>('lokets', () => [])
  const menunggu = useState<any[]>('loket-menunggu', () => [])
  const log = useState<any[]>('loket-log', () => [])
  const hariIni = useState<string>('loket-hari', () => todayStr())
  const loketId = useState<string>('loket-id', () => {
    try { return localStorage.getItem(LOKET_KEY) || '' } catch { return '' }
  })
  watch(loketId, (v) => { try { localStorage.setItem(LOKET_KEY, v) } catch {} })

  const loket = computed(() => lokets.value.find((l) => l.id === loketId.value) || null)
  /** Tiket hari ini yang sedang dipegang loket terpilih. */
  const aktif = computed(() => loket.value?.current || null)
  /** Tiket hari sebelumnya yang masih dipegang loket terpilih (belum diselesaikan). */
  const tertinggal = computed(() => loket.value?.tertinggal || null)

  /** Semua tiket satu tanggal (semua halaman, urutan panggil dari server). */
  const tiketTanggal = async (date: string, doctorId = '') => {
    const out: any[] = []
    for (let page = 1; page <= 20; page++) {
      const r = await apiPage('/api/v1/queues', { query: { date, doctor_id: doctorId, page, limit: 100 } })
      out.push(...r.data)
      if (!r.pagination?.has_next_page) break
    }
    return out
  }

  /** Muat loket + daftar tiket hari ini (menunggu dan log aksi). Tanggal dihitung ulang tiap muat → ganti hari otomatis. */
  const refresh = async () => {
    const today = todayStr()
    const [cs, qs] = await Promise.all([api<any[]>('/api/v1/counters'), tiketTanggal(today)])
    hariIni.value = today
    lokets.value = (cs || []).map((c) => {
      const cur = view(c.current)
      const basi = !!cur && cur.tanggal !== today
      return { id: c.id, nama: c.name, aktif: c.is_active, current: basi ? null : cur, tertinggal: basi ? cur : null }
    })
    if (!lokets.value.some((l) => l.id === loketId.value)) loketId.value = lokets.value.find((l) => l.aktif)?.id || lokets.value[0]?.id || ''
    const all = qs.map(view).filter((t) => t.tanggal === today)
    menunggu.value = all.filter((t) => t.raw === 'WAITING')
    log.value = all.filter((t) => t.raw !== 'WAITING').sort((a, b) => (a.aksiAt < b.aksiAt ? 1 : -1))
  }

  const act = async (aksi: 'next' | 'serve' | 'recall' | 'skip' | 'complete') => {
    const t = view(await api(`/api/v1/counters/${loketId.value}/${aksi}`, { method: 'POST' }))
    await refresh()
    return t
  }
  const setAktif = async (id: string, isActive: boolean) => {
    await api(`/api/v1/counters/${id}/status`, { method: 'PATCH', body: { is_active: isActive } })
    await refresh()
  }

  /** Muat ulang berkala selama komponen terpasang (loket lain bisa memanggil nomor kapan saja). */
  const poll = (ms = 5000) => {
    const err = ref('')
    const run = () => refresh().then(() => (err.value = ''), (e) => (err.value = e.message))
    let t: any
    onMounted(() => { run(); t = setInterval(run, ms) })
    onBeforeUnmount(() => clearInterval(t))
    return err
  }

  /** Antrean satu dokter (bentuk tampilan). Untuk akun dokter, server mengabaikan doctorId dan memakai dokter akun. */
  const antreanDokter = async (date = todayStr(), doctorId = '') => (await tiketTanggal(date, doctorId)).map(view)

  return { antreanDokter, lokets, loketId, loket, aktif, tertinggal, menunggu, log, hariIni, refresh, poll, setAktif,
    next: () => act('next'), serve: () => act('serve'), recall: () => act('recall'), skip: () => act('skip'), complete: () => act('complete') }
}

/** Data publik layar antrean (/api/v1/display/queues, tanpa login). Panggilan hari sebelumnya disaring. */
export async function displayQueues() {
  const d = await api<any>('/api/v1/display/queues')
  const today = todayStr()
  const hariIniDipanggil = (c: any) => !!c && dateOf(c.last_called_at || c.called_at) === today
  return {
    tanggal: d?.date || today,
    menunggu: d?.waiting_count || 0,
    lokets: (d?.counters || []).map((c: any) => ({
      id: c.counter_id,
      nama: c.counter_name,
      aktif: c.is_active,
      current: hariIniDipanggil(c.current)
        ? { nomor: fmtNomorLoket(c.current.queue_number), raw: c.current.status, dipanggil: c.current.call_count, lastCalledAt: c.current.last_called_at || c.current.called_at }
        : null,
    })),
  }
}
