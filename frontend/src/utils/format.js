import { ref, onMounted, onBeforeUnmount } from 'vue'

const ID = 'id-ID'

/** Rabu, 14 Mei 2025 */
export function formatTanggalPanjang(d = new Date()) {
  return new Intl.DateTimeFormat(ID, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

/** 14 Mei 2025 */
export function formatTanggal(d = new Date()) {
  return new Intl.DateTimeFormat(ID, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
}

/** 09:12 */
export function formatJam(d = new Date()) {
  const x = new Date(d)
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
}

/** Rp1.250.000 */
export function formatRupiah(n) {
  return `Rp${new Intl.NumberFormat(ID).format(Math.round(Number(n) || 0))}`
}

/** 1.250 */
export function formatAngka(n, digits = 0) {
  return new Intl.NumberFormat(ID, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(n) || 0)
}

/** 32XXXXXXXXXX — NIK disamarkan (UU PDP). */
export function maskNik(nik = '') {
  const s = String(nik)
  return s.length > 4 ? `${s.slice(0, 2)}${'X'.repeat(Math.max(0, s.length - 6))}` : s
}

/** Salam sesuai jam. */
export function salam(d = new Date()) {
  const h = d.getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

/** Waktu sekarang yang reaktif, diperbarui tiap 30 detik. */
export function useNow(intervalMs = 30000) {
  const now = ref(new Date())
  let t
  onMounted(() => (t = setInterval(() => (now.value = new Date()), intervalMs)))
  onBeforeUnmount(() => clearInterval(t))
  return now
}
