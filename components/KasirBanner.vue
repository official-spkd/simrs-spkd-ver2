<script setup lang="ts">
// Patient Banner kasir (KS-02..KS-04): avatar, identitas, kunjungan, penjamin, alergi.
const props = defineProps<{ patient: any; visit: any }>()
const { poli, doctor } = useDb()
const jk = computed(() => (props.patient.jk === 'L' ? 'Laki-laki' : 'Perempuan'))
</script>

<template>
  <div class="kbanner">
    <div class="kav">{{ inisial(patient.nama) }}</div>
    <div class="kinfo">
      <div class="nm">{{ patient.nama }}</div>
      <div class="muted small">RM {{ patient.rm }} · NIK {{ maskNik(patient.nik) }} · {{ umur(patient.tglLahir) }} tahun / {{ jk }}</div>
      <div class="muted small">{{ visit.noKunjungan }} · {{ fmtTgl(visit.tanggal) }} · {{ poli(visit.poliId).nama }} / {{ doctor(visit.doctorId).nama }}</div>
    </div>
    <div class="ktags">
      <span class="tag t-teal">Kunjungan: {{ visit.status }}</span>
      <span class="tag t-navy">Penjamin: {{ visit.penjamin }}</span>
      <span class="tag" :class="patient.alergi ? 't-err' : 't-navy'">Alergi: {{ patient.alergi || 'Tidak ada' }}</span>
    </div>
  </div>
</template>
