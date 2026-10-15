<script setup lang="ts">
// KL-06 Tutup Kunjungan
const props = defineProps<{ modelValue: boolean; visitId: string }>()
const emit = defineEmits(['update:modelValue', 'closed'])
const { db, visit, patient, getSoap, closeVisit, doctorsOfPoli, poli } = useDb()
const toast = useToast()

const v = computed(() => visit(props.visitId))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const soap = computed(() => getSoap(props.visitId))
const orders = computed(() => db.orders[props.visitId] || [])
const tindakan = computed(() => orders.value.filter((o: any) => o.jenis === 'tindakan'))
const resep = computed(() => orders.value.filter((o: any) => o.jenis === 'resep'))
const f = reactive({ kondisiPulang: 'membaik', caraPulang: 'pulang', tglKontrol: '', doctorIdKontrol: '' })
const err = ref('')
watch(() => props.modelValue, (o) => {
  if (!o) return
  err.value = ''
  f.caraPulang = soap.value.tindakLanjut === 'kontrol' ? 'kontrol ulang' : soap.value.tindakLanjut === 'rawat inap' || soap.value.tindakLanjut === 'ICU' ? 'rawat inap' : 'pulang'
  f.tglKontrol = ''; f.doctorIdKontrol = ''
})
const blokir = computed(() => (!soap.value.diagUtama ? 'Belum ada diagnosis utama. Isi di tab SOAP.' : !soap.value.signed ? 'SOAP belum ditandatangani. Tanda tangani di tab SOAP.' : ''))

// sesi reservasi kontrol: dokter poli yang sama yang praktik pada tanggal kontrol (kuota satu sumber dengan loket/APM/reservasi)
const sesi = computed(() => (f.tglKontrol && v.value ? doctorsOfPoli(v.value.poliId, f.tglKontrol) : []))
watch(sesi, (list) => {
  if (!list.some((d: any) => d.id === f.doctorIdKontrol)) f.doctorIdKontrol = (list.find((d: any) => d.id === v.value?.doctorId && d.sesi.sisa > 0) || list.find((d: any) => d.sesi.sisa > 0))?.id || ''
})
const labelSesi = (d: any) => `${poli(d.poliId)?.kode} · ${d.nama} · ${d.sesi.mulai.replace(':', '.')}–${d.sesi.selesai.replace(':', '.')} · ${d.sesi.cuti && !d.sesi.cuti.penggantiId ? 'cuti' : 'sisa ' + d.sesi.sisa}`

const tutup = () => {
  err.value = ''
  if (f.caraPulang === 'kontrol ulang') {
    if (!f.tglKontrol) { err.value = 'Tanggal kontrol wajib diisi'; return }
    if (!f.doctorIdKontrol) { err.value = 'Tidak ada sesi praktik dengan kuota tersisa pada tanggal kontrol'; return }
  }
  try {
    closeVisit(props.visitId, { ...f })
  } catch (e: any) { err.value = e.message; toast.err(e.message); return }
  toast.ok(f.caraPulang === 'kontrol ulang' ? 'Kunjungan ditutup — reservasi kontrol dibuat, tagihan dikirim ke kasir' : 'Kunjungan ditutup — tagihan dikirim ke kasir')
  emit('update:modelValue', false)
  emit('closed')
}
</script>

<template>
  <AppModal :model-value="modelValue" code="KL-06 · KLINIS" title="Tutup Kunjungan" subtitle="Pastikan dokumentasi lengkap sebelum menyerahkan pasien ke kasir." size="xl" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="v && pt" class="kl-col" style="gap: 20px">
      <PatientBanner :patient="pt" :visit="v" style="margin: 0; box-shadow: none" />

      <div class="kl-actions" style="gap: 16px">
        <span class="badge" :class="soap.signed ? 'b-ok' : 'b-err'">{{ soap.signed ? '✓ SOAP ditandatangani · ' + fmtJam(soap.signedAt) : '✕ SOAP belum ditandatangani' }}</span>
        <span class="badge" :class="soap.diagUtama ? 'b-ok' : 'b-err'">{{ soap.diagUtama ? '✓ Diagnosis utama lengkap' : '✕ Diagnosis utama kosong' }}</span>
      </div>
      <div v-if="blokir" class="guide err">{{ blokir }}</div>

      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Ringkasan</th><th>Detail</th></tr></thead>
          <tbody>
            <tr><td data-label="Ringkasan">Diagnosis utama</td><td data-label="Detail" style="color: var(--teal-d)">{{ soap.diagUtama ? soap.diagUtama.kode + ' · ' + soap.diagUtama.nama : '-' }}</td></tr>
            <tr v-if="soap.diagSekunder.length"><td data-label="Ringkasan">Diagnosis sekunder</td><td data-label="Detail" style="color: var(--teal-d)">{{ soap.diagSekunder.map((d: any) => d.kode + ' · ' + d.nama).join(', ') }}</td></tr>
            <tr><td data-label="Ringkasan">Tindakan</td><td data-label="Detail" style="color: var(--teal-d)">{{ tindakan.length ? tindakan.map((t: any) => t.nama + ' · ' + t.jumlah).join(', ') : '-' }}</td></tr>
            <tr><td data-label="Ringkasan">Resep</td><td data-label="Detail" style="color: var(--teal-d)">{{ resep.length ? resep.map((o: any) => [o.nama, o.jumlah, o.aturan].filter(Boolean).join(' · ')).join(', ') : '-' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="form-grid">
        <div class="field"><label class="req" for="kp">Kondisi pulang</label>
          <select id="kp" v-model="f.kondisiPulang" class="select"><option value="sembuh">Sembuh</option><option value="membaik">Membaik</option><option value="tetap">Tetap</option></select>
        </div>
        <div class="field"><label class="req" for="cp">Cara pulang</label>
          <select id="cp" v-model="f.caraPulang" class="select"><option value="pulang">Pulang</option><option value="kontrol ulang">Kontrol ulang</option><option value="rujuk RS lain">Rujuk RS lain</option><option value="rawat inap">Rawat inap</option></select>
        </div>
      </div>
      <p class="hint" style="margin: -8px 0 0">Cara pulang: pulang / kontrol ulang / rujuk RS lain / rawat inap (hanya dicatat pada MVP).</p>

      <div v-if="f.caraPulang === 'kontrol ulang'" class="form-grid">
        <div class="field"><label class="req" for="tk">Tanggal kontrol</label><input id="tk" v-model="f.tglKontrol" class="input" type="date" :min="addDays(todayStr(), 1)" :max="addDays(todayStr(), 30)"></div>
        <div class="field"><label for="sk">Sesi reservasi kontrol</label>
          <select id="sk" v-model="f.doctorIdKontrol" class="select" :disabled="!sesi.length">
            <option v-if="!f.tglKontrol" value="">Pilih tanggal kontrol dahulu</option>
            <option v-else-if="!sesi.length" value="">Tidak ada praktik pada tanggal ini</option>
            <option v-for="d in sesi" :key="d.id" :value="d.id" :disabled="d.sesi.sisa <= 0">{{ labelSesi(d) }}</option>
          </select>
        </div>
      </div>

      <p v-if="err" class="err-text">{{ err }}</p>
      <div v-if="f.caraPulang === 'kontrol ulang'" class="guide"><AppIcon name="info" :size="18" /> Tanggal kontrol membuat reservasi di FO-08. Surat kontrol / SKDP tidak diterbitkan otomatis di MVP.</div>
      <div class="guide"><AppIcon name="info" :size="18" /> Kunjungan berubah dilayani → selesai. Tagihan diteruskan ke worklist kasir dan Encounter masuk antrean Satu Sehat. SOAP belum ditandatangani atau diagnosis utama kosong akan memblokir penutupan.</div>
    </div>
    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Batal</button>
      <button class="btn btn-primary" :disabled="!!blokir" @click="tutup">Tutup kunjungan</button>
    </template>
  </AppModal>
</template>
