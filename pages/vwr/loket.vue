<script setup lang="ts">
// VWR-01 Display antrean loket — data publik dari server (/api/v1/display/queues), hanya panggilan hari ini; tanpa nama pasien.
definePageMeta({ layout: 'tv' })
const { soundOn, supported, speak, enable } = useVwrSound()

const flash = ref(false)
let ft: any
const kedip = () => {
  flash.value = false
  clearTimeout(ft)
  setTimeout(() => (flash.value = true), 30)
  ft = setTimeout(() => (flash.value = false), 3400)
}
// Panggilan baru / panggil ulang (last_called_at berubah) → kedip + suara. Muatan pertama hanya kedip.
const { current, err, diperbarui, berikutnya } = useVwrLoket((e, live) => {
  kedip()
  if (live) speak(teksPanggil(e))
})
const daftar = computed(() => berikutnya(5))
const aktifkan = () => enable(teksPanggil(current.value))
onBeforeUnmount(() => clearTimeout(ft))
</script>
<template>
  <VwrFrame kode="VWR-01" judul="Antrean Pendaftaran · Lobi Utama" :terhubung="!err" :diperbarui="diperbarui" :sound-on="soundOn" :supported="supported" @suara="aktifkan">
    <section class="now" :class="{ flash }" aria-live="assertive">
      <p class="lbl">Sedang dipanggil</p>
      <p v-if="current" class="no">{{ current.nomor }} → {{ current.loketNama }}</p>
      <p v-else class="no kosong">Belum ada panggilan</p>
      <p class="arah">Silakan menuju loket pendaftaran</p>
    </section>
    <p class="sub">Antrean berikutnya</p>
    <div class="next">
      <div v-for="n in daftar" :key="n" class="tk">{{ n }}</div>
      <div v-if="!daftar.length" class="tk kosong">{{ err ? 'Menghubungkan ke server…' : 'Tidak ada antrean menunggu' }}</div>
    </div>
  </VwrFrame>
</template>
<style scoped>
.now { background: #fff; border-radius: 16px; padding: 40px; min-height: 446px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; }
.now p { margin: 0; }
.now.flash { animation: kedip 1s ease 3; }
@keyframes kedip { 50% { background: #d8f1f2; } }
.lbl { font-size: 36px; color: #647887; }
.no { font-size: clamp(64px, 9.2vw, 176px); font-weight: 700; color: #06345d; line-height: 1.1; white-space: nowrap; }
.no.kosong { font-size: 64px; color: #647887; }
.arah { font-size: 32px; color: #00747c; }
.sub { font-size: 32px; font-weight: 600; line-height: 1.45; margin: 0; }
.next { display: flex; gap: 16px; }
.tk { flex: 1; min-width: 0; height: 160px; background: #124465; border-radius: 16px; display: grid; place-items: center; font-size: 64px; font-weight: 600; }
.tk.kosong { font-size: 32px; font-weight: 400; color: #afcad8; }
@media (max-width: 767px) {
  .now { min-height: 0; padding: 20px; } .lbl { font-size: 20px; } .arah { font-size: 18px; } .no { white-space: normal; }
  .sub { font-size: 20px; } .next { flex-wrap: wrap; } .tk { flex-basis: 30%; height: 80px; font-size: 32px; } .tk.kosong { font-size: 18px; }
}
</style>
