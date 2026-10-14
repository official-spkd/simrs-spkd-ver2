<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { db, takeLoketTicket } = useDb()

const TIPE = [
  { v: 'nik', label: 'NIK', max: 16, hint: 'Ketik 16 digit NIK pada KTP' },
  { v: 'rm', label: 'No. RM', max: 8, hint: 'Ketik No. Rekam Medis pada kartu pasien' },
  { v: 'bpjs', label: 'No. BPJS', max: 13, hint: 'Ketik 13 digit No. kartu BPJS' },
] as const
const tipe = ref<'nik' | 'rm' | 'bpjs'>(apm.state.value.idTipe || 'nik')
const nilai = ref('')
const cfg = computed(() => TIPE.find((t) => t.v === tipe.value)!)
const valid = computed(() => (tipe.value === 'rm' ? nilai.value.length >= 1 : nilai.value.length === cfg.value.max))
const wait = ref(0)
const tidakDitemukan = ref(false)
const tiketBantuan = ref<any>(null)
let iv: any

const pilihTipe = (v: any) => {
  tipe.value = v
  nilai.value = ''
  tidakDitemukan.value = false
}
const ketik = (d: string) => {
  if (wait.value > 0) return
  tidakDitemukan.value = false
  if (nilai.value.length < cfg.value.max) nilai.value += d
}
const hapus = () => { nilai.value = ''; tidakDitemukan.value = false }
const mundur = () => { nilai.value = nilai.value.slice(0, -1); tidakDitemukan.value = false }

const tampil = computed(() => {
  const n = nilai.value
  if (tipe.value === 'nik') return n.replace(/(\d{6})(\d{0,6})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
  if (tipe.value === 'bpjs') return n.replace(/(\d{4})(\d{0,5})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
  return n
})

const cekWait = () => {
  wait.value = apm.waitSeconds()
}
const lanjut = () => {
  cekWait()
  if (wait.value > 0 || !valid.value) return
  apm.registerAttempt()
  const v = nilai.value
  const p = db.patients.find((x: any) => {
    if (tipe.value === 'nik') return x.nik === v
    if (tipe.value === 'bpjs') return x.noKartu === v
    return x.rm === v.padStart(6, '0')
  })
  if (!p) {
    cekWait()
    tidakDitemukan.value = true
    return
  }
  apm.state.value.idTipe = tipe.value
  apm.state.value.mode = 'lama'
  apm.startToken(p.id)
  navigateTo('/apm/konfirmasi')
}
const daftarBaru = () => {
  apm.state.value.mode = 'baru'
  navigateTo('/apm/baru')
}
const bantuan = () => {
  tiketBantuan.value = takeLoketTicket('apm')
  toast.ok(`Nomor loket ${tiketBantuan.value.nomor} dicetak. Silakan menuju loket pendaftaran.`)
}

const onKey = (e: KeyboardEvent) => {
  if (/^\d$/.test(e.key)) ketik(e.key)
  else if (e.key === 'Backspace') mundur()
  else if (e.key === 'Enter') lanjut()
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  iv = setInterval(cekWait, 1000)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearInterval(iv)
})
</script>
<template>
  <ApmShell kode="APM-03" langkah="Langkah 2 · Identifikasi pasien">
    <h1>Siapa yang akan berobat?</h1>
    <div class="seg" role="tablist">
      <button v-for="t in TIPE" :key="t.v" :class="{ on: tipe === t.v }" role="tab" @click="pilihTipe(t.v)">{{ t.label }}</button>
    </div>
    <div class="idwrap">
      <div class="left">
        <div class="display" :class="{ ph: !nilai }" aria-live="polite">{{ tampil || cfg.hint }}</div>
        <div class="count">{{ nilai.length }}<template v-if="tipe !== 'rm'"> / {{ cfg.max }}</template> digit</div>

        <div v-if="wait > 0" class="alert warn big-alert">Terlalu banyak percobaan. Mohon tunggu {{ wait }} detik, atau minta bantuan petugas.</div>
        <div v-else-if="tidakDitemukan" class="alert err big-alert nf">
          <div>
            <b>Data tidak ditemukan.</b>
            <p>Periksa kembali nomor yang Anda ketik, atau pilih salah satu di bawah ini.</p>
            <div class="row nf-btn">
              <button class="btn btn-primary" @click="daftarBaru">Daftar pasien baru</button>
              <button v-if="!tiketBantuan" class="btn" @click="bantuan">Bantuan loket</button>
              <span v-else class="tkt">Nomor loket Anda: <b>{{ tiketBantuan.nomor }}</b></span>
            </div>
          </div>
        </div>
      </div>
      <div class="right-pad">
        <div class="keypad">
          <button v-for="d in ['1', '2', '3', '4', '5', '6', '7', '8', '9']" :key="d" @click="ketik(d)">{{ d }}</button>
          <button class="fn" @click="hapus">Hapus</button>
          <button @click="ketik('0')">0</button>
          <button class="fn" aria-label="Hapus satu digit" @click="mundur">←</button>
        </div>
      </div>
    </div>
    <div class="row act">
      <NuxtLink class="btn" to="/apm/menu">Kembali</NuxtLink>
      <button class="btn btn-primary go" :disabled="!valid || wait > 0" @click="lanjut">Lanjut</button>
    </div>
  </ApmShell>
</template>
<style scoped>
.idwrap { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 32px; margin: 24px 0; align-items: start; }
.display { min-height: 96px; border: 2px solid var(--teal); border-radius: 14px; background: #fff; display: flex; align-items: center; padding: 0 24px; font-size: 40px; font-weight: 700; letter-spacing: 3px; color: var(--navy); font-family: ui-monospace, Consolas, monospace; overflow: hidden; }
.display.ph { font-size: 20px; font-weight: 500; letter-spacing: 0; color: var(--muted); font-family: inherit; }
.count { font-size: 16px; color: var(--muted); margin: 8px 4px 16px; }
.keypad button { min-height: 88px; font-size: 32px; }
.keypad .fn { font-size: 20px; color: var(--teal-d); }
.big-alert { font-size: 20px; padding: 18px 20px; }
.nf p { margin: 6px 0 14px; }
.nf-btn { gap: 12px; }
.tkt { font-size: 20px; }
.tkt b { font-size: 30px; }
.act { justify-content: space-between; }
.go { min-width: 240px; }
@media (max-width: 899px) {
  .idwrap { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .display { font-size: 28px; letter-spacing: 1px; min-height: 76px; padding: 0 14px; }
  .keypad button { min-height: 72px; }
}
</style>
