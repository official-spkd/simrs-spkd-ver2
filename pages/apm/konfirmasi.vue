<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { pasien } = apm

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const lahir = computed(() => {
  const t = pasien.value?.tglLahir
  if (!t) return '-'
  const [, m, d] = t.split('-')
  return `${parseInt(d)} ${BULAN[parseInt(m) - 1]}`
})
const namaSamar = computed(() => (pasien.value ? maskNama(pasien.value.nama) : ''))
const sisa = ref(0)
let iv: any
const keluar = (pesan: string) => {
  toast.warn(pesan)
  apm.state.value.patientId = ''
  apm.state.value.tokenExp = 0
  navigateTo('/apm/identifikasi')
}
const tick = () => {
  sisa.value = Math.max(0, Math.ceil((apm.state.value.tokenExp - Date.now()) / 1000))
  if (!apm.tokenValid()) {
    clearInterval(iv)
    keluar('Waktu konfirmasi habis. Silakan identifikasi ulang.')
  }
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
  navigateTo('/apm/poli')
}
const bukan = () => {
  clearInterval(iv)
  apm.state.value.patientId = ''
  apm.state.value.tokenExp = 0
  navigateTo('/apm/identifikasi')
}
const mm = computed(() => `${Math.floor(sisa.value / 60)}:${String(sisa.value % 60).padStart(2, '0')}`)
</script>
<template>
  <ApmShell kode="APM-04" langkah="Langkah 3 · Konfirmasi identitas">
    <h1>Apakah ini data Anda?</h1>
    <div v-if="pasien" class="card idcard">
      <div class="ava" aria-hidden="true">{{ pasien.nama.slice(0, 1) }}</div>
      <dl>
        <dt>Nama</dt>
        <dd class="nm">{{ namaSamar }}</dd>
        <dt>Tanggal &amp; bulan lahir</dt>
        <dd>{{ lahir }}</dd>
        <dt>Jenis kelamin</dt>
        <dd>{{ pasien.jk === 'L' ? 'Laki-laki' : 'Perempuan' }}</dd>
        <dt>Penjamin</dt>
        <dd><StatusBadge :value="pasien.penjamin" /></dd>
      </dl>
    </div>
    <p class="hint">Demi privasi, sebagian data disamarkan. Konfirmasi berlaku {{ mm }} lagi.</p>
    <div class="row act">
      <button class="btn big" @click="bukan">Bukan saya</button>
      <button class="btn btn-primary big" @click="ya">Ya, benar</button>
    </div>
  </ApmShell>
</template>
<style scoped>
.idcard { display: flex; gap: 32px; align-items: center; padding: 32px; margin: 12px 0 8px; }
.ava { width: 120px; height: 120px; border-radius: 50%; background: var(--teal-l); color: var(--teal-d); font-size: 56px; font-weight: 800; display: grid; place-items: center; flex: none; }
dl { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 12px 20px; margin: 0; font-size: 22px; }
dt { color: var(--muted); }
dd { margin: 0; font-weight: 600; }
.nm { font-size: 36px; letter-spacing: 2px; color: var(--navy); }
.act { gap: 20px; margin-top: 24px; }
.big { flex: 1; min-height: 88px !important; font-size: 28px !important; }
@media (max-width: 767px) {
  .idcard { flex-direction: column; padding: 20px; gap: 16px; text-align: center; }
  dl { grid-template-columns: minmax(0, 1fr); gap: 2px; font-size: 18px; }
  dd { margin-bottom: 8px; }
  .nm { font-size: 28px; }
  .ava { width: 84px; height: 84px; font-size: 40px; }
  .act { flex-direction: column-reverse; }
  .big { width: 100%; }
}
</style>
