<script setup>
/** RI-03 · Rawat inap — Workspace Ranap */
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiAlert, UiBadge, UiButton, UiCard, UiModal, StatCard, FormField } from '@/components/ui'
import PatientBanner from './parts-b/PatientBanner.vue'
import SegmentTabs from './parts-b/SegmentTabs.vue'
import CheckList from './parts-a/CheckList.vue'
import {
  pasienBudi,
  tabWorkspace,
  infoRawat,
  vitalAwal,
  perawatanHariIni,
  checklistPerawatan,
  terapiAktif,
  cpptAwal,
  penunjangRanap,
} from '../data-a'

const router = useRouter()
const tab = ref('askep')
const checklist = ref(checklistPerawatan.map((c) => ({ ...c })))
const vital = reactive({ ...vitalAwal })
const cppt = ref(cpptAwal.map((c) => ({ ...c })))
const notice = ref(null)

// Tab yang punya layar sendiri langsung diarahkan ke layar tersebut
const tujuanTab = { io: '/rawat-inap/askep-dan-io', terapi: '/rawat-inap/instruksi-medis', pulang: '/rawat-inap/resume-pulang' }
watch(tab, (t) => {
  if (tujuanTab[t]) router.push(tujuanTab[t])
})

const stats = computed(() => [
  { label: 'TD', value: vital.td, note: '↑ Pantau tekanan darah' },
  { label: 'Nadi', value: vital.nadi, note: 'x/menit' },
  { label: 'SpO₂', value: `${vital.spo2}%`, note: 'Udara ruangan' },
  { label: 'Suhu', value: `${vital.suhu}°`, note: `°C · ${vital.jam} WIB` },
])

const jamSekarang = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')

// Modal vital sign
const vitalOpen = ref(false)
const vitalForm = reactive({ ...vitalAwal })
const vitalError = ref('')
function bukaVital() {
  Object.assign(vitalForm, vital)
  vitalError.value = ''
  vitalOpen.value = true
}
function simpanVital() {
  if (!/^\d{2,3}\/\d{2,3}$/.test(vitalForm.td.trim())) {
    vitalError.value = 'Format TD: sistolik/diastolik, mis. 130/80.'
    return
  }
  Object.assign(vital, vitalForm, { jam: jamSekarang() })
  vitalOpen.value = false
  notice.value = { tone: 'success', title: 'Vital sign tersimpan', text: `TD ${vital.td} · Nadi ${vital.nadi} · SpO₂ ${vital.spo2}% · Suhu ${vital.suhu} °C` }
}

// Modal CPPT (SOAP)
const cpptOpen = ref(false)
const soap = reactive({ s: '', o: '', a: '', p: '' })
const soapError = ref('')
function bukaCppt() {
  Object.assign(soap, { s: '', o: '', a: '', p: '' })
  soapError.value = ''
  cpptOpen.value = true
}
function simpanCppt() {
  if (!soap.s.trim() || !soap.a.trim() || !soap.p.trim()) {
    soapError.value = 'S, A, dan P wajib diisi.'
    return
  }
  cppt.value.unshift({
    id: Date.now(),
    waktu: `14 Mei ${jamSekarang()}`,
    oleh: 'Ns. Maya',
    soap: `S: ${soap.s} O: ${soap.o || '-'} A: ${soap.a} P: ${soap.p}`,
  })
  cpptOpen.value = false
  tab.value = 'cppt'
  notice.value = { tone: 'success', title: 'CPPT tersimpan', text: 'Catatan terintegrasi ditambahkan oleh Ns. Maya.' }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienBudi" />

    <SegmentTabs v-model="tab" :tabs="tabWorkspace" />

    <UiAlert tone="info" :title="infoRawat.title" :text="infoRawat.text" />
    <UiAlert v-if="notice" :tone="notice.tone" :title="notice.title" :text="notice.text" />

    <div class="row ws__stats">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" :note="s.note" />
    </div>

    <div class="row ws__main">
      <!-- Konten utama per tab -->
      <UiCard v-if="tab === 'cppt'" class="grow" title="CPPT" subtitle="Catatan perkembangan pasien terintegrasi">
        <div v-for="c in cppt" :key="c.id" class="ws__note">
          <p class="t-sm t-muted">{{ c.waktu }} · {{ c.oleh }}</p>
          <p>{{ c.soap }}</p>
        </div>
        <UiButton class="ws__btn" variant="primary" @click="bukaCppt">Tambah CPPT</UiButton>
      </UiCard>

      <UiCard v-else-if="tab === 'penunjang'" class="grow" title="Penunjang" subtitle="Hasil laboratorium & radiologi selama rawat inap">
        <div v-for="p in penunjangRanap" :key="p.id" class="ws__note row-between">
          <div>
            <p class="t-sm t-muted">{{ p.waktu }} · {{ p.jenis }}</p>
            <p>{{ p.hasil }}</p>
          </div>
          <UiBadge :tone="p.status === 'Final' ? 'success' : 'warning'">{{ p.status }}</UiBadge>
        </div>
      </UiCard>

      <UiCard v-else class="grow" title="Perawatan hari ini">
        <p class="t-strong">{{ perawatanHariIni.diagnosis }}</p>
        <p>{{ perawatanHariIni.catatan }}</p>
        <CheckList v-model="checklist" />
        <div class="row ws__actions">
          <UiButton variant="primary" @click="bukaCppt">CPPT</UiButton>
          <UiButton @click="bukaVital">Vital sign</UiButton>
          <UiButton to="/farmasi/resep-board">Resep</UiButton>
        </div>
      </UiCard>

      <UiCard class="ws__side" title="Terapi aktif">
        <p>{{ terapiAktif.join(' ') }}</p>
        <UiBadge tone="success" class="ws__badge">MedicationRequest · Terkirim</UiBadge>
        <UiButton class="ws__btn" to="/rawat-inap/instruksi-medis">Lihat instruksi medis</UiButton>
      </UiCard>
    </div>

    <UiModal v-model:open="vitalOpen" title="Vital sign" subtitle="Budi Santoso · 301-2" width="520px">
      <div class="grid-2">
        <FormField label="TD (mmHg)" required :error="vitalError"><input v-model="vitalForm.td" class="input" /></FormField>
        <FormField label="Nadi (x/menit)"><input v-model="vitalForm.nadi" class="input" inputmode="numeric" /></FormField>
        <FormField label="SpO₂ (%)"><input v-model="vitalForm.spo2" class="input" inputmode="numeric" /></FormField>
        <FormField label="Suhu (°C)"><input v-model="vitalForm.suhu" class="input" /></FormField>
      </div>
      <template #footer>
        <UiButton @click="vitalOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanVital">Simpan</UiButton>
      </template>
    </UiModal>

    <UiModal v-model:open="cpptOpen" title="CPPT" subtitle="Budi Santoso · format SOAP" width="640px">
      <div class="stack">
        <FormField label="S · Subjektif" required><textarea v-model="soap.s" class="textarea" /></FormField>
        <FormField label="O · Objektif"><textarea v-model="soap.o" class="textarea" /></FormField>
        <FormField label="A · Asesmen" required><input v-model="soap.a" class="input" /></FormField>
        <FormField label="P · Rencana" required :error="soapError"><input v-model="soap.p" class="input" /></FormField>
      </div>
      <template #footer>
        <UiButton @click="cpptOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="simpanCppt">Simpan CPPT</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.ws__main p { font-size: 14px; }
.ws__main p.t-sm { font-size: 12px; }
.ws__side { width: 340px; flex-shrink: 0; }
.ws__btn, .ws__badge { align-self: flex-start; }
.ws__actions { flex-wrap: wrap; }
.ws__note { padding-bottom: 12px; border-bottom: 1px solid var(--c-border); display: flex; flex-direction: column; gap: 4px; }
.ws__note.row-between { flex-direction: row; }
@media (max-width: 1100px) {
  .ws__stats { flex-wrap: wrap; }
  .ws__stats > :deep(.stat) { flex-basis: calc(50% - 8px); }
  .ws__main { flex-direction: column; }
  .ws__side { width: 100%; }
}
</style>
