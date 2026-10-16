<script setup lang="ts">
// APM-08 Scan QR & Check-in Mobile JKN (pemindai = ilustrasi demo; kode booking diketik di keypad)
import scanTarget from '~/assets/images/apm/scan-target.svg'
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { db, poli, doctor, patient, findBooking, checkInBooking } = useDb()

const metode = ref<'scan' | 'kode'>('scan')
const kode = ref('')
const contoh = computed(() => db.reservations.find((r: any) => r.kanal === 'mobile-jkn' && r.tanggal === todayStr() && r.status === 'booked'))
onMounted(() => {
  apm.reset()
  apm.state.value.mode = 'booking'
  // desain demo: kode contoh langsung terisi
  if (contoh.value) kode.value = contoh.value.kodeBooking
})
const ketik = (d: string) => { if (kode.value.length < 10) kode.value += d }
const mundur = () => (kode.value = kode.value.slice(0, -1))
const hapus = () => (kode.value = '')
const onKey = (e: KeyboardEvent) => {
  if (/^\d$/.test(e.key)) ketik(e.key)
  else if (e.key === 'Backspace') mundur()
  else if (e.key === 'Enter') proses()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const booking = computed(() => (kode.value.length === 10 ? findBooking(kode.value) : null))
const status = computed(() => {
  if (kode.value.length < 10) return { ok: false, teks: `${kode.value.length} / 10 digit` }
  if (!booking.value) return { ok: false, teks: 'Kode booking tidak tersedia di SIMRS' }
  if (booking.value.tanggal !== todayStr()) return { ok: false, teks: `Booking untuk ${fmtTgl(booking.value.tanggal)} · check-in hanya pada hari pelayanan` }
  if (booking.value.status !== 'booked') return { ok: false, teks: 'Booking sudah check-in / tidak aktif' }
  return { ok: true, teks: '✓ 10 digit · ' + (contoh.value && kode.value === contoh.value.kodeBooking ? 'Kode contoh terisi' : 'Kode ditemukan') }
})
const pt = computed(() => (booking.value ? patient(booking.value.patientId) : null))

const proses = () => {
  apm.registerAttempt()
  if (apm.waitSeconds() > 0) return toast.warn('Terlalu banyak percobaan. Mohon tunggu sebentar atau panggil petugas.')
  if (!status.value.ok || !booking.value) return toast.err(status.value.teks)
  const v = toast.attempt(() => checkInBooking(booking.value.id))
  if (!v) return
  apm.state.value.bookingId = booking.value.id
  apm.state.value.patientId = v.patientId
  apm.state.value.visitId = v.id
  navigateTo('/apm/hasil')
}
</script>
<template>
  <ApmShell kode="APM-08" langkah="Check-in Mobile JKN" back="/apm/menu" bantuan-inline>
    <div class="head">
      <h1 class="apm-h1">Scan QR &amp; Check-in Mobile JKN</h1>
      <p class="apm-note">Buka bukti booking di aplikasi Mobile JKN, lalu arahkan QR di HP ke pemindai.</p>
    </div>
    <div class="apm-row">
      <button type="button" class="apm-btn" :class="{ pri: metode === 'scan' }" :aria-pressed="metode === 'scan'" @click="metode = 'scan'"><AppIcon name="scan-line" :size="26" /> Scan Barcode/QR</button>
      <button type="button" class="apm-btn" :class="{ pri: metode === 'kode' }" :aria-pressed="metode === 'kode'" @click="metode = 'kode'"><AppIcon name="keyboard" :size="26" /> Input Kode Booking</button>
    </div>
    <div class="dua">
      <div class="apm-card pn scan" :class="{ redup: metode === 'kode' }">
        <p class="pt">Arahkan layar HP ke pemindai</p>
        <div class="area">
          <img :src="scanTarget" alt="" width="170" height="160">
          <span>Area pemindai · Ilustrasi demo</span>
        </div>
        <p class="apm-note">Naikkan kecerahan layar HP. Pastikan seluruh QR terlihat dan tidak terpotong.</p>
        <div class="apm-guide"><AppIcon name="info" :size="24" /> Scanner tidak aktif pada desain demo ini. Gunakan contoh kode booking di samping.</div>
      </div>
      <div class="apm-card pn kode">
        <p class="pt">Atau ketik kode booking</p>
        <div class="kode-in" aria-live="polite">{{ kode || '__________' }}</div>
        <p class="st" :class="{ bad: !status.ok && kode.length === 10 }">{{ status.teks }}</p>
        <div class="apm-keys" aria-label="Keypad angka">
          <div v-for="r in [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']]" :key="r[0]" class="kr">
            <button v-for="d in r" :key="d" type="button" class="apm-key k" @click="ketik(d)">{{ d }}</button>
          </div>
          <div class="kr">
            <button type="button" class="apm-key k sm" @click="hapus">Hapus</button>
            <button type="button" class="apm-key k" @click="ketik('0')">0</button>
            <button type="button" class="apm-key k" aria-label="Hapus satu digit" @click="mundur">⌫</button>
          </div>
        </div>
        <button type="button" class="apm-btn pri full" :disabled="!status.ok" @click="proses">Proses Check-in</button>
      </div>
    </div>
    <div v-if="booking && pt" class="apm-card prev">
      <div class="prev-h">
        <span>Konfirmasi booking · Data demo</span>
        <span class="bk">{{ booking.status === 'booked' ? 'Booked · Belum check-in' : 'Sudah check-in' }}</span>
      </div>
      <div class="prev-b">
        <div><b>{{ maskNama(pt.nama) }}</b><span>Kode booking {{ booking.kodeBooking || booking.kode }} · {{ pt.penjamin }}</span></div>
        <div><b>Poli {{ poli(booking.poliId)?.nama }} · {{ doctor(booking.doctorId)?.nama }}</b><span>{{ fmtTglPanjang(booking.tanggal).replace(/^\w+, /, '') }} · Estimasi layanan {{ booking.jam }}</span></div>
      </div>
    </div>
    <div class="apm-guide"><AppIcon name="info" :size="24" /> Setelah Proses Check-in: Booked → Hadir. Task ID 3 · Selesai Pendaftaran &amp; Masuk Antrean Poli dicatat pada simulasi lokal; tidak dikirim ke BPJS.</div>
  </ApmShell>
</template>
<style scoped>
.head { display: flex; flex-direction: column; gap: 8px; }
.dua { display: grid; grid-template-columns: minmax(0, 1fr) 480px; gap: 24px; align-items: start; }
.pn { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.pn p { margin: 0; }
.pt { font-size: 24px; font-weight: 600; color: #06345d; line-height: 1.45; }
.scan.redup { opacity: .55; }
.area { background: #f3f6f8; border-radius: 8px; height: 268px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: #00747c; font-size: 20px; }
.kode { gap: 16px; }
.kode-in { border: 2px solid #008d96; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 600; color: #06345d; letter-spacing: 1px; }
.st { font-size: 18px; color: #00747c; }
.st.bad { color: var(--err); }
.kode .apm-keys { gap: 10px; } .kode .kr { gap: 10px; }
.k { background: #f3f6f8; min-height: 56px; padding: 0; font-size: 26px; }
.k.sm { font-size: 18px; }
.full { width: 100%; }
.prev { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.prev-h { display: flex; justify-content: space-between; gap: 12px; font-weight: 600; font-size: 24px; color: #06345d; flex-wrap: wrap; }
.prev-h .bk { font-size: 20px; color: #946017; }
.prev-b { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; line-height: 1.45; }
.prev-b div { display: flex; flex-direction: column; gap: 6px; }
.prev-b b { font-size: 24px; font-weight: 600; color: #173348; }
.prev-b span { font-size: 20px; color: #647887; }
@media (max-width: 1099px) { .dua { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 767px) { .prev-b { grid-template-columns: minmax(0, 1fr); } .prev-h, .prev-b b { font-size: 18px; } .area { height: 200px; } }
</style>
