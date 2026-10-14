<script setup lang="ts">
// FO-09 Batal Kunjungan (modal + audit)
const props = defineProps<{ modelValue: boolean; visit: any }>()
const emit = defineEmits(['update:modelValue', 'done'])
const { cancelVisit, patientOf, poli, doctor } = useDb()
const { user } = useAuth()
const toast = useToast()

const ALASAN = [
  { v: 'permintaan pasien', l: 'Permintaan pasien' },
  { v: 'kesalahan petugas', l: 'Kesalahan petugas' },
  { v: 'dokter tidak praktik', l: 'Dokter tidak praktik' },
  { v: 'lainnya', l: 'Lainnya' },
]
const PEMINTA = ['Pasien', 'Keluarga pasien', 'Petugas pendaftaran', 'Dokter / poli', 'Manajemen']
const f = reactive({ alasan: '', ket: '', peminta: 'Pasien' })
const err = ref('')
const pt = computed(() => (props.visit ? patientOf(props.visit) : null))

watch(() => props.modelValue, (v) => {
  if (v) { f.alasan = ''; f.ket = ''; f.peminta = 'Pasien'; err.value = '' }
})
const close = () => emit('update:modelValue', false)
const submit = () => {
  err.value = ''
  if (!f.alasan) { err.value = 'Alasan wajib dipilih'; return }
  if (f.ket.trim().length < 10) { err.value = 'Keterangan wajib minimal 10 karakter'; return }
  try {
    cancelVisit(props.visit.id, { alasan: f.alasan, ket: f.ket.trim(), peminta: f.peminta })
    toast.ok(`Kunjungan ${props.visit.noKunjungan} dibatalkan. Kuota dilepas, SEP dibatalkan.`)
    emit('done')
    close()
  } catch (e: any) {
    err.value = e.message || String(e)
    toast.err(err.value)
  }
}
</script>

<template>
  <AppModal :model-value="modelValue" title="Batalkan kunjungan" @update:model-value="close">
    <form v-if="visit" class="stack" style="gap: 14px" @submit.prevent="submit">
      <div class="alert warn">
        <span>
          <b>{{ pt?.nama }}</b> · {{ visit.noKunjungan }} · antrean {{ visit.antreanPoli.nomor }}<br />
          {{ poli(visit.poliId)?.nama }} · {{ doctor(visit.doctorId)?.nama }}. Hanya kunjungan berstatus terdaftar / menunggu poli yang dapat dibatalkan.
        </span>
      </div>
      <div class="field">
        <label class="req" for="cv-alasan">Alasan pembatalan</label>
        <select id="cv-alasan" v-model="f.alasan" class="select">
          <option value="" disabled>Pilih alasan</option>
          <option v-for="a in ALASAN" :key="a.v" :value="a.v">{{ a.l }}</option>
        </select>
      </div>
      <div class="field">
        <label class="req" for="cv-ket">Keterangan (min. 10 karakter)</label>
        <textarea id="cv-ket" v-model="f.ket" class="textarea" placeholder="Jelaskan alasan pembatalan" />
        <span class="hint">{{ f.ket.trim().length }} karakter</span>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="cv-minta">Pihak yang meminta</label>
          <select id="cv-minta" v-model="f.peminta" class="select"><option v-for="p in PEMINTA" :key="p" :value="p">{{ p }}</option></select>
        </div>
        <div class="field">
          <label for="cv-petugas">Petugas pembatal</label>
          <input id="cv-petugas" class="input" :value="user?.nama" disabled />
        </div>
      </div>
      <p v-if="err" class="err-text" role="alert">{{ err }}</p>
      <p class="hint" style="margin: 0">Pembatalan tercatat pada audit trail (MG-03 dan IT-06).</p>
      <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
    </form>
    <template #footer>
      <button class="btn" @click="close">Tutup</button>
      <button class="btn btn-solid-danger" @click="submit">Batalkan kunjungan</button>
    </template>
  </AppModal>
</template>
