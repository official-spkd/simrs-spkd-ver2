<script setup lang="ts">
// KS-01 Worklist Tagihan
const { db, patient, poli, billTotals } = useDb()
const { user } = useAuth()
const toast = useToast()

const tab = ref('siap')
const q = ref('')
const fPoli = ref('')
const fPenjamin = ref('')
const tgl = ref(todayStr())

const list = computed(() => db.visits.filter((v: any) => v.status !== 'dibatalkan' && v.tanggal === tgl.value))
const match = (v: any) => {
  const s = q.value.trim().toLowerCase()
  const p = patient(v.patientId)
  if (fPoli.value && v.poliId !== fPoli.value) return false
  if (fPenjamin.value && v.penjamin !== fPenjamin.value) return false
  return !s || p.nama.toLowerCase().includes(s) || p.rm.includes(s) || v.noKunjungan.toLowerCase().includes(s)
}
const siap = computed(() => list.value.filter((v: any) => v.status === 'selesai'))
const menunggu = computed(() => list.value.filter((v: any) => ['terdaftar', 'dilayani'].includes(v.status)))
const lunas = computed(() => list.value.filter((v: any) => v.status === 'lunas'))
const terdaftar = computed(() => menunggu.value.filter((v: any) => v.status === 'terdaftar').length)
const penerimaan = computed(() => lunas.value.reduce((s: number, v: any) => s + (db.bills[v.id]?.payments || []).reduce((a: number, p: any) => a + p.jumlah, 0), 0))
const TABS = computed(() => [
  { key: 'siap', label: `Siap bayar (${siap.value.length})` },
  { key: 'menunggu', label: `Menunggu klinis (${menunggu.value.length})` },
  { key: 'lunas', label: `Lunas hari ini (${lunas.value.length})` },
])
const JUDUL: Record<string, string> = { siap: 'Kunjungan selesai · Siap ditagihkan', menunggu: 'Kunjungan masih di poli · Menunggu klinis', lunas: 'Tagihan lunas hari ini' }
const rows = computed(() => (tab.value === 'siap' ? siap.value : tab.value === 'menunggu' ? menunggu.value : lunas.value).filter(match).sort((a: any, b: any) => (a.noKunjungan > b.noKunjungan ? -1 : 1)))
const total = (v: any) => billTotals(v.id).net
const tagihan = (v: any) => { const b = db.bills[v.id]; return !b || b.status === 'draf' ? 'Draf' : b.status === 'final' ? 'Final · INV' : 'Lunas' }
const totalRows = computed(() => rows.value.reduce((s: number, v: any) => s + total(v), 0))
const buka = (v: any) => navigateTo('/kasir/' + v.id)
const pertama = computed(() => rows.value[0])
const segarkan = () => toast.ok('Daftar tagihan disegarkan')
</script>

<template>
  <div>
    <PageHead code="KS-01" role="Kasir" title="Worklist Tagihan" :subtitle="`Tagihan dari pelayanan rawat jalan · ${user?.unit || 'Kasir'} · ${user?.nama || ''}`" />

    <div class="grid g3" style="margin-bottom: 16px">
      <div class="kpi"><small>Siap bayar</small><b>{{ siap.length }}</b><span>Kunjungan selesai · siap finalisasi</span></div>
      <div class="kpi"><small>Menunggu klinis</small><b>{{ menunggu.length }}</b><span>{{ terdaftar }} terdaftar · {{ menunggu.length - terdaftar }} dilayani</span></div>
      <div class="kpi"><small>Lunas hari ini</small><b>{{ lunas.length }}</b><span>Penerimaan {{ fmtRp(penerimaan) }}</span></div>
    </div>

    <AppTabs v-model="tab" :tabs="TABS" />

    <div class="filters">
      <input v-model="q" class="input" style="min-width: 240px" placeholder="Nama / RM / ID kunjungan" aria-label="Cari pasien">
      <select v-model="fPoli" class="select" aria-label="Filter poli"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
      <select v-model="fPenjamin" class="select" aria-label="Filter penjamin"><option value="">Semua penjamin</option><option>Umum</option><option>BPJS</option><option>Asuransi</option></select>
      <input v-model="tgl" type="date" class="input" aria-label="Tanggal">
      <button class="btn" @click="segarkan">Segarkan</button>
    </div>

    <div class="card">
      <h2>{{ JUDUL[tab] }}</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>ID kunjungan</th><th>Pasien / RM</th><th>Poli</th><th>Penjamin</th><th>Tagihan</th><th>Total sementara</th><th>Selesai</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="8">Tidak ada data.</td></tr>
            <tr v-for="(v, i) in rows" :key="v.id" class="click" :class="{ 'row-hl': i === 0 }" @click="buka(v)">
              <td data-label="ID kunjungan" class="mono">{{ v.noKunjungan }}</td>
              <td data-label="Pasien / RM"><b style="font-weight: 500">{{ patient(v.patientId).nama }}</b><div>{{ patient(v.patientId).rm }}</div></td>
              <td data-label="Poli">{{ poli(v.poliId).nama }}</td>
              <td data-label="Penjamin"><StatusBadge :value="v.penjamin" /></td>
              <td data-label="Tagihan"><StatusBadge v-if="tagihan(v) === 'Draf'" value="draf" /><template v-else>{{ tagihan(v) }}</template></td>
              <td data-label="Total sementara">{{ fmtRp(total(v)) }}</td>
              <td data-label="Selesai">{{ fmtJam(v.jamSelesai) }}</td>
              <td data-label="Aksi" @click.stop><a href="#" @click.prevent="buka(v)">{{ tab === 'menunggu' ? 'Lihat sementara' : 'Buka tagihan' }}</a></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="muted" style="margin-top: 14px">{{ rows.length }} kunjungan {{ tab === 'siap' ? 'siap bayar' : tab === 'menunggu' ? 'menunggu klinis' : 'lunas' }} · Total {{ tab === 'siap' ? 'sementara ' : '' }}{{ fmtRp(totalRows) }} · Porsi penjamin dihitung di detail tagihan.</p>
    </div>

    <div class="alert" style="margin-top: 16px"><span>Hanya kunjungan selesai yang dapat difinalisasi. Total draf masih sementara; finalisasi membekukan item dan menerbitkan INV. Gangguan SEP tidak menghalangi pelayanan lokal.</span></div>

    <div class="row" style="margin-top: 16px">
      <button class="btn btn-primary" :disabled="!pertama" @click="pertama && buka(pertama)">Buka tagihan {{ pertama ? patient(pertama.patientId).nama : '' }}</button>
      <NuxtLink to="/kasir/shift" class="btn">Rekap shift</NuxtLink>
    </div>
  </div>
</template>
