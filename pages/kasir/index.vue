<script setup lang="ts">
// KS-01 Worklist Tagihan
const { db, patient, poli, billTotals } = useDb()
const { user } = useAuth()
const toast = useToast()

const tanggal = ref(todayStr())
const { siap, terdaftar, dilayani, menunggu, lunas, totalSementara, penerimaan, shift } = useKasir(tanggal)

const tab = ref<'siap' | 'menunggu' | 'lunas'>('siap')
const TABS = computed(() => [
  { key: 'siap', label: `Siap bayar (${siap.value.length})` },
  { key: 'menunggu', label: `Menunggu klinis (${menunggu.value.length})` },
  { key: 'lunas', label: `Lunas hari ini (${lunas.value.length})` },
])
const JUDUL: Record<string, string> = { siap: 'Kunjungan selesai · Siap ditagihkan', menunggu: 'Masih di poli · Menunggu klinis', lunas: 'Pembayaran lunas hari ini' }

// filter
const q = ref('')
const poliId = ref('')
const penjamin = ref('')
const cocok = (v: any) => {
  if (poliId.value && v.poliId !== poliId.value) return false
  if (penjamin.value && v.penjamin !== penjamin.value) return false
  const s = q.value.trim().toLowerCase()
  if (!s) return true
  const p = patient(v.patientId)
  return p?.nama.toLowerCase().includes(s) || p?.rm.includes(s) || v.noKunjungan.toLowerCase().includes(s)
}
const rows = computed(() => (tab.value === 'siap' ? siap.value : tab.value === 'menunggu' ? menunggu.value : lunas.value)
  .filter(cocok).slice().sort((a: any, b: any) => ((b.jamSelesai || b.jamDaftar) > (a.jamSelesai || a.jamDaftar) ? 1 : -1)))

// baris terpilih → tombol "Buka tagihan {nama}"
const selId = ref('')
const sel = computed(() => rows.value.find((v: any) => v.id === selId.value) || rows.value[0] || null)
const buka = (v: any) => navigateTo('/kasir/' + v.id)
const segarkan = () => { tanggal.value = tanggal.value || todayStr(); toast.ok('Worklist diperbarui') }
const jamShift = computed(() => (shift.value ? `${fmtJam(shift.value.mulai)}–${shift.value.selesai ? fmtJam(shift.value.selesai) : 'sekarang'}` : 'belum ada shift terbuka'))
</script>

<template>
  <div>
    <PageHead code="KS-01" role="Kasir" title="Worklist Tagihan" :subtitle="`Tagihan dari pelayanan rawat jalan · Shift ${shift?.kasir || user?.nama} · ${jamShift}`" />

    <div class="grid g3" style="margin-bottom: 16px">
      <div class="kl-kpi"><small>Siap bayar</small><b>{{ siap.length }}</b><span>Kunjungan selesai · siap finalisasi</span></div>
      <div class="kl-kpi"><small>Menunggu klinis</small><b>{{ menunggu.length }}</b><span>{{ terdaftar.length }} terdaftar · {{ dilayani.length }} dilayani</span></div>
      <div class="kl-kpi"><small>Lunas hari ini</small><b>{{ lunas.length }}</b><span>Penerimaan {{ fmtRp(penerimaan) }}</span></div>
    </div>

    <AppTabs v-model="tab" :tabs="TABS" />

    <div class="kl-filters">
      <input v-model="q" class="input q" placeholder="⌕ Nama / RM / ID kunjungan" aria-label="Cari nama, RM, atau ID kunjungan">
      <select v-model="poliId" class="select" aria-label="Poli"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
      <select v-model="penjamin" class="select" aria-label="Penjamin"><option value="">Semua penjamin</option><option>Umum</option><option>BPJS</option><option>Asuransi</option></select>
      <input v-model="tanggal" class="input" type="date" aria-label="Tanggal">
      <button class="btn" @click="segarkan">Segarkan</button>
    </div>

    <div class="panel">
      <h2>{{ JUDUL[tab] }}</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>ID kunjungan</th><th>Pasien / RM</th><th>Poli</th><th>Penjamin</th><th>Tagihan</th><th>{{ tab === 'lunas' ? 'Total' : 'Total sementara' }}</th><th>Selesai</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="8">Tidak ada data.</td></tr>
            <tr v-for="v in rows" :key="v.id" class="click" :class="{ sel: sel?.id === v.id }" tabindex="0" @click="selId = v.id" @dblclick="buka(v)" @keydown.enter="buka(v)">
              <td data-label="ID kunjungan">{{ v.noKunjungan }}</td>
              <td data-label="Pasien / RM">{{ patient(v.patientId).nama }}<div>{{ patient(v.patientId).rm }}</div></td>
              <td data-label="Poli">{{ poli(v.poliId)?.nama }}</td>
              <td data-label="Penjamin"><span class="badge b-navy">{{ v.penjamin }}</span></td>
              <td data-label="Tagihan"><span class="badge" :class="statusTagihan(db.bills[v.id]).cls">{{ statusTagihan(db.bills[v.id]).label }}</span></td>
              <td data-label="Total">{{ fmtRp(billTotals(v.id).net) }}</td>
              <td data-label="Selesai">{{ v.jamSelesai ? fmtJam(v.jamSelesai) : '-' }}</td>
              <td data-label="Aksi"><button class="btn btn-sm btn-ghost" @click.stop="buka(v)">{{ tab === 'menunggu' ? 'Lihat sementara' : tab === 'lunas' ? 'Lihat' : 'Buka tagihan' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="muted" style="font-size: 13px">{{ rows.length }} kunjungan {{ tab === 'siap' ? 'siap bayar' : tab === 'menunggu' ? 'masih di poli' : 'lunas' }} · Total {{ tab === 'lunas' ? '' : 'sementara ' }}{{ fmtRp(totalSementara(rows)) }} · Porsi penjamin dihitung di detail tagihan.</p>
    </div>

    <div class="guide" style="margin-top: 16px">Hanya kunjungan selesai yang dapat difinalisasi. Total draf masih sementara; finalisasi membekukan item dan menerbitkan INV. Gangguan SEP tidak menghalangi pelayanan lokal.</div>
    <div class="kl-actions" style="margin-top: 16px">
      <button v-if="sel" class="btn btn-primary" @click="buka(sel)">Buka tagihan {{ patient(sel.patientId).nama }}</button>
      <NuxtLink to="/kasir/shift" class="btn">Rekap shift</NuxtLink>
    </div>
  </div>
</template>
