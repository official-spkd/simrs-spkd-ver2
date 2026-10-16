<script setup lang="ts">
// APM-03 Identifikasi pasien lama: NIK / No. RM / No. BPJS / Kode Booking Mobile JKN
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { db, takeLoketTicket, findBooking } = useDb()

const TIPE = [
  { v: 'nik', label: 'NIK', max: 16, judul: 'NIK · 16 digit', hint: 'Ketik 16 digit NIK pada KTP.' },
  { v: 'rm', label: 'No. RM', max: 8, judul: 'No. Rekam Medis', hint: 'Ketik No. Rekam Medis pada kartu pasien.' },
  { v: 'bpjs', label: 'No. BPJS', max: 13, judul: 'No. kartu BPJS · 13 digit', hint: 'Ketik 13 digit nomor kartu BPJS.' },
  { v: 'booking', label: 'Kode Booking Mobile JKN', max: 10, judul: 'Kode Booking Mobile JKN · 10 digit', hint: 'Masukkan kode booking 10 digit dari aplikasi Mobile JKN. Sistem akan memeriksa ketersediaan kode di SIMRS sebelum melanjutkan.' },
] as const
type Tipe = (typeof TIPE)[number]['v']
const tipe = ref<Tipe>((apm.state.value.idTipe as Tipe) || 'nik')
const nilai = ref('')
const cfg = computed(() => TIPE.find((t) => t.v === tipe.value)!)
const valid = computed(() => (tipe.value === 'rm' ? nilai.value.length >= 1 : nilai.value.length === cfg.value.max))
const wait = ref(0)
const galat = ref('')
const tiketBantuan = ref<any>(null)
let iv: any

const pilihTipe = (v: Tipe) => { tipe.value = v; nilai.value = ''; galat.value = '' }
const ketik = (d: string) => {
  if (wait.value > 0) return
  galat.value = ''
  if (nilai.value.length < cfg.value.max) nilai.value += d
}
const hapus = () => { nilai.value = ''; galat.value = '' }
const mundur = () => { nilai.value = nilai.value.slice(0, -1); galat.value = '' }
const status = computed(() => {
  if (tipe.value === 'rm') return `${nilai.value.length} digit`
  return `${nilai.value.length} / ${cfg.value.max} digit${valid.value ? ' · siap diperiksa' : ''}`
})

const cekWait = () => { wait.value = apm.waitSeconds() }
const lanjut = () => {
  cekWait()
  if (wait.value > 0 || !valid.value) return
  apm.registerAttempt()
  const v = nilai.value
  let pid = ''
  if (tipe.value === 'booking') {
    const r = findBooking(v)
    if (!r) return (galat.value = 'Kode booking tidak tersedia di SIMRS.')
    if (r.tanggal !== todayStr()) return (galat.value = `Kode booking berlaku untuk ${fmtTglPanjang(r.tanggal)}. Check-in hanya pada hari pelayanan.`)
    if (r.status !== 'booked') return (galat.value = 'Kode booking ini sudah check-in atau tidak aktif. Silakan menuju loket.')
    apm.state.value.mode = 'booking'
    apm.state.value.bookingId = r.id
    pid = r.patientId
  } else {
    const p = db.patients.find((x: any) => (tipe.value === 'nik' ? x.nik === v : tipe.value === 'bpjs' ? x.noKartu === v : x.rm === v.padStart(6, '0')))
    if (!p) return (galat.value = 'Data tidak ditemukan. Periksa kembali nomor yang Anda ketik.')
    apm.state.value.mode = 'lama'
    apm.state.value.bookingId = ''
    pid = p.id
  }
  apm.state.value.idTipe = tipe.value
  apm.startToken(pid)
  navigateTo('/apm/konfirmasi')
}
const daftarBaru = () => { apm.reset(); apm.state.value.mode = 'baru'; navigateTo('/apm/baru') }
const bantuan = () => {
  if (tiketBantuan.value) return
  tiketBantuan.value = takeLoketTicket('apm')
  toast.ok(`Nomor loket ${tiketBantuan.value.nomor} dicetak. Silakan menuju loket pendaftaran.`)
}

const onKey = (e: KeyboardEvent) => {
  if (/^\d$/.test(e.key)) ketik(e.key)
  else if (e.key === 'Backspace') mundur()
  else if (e.key === 'Enter') lanjut()
}
onMounted(() => { window.addEventListener('keydown', onKey); iv = setInterval(cekWait, 1000) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); clearInterval(iv) })
</script>
<template>
  <ApmShell kode="APM-03" langkah="Langkah 2 · Identifikasi pasien lama">
    <h1 class="apm-h1">Masukkan identitas Anda</h1>
    <div class="apm-row" role="tablist">
      <button v-for="t in TIPE" :key="t.v" type="button" role="tab" class="apm-btn" :class="{ pri: tipe === t.v }" :aria-selected="tipe === t.v" @click="pilihTipe(t.v)">{{ t.label }}{{ tipe === t.v ? ' ✓' : '' }}</button>
    </div>
    <div class="isi">
      <div class="kiri">
        <div class="apm-field">
          <label for="id-in">{{ cfg.judul }}</label>
          <input id="id-in" :value="nilai" class="apm-input" readonly inputmode="none" :placeholder="tipe === 'booking' ? 'Contoh 2610130007' : 'Ketik dengan keypad'" aria-live="polite">
          <span class="apm-note">{{ status }}</span>
        </div>
        <p class="apm-note">{{ cfg.hint }}</p>
        <div v-if="wait > 0" class="apm-alert warn">Terlalu banyak percobaan. Mohon tunggu {{ wait }} detik, atau minta bantuan petugas.</div>
        <div v-else-if="galat" class="apm-alert" role="alert">{{ galat }}</div>
        <div class="apm-row">
          <button type="button" class="apm-btn pri" :disabled="!valid || wait > 0" @click="lanjut">Lanjut</button>
          <button type="button" class="apm-btn" @click="hapus">Hapus</button>
        </div>
        <div class="apm-guide">{{ tipe === 'booking' ? 'Jika kode booking tidak tersedia di SIMRS, periksa kembali kode yang dimasukkan atau pilih metode identitas lain.' : 'Jika data tidak ditemukan, periksa kembali nomor yang dimasukkan, daftar sebagai pasien baru, atau minta bantuan loket.' }}</div>
        <div class="apm-row">
          <button type="button" class="apm-btn" @click="daftarBaru">Daftar pasien baru</button>
          <button type="button" class="apm-btn" :disabled="!!tiketBantuan" @click="bantuan">{{ tiketBantuan ? 'Nomor loket ' + tiketBantuan.nomor : 'Bantuan loket' }}</button>
        </div>
      </div>
      <div class="apm-keys pad" aria-label="Keypad angka">
        <div v-for="r in [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']]" :key="r[0]" class="kr">
          <button v-for="d in r" :key="d" type="button" class="apm-key" @click="ketik(d)">{{ d }}</button>
        </div>
        <div class="kr">
          <button type="button" class="apm-key" @click="hapus">Hapus</button>
          <button type="button" class="apm-key" @click="ketik('0')">0</button>
          <button type="button" class="apm-key" aria-label="Hapus satu digit" @click="mundur">←</button>
        </div>
      </div>
    </div>
  </ApmShell>
</template>
<style scoped>
.isi { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 16px; align-items: start; }
.kiri { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
@media (max-width: 899px) { .isi { grid-template-columns: minmax(0, 1fr); } }
</style>
