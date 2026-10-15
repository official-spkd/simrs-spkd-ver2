<script setup lang="ts">
// Patient Banner: inisial, nama, RM · NIK · umur/JK, episode kunjungan, status kunjungan/penjamin/alergi — tampil di semua halaman yang menyentuh satu pasien.
const props = defineProps<{ patient: any; visit?: any }>()
const { poli, doctor } = useDb()
const penjamin = computed(() => props.visit?.penjamin || props.patient?.penjamin)
const nikTersamar = computed(() => (props.patient?.nik ? props.patient.nik.slice(0, 4) + '••••••••' + props.patient.nik.slice(-4) : '-'))
const jk = computed(() => (props.patient?.jk === 'L' ? 'Laki-laki' : props.patient?.jk === 'P' ? 'Perempuan' : props.patient?.jk || '-'))
const episode = computed(() => {
  const v = props.visit
  if (!v) return ''
  const tgl = fmtTglPanjang(v.tanggal).replace(/^\w+, /, '')
  return `${v.noKunjungan}  •  ${tgl}  •  ${v.poliNama || poli(v.poliId)?.nama || '-'} / ${v.dokterNama || doctor(v.doctorId)?.nama || '-'}`
})
</script>
<template>
  <div v-if="patient" class="pbanner" :class="{ 'alert-al': patient.alergi }">
    <div class="pb-ini" aria-hidden="true">{{ inisial(patient.nama) }}</div>
    <div class="pb-main">
      <div class="nm">{{ patient.nama }}</div>
      <div class="pb-l1">RM {{ patient.rm }}  •  NIK {{ nikTersamar }}  •  {{ patient.tglLahir ? umur(patient.tglLahir) + ' tahun' : '-' }} / {{ jk }}</div>
      <div v-if="episode" class="pb-l2">{{ episode }}</div>
      <div v-if="$slots.default" class="pb-extra"><slot /></div>
    </div>
    <div class="pb-status">
      <span v-if="visit" class="badge" :class="visit.status === 'dilayani' ? 'b-teal' : visit.status === 'dibatalkan' ? 'b-err' : visit.status === 'terdaftar' ? 'b-navy' : 'b-ok'">Kunjungan: {{ visit.status }}</span>
      <span class="badge b-navy">Penjamin: {{ penjamin || '-' }}</span>
      <span class="badge" :class="patient.alergi ? 'b-err' : 'b-mute'">Alergi: {{ patient.alergi || 'tidak ada' }}</span>
    </div>
  </div>
</template>
