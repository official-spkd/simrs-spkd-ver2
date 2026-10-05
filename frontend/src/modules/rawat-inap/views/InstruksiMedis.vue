<script setup>
/** RI-05 · Rawat inap — Instruksi Medis */
import { computed, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, FormField } from '@/components/ui'
import PatientBanner from './parts-b/PatientBanner.vue'
import SegmentTabs from './parts-b/SegmentTabs.vue'
import { pasienRanap, instruksiMedis, catatanHandoverAwal } from '../data-b'

const instruksi = ref(instruksiMedis.map((i) => ({ ...i })))
const tab = ref('semua')
const handover = ref(catatanHandoverAwal)
const handoverError = ref('')
const notice = ref(null)

const belum = computed(() => instruksi.value.filter((i) => i.status === 'baru').length)
const tabs = computed(() => [
  { key: 'semua', label: 'Semua instruksi' },
  { key: 'baru', label: `Belum dibaca · ${belum.value}` },
  { key: 'diakui', label: 'Sudah diakui' },
])
const tampil = computed(() => (tab.value === 'semua' ? instruksi.value : instruksi.value.filter((i) => i.status === tab.value)))

function akui(item) {
  const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
  item.status = 'diakui'
  item.diakuiOleh = `Diakui Ns. Maya · ${jam}`
}

function kirimHandover() {
  if (!handover.value.trim()) {
    handoverError.value = 'Catatan handover wajib diisi.'
    return
  }
  handoverError.value = ''
  notice.value = belum.value
    ? { tone: 'warning', title: 'Handover terkirim', text: `Masih ada ${belum.value} instruksi yang belum diakui.` }
    : { tone: 'success', title: 'Handover terkirim', text: 'Catatan diteruskan ke perawat shift berikutnya.' }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienRanap" />

    <SegmentTabs v-model="tab" :tabs="tabs" />

    <div class="row im__main">
      <div class="grow stack">
        <UiCard v-for="i in tampil" :key="i.id" :title="`${i.waktu} · ${i.jenis}`">
          <div class="row">
            <p class="grow im__isi">{{ i.isi }}</p>
            <UiBadge :tone="i.status === 'baru' ? 'warning' : 'success'">{{ i.status === 'baru' ? 'Baru' : 'Diakui' }}</UiBadge>
          </div>
          <p class="t-sm t-muted">{{ i.dokter }} · Tanda tangan elektronik terverifikasi</p>
          <UiButton class="im__btn" :disabled="i.status === 'diakui'" @click="akui(i)">
            {{ i.status === 'diakui' ? i.diakuiOleh : 'Saya sudah membaca' }}
          </UiButton>
        </UiCard>
        <p v-if="!tampil.length" class="t-sm t-muted">Tidak ada instruksi pada filter ini.</p>
      </div>

      <UiCard class="im__side" title="Komunikasi tim">
        <UiAlert v-if="belum" tone="warning" :title="`${belum} instruksi perlu pengakuan`" text="Pastikan instruksi dipahami sebelum pelaksanaan." />
        <UiAlert v-else tone="success" title="Semua instruksi telah diakui" text="Instruksi siap dilaksanakan." />
        <FormField label="Catatan handover" :error="handoverError">
          <textarea v-model="handover" class="textarea im__textarea" />
        </FormField>
        <UiAlert v-if="notice" :tone="notice.tone" :title="notice.title" :text="notice.text" />
        <UiButton class="im__btn" variant="primary" @click="kirimHandover">Kirim handover</UiButton>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.im__side { width: 300px; flex-shrink: 0; }
.im__isi { font-size: 14px; }
.im__btn { align-self: flex-start; }
.im__btn:disabled { opacity: 1; cursor: default; }
.im__textarea { min-height: 92px; }
@media (max-width: 1100px) {
  .im__main { flex-direction: column; }
  .im__side { width: 100%; }
}
</style>
