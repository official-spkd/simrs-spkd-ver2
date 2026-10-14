<script setup>
/** FRS-02 · Farmasi — Telaah Resep */
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PageHeader, UiButton, UiBadge, UiAlert, UiCard, UiModal, DataTable, FormField } from '@/components/ui'
import PatientBanner from './parts-a/PatientBanner.vue'
import CheckList from './parts-a/CheckList.vue'
import { pasienResep, itemResep, evaluasiTelaah, labTerkait } from '../data-a'

const router = useRouter()

const kolom = [
  { key: 'obat', label: 'Obat', strong: true },
  { key: 'jumlah', label: 'Jumlah' },
  { key: 'aturan', label: 'Aturan pakai' },
  { key: 'durasi', label: 'Durasi' },
]
const terpilih = ref(itemResep[0].id)
const evaluasi = reactive(evaluasiTelaah.map((e) => ({ ...e })))
const catatan = ref('Resep dapat diproses setelah telaah klinis.')
const hasil = ref(null)
const disetujui = ref(false)

function setuju() {
  const belum = evaluasi.filter((e) => !e.done).map((e) => e.label)
  if (belum.length) {
    hasil.value = { tone: 'warning', title: 'Evaluasi belum lengkap', text: `Belum dicentang: ${belum.join(', ')}.` }
    return
  }
  disetujui.value = true
  hasil.value = { tone: 'success', title: 'Telaah disetujui', text: 'Resep RX-DEMO-007 diteruskan ke komposisi obat.' }
}

/* ---------- Dialog tanya dokter ---------- */
const modalOpen = ref(false)
const pertanyaan = ref('')
const errTanya = ref('')

function bukaTanya() {
  pertanyaan.value = ''
  errTanya.value = ''
  modalOpen.value = true
}
function kirimTanya() {
  if (!pertanyaan.value.trim()) {
    errTanya.value = 'Pertanyaan wajib diisi.'
    return
  }
  modalOpen.value = false
  hasil.value = { tone: 'info', title: 'Pertanyaan terkirim ke dr. Andi', text: pertanyaan.value.trim() }
}
</script>

<template>
  <div class="page">
    <PageHeader />

    <PatientBanner :pasien="pasienResep" />

    <UiAlert v-if="hasil" :tone="hasil.tone" :title="hasil.title" :text="hasil.text">
      <template v-if="disetujui" #actions>
        <UiButton size="sm" variant="primary" @click="router.push('/farmasi/komposisi-obat')">Lanjut komposisi</UiButton>
      </template>
    </UiAlert>

    <div class="row telaah">
      <div class="stack grow telaah__main">
        <DataTable
          v-model:selected="terpilih"
          title="Resep RX-DEMO-007 · dr. Andi"
          :columns="kolom"
          :rows="itemResep"
          selectable
          export-name="resep-rx-demo-007"
        />

        <UiCard title="Evaluasi dosis & duplikasi">
          <CheckList :items="evaluasi" />
          <p class="t-sm">{{ labTerkait }}</p>
        </UiCard>
      </div>

      <div class="stack telaah__side">
        <UiAlert
          tone="danger"
          title="Alergi PENISILIN"
          text="Riwayat ruam terkonfirmasi. Tidak ada penisilin pada resep ini; furosemid bukan penisilin."
        />
        <UiAlert
          tone="warning"
          title="Pantau tekanan darah & elektrolit"
          text="Terapi diuretik: kaji kebutuhan pemantauan dan risiko hipotensi. Peringatan bukan pengganti telaah apoteker."
        />
        <UiCard title="Hasil telaah">
          <UiBadge tone="success" class="self-start">Interaksi berat: tidak ditemukan</UiBadge>
          <p class="telaah__teks">Pengkajian dilakukan Apt. Ratna. Edukasi waktu minum pagi disiapkan.</p>
          <FormField label="Catatan telaah">
            <input v-model="catatan" class="input" />
          </FormField>
          <div class="row">
            <UiButton variant="primary" :disabled="disetujui" @click="setuju">{{ disetujui ? 'Disetujui' : 'Setuju' }}</UiButton>
            <UiButton @click="bukaTanya">Tanya Dokter</UiButton>
          </div>
        </UiCard>
      </div>
    </div>

    <UiModal v-model:open="modalOpen" title="Tanya Dokter" subtitle="Konfirmasi resep RX-DEMO-007 kepada dr. Andi." width="520px">
      <FormField label="Pertanyaan" required :error="errTanya">
        <textarea v-model="pertanyaan" class="textarea" :class="{ 'input--error': errTanya }" placeholder="Tulis pertanyaan klinis" />
      </FormField>
      <template #footer>
        <UiButton @click="modalOpen = false">Batal</UiButton>
        <UiButton variant="primary" @click="kirimTanya">Kirim</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.telaah__main { min-width: 0; }
.telaah__side { width: 390px; flex-shrink: 0; }
.telaah__teks { font-size: 14px; }
.self-start { align-self: flex-start; }
@media (max-width: 1100px) {
  .telaah { flex-direction: column; }
  .telaah__main, .telaah__side { width: 100%; }
}
</style>
