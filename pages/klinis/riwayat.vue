<script setup lang="ts">
// KL-08 Riwayat Kunjungan — menu sendiri; episode = ?id=, atau pasien aktif terakhir di workspace.
const route = useRoute()
const { visit, patient } = useDb()
const { isDokter, sync, rows } = useDokterQueue()
const klinis = useKlinis()

const id = ref(String(route.query.id || ''))
const siap = ref(!!id.value)
onMounted(async () => {
  if (!id.value) {
    try { id.value = localStorage.getItem(KL_AKTIF_KEY) || '' } catch {}
    if (!visit(id.value)) {
      if (isDokter.value) await sync()
      id.value = (rows.value.find((x: any) => x.status === 'dilayani') || rows.value[0])?.id || ''
    }
  }
  // dibuka langsung lewat ?id= tanpa cache: ambil kunjungannya dari server
  if (isDokter.value && id.value && !visit(id.value)) { try { await klinis.muat(id.value) } catch {} }
  siap.value = true
})
const v = computed(() => (id.value ? visit(id.value) : null))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const TABS = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'vital', label: 'Vital & Pengkajian' },
  { key: 'soap', label: 'SOAP' },
  { key: 'order', label: 'Resep & Tindakan' },
  { key: 'riwayat', label: 'Riwayat' },
  { key: 'lampiran', label: 'Lampiran' },
]
const keTab = (k: string) => { if (k !== 'riwayat' && v.value) navigateTo({ path: '/klinis/' + v.value.id, query: k === 'ringkasan' ? {} : { tab: k } }) }
</script>

<template>
  <div>
    <PageHead code="KL-08" role="Dokter / Perawat" title="Riwayat Kunjungan" subtitle="Rekam medis longitudinal · Riwayat final hanya dapat dibaca" />
    <template v-if="v && pt">
      <PatientBanner :patient="pt" :visit="v" />
      <AppTabs model-value="riwayat" :tabs="TABS" @update:model-value="keTab" />
      <KlRiwayat :visit-id="v.id" @back="keTab('ringkasan')" />
    </template>
    <div v-else-if="siap" class="panel">
      <h2>Belum ada pasien aktif</h2>
      <p class="muted">Riwayat kunjungan dibuka untuk pasien aktif. Pilih pasien dari Worklist Poli atau buka workspace pasien terlebih dahulu.</p>
      <div><NuxtLink to="/klinis" class="btn btn-primary">Buka Worklist Poli</NuxtLink></div>
    </div>
  </div>
</template>
