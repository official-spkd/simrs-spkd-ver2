<script setup lang="ts">
// KL-08 Riwayat Kunjungan Pasien (baca saja)
const props = defineProps<{ visitId: string }>()
const { db, visit, poli, doctor } = useDb()

const list = computed(() => {
  const v = visit(props.visitId)
  return db.visits
    .filter((x: any) => x.patientId === v.patientId && x.id !== props.visitId && x.status !== 'dibatalkan')
    .sort((a: any, b: any) => (a.jamDaftar < b.jamDaftar ? 1 : -1))
})
const open = ref<string | null>(null)
const soapOf = (id: string) => db.soap[id]
</script>

<template>
  <div class="card">
    <h2>Riwayat kunjungan pasien</h2>
    <div v-if="!list.length" class="muted">Belum ada kunjungan terdahulu.</div>
    <div v-else class="timeline">
      <div v-for="x in list" :key="x.id">
        <div class="row between">
          <div>
            <div class="bold">{{ fmtTgl(x.tanggal) }} · {{ poli(x.poliId).nama }}</div>
            <div class="muted small">{{ doctor(x.doctorId).nama }} · {{ x.noKunjungan }}</div>
          </div>
          <StatusBadge :value="x.status" />
        </div>
        <div style="margin-top:4px">
          <template v-if="soapOf(x.id)?.diagUtama"><b>{{ soapOf(x.id).diagUtama.kode }}</b> {{ soapOf(x.id).diagUtama.nama }}</template>
          <span v-else class="muted">Diagnosis belum tercatat</span>
        </div>
        <button v-if="soapOf(x.id)" class="btn btn-sm btn-ghost" style="margin-top:4px" @click="open = open === x.id ? null : x.id">{{ open === x.id ? 'Sembunyikan SOAP' : 'Lihat SOAP' }}</button>
        <div v-if="open === x.id && soapOf(x.id)" class="alert info" style="margin-top:6px;display:block">
          <dl class="kv">
            <dt>S</dt><dd>{{ soapOf(x.id).s || '-' }}</dd>
            <dt>O</dt><dd>{{ soapOf(x.id).fisik || '-' }}</dd>
            <dt>A</dt><dd>{{ soapOf(x.id).asesmen || '-' }}</dd>
            <dt>P</dt><dd>{{ soapOf(x.id).p || '-' }}</dd>
            <dt>Lampiran</dt><dd>{{ soapOf(x.id).lampiran?.length ? soapOf(x.id).lampiran.map((l: any) => l.nama).join(', ') : '-' }}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
