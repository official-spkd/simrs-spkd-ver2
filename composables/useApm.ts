// State alur APM (Anjungan Pendaftaran Mandiri) dibagi antar halaman lewat useState.
// Termasuk: token identifikasi (sekali pakai, 180 dtk), rate limit per perangkat, timer idle 90 dtk, cek perangkat terdaftar.
// Pasien lama/baru, poli, dokter & pendaftaran kunjungan lewat endpoint publik /api/v1/apm/* (tanpa login).
// Check-in reservasi / Mobile JKN, ambil nomor loket saja & panggil petugas belum ada endpoint-nya → masih lokal.
export const APM_IDLE_SEC = 90
export const APM_TOKEN_SEC = 180

export type ApmState = {
  mode: '' | 'lama' | 'baru' | 'booking'
  idTipe: 'nik' | 'rm' | 'bpjs' | 'booking'
  bookingId: string // reservasi Mobile JKN / online yang sedang di-check-in
  patientId: string
  tokenExp: number // epoch ms; 0 = tidak ada token
  confirmed: boolean // identitas sudah dikonfirmasi pasien (token sudah dipakai)
  poliId: string
  doctorId: string
  visitId: string
  baruRm: string
  /** pasien dari server (lookup / daftar baru), bentuk lokal — kosong untuk alur booking lokal */
  srvPasien: any
  /** tiket dari POST /apm/visits */
  tiket: any
}

const emptyState = (): ApmState => ({ mode: '', idTipe: 'nik', bookingId: '', patientId: '', tokenExp: 0, confirmed: false, poliId: '', doctorId: '', visitId: '', baruRm: '', srvPasien: null, tiket: null })

const JK: Record<string, string> = { Male: 'L', Female: 'P' }
const PAYER: Record<string, string> = { General: 'Umum', BPJS: 'BPJS', Insurance: 'Asuransi' }
/** apm.PatientBrief → bentuk pasien lokal yang dipakai halaman APM. NIK tidak dikirim server. */
const briefToPasien = (b: any) => ({
  id: b.id, rm: b.medical_record_number, nama: b.full_name, tglLahir: (b.birth_date || '').slice(0, 10),
  jk: JK[b.gender] || '', nik: '', penjamin: PAYER[b.payer] || 'Umum', noKartu: b.bpjs_number || '', server: true,
})
/** Pesan ramah untuk galat endpoint publik APM. */
export const apmPesan = (e: any) => {
  if (e instanceof ApiError && e.status === 429) return 'Terlalu banyak percobaan dari perangkat ini. Mohon tunggu sebentar atau panggil petugas.'
  if (e instanceof ApiError && e.status === 0) return 'Server tidak dapat dihubungi. Silakan menuju loket pendaftaran.'
  return e?.message || String(e)
}

/** Endpoint publik APM (tanpa login). */
export const apmApi = {
  /** Kirim tepat satu: nik, medical_record_number (RM-000001) atau bpjs_number. 404 bila tidak ditemukan. */
  lookup: async (q: { nik?: string; medical_record_number?: string; bpjs_number?: string }) => briefToPasien(await api('/api/v1/apm/patients/lookup', { query: q })),
  /** Body sama dengan form pasien Front Office (patients.PatientRequest). 409 bila NIK/No. BPJS sudah terdaftar. */
  daftarPasien: async (body: any) => briefToPasien(await api('/api/v1/apm/patients', { method: 'POST', body })),
  polis: () => api<any[]>('/api/v1/apm/polis'),
  doctors: (poliId = '') => api<any[]>('/api/v1/apm/doctors', { query: { poli_id: poliId } }),
  /** Daftar kunjungan hari ini → tiket cetak (apm.Ticket). */
  daftarKunjungan: (body: any) => api<any>('/api/v1/apm/visits', { method: 'POST', body }),
}

/** Jam berjalan (detik) untuk kiosk / TV. */
export function useKioskClock() {
  const now = ref(new Date())
  let iv: any
  onMounted(() => {
    now.value = new Date()
    iv = setInterval(() => (now.value = new Date()), 1000)
  })
  onBeforeUnmount(() => clearInterval(iv))
  const hh = (n: number) => String(n).padStart(2, '0')
  const jam = computed(() => `${hh(now.value.getHours())}.${hh(now.value.getMinutes())}`)
  const detik = computed(() => hh(now.value.getSeconds()))
  const tanggal = computed(() => fmtTglPanjang(now.value.toISOString()))
  return { now, jam, detik, tanggal }
}

export function useApm() {
  const state = useState<ApmState>('apm', emptyState)
  const attempts = useState<number[]>('apm-attempts', () => [])
  const lastStaff = useState<number>('apm-staff', () => 0)
  const lastTicket = useState<number>('apm-ticket', () => 0)
  const { db, patient, uid } = useDb()

  /** Perangkat APM terdaftar (IT-07). */
  const device = computed(() => db.devices.find((d: any) => d.tipe === 'APM' && d.terdaftar))
  const deviceOk = computed(() => !!device.value)

  const reset = () => {
    Object.assign(state.value, emptyState())
  }
  const pasien = computed(() => state.value.srvPasien || (state.value.patientId ? patient(state.value.patientId) : null))

  // ---- token identifikasi sekali pakai ----
  const startToken = (patientId: string, srvPasien: any = null) => {
    state.value.patientId = patientId
    state.value.srvPasien = srvPasien
    state.value.tokenExp = Date.now() + APM_TOKEN_SEC * 1000
    state.value.confirmed = false
  }
  const tokenValid = () => state.value.tokenExp > Date.now()
  /** Pakai token (sekali pakai). Mengembalikan true bila masih berlaku. */
  const consumeToken = () => {
    const ok = tokenValid() && !!state.value.patientId
    state.value.tokenExp = 0
    state.value.confirmed = ok
    return ok
  }

  // ---- rate limit identifikasi: maks 5 percobaan / 60 detik / perangkat ----
  const MAX_ATTEMPT = 5
  const waitSeconds = () => {
    const now = Date.now()
    attempts.value = attempts.value.filter((t) => now - t < 60000)
    if (attempts.value.length < MAX_ATTEMPT) return 0
    return Math.max(1, Math.ceil((attempts.value[0] + 60000 - now) / 1000))
  }
  const registerAttempt = () => {
    attempts.value = [...attempts.value.filter((t) => Date.now() - t < 60000), Date.now()]
  }

  // ---- panggil petugas: 1x / 60 detik ----
  const staffWait = () => Math.max(0, Math.ceil((lastStaff.value + 60000 - Date.now()) / 1000))
  const callStaff = () => {
    const w = staffWait()
    if (w > 0) throw new Error(`Petugas sudah dipanggil. Mohon tunggu, panggilan berikutnya bisa dilakukan ${w} detik lagi.`)
    lastStaff.value = Date.now()
    db.notifications.unshift({ id: uid('n'), teks: `${device.value?.nama || 'APM'} meminta bantuan petugas`, at: nowIso(), dibaca: false })
  }
  const ticketWait = () => Math.max(0, Math.ceil((lastTicket.value + 8000 - Date.now()) / 1000))
  const markTicket = () => (lastTicket.value = Date.now())

  return { state, device, deviceOk, pasien, reset, startToken, tokenValid, consumeToken, waitSeconds, registerAttempt, staffWait, callStaff, ticketWait, markTicket }
}

/** Timer idle: tanpa sentuhan/keyboard selama 90 detik → reset state & kembali ke /apm. */
export function useApmIdle(enabled = true, limit = APM_IDLE_SEC) {
  const apm = useApm()
  const left = ref(limit)
  let last = Date.now()
  let iv: any
  const touch = () => {
    last = Date.now()
    left.value = limit
  }
  onMounted(() => {
    if (!enabled) return
    touch()
    window.addEventListener('pointerdown', touch, true)
    window.addEventListener('keydown', touch, true)
    iv = setInterval(() => {
      const s = Math.floor((Date.now() - last) / 1000)
      left.value = Math.max(0, limit - s)
      if (s >= limit) {
        clearInterval(iv)
        apm.reset()
        navigateTo('/apm')
      }
    }, 1000)
  })
  onBeforeUnmount(() => {
    clearInterval(iv)
    window.removeEventListener('pointerdown', touch, true)
    window.removeEventListener('keydown', touch, true)
  })
  return { left }
}
