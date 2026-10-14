<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { takeLoketTicket, loketMenunggu } = useDb()

const lama = () => {
  apm.reset()
  apm.state.value.mode = 'lama'
  navigateTo('/apm/identifikasi')
}
const baru = () => {
  apm.reset()
  apm.state.value.mode = 'baru'
  navigateTo('/apm/baru')
}
const panggil = () => {
  try {
    apm.callStaff()
    toast.ok('Petugas telah dipanggil. Mohon tunggu di tempat.')
  } catch (e: any) {
    toast.warn(e.message)
  }
}

const tiket = ref<any>(null)
const showTiket = ref(false)
const ambil = () => {
  const w = apm.ticketWait()
  if (w > 0) return toast.warn(`Nomor baru saja diambil. Tunggu ${w} detik.`)
  tiket.value = takeLoketTicket('apm')
  apm.markTicket()
  showTiket.value = true
}
const sisaDepan = computed(() => (tiket.value ? loketMenunggu().filter((t: any) => t.jam < tiket.value.jam).length : 0))
</script>
<template>
  <ApmShell kode="APM-02" langkah="Langkah 1 · Menu utama">
    <h1>Selamat datang. Silakan pilih layanan.</h1>
    <div class="grid g2 big">
      <button class="tile big" @click="lama">
        <span class="ico">1</span>
        Pasien Lama
        <small>Sudah pernah berobat di RS SPKD</small>
      </button>
      <button class="tile big" @click="baru">
        <span class="ico">+</span>
        Pasien Baru
        <small>Baru pertama kali berobat</small>
      </button>
    </div>
    <div class="row sub">
      <button class="btn" @click="ambil">Ambil nomor loket</button>
      <button class="btn" @click="panggil">Panggil petugas</button>
      <NuxtLink class="btn btn-ghost" to="/apm">Kembali ke awal</NuxtLink>
    </div>
    <p class="hint">Nomor loket dipakai bila Anda ingin dilayani langsung oleh petugas pendaftaran.</p>

    <AppModal v-model="showTiket" title="Nomor antrean loket Anda">
      <div class="tk center">
        <p class="muted">Silakan duduk dan tunggu nomor Anda dipanggil di layar loket.</p>
        <div class="tk-no">{{ tiket?.nomor }}</div>
        <p><b>{{ sisaDepan }}</b> antrean di depan Anda</p>
        <p class="hint">Nomor dicetak otomatis. Simpan struk Anda.</p>
      </div>
      <template #footer><button class="btn btn-primary" style="min-height: 64px; font-size: 20px; padding: 0 36px" @click="showTiket = false">Selesai</button></template>
    </AppModal>
  </ApmShell>
</template>
<style scoped>
.big { gap: 28px; margin: 12px 0 32px; }
.tile.big { min-height: 260px; gap: 10px; font-size: 40px; }
.tile.big small { font-size: 20px; }
.ico { width: 84px; height: 84px; border-radius: 50%; background: var(--teal-l); color: var(--teal-d); display: grid; place-items: center; font-size: 46px; font-weight: 800; }
.sub { gap: 16px; }
.tk-no { font-size: 88px; font-weight: 800; color: var(--navy); letter-spacing: 3px; margin: 14px 0; line-height: 1; }
.tk p { font-size: 18px; }
@media (max-width: 767px) {
  .tile.big { min-height: 150px; font-size: 28px; }
  .ico { width: 56px; height: 56px; font-size: 30px; }
  .tk-no { font-size: 64px; }
}
</style>
