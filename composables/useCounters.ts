// Antrean loket dari backend (/api/v1/counters, /api/v1/queues, khusus role front_office).
// Tiket loket diterbitkan server saat kunjungan didaftarkan (POST /api/v1/visits) — tidak ada endpoint ambil nomor.
// Alur: WAITING -next-> CALLING -serve-> SERVING -complete-> COMPLETED; CALLING -skip-> SKIPPED; recall = bunyikan bel lagi.

const STATUS: Record<string, string> = { WAITING: 'menunggu', CALLING: 'dipanggil', SERVING: 'dilayani', COMPLETED: 'selesai', SKIPPED: 'dilewati' }
const LOKET_KEY = 'spkd-loket'

/** "A001" → "A-001" */
export const fmtNomorLoket = (n?: string | null) => (n ? n.replace(/^([A-Za-z]+)-?(\d+)$/, '$1-$2') : '-')

/** Bentuk tampilan tiket. */
const view = (q: any) => q && {
  id: q.id,
  nomor: fmtNomorLoket(q.queue_number),
  status: STATUS[q.status] || q.status,
  raw: q.status as string,
  loketId: q.counter?.id || '',
  loketNama: q.counter?.name || '',
  nama: q.patient?.full_name || '',
  rm: rmOf(q.patient?.medical_record_number),
  poli: q.poli || '',
  dokter: q.doctor || '',
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
  const loketId = useState<string>('loket-id', () => {
    try { return localStorage.getItem(LOKET_KEY) || '' } catch { return '' }
  })
  watch(loketId, (v) => { try { localStorage.setItem(LOKET_KEY, v) } catch {} })

  const loket = computed(() => lokets.value.find((l) => l.id === loketId.value) || null)
  const aktif = computed(() => loket.value?.current || null)

  /** Muat loket + daftar tiket hari ini (menunggu dan log aksi). */
  const refresh = async () => {
    const [cs, qs] = await Promise.all([
      api<any[]>('/api/v1/counters'),
      apiPage('/api/v1/queues', { query: { date: todayStr(), limit: 100 } }),
    ])
    lokets.value = (cs || []).map((c) => ({ id: c.id, nama: c.name, aktif: c.is_active, current: view(c.current) }))
    if (!lokets.value.some((l) => l.id === loketId.value)) loketId.value = lokets.value.find((l) => l.aktif)?.id || lokets.value[0]?.id || ''
    const all = qs.data.map(view)
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

  return { lokets, loketId, loket, aktif, menunggu, log, refresh, poll, setAktif,
    next: () => act('next'), serve: () => act('serve'), recall: () => act('recall'), skip: () => act('skip'), complete: () => act('complete') }
}
