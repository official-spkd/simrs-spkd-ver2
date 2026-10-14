<script setup lang="ts">
// KL-06 modal Tutup Kunjungan
const props = defineProps<{ modelValue: boolean; visitId: string }>()
const emit = defineEmits(['update:modelValue', 'closed'])
const { db, visit, getSoap, closeVisit } = useDb()
const toast = useToast()

const soap = computed(() => getSoap(props.visitId))
const tindakan = computed(() => (db.orders[props.visitId] || []).filter((o: any) => o.jenis === 'tindakan'))
const f = reactive({ kondisiPulang: 'membaik', caraPulang: 'pulang', tglKontrol: '' })
const err = ref('')
watch(() => props.modelValue, (o) => { if (o) { err.value = ''; f.tglKontrol = '' } })
const blokir = computed(() => (!soap.value.diagUtama ? 'Belum ada diagnosis utama. Isi di tab SOAP.' : !soap.value.signed ? 'SOAP belum ditandatangani. Tanda tangani di tab SOAP.' : ''))

const tutup = () => {
  err.value = ''
  if (f.caraPulang === 'kontrol ulang' && !f.tglKontrol) { err.value = 'Tanggal kontrol wajib diisi'; return }
  try {
    closeVisit(props.visitId, { ...f })
  } catch (e: any) { err.value = e.message; toast.err(e.message); return }
  toast.ok(f.caraPulang === 'kontrol ulang' ? 'Kunjungan ditutup — reservasi kontrol dibuat, tagihan dikirim ke kasir' : 'Kunjungan ditutup — tagihan dikirim ke kasir')
  emit('update:modelValue', false)
  emit('closed')
}
</script>

<template>
  <AppModal :model-value="modelValue" title="Tutup Kunjungan" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="blokir" class="alert err" style="margin-bottom:12px"><span>{{ blokir }}</span></div>
    <dl class="kv" style="margin-bottom:14px">
      <dt>Diagnosis utama</dt><dd>{{ soap.diagUtama ? soap.diagUtama.kode + ' — ' + soap.diagUtama.nama : '-' }}</dd>
      <dt>Diagnosis sekunder</dt><dd>{{ soap.diagSekunder.length ? soap.diagSekunder.map((d: any) => d.kode).join(', ') : '-' }}</dd>
      <dt>Tindakan</dt><dd>{{ tindakan.length ? tindakan.map((t: any) => t.nama + ' ×' + t.jumlah).join(', ') : '-' }}</dd>
      <dt>SOAP</dt><dd><StatusBadge :value="soap.signed ? 'final' : 'draf'" /> {{ soap.signed ? 'ditandatangani' : 'belum ditandatangani' }}</dd>
    </dl>
    <div class="form-grid">
      <div class="field"><label for="kp">Kondisi pulang</label>
        <select id="kp" v-model="f.kondisiPulang" class="select"><option>sembuh</option><option>membaik</option><option>tetap</option></select>
      </div>
      <div class="field"><label for="cp">Cara pulang</label>
        <select id="cp" v-model="f.caraPulang" class="select"><option value="pulang">Pulang</option><option value="kontrol ulang">Kontrol ulang</option><option value="rujuk RS lain">Rujuk RS lain</option><option value="rawat inap">Rawat inap</option></select>
      </div>
      <div v-if="f.caraPulang === 'kontrol ulang'" class="field full"><label class="req" for="tk">Tanggal kontrol</label><input id="tk" v-model="f.tglKontrol" class="input" type="date" :min="todayStr()"><span class="hint">Membuat reservasi otomatis (FO-08).</span></div>
    </div>
    <p v-if="err" class="err-text" style="margin-top:10px">{{ err }}</p>
    <div class="alert info" style="margin-top:12px"><span>SKDP tidak diterbitkan di MVP.</span></div>
    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Batal</button>
      <button class="btn btn-primary" :disabled="!!blokir" @click="tutup">Tutup kunjungan</button>
    </template>
  </AppModal>
</template>
