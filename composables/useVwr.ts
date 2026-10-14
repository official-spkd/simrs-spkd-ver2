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

/** Data VWR-01: panggilan loket terakhir + 5 nomor berikutnya. */
export function useVwrLoket() {
  const { db, loketMenunggu } = useDb()
  const current = computed(() => {
    const e = db.queueLog.find((x: any) => x.type === 'loket' && (x.aksi === 'panggil' || x.aksi === 'panggil ulang'))
    if (e) return { nomor: e.nomor, loket: e.loket }
    const t = [...db.loket].reverse().find((x: any) => x.status === 'dipanggil')
    return t ? { nomor: t.nomor, loket: t.loket } : null
  })
  const menunggu = computed(() => loketMenunggu().sort((a: any, b: any) => (a.jam > b.jam ? 1 : -1)))
  const next = computed(() => menunggu.value.slice(0, 5))
  return { current, menunggu, next }
}
