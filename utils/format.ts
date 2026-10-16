export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const nowIso = () => new Date().toISOString()
export const fmtRp = (n: number | null | undefined) =>
  'Rp ' + Math.round(n || 0).toLocaleString('id-ID')
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const hariNama = (i: number) => HARI[i]
export const fmtTgl = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}
export const fmtTglPanjang = (iso?: string | null) => {
  const d = iso ? new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso) : new Date()
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`
}
export const fmtJam = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
}
export const fmtWaktu = (iso?: string | null) => (iso ? `${fmtTgl(iso)} ${fmtJam(iso)}` : '-')
export const umur = (tgl: string) => {
  const d = new Date(tgl + 'T00:00:00')
  const n = new Date()
  let a = n.getFullYear() - d.getFullYear()
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--
  return a
}
export const maskNik = (nik: string) => (nik ? nik.slice(0, 6) + '******' + nik.slice(-4) : '-')
export const maskNama = (nama: string) =>
  nama
    .split(' ')
    .map((w) => (w.length <= 2 ? w : w.slice(0, 2).toUpperCase() + '*'.repeat(Math.min(w.length - 2, 4))))
    .join(' ')
export const menitAntara = (a?: string | null, b?: string | null) =>
  a ? Math.max(0, Math.round(((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) / 60000)) : 0
export const pad = (n: number, w = 3) => String(n).padStart(w, '0')

/** Terbilang Rupiah: 250000 → 'Dua ratus lima puluh ribu rupiah' (untuk kwitansi KS-04). */
export const terbilang = (n: number): string => {
  const SAT = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
  const eja = (x: number): string => {
    if (x < 12) return SAT[x]
    if (x < 20) return eja(x - 10) + ' belas'
    if (x < 100) return eja(Math.floor(x / 10)) + ' puluh' + (x % 10 ? ' ' + eja(x % 10) : '')
    if (x < 200) return 'seratus' + (x - 100 ? ' ' + eja(x - 100) : '')
    if (x < 1000) return eja(Math.floor(x / 100)) + ' ratus' + (x % 100 ? ' ' + eja(x % 100) : '')
    if (x < 2000) return 'seribu' + (x - 1000 ? ' ' + eja(x - 1000) : '')
    if (x < 1e6) return eja(Math.floor(x / 1000)) + ' ribu' + (x % 1000 ? ' ' + eja(x % 1000) : '')
    if (x < 1e9) return eja(Math.floor(x / 1e6)) + ' juta' + (x % 1e6 ? ' ' + eja(x % 1e6) : '')
    return eja(Math.floor(x / 1e9)) + ' miliar' + (x % 1e9 ? ' ' + eja(x % 1e9) : '')
  }
  const v = Math.round(Math.abs(n || 0))
  const t = v === 0 ? 'nol' : eja(v).replace(/\s+/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1) + ' rupiah'
}
/** 09.10.08 */
export const fmtJamDetik = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso)
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join('.')
}
/** 13 Okt */
export const fmtTglPendek = (iso?: string | null) => {
  if (!iso) return '-'
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso)
  return `${d.getDate()} ${BULAN[d.getMonth()]}`
}
/** 13 Okt · 10.00 */
export const fmtTglJam = (iso?: string | null) => (iso ? `${fmtTglPendek(iso)} · ${fmtJam(iso)}` : '-')
