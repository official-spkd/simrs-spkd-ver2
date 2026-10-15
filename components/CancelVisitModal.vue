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
  { v: 'dokter tidak praktik', l: 'Dokter tidak hadir' },
  { v: 'lainnya', l: 'Lainnya' },
]
const PEMINTA = ['Pasien', 'Keluarga pasien', 'Petugas pendaftaran', 'Dokter / poli', 'Manajemen']
const f = reactive({ alasan: '', ket: '', peminta: 'Pasien' })
const err = ref('')
const waktu = ref(new Date().toISOString())
const isBpjs = computed(() => props.visit?.penjamin === 'BPJS')
const pt = computed(() => (props.visit ? patientOf(props.visit) : null))

watch(() => props.modelValue, (v) => {
  if (v) { waktu.value = new Date().toISOString(); f.alasan = ''; f.ket = ''; f.peminta = 'Pasien'; err.value = '' }
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
  <AppModal :model-value="modelValue" title="Batal Kunjungan & Antrean BPJS" code="FO-09 · FRONT OFFICE / ADMIN" size="xl" @update:model-value="close">
    <form v-if="visit" class="stack" style="gap: 20px" @submit.prevent="submit">
      <div class="panel">
        <h2>{{ pt?.nama }} · RM {{ pt?.rm }}</h2>
        <p style="font-size: 14px">{{ visit.noKunjungan }} · {{ visit.antreanPoli?.nomor }} · {{ poli(visit.poliId)?.nama }} · {{ doctor(visit.doctorId)?.nama }} · {{ fmtTgl(visit.tanggal) }}</p>
        <div class="row" style="gap: 16px">
          <StatusBadge :value="visit.status" />
          <span class="badge b-navy">Penjamin: {{ visit.penjamin }}</span>
          <span class="badge b-navy">SEP: {{ visit.sep ? visit.sep.status : 'tidak diperlukan' }}</span>
        </div>
      </div>
      <div class="field">
        <label class="req" for="cv-alasan">Alasan pembatalan</label>
        <select id="cv-alasan" v-model="f.alasan" class="select">
          <option value="" disabled>Pilih alasan</option>
          <option v-for="a in ALASAN" :key="a.v" :value="a.v">{{ a.l }}</option>
        </select>
        <span class="hint">Pilihan: Permintaan pasien / Kesalahan petugas / Dokter tidak hadir / Lainnya</span>
      </div>
      <div class="field">
        <label class="req" for="cv-ket">Penjelasan · minimal 10 karakter</label>
        <textarea id="cv-ket" v-model="f.ket" class="textarea" placeholder="Jelaskan alasan pembatalan" />
        <span class="hint">{{ f.ket.trim().length }} karakter<template v-if="f.ket.trim().length >= 10"> · Valid ✓</template></span>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="cv-minta">Pihak pemohon</label>
          <select id="cv-minta" v-model="f.peminta" class="select"><option v-for="p in PEMINTA" :key="p" :value="p">{{ p }}</option></select>
        </div>
        <div class="field">
          <label for="cv-petugas">Petugas pembatal · otomatis</label>
          <input id="cv-petugas" class="input" :value="`${user?.nama || ''} · ${fmtWaktu(waktu)}`" disabled />
        </div>
      </div>
      <div class="guide warn">Pembatalan melepaskan kuota dan alokasi SEP bila ada. Kunjungan menjadi dibatalkan, tidak dihapus. Alasan, pemohon, petugas, dan waktu tersimpan pada audit trail (MG-03 dan IT-06).</div>
      <div class="panel" style="padding: 16px; gap: 12px; border-radius: 8px; box-shadow: none">
        <h3>Pembatalan antrean BPJS</h3>
        <div class="row" style="background: var(--bg, #f3f6f8); border-radius: 8px; padding: 12px; opacity: .5; flex-wrap: nowrap">
          <input type="radio" disabled aria-label="Kirim API Batal ke BPJS" />
          <div>
            <div class="bold" style="font-size: 13px">Kirim API Batal ke BPJS</div>
            <div class="muted small">{{ isBpjs ? 'Simulasi, tidak ada pengiriman aktif.' : 'Tidak tersedia untuk penjamin ' + visit.penjamin + ' · hanya untuk kunjungan BPJS dengan booking aktif.' }}</div>
          </div>
        </div>
        <div class="form-grid">
          <div class="field"><label for="cv-resp">Status respons pembatalan</label><input id="cv-resp" class="input" :value="isBpjs ? 'Belum dikirim · simulasi' : 'Tidak berlaku · penjamin ' + visit.penjamin" disabled /></div>
          <div class="field"><label for="cv-book">Kode booking 10 digit</label><input id="cv-book" class="input" value="—" disabled /></div>
        </div>
        <p class="muted" style="font-size: 12px">Untuk BPJS: Batalkan Antrean → kirim API pembatalan BPJS → lepas kuota dokter → catat log audit. Simulasi, tidak ada pengiriman aktif.</p>
      </div>
      <p class="muted" style="font-size: 13px; margin: 0">Hanya kunjungan terdaftar / menunggu poli yang dapat dibatalkan. Kunjungan dilayani, selesai, atau lunas tidak menyediakan aksi pembatalan.</p>
      <p v-if="err" class="err-text" role="alert">{{ err }}</p>
      <button type="submit" class="hidden" aria-hidden="true" tabindex="-1" />
    </form>
    <template #footer>
      <button class="btn" @click="close">Tutup</button>
      <button class="btn btn-solid-danger" @click="submit">Batalkan kunjungan</button>
    </template>
  </AppModal>
</template>
