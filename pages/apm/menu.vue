<script setup lang="ts">
// APM-02 Menu utama: Pasien Lama / Pasien Baru / Check-in Mobile JKN, ambil nomor loket
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { takeLoketTicket, loketMenunggu } = useDb()

const pilih = (mode: 'lama' | 'baru' | 'booking') => {
  apm.reset()
  apm.state.value.mode = mode
  navigateTo(mode === 'lama' ? '/apm/identifikasi' : mode === 'baru' ? '/apm/baru' : '/apm/checkin')
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
const PILIHAN = [
  { mode: 'lama', ikon: 'user-check', judul: 'Pasien Lama', teks: 'Sudah memiliki nomor rekam medis di RS SPKD.' },
  { mode: 'baru', ikon: 'user-plus', judul: 'Pasien Baru', teks: 'Belum pernah mendaftar di RS SPKD.' },
  { mode: 'booking', ikon: 'smartphone', judul: 'Check-in Pasien Mobile JKN / Online', teks: 'Sudah memiliki kode booking dari Mobile JKN atau layanan online.' },
] as const
</script>
<template>
  <ApmShell kode="APM-02" langkah="Langkah 1 · Menu utama" back="/apm">
    <h1 class="apm-h1">Silakan pilih jenis pasien</h1>
    <div class="pilihan">
      <button v-for="p in PILIHAN" :key="p.mode" type="button" class="apm-card kartu" @click="pilih(p.mode)">
        <span class="ico"><AppIcon :name="p.ikon" :size="56" /></span>
        <span class="jdl">{{ p.judul }}</span>
        <span class="txt">{{ p.teks }}</span>
        <span class="go">Pilih →</span>
      </button>
    </div>
    <div class="apm-row">
      <button type="button" class="apm-btn pri stack" @click="ambil">Ambil nomor loket<small>Task ID 1 · Mulai Tunggu Admisi</small></button>
    </div>
    <div class="apm-guide">Pengguna Asuransi atau yang memerlukan bantuan pendaftaran dapat mengambil nomor loket. Umum dan BPJS dapat melanjutkan di APM.</div>
    <p class="apm-note">Panggil petugas dibatasi 1 kali setiap 60 detik agar bantuan tetap tertib.</p>

    <AppModal v-model="showTiket" title="Nomor antrean loket Anda">
      <div class="tk">
        <p class="muted">Silakan duduk dan tunggu nomor Anda dipanggil di layar loket.</p>
        <div class="tk-no">{{ tiket?.nomor }}</div>
        <p><b>{{ sisaDepan }}</b> antrean di depan Anda</p>
        <p class="hint">Task ID 1 · Mulai Tunggu Admisi tercatat (simulasi). Simpan struk Anda.</p>
      </div>
      <template #footer><button class="apm-btn pri" @click="showTiket = false">Selesai</button></template>
    </AppModal>
  </ApmShell>
</template>
<style scoped>
.pilihan { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.kartu { min-height: 480px; padding: 32px; display: flex; flex-direction: column; align-items: flex-start; gap: 24px; text-align: left; cursor: pointer; font: inherit; }
.kartu:hover { border-color: #008d96; box-shadow: 0 0 0 3px rgba(0, 141, 150, .15); }
.ico { color: #008d96; display: flex; }
.jdl { font-size: 32px; font-weight: 600; color: #06345d; line-height: 1.45; }
.txt { font-size: 24px; color: #173348; line-height: 1.45; }
.go { font-size: 24px; font-weight: 600; color: #008d96; }
.tk { text-align: center; }
.tk-no { font-size: 88px; font-weight: 800; color: #06345d; letter-spacing: 3px; margin: 14px 0; line-height: 1; }
.tk p { font-size: 18px; }
@media (max-width: 899px) {
  .pilihan { grid-template-columns: minmax(0, 1fr); }
  .kartu { min-height: 0; padding: 20px; gap: 10px; }
  .jdl { font-size: 26px; } .txt, .go { font-size: 18px; }
}
</style>
