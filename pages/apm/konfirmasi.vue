<script setup lang="ts">
// APM-04 Konfirmasi identitas & status check-in (token identifikasi sekali pakai 180 detik)
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { pasien } = apm
const { db, poli, doctor, checkInBooking } = useDb()

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const lahir = computed(() => {
  const t = pasien.value?.tglLahir
  if (!t) return '-'
  const [, m, d] = t.split('-')
  return `${parseInt(d)} ${BULAN[parseInt(m) - 1]}`
})
const namaSamar = computed(() => (pasien.value ? maskNama(pasien.value.nama) : ''))
const nikSamar = computed(() => (pasien.value?.nik ? '•'.repeat(12) + pasien.value.nik.slice(-4) : '-'))
const booking = computed(() => (apm.state.value.bookingId ? db.reservations.find((r: any) => r.id === apm.state.value.bookingId) : null))

const sisa = ref(0)
let iv: any
const keluar = (pesan: string) => {
  toast.warn(pesan)
  apm.state.value.patientId = ''
  apm.state.value.srvPasien = null
  apm.state.value.tokenExp = 0
  navigateTo('/apm/identifikasi')
}
const tick = () => {
  sisa.value = Math.max(0, Math.ceil((apm.state.value.tokenExp - Date.now()) / 1000))
  if (!apm.tokenValid()) { clearInterval(iv); keluar('Waktu konfirmasi habis. Silakan identifikasi ulang.') }
}
onMounted(() => {
  if (!pasien.value || !apm.tokenValid()) return keluar('Silakan identifikasi terlebih dahulu.')
  tick()
  iv = setInterval(tick, 1000)
})
onBeforeUnmount(() => clearInterval(iv))

const ya = () => {
  if (!apm.consumeToken()) return keluar('Waktu konfirmasi habis. Silakan identifikasi ulang.')
  clearInterval(iv)
  if (!booking.value) return navigateTo('/apm/poli')
  // pasien booking: Booked → Hadir, langsung terbit nomor antrean poli
  const v = toast.attempt(() => checkInBooking(booking.value.id))
  if (!v) return navigateTo('/apm/identifikasi')
  apm.state.value.visitId = v.id
  navigateTo('/apm/hasil')
}
const bukan = () => {
  clearInterval(iv)
  apm.state.value.patientId = ''
  apm.state.value.srvPasien = null
  apm.state.value.tokenExp = 0
  apm.state.value.bookingId = ''
  navigateTo('/apm/identifikasi')
}
</script>
<template>
  <ApmShell kode="APM-04" langkah="Langkah 3 · Konfirmasi identitas & check-in" back="/apm/identifikasi">
    <h1 class="apm-h1">{{ booking ? 'Konfirmasi Identitas & Status Check-in' : 'Apakah ini data Anda?' }}</h1>
    <div v-if="pasien" class="kartu-row">
      <div class="apm-card idk">
        <span class="ico"><AppIcon name="shield-check" :size="64" /></span>
        <p class="nm">{{ namaSamar }}</p>
        <p class="t28">Tanggal lahir: {{ lahir }}</p>
        <p v-if="pasien.nik" class="t24 muted">NIK {{ nikSamar }}</p>
        <p v-else-if="pasien.rm" class="t24 muted">No. RM {{ pasien.rm }}</p>
        <p class="t24">Pastikan nama dan tanggal lahir sesuai.</p>
      </div>
      <div v-if="booking" class="apm-card bk">
        <div class="bk-h">
          <div>
            <p class="bk-t">Detail Reservasi Mobile JKN</p>
            <p class="apm-note">Data demo fiktif · Gunakan untuk simulasi konfirmasi check-in.</p>
          </div>
          <span class="pill">Booked</span>
        </div>
        <dl class="bk-rows">
          <div><dt>Nama</dt><dd>{{ namaSamar }}</dd></div>
          <div><dt>Poli</dt><dd>Poli {{ poli(booking.poliId)?.nama }}</dd></div>
          <div><dt>DPJP</dt><dd>{{ doctor(booking.doctorId)?.nama }}</dd></div>
          <div><dt>Jam estimasi</dt><dd>{{ booking.jam.replace('.', ':') }} WIB</dd></div>
          <div><dt>Kode booking</dt><dd>{{ booking.kodeBooking || booking.kode }}</dd></div>
        </dl>
        <p class="bk-note">Status saat ini: Booked. Konfirmasi mengubah Booked → Hadir dan mencatat Task ID 3 · Selesai Admisi. Simulasi lokal, tanpa pengiriman BPJS nyata.</p>
      </div>
    </div>
    <div class="apm-row">
      <button type="button" class="apm-btn" @click="bukan">Batal / Bukan Saya</button>
      <button type="button" class="apm-btn pri" @click="ya">{{ booking ? 'Ya, Check-in Sekarang' : 'Ya, Ini Saya' }}</button>
    </div>
    <div class="apm-guide">Token identifikasi hanya dapat digunakan sekali dan berlaku 180 detik (sisa {{ sisa }} detik). Pilih “Batal / Bukan Saya” untuk menghapus hasil dan memasukkan identitas kembali.</div>
    <p class="apm-note">Detail identitas lengkap tidak ditampilkan untuk menjaga privasi Anda.</p>
  </ApmShell>
</template>
<style scoped>
.kartu-row { display: flex; gap: 24px; align-items: flex-start; }
.idk { width: 560px; flex: none; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; }
.idk p, .bk p { margin: 0; }
.ico { color: #008d96; display: flex; }
.nm { font-size: 48px; font-weight: 600; color: #06345d; }
.t28 { font-size: 28px; color: #173348; }
.t24 { font-size: 24px; color: #173348; }
.t24.muted { color: #647887; }
.bk { flex: 1; min-width: 0; padding: 40px; display: flex; flex-direction: column; gap: 24px; }
.bk-h { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.bk-h > div { display: flex; flex-direction: column; gap: 8px; }
.bk-t { font-size: 32px; font-weight: 600; color: #06345d; }
.pill { background: #eaf6f5; color: #00747c; border-radius: 999px; padding: 10px 16px; font-size: 18px; font-weight: 600; flex: none; }
.bk-rows { display: flex; flex-direction: column; gap: 16px; margin: 0; font-size: 20px; }
.bk-rows div { display: flex; justify-content: space-between; gap: 12px; }
.bk-rows dt { color: #647887; } .bk-rows dd { margin: 0; font-weight: 600; color: #173348; text-align: right; }
.bk-note { background: #f3f6f8; border-radius: 8px; padding: 16px; font-size: 18px; color: #647887; line-height: 1.45; }
@media (max-width: 1099px) {
  .kartu-row { flex-direction: column; }
  .idk { width: 100%; }
}
@media (max-width: 767px) {
  .idk, .bk { padding: 20px; gap: 14px; }
  .nm { font-size: 32px; } .t28 { font-size: 20px; } .t24 { font-size: 17px; } .bk-t { font-size: 24px; } .bk-rows { font-size: 17px; }
}
</style>
