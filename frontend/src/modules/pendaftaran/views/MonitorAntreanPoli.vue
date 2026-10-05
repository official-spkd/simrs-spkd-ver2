<script setup>
/** PDR-06 · Pendaftaran — Monitor Antrean Poli */
import { computed, reactive, ref } from 'vue'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, UiModal, StatCard, FormField } from '@/components/ui'
import { formatJam, useNow } from '@/utils/format'
import { rekapAntrean, monitorPoli } from '../data-b'

const now = useNow()
const rekap = reactive({ ...rekapAntrean })
const polis = reactive(monitorPoli.map((p) => ({ ...p, dilewati: [...p.dilewati], antrean: p.antrean.map((a) => ({ ...a })) })))
const panggilTerakhir = ref('09:10')
const pesan = ref(null)

const stats = computed(() => [
  { label: 'Menunggu', value: rekap.menunggu },
  { label: 'Dipanggil', value: rekap.dipanggil },
  { label: 'Dilayani', value: rekap.dilayani },
  { label: 'Skip', value: rekap.skip },
])
const catatan = computed(() => `Diperbarui ${formatJam(now.value)} WIB`)

function catat(text) {
  panggilTerakhir.value = formatJam(new Date())
  pesan.value = text
}

function panggilBerikut(p) {
  const next = p.antrean.shift()
  if (!next) return
  p.dilayani = next.nomor
  rekap.menunggu = Math.max(0, rekap.menunggu - 1)
  rekap.dilayani++
  catat(`${next.nomor} · ${next.nama} dipanggil ke ${p.poli}.`)
}
function panggilUlang(p) {
  const nomor = p.dilewati.length ? p.dilewati.pop() : p.dilayani
  if (nomor !== p.dilayani) {
    p.dilayani = nomor
    rekap.skip = Math.max(0, rekap.skip - 1)
  }
  catat(`${nomor} dipanggil ulang ke ${p.poli}.`)
}
function skip(p) {
  const next = p.antrean.shift()
  if (!next) return
  p.dilewati.push(next.nomor)
  rekap.menunggu = Math.max(0, rekap.menunggu - 1)
  rekap.skip++
  catat(`${next.nomor} dilewati · dapat dipanggil ulang.`)
}

// Transfer pasien berikutnya ke poli lain
const transferOpen = ref(false)
const transferDari = ref(null)
const transferKe = ref('')
const tujuanTransfer = computed(() => polis.filter((p) => p.key !== transferDari.value?.key))
function bukaTransfer(p) {
  if (!p.antrean.length) return
  transferDari.value = p
  transferKe.value = tujuanTransfer.value[0]?.key ?? ''
  transferOpen.value = true
}
function konfirmasiTransfer() {
  const dari = transferDari.value
  const ke = polis.find((p) => p.key === transferKe.value)
  if (!dari || !ke) return
  const pasien = dari.antrean.shift()
  ke.antrean.push(pasien)
  transferOpen.value = false
  catat(`${pasien.nomor} · ${pasien.nama} ditransfer ke ${ke.poli}.`)
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <div class="grid-4 mon__stats">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" :note="catatan" />
    </div>

    <div class="grid-3 mon__poli">
      <UiCard v-for="p in polis" :key="p.key" :title="p.poli">
        <p class="mon__nomor">{{ p.dilayani }}</p>
        <div><UiBadge tone="success">Sedang dilayani</UiBadge></div>
        <template v-if="p.antrean.length">
          <p class="t-strong">Berikut: {{ p.antrean[0].nomor }} · {{ p.antrean[0].nama }}</p>
          <p class="t-sm">Menunggu {{ p.antrean[0].tunggu }} menit · IHS ✓ NIK {{ p.antrean[0].nik }}</p>
        </template>
        <p v-else class="t-sm t-muted">Tidak ada antrean berikutnya.</p>
        <div><UiButton variant="primary" size="lg" :disabled="!p.antrean.length" @click="panggilBerikut(p)">Panggil berikutnya</UiButton></div>
        <div><UiButton @click="panggilUlang(p)">Panggil ulang</UiButton></div>
        <div class="row">
          <UiButton :disabled="!p.antrean.length" @click="bukaTransfer(p)">Transfer</UiButton>
          <UiButton :disabled="!p.antrean.length" @click="skip(p)">Skip</UiButton>
        </div>
        <p class="t-sm">
          <template v-if="p.dilewati.length">Lewati: {{ p.dilewati.join(', ') }} · dapat dipanggil ulang</template>
          <template v-else>Tidak ada nomor dilewati</template>
        </p>
      </UiCard>
    </div>

    <UiAlert
      tone="info"
      title="Monitor sinkron dengan display poli"
      :text="`Pemanggilan terakhir ${panggilTerakhir} WIB · status arrived / in-progress sesuai encounter.`"
    >
      <p v-if="pesan" class="t-strong">{{ pesan }}</p>
    </UiAlert>

    <UiModal v-model:open="transferOpen" title="Transfer antrean" :subtitle="transferDari ? `${transferDari.antrean[0]?.nomor} · ${transferDari.antrean[0]?.nama} dari ${transferDari.poli}` : ''" width="480px">
      <FormField label="Poli tujuan" required>
        <select v-model="transferKe" class="select">
          <option v-for="p in tujuanTransfer" :key="p.key" :value="p.key">{{ p.poli }}</option>
        </select>
      </FormField>
      <template #footer>
        <UiButton @click="transferOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="konfirmasiTransfer">Transfer</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.mon__stats,
.mon__poli { width: 100%; }
.mon__nomor { font-size: 48px; font-weight: 600; line-height: 1.45; color: var(--c-primary); }
@media (max-width: 1100px) {
  .mon__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mon__poli { grid-template-columns: 1fr; }
}
</style>
