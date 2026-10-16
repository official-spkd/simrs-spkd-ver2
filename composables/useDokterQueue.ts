/**
 * Antrean poli milik akun Dokter / Perawat — satu sumber untuk GL-02 Beranda, KL-01 Worklist, dan panel "Unit aktif".
 * Akun dokter: GET /api/v1/examinations (server hanya mengirim pasien dokter akun ini, lengkap dengan status
 * kunjungan & antrean poli). Role lain: antrean lokal.
 */
export function useDokterQueue() {
  const { db, poli, doctor, poliQueue } = useDb()
  const { user } = useAuth()
  const isDokter = computed(() => user.value?.role === 'dokter')

  const tanggal = useState('kl-tanggal', () => todayStr())
  const serverIds = useState<string[] | null>('kl-server-ids', () => null)
  const syncErr = useState('kl-sync-err', () => '')
  const syncSkip = useState('kl-sync-skip', () => 0)
  const loading = useState('kl-loading', () => false)

  const sync = async () => {
    if (!isDokter.value) return
    loading.value = true
    try {
      const r = await useKlinis().syncWorklist(tanggal.value)
      serverIds.value = r.rows.map((v: any) => v.id)
      syncSkip.value = r.skipped
      syncErr.value = ''
    } catch (e: any) {
      syncErr.value = e.message
    } finally {
      loading.value = false
    }
  }

  const rows = computed(() => {
    const ids = new Set(serverIds.value || [])
    const list = isDokter.value
      ? db.visits.filter((v: any) => ids.has(v.id))
      : poliQueue(null, null).filter((v: any) => v.tanggal === tanggal.value)
    return list.filter((v: any) => v.status !== 'dibatalkan').slice().sort((a: any, b: any) => (a.antreanPoli.nomor > b.antreanPoli.nomor ? 1 : -1))
  })

  // dokter akun: cocokkan nama akun dengan master dokter, atau dari antrean yang diterima server
  const dokter = computed(() => db.doctors.find((d: any) => d.nama === user.value?.nama) || (rows.value[0] ? doctor(rows.value[0].doctorId) : null))
  const poliAktif = computed(() => (dokter.value ? poli(dokter.value.poliId) : null))

  // alur MVP: menunggu/dipanggil → vital selesai (pengkajian awal, masih terdaftar) → diperiksa (dilayani)
  const menunggu = computed(() => rows.value.filter((v: any) => v.status === 'terdaftar' && v.antreanPoli.status !== 'vital selesai'))
  const dilayani = computed(() => rows.value.filter((v: any) => v.status === 'dilayani' || (v.status === 'terdaftar' && v.antreanPoli.status === 'vital selesai')))
  const selesai = computed(() => rows.value.filter((v: any) => v.status === 'selesai'))
  const lunas = computed(() => rows.value.filter((v: any) => v.status === 'lunas'))

  return { isDokter, tanggal, serverIds, syncErr, syncSkip, loading, sync, rows, dokter, poliAktif, menunggu, dilayani, selesai, lunas }
}

/** localStorage: kunjungan terakhir yang dibuka di workspace (menu "Workspace pasien" / "Riwayat kunjungan"). */
export const KL_AKTIF_KEY = 'spkd-klinis-aktif'

/** Status antrean poli untuk tampilan (gabungan antrean + kunjungan). */
export const statusAntreanPoli = (v: any) => {
  if (v.status === 'selesai' || v.status === 'lunas') return 'selesai'
  if (v.status === 'dilayani') return 'diperiksa'
  return v.antreanPoli.status
}

/** Inisial nama pasien untuk banner (maks. 2 huruf). */
export const inisial = (nama = '') =>
  nama.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

/** URL pratinjau lampiran SOAP — hanya di memori sesi ini (yang disimpan ke database lokal hanya metadata berkas). */
const lampiranUrl = new Map<string, string>()
export const simpanUrlLampiran = (l: any, file: File) => lampiranUrl.set(`${l.at}|${l.nama}`, URL.createObjectURL(file))
export const urlLampiran = (l: any) => lampiranUrl.get(`${l.at}|${l.nama}`) || ''
