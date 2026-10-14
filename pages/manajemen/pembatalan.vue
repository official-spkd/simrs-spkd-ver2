<script setup lang="ts">
const { db, poli, patient } = useDb()
const toast = useToast()
const t = todayStr()
const dari = ref(addDays(t, -29))
const sampai = ref(t)

const rows = computed(() =>
  db.visits
    .filter((v: any) => v.status === 'dibatalkan' && v.pembatalan && v.tanggal >= dari.value && v.tanggal <= sampai.value)
    .map((v: any) => ({ v, p: patient(v.patientId), poli: poli(v.poliId) }))
    .sort((a: any, b: any) => (a.v.pembatalan.jam < b.v.pembatalan.jam ? 1 : -1)),
)
const cetak = () => window.print()
const ekspor = () => {
  if (!rows.value.length) return toast.warn('Tidak ada data untuk diekspor')
  const head = ['Tanggal', 'No. Kunjungan', 'Pasien', 'Poli', 'Alasan', 'Keterangan', 'Pihak peminta', 'Petugas pembatal', 'Jam']
  const body = rows.value.map((r: any) => [r.v.tanggal, r.v.noKunjungan, r.p?.nama, r.poli?.nama, r.v.pembatalan.alasan, r.v.pembatalan.ket, r.v.pembatalan.peminta, r.v.pembatalan.petugas, fmtJam(r.v.pembatalan.jam)])
  downloadCsv(`laporan-pembatalan-${dari.value}_${sampai.value}.csv`, [head, ...body])
  toast.ok(`Berkas CSV diunduh (${rows.value.length} baris)`)
}
</script>

<template>
  <div>
    <PageHead code="MG-03" role="Management" title="Laporan Pembatalan" subtitle="Kunjungan yang dibatalkan beserta alasan, pihak peminta, dan petugas. Setiap pembatalan tercatat di audit trail.">
      <template #actions>
        <button class="btn" @click="ekspor">Ekspor CSV</button>
        <button class="btn" @click="cetak">Cetak</button>
      </template>
    </PageHead>
    <div class="card">
      <div class="filters no-print">
        <div class="field"><label for="b-dari">Dari</label><input id="b-dari" v-model="dari" type="date" class="input" :max="sampai" /></div>
        <div class="field"><label for="b-sampai">Sampai</label><input id="b-sampai" v-model="sampai" type="date" class="input" :min="dari" /></div>
        <span class="muted small">{{ rows.length }} pembatalan</span>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Tanggal</th><th>Pasien</th><th>Poli</th><th>Alasan</th><th>Pihak peminta</th><th>Petugas pembatal</th><th>Jam</th><th class="no-print">Audit</th></tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="r.v.id">
              <td data-label="Tanggal">{{ fmtTgl(r.v.tanggal) }}</td>
              <td data-label="Pasien">{{ r.p?.nama }}<div class="muted small mono">{{ r.v.noKunjungan }}</div></td>
              <td data-label="Poli">{{ r.poli?.nama }}</td>
              <td data-label="Alasan"><b style="text-transform: capitalize">{{ r.v.pembatalan.alasan }}</b><div class="muted small">{{ r.v.pembatalan.ket }}</div></td>
              <td data-label="Pihak peminta">{{ r.v.pembatalan.peminta }}</td>
              <td data-label="Petugas pembatal">{{ r.v.pembatalan.petugas }}</td>
              <td data-label="Jam">{{ fmtJam(r.v.pembatalan.jam) }}</td>
              <td data-label="Audit" class="no-print"><NuxtLink class="btn btn-sm" :to="`/it/audit?q=${encodeURIComponent(r.v.noKunjungan)}`">Detail audit</NuxtLink></td>
            </tr>
            <tr v-if="!rows.length"><td colspan="8" class="empty">Tidak ada pembatalan pada periode ini</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
