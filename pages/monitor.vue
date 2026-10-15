<script setup lang="ts">
// FO-11 Monitor Antrean Poli (baca saja, refresh otomatis 5 detik)
const { db, poli, doctor, patient } = useDb()
const { user } = useAuth()

const fPoli = ref('')
const tick = ref(Date.now())
let timer: any
onMounted(() => { timer = setInterval(() => (tick.value = Date.now()), 5000) })
onBeforeUnmount(() => clearInterval(timer))

const COLS = [
  { key: 'menunggu', label: 'Menunggu', cls: 'b-warn' },
  { key: 'dipanggil', label: 'Dipanggil', cls: 'b-info' },
  { key: 'dilayani', label: 'Dilayani', cls: 'b-ok' },
  { key: 'selesai', label: 'Selesai', cls: 'b-teal' },
  { key: 'dilewati', label: 'Dilewati', cls: 'b-mute' },
]
const bucket = (st: string) => (st === 'vital selesai' ? 'menunggu' : st)
const wait = (v: any) =>
  ['menunggu', 'vital selesai'].includes(v.antreanPoli.status) ? menitAntara(v.jamDaftar) : menitAntara(v.jamDaftar, v.jamPanggil || v.jamDaftar)
const lanes = computed(() => {
  void tick.value
  return db.polis
    .filter((p: any) => p.aktif && (!fPoli.value || p.id === fPoli.value))
    .map((p: any) => {
      const vs = db.visits.filter((v: any) => v.tanggal === todayStr() && v.poliId === p.id && v.status !== 'dibatalkan')
        .slice().sort((a: any, b: any) => (a.antreanPoli.nomor > b.antreanPoli.nomor ? 1 : -1))
      return {
        poli: p,
        total: vs.length,
        cols: COLS.map((c) => ({ ...c, items: vs.filter((v: any) => bucket(v.antreanPoli.status) === c.key) })),
      }
    })
})
const semua = computed(() => lanes.value.flatMap((l: any) => l.cols))
const jml = (k: string) => semua.value.filter((c: any) => c.key === k).reduce((n: number, c: any) => n + c.items.length, 0)
const lunas = computed(() => semua.value.filter((c: any) => c.key === 'selesai').reduce((n: number, c: any) => n + c.items.filter((v: any) => v.status === 'lunas').length, 0))
const dokterPoli = (pid: string) => db.doctors.filter((d: any) => d.poliId === pid).map((d: any) => d.nama).join(' · ')
const jamTick = computed(() => { void tick.value; return fmtJam(new Date().toISOString()) })
</script>

<template>
  <div>
    <PageHead code="FO-11" :role="user?.role === 'mgmt' ? 'Management · baca saja' : 'Front Office / Admin'" title="Monitor Antrean Poli" subtitle="Gambaran antrean lintas poli · Front Office / Manajemen membaca saja" />

    <div class="kl-filters">
      <select id="m-poli" v-model="fPoli" class="select" aria-label="Poli"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
      <span class="badge b-navy">{{ fmtTglPanjang(todayStr()) }}</span>
    </div>

    <div class="row" style="gap: 16px; margin-bottom: 16px">
      <span class="chip-ss"><span class="dot" /> Auto-refresh 5 detik</span>
      <span class="badge b-navy">Diperbarui {{ jamTick }}</span>
      <span class="badge b-navy">Baca saja · tanpa kontrol panggilan</span>
    </div>

    <div class="grid g4" style="margin-bottom: 16px">
      <div class="kl-kpi"><small>Menunggu</small><b>{{ jml('menunggu') }}</b></div>
      <div class="kl-kpi"><small>Sedang dilayani</small><b>{{ jml('dilayani') }}</b></div>
      <div class="kl-kpi"><small>Selesai poli</small><b>{{ jml('selesai') }}</b><span>{{ jml('selesai') - lunas }} belum lunas · {{ lunas }} lunas</span></div>
      <div class="kl-kpi"><small>Dilewati / batal</small><b>{{ jml('dilewati') }}</b></div>
    </div>

    <div class="grid g2">
      <div v-for="l in lanes" :key="l.poli.id" class="panel">
        <h2>{{ l.poli.nama }} · {{ l.poli.ruang }}</h2>
        <p class="muted" style="font-size: 13px">{{ dokterPoli(l.poli.id) || l.poli.kode }} · {{ l.total }} pasien</p>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Status antrean</th><th>Nomor / waktu tunggu</th></tr></thead>
            <tbody>
              <tr v-for="(c, i) in l.cols" :key="c.key" :class="{ sel: i === 0 }">
                <td style="vertical-align: top"><span class="badge" :class="c.cls">{{ c.label }}</span> <span class="muted small">{{ c.items.length }}</span></td>
                <td style="color: var(--teal-d)">
                  <div v-for="v in c.items" :key="v.id"><b class="mono">{{ v.antreanPoli.nomor }}</b> <span class="muted small">{{ doctor(v.doctorId)?.nama.split(',')[0] }}</span> · {{ wait(v) }} mnt</div>
                  <span v-if="!c.items.length" class="muted">Tidak ada</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="!lanes.length" class="panel"><p class="muted">Tidak ada poli yang cocok.</p></div>
    </div>

    <div class="guide" style="margin-top: 16px">Menunggu, Dipanggil, Dilayani, Selesai, dan Dilewati adalah status antrean. Status kunjungan dan status SEP / tagihan / sinkronisasi dicatat terpisah. Waktu tunggu = selisih jam daftar sampai dipanggil (untuk yang masih menunggu: sampai sekarang); "Menunggu" mencakup pasien yang vitalnya sudah selesai.</div>
  </div>
</template>
