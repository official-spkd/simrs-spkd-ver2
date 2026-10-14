<script setup lang="ts">
// Patient Banner: nama, No. RM, NIK, umur/JK, alergi, penjamin — tampil di semua halaman yang menyentuh satu pasien.
const props = defineProps<{ patient: any; visit?: any }>()
const penjamin = computed(() => props.visit?.penjamin || props.patient?.penjamin)
</script>
<template>
  <div v-if="patient" class="pbanner" :class="{ 'alert-al': patient.alergi }">
    <div>
      <div class="nm">{{ patient.nama }}</div>
      <div class="muted small">No. RM {{ patient.rm }}<template v-if="visit"> · {{ visit.noKunjungan }}</template></div>
    </div>
    <div class="f"><small>NIK</small><b>{{ maskNik(patient.nik) }}</b></div>
    <div class="f"><small>Umur / JK</small><b>{{ umur(patient.tglLahir) }} th / {{ patient.jk }}</b></div>
    <div class="f"><small>Penjamin</small><StatusBadge :value="penjamin" /></div>
    <div class="f"><small>Alergi</small><span v-if="patient.alergi" class="alergi-tag">{{ patient.alergi }}</span><b v-else class="muted">Tidak ada</b></div>
    <slot />
  </div>
</template>
