// Logika bersama display TV (VWR-01 Loket, VWR-02 Poli): suara panggilan Bahasa Indonesia, event db.lastCall, replay.
const DIGIT = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']

/** 'A-012' → 'A nol satu dua'; 'PD-012' → 'P D nol satu dua' */
export function nomorUcap(nomor: string) {
  const m = /^([A-Za-z]+)-?(\d+)$/.exec(nomor || '')
  if (!m) return nomor || ''
  return `${m[1].toUpperCase().split('').join(' ')} ${m[2].split('').map((d) => DIGIT[+d]).join(' ')}`
}
/** Angka kecil dalam kalimat ('Ruang 3' → 'ruang tiga', 'Loket 12' → 'loket dua belas'). */
export function angkaUcap(teks: string | number) {
  const sebut = (n: number) => {
    if (n < 10) return DIGIT[n]
    if (n === 10) return 'sepuluh'
    if (n === 11) return 'sebelas'
    if (n < 20) return `${DIGIT[n - 10]} belas`
    if (n < 100) return `${DIGIT[Math.floor(n / 10)]} puluh${n % 10 ? ' ' + DIGIT[n % 10] : ''}`
    return String(n).split('').map((d) => DIGIT[+d]).join(' ')
  }
  return String(teks).replace(/\d+/g, (d) => sebut(parseInt(d)))
}
/** Kalimat panggilan dari entri queueLog / lastCall. */
export function teksPanggil(e: any) {
  if (!e) return ''
  const tujuan = e.type === 'loket' ? `loket ${angkaUcap(e.loket ?? '')}` : angkaUcap(String(e.ruang || 'ruang').toLowerCase())
  return `Nomor antrean ${nomorUcap(e.nomor)}, silakan menuju ${tujuan}`
}

export function useVwrSound() {
  const soundOn = useState<boolean>('vwr-sound', () => false)
  const supported = import.meta.client && 'speechSynthesis' in window
  const pickVoice = () => {
    const vs = window.speechSynthesis.getVoices()
    return vs.find((v) => v.lang.toLowerCase().replace('_', '-') === 'id-id') || vs.find((v) => v.lang.toLowerCase().startsWith('id'))
  }
  const speak = (text: string) => {
    if (!supported || !soundOn.value || !text) return
    try {
      const s = window.speechSynthesis
      s.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'id-ID'
      u.rate = 0.9
      const v = pickVoice()
      if (v) u.voice = v
      s.speak(u)
    } catch {}
  }
  const enable = (sampleText = '') => {
    soundOn.value = true
    speak(sampleText || 'Suara antrean diaktifkan')
  }
  return { soundOn, supported, speak, enable }
}

/**
 * Pantau db.lastCall untuk tipe tertentu. onCall dipanggil saat ada panggilan baru (live=true)
 * atau saat replay (live=false: halaman baru dimuat / koneksi kembali / tab terlihat lagi).
 */
export function useVwrCalls(types: string[], onCall: (e: any, live: boolean) => void) {
  const { db } = useDb()
  const lastCallOf = (type: string) => db.queueLog.find((e: any) => e.type === type && (e.aksi === 'panggil' || e.aksi === 'panggil ulang'))
  const latest = () => {
    const c = types.map(lastCallOf).filter(Boolean)
    return c.sort((a: any, b: any) => (a.at < b.at ? 1 : -1))[0] || null
  }
  const replay = () => {
    const e = latest()
    if (e) onCall(e, false)
  }
  watch(() => db.lastCall?.ts, (ts, old) => {
    const e = db.lastCall
    if (ts && ts !== old && e && types.includes(e.type)) onCall(e, true)
  })
  const onVisible = () => document.visibilityState === 'visible' && replay()
  onMounted(() => {
    replay()
    window.addEventListener('online', replay)
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', replay)
    document.removeEventListener('visibilitychange', onVisible)
  })
  return { replay, latest }
}

/**
 * Data VWR-01 dari server (/api/v1/display/queues, publik, dipoll tiap 3 detik). Hanya panggilan hari ini.
 * onCall(e, live) dipanggil bila last_called_at sebuah loket berubah (panggil baru / panggil ulang):
 * live=false untuk muatan pertama (replay), live=true untuk perubahan setelahnya.
 */
export function useVwrLoket(onCall: (e: any, live: boolean) => void = () => {}, ms = 3000) {
  const lokets = ref<any[]>([])
  const menunggu = ref(0)
  const diperbarui = ref('')
  const tanggal = ref(todayStr())
  const err = ref('')
  const seen = new Map<string, string>()
  let first = true
  /** Panggilan terakhir di semua loket (untuk tampilan besar & replay suara). */
  const current = computed(() =>
    lokets.value.filter((l) => l.current).map((l) => ({ nomor: l.current.nomor, loket: l.nama.replace(/^loket\s*/i, ''), loketNama: l.nama, at: l.current.lastCalledAt, type: 'loket' }))
      .sort((a, b) => (a.at < b.at ? 1 : -1))[0] || null)
  const muat = async () => {
    try {
      const d = await displayQueues()
      lokets.value = d.lokets
      menunggu.value = d.menunggu
      tanggal.value = d.tanggal
      diperbarui.value = d.diperbarui
      err.value = ''
      const calls = d.lokets.filter((l: any) => l.current).map((l: any) => ({ nomor: l.current.nomor, loket: l.nama.replace(/^loket\s*/i, ''), loketNama: l.nama, at: l.current.lastCalledAt, type: 'loket' }))
      const baru = calls.filter((c: any) => seen.get(c.loketNama) !== c.at).sort((a: any, b: any) => (a.at > b.at ? 1 : -1))
      calls.forEach((c: any) => seen.set(c.loketNama, c.at))
      if (first) { first = false; if (current.value) onCall(current.value, false) } else baru.forEach((c: any) => onCall(c, true))
    } catch (e: any) { err.value = e.message }
  }
  let t: any
  const onVisible = () => document.visibilityState === 'visible' && muat()
  onMounted(() => {
    muat()
    t = setInterval(muat, ms)
    window.addEventListener('online', muat)
    document.addEventListener('visibilitychange', onVisible)
  })
  onBeforeUnmount(() => {
    clearInterval(t)
    window.removeEventListener('online', muat)
    document.removeEventListener('visibilitychange', onVisible)
  })
  /**
   * "Antrean berikutnya": API display hanya memberi jumlah menunggu, jadi nomor diturunkan dari nomor tertinggi
   * yang sudah dipanggil hari ini (+1, +2, …; antrean loket FIFO & berurutan), maksimal `n` nomor.
   */
  const berikutnya = (n = 5) => {
    const nomor = lokets.value.filter((l) => l.current).map((l) => /^([A-Za-z]+)-?(\d+)$/.exec(l.current.nomor)).filter(Boolean) as RegExpExecArray[]
    const prefix = nomor[0]?.[1] || 'A'
    const lebar = nomor[0]?.[2].length || 3
    const maks = Math.max(0, ...nomor.map((m) => +m[2]))
    return Array.from({ length: Math.min(n, menunggu.value) }, (_, i) => `${prefix}-${String(maks + i + 1).padStart(lebar, '0')}`)
  }
  return { lokets, current, menunggu, tanggal, err, diperbarui, berikutnya }
}
