<script setup lang="ts">
// KS-01 Worklist Tagihan
const { db, tagihanList, patient, poli, billTotals } = useDb()

const tab = ref('siap')
const q = ref('')
const list = computed(() => tagihanList())
const match = (v: any) => {
  const s = q.value.trim().toLowerCase()
  if (!s) return true
  const p = patient(v.patientId)
  return p.nama.toLowerCase().includes(s) || p.rm.includes(s) || v.noKunjungan.toLowerCase().includes(s)
}
const siap = computed(() => list.value.filter((v: any) => v.status === 'selesai'))
const menunggu = computed(() => list.value.filter((v: any) => ['terdaftar', 'dilayani'].includes(v.status)))
const lunas = computed(() => list.value.filter((v: any) => v.status === 'lunas'))
const TABS = computed(() => [
  { key: 'siap', label: `Siap bayar (${siap.value.length})` },
  { key: 'menunggu', label: `Menunggu klinis (${menunggu.value.length})` },
  { key: 'lunas', label: `Lunas hari ini (${lunas.value.length})` },
])
const rows = computed(() => (tab.value === 'siap' ? siap.value : tab.value === 'menunggu' ? menunggu.value : lunas.value).filter(match).sort((a: any, b: any) => (a.noKunjungan > b.noKunjungan ? 1 : -1)))
const total = (v: any) => billTotals(v.id).net
const buka = (v: any) => navigateTo('/kasir/' + v.id)
</script>

<template>
  <div>
    <PageHead code="KS-01" role="Kasir" title="Worklist Tagihan" subtitle="Tagihan kunjungan hari ini. Hanya kunjungan berstatus selesai yang dapat difinalkan." :crumbs="['Kasir', 'Worklist tagihan']" />
    <div class="card">
      <div class="filters">
        <div class="field" style="flex:1;min-width:220px"><label for="k-q">Cari pasien</label><input id="k-q" v-model="q" class="input" style="width:100%" placeholder="Nama, No. RM, atau No. kunjungan"></div>
      </div>
      <AppTabs v-model="tab" :tabs="TABS" />
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>No. kunjungan</th><th>Pasien</th><th>Poli</th><th>Penjamin</th><th class="right">{{ tab === 'menunggu' ? 'Total sementara' : 'Total' }}</th><th>Jam selesai</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="8">Tidak ada data.</td></tr>
            <tr v-for="v in rows" :key="v.id" class="click" @click="buka(v)">
              <td data-label="No. kunjungan" class="mono">{{ v.noKunjungan }}</td>
              <td data-label="Pasien"><b>{{ patient(v.patientId).nama }}</b><div class="muted small">{{ patient(v.patientId).rm }}</div></td>
              <td data-label="Poli">{{ poli(v.poliId).nama }}</td>
              <td data-label="Penjamin"><StatusBadge :value="v.penjamin" /></td>
              <td data-label="Total" class="right bold">{{ fmtRp(total(v)) }}</td>
              <td data-label="Jam selesai">{{ fmtJam(v.jamSelesai) }}</td>
              <td data-label="Status"><StatusBadge :value="v.status" /></td>
              <td class="right" @click.stop><button class="btn btn-sm" :class="tab === 'siap' ? 'btn-primary' : ''" @click="buka(v)">{{ tab === 'siap' ? 'Buka tagihan' : tab === 'menunggu' ? 'Lihat sementara' : 'Lihat' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="tab === 'menunggu'" class="hint">Pasien masih di poli: tagihan dapat dibuka namun finalisasi diblokir sampai kunjungan selesai.</p>
    </div>
  </div>
</template>
