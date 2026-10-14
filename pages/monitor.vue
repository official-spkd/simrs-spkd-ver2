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
const jamTick = computed(() => { void tick.value; return fmtJam(new Date().toISOString()) })
</script>

<template>
  <div>
    <PageHead code="FO-11" :role="user?.role === 'mgmt' ? 'Management · baca saja' : 'Front Office · baca saja'" title="Monitor Antrean Poli" subtitle="Pantau antrean semua poli. Halaman ini diperbarui otomatis setiap 5 detik.">
      <template #actions>
        <span class="chip-ss"><span class="dot" /> Diperbarui {{ jamTick }}</span>
      </template>
    </PageHead>

    <div class="filters">
      <div class="field"><label for="m-poli" class="small">Poli</label>
        <select id="m-poli" v-model="fPoli" class="select"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select></div>
    </div>

    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr))">
      <div v-for="l in lanes" :key="l.poli.id" class="card">
        <div class="row between" style="margin-bottom: 12px">
          <div><h2 style="margin: 0">{{ l.poli.nama }}</h2><div class="muted small">{{ l.poli.ruang }} · {{ l.total }} pasien</div></div>
          <span class="badge b-navy">{{ l.poli.kode }}</span>
        </div>
        <div v-for="c in l.cols" :key="c.key" style="margin-bottom: 12px">
          <div class="row between" style="margin-bottom: 4px"><span class="badge" :class="c.cls">{{ c.label }}</span><span class="muted small">{{ c.items.length }}</span></div>
          <div v-if="!c.items.length" class="muted small" style="padding: 2px 0 2px 4px">Kosong</div>
          <div v-for="v in c.items" :key="v.id" class="row between" style="padding: 6px 4px; border-top: 1px solid var(--line); flex-wrap: nowrap">
            <span><b class="mono">{{ v.antreanPoli.nomor }}</b> <span class="muted small">{{ doctor(v.doctorId)?.nama.split(',')[0] }}</span></span>
            <span class="muted small nowrap">{{ wait(v) }} mnt</span>
          </div>
        </div>
      </div>
      <div v-if="!lanes.length" class="card"><p class="muted">Tidak ada poli yang cocok.</p></div>
    </div>
    <p class="hint">Waktu tunggu = selisih jam daftar sampai dipanggil (untuk yang masih menunggu: sampai sekarang). "Menunggu" mencakup pasien yang vitalnya sudah selesai.</p>
  </div>
</template>
