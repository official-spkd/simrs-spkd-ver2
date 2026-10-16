<script setup lang="ts">
// IT-08 Mapping HFIS BPJS & Antrol V2 — pemetaan subspesialis & dokter SIMRS ke master HFIS (contoh).
// Demo: simpan, tes koneksi, dan sinkronisasi hanya disimulasikan; tidak ada request ke API BPJS.
const { db } = useDb()
const { hfisRows, simpanMapping, syncMasterHfis, tesHfis } = useIt()
const toast = useToast()
const cfg = computed(() => db.hfis.config)
const rows = computed(() => hfisRows())
const cocok = computed(() => rows.value.filter((r: any) => r.status === 'cocok').length)
const perlu = computed(() => rows.value.filter((r: any) => r.status !== 'cocok'))

// ---- parameter koneksi (pratinjau demo) ----
const p = reactive({ ...db.hfis.config })
const radiusErr = computed(() => !(Number(p.radius) > 0) ? 'Radius harus angka > 0' : '')
const simpanParam = () => {
  if (radiusErr.value) return toast.err(radiusErr.value)
  if (!/^https:\/\//.test(p.baseUrl)) return toast.err('Base URL harus diawali https://')
  Object.assign(db.hfis.config, { ...p, radius: Number(p.radius) })
  useDb().audit('ubah parameter BPJS (demo)', 'Antrol V2', 'Pratinjau konfigurasi · kredensial tersamar')
  toast.ok('Parameter disimpan sebagai pratinjau demo')
}
const tes = () => { tesHfis(); toast.ok('Tes mock berhasil · respons simulasi 200') }

// ---- tabel pemetaan ----
const q = ref('')
const fSt = ref('')
const tampil = computed(() => {
  const s = q.value.trim().toLowerCase()
  return rows.value.filter((r: any) => (!fSt.value || (fSt.value === 'cocok') === (r.status === 'cocok'))
    && (!s || [r.subSimrs, r.sub.nama, r.kodeD, r.d.nama, r.map?.dokter].some((x) => String(x || '').toLowerCase().includes(s))))
})
const sync = () => { const n = syncMasterHfis(); toast.ok(n ? `Master HFIS tersinkron · ${n} dokter baru` : 'Master HFIS tersinkron · tidak ada perubahan') }

// ---- pilihan mapping ----
const selId = ref('')
const sel = computed(() => rows.value.find((r: any) => r.d.id === selId.value) || perlu.value[0] || rows.value[0])
const m = reactive({ sub: '', dokter: '' })
watch(sel, (r) => { m.sub = r?.map?.sub || r?.sub.kode || ''; m.dokter = r?.map?.dokter || '' }, { immediate: true })
const dokterHfis = computed(() => db.hfis.master.dokter.filter((x: any) => x.sub === m.sub))
const tanpaPasangan = computed(() => sel.value && !db.hfis.master.dokter.some((x: any) => x.doctorId === sel.value.d.id))
const simpan = () => { if (toast.attempt(() => simpanMapping(sel.value.d.id, m.sub, m.dokter))) toast.ok('Mapping disimpan (simulasi)') }
const batal = () => { m.sub = sel.value?.map?.sub || sel.value?.sub.kode || ''; m.dokter = sel.value?.map?.dokter || '' }
const subNama = (k: string) => db.hfis.master.sub.find((x: any) => x.kode === k)?.nama || k
</script>

<template>
  <div>
    <PageHead code="IT-08" role="IT" title="Mapping HFIS BPJS & Antrol V2" :subtitle="`Pemetaan master subspesialis dan dokter untuk Antrean Online V2 · ${fmtTglPanjang()}`" />
    <div class="guide" style="margin-bottom: 24px"><AppIcon name="info" :size="18" /> <span>Demo aktif · Seluruh kode dan hasil tes di halaman ini adalah contoh fiktif. Simpan, tes koneksi, dan sinkronisasi hanya disimulasikan; tidak ada request API BPJS.</span></div>

    <div class="grid g3">
      <div class="kl-kpi"><small>Mapping master</small><b>{{ cocok }} / {{ rows.length }} cocok</b><span>{{ perlu.length ? `${perlu.length} dokter belum dipetakan` : 'Semua dokter terpetakan' }}</span></div>
      <div class="kl-kpi"><small>Sinkron HFIS terakhir</small><b>{{ fmtJam(db.hfis.lastSync) }}</b><span>{{ fmtTgl(db.hfis.lastSync) }} · Berhasil (Mock)</span></div>
      <div class="kl-kpi"><small>BPJS Antrol V2</small><b>Mock aktif</b><span>Produksi terkunci · Kredensial belum valid</span></div>
    </div>

    <div class="kl-cols" style="margin-top: 16px; grid-template-columns: minmax(0, 1fr) 390px">
      <div class="panel">
        <h2>Parameter koneksi BPJS</h2>
        <div class="kl-cols half" style="gap: 16px">
          <div class="field"><label for="h-cons">Consumer ID</label><input id="h-cons" v-model="p.consId" class="input" maxlength="30" /><span class="hint">Identitas contoh · Bukan kredensial produksi</span></div>
          <div class="field"><label for="h-sec">Secret Key</label><input id="h-sec" v-model="p.secret" type="password" class="input" autocomplete="off" /><span class="hint">Tersamar · Tidak ditampilkan pada log</span></div>
          <div class="field"><label for="h-uk">User Key</label><input id="h-uk" v-model="p.userKey" type="password" class="input" autocomplete="off" /><span class="hint">Tersamar · Token contoh untuk demo</span></div>
          <div class="field"><label for="h-rad">Radius Geofencing Check-in</label>
            <div class="unit"><input id="h-rad" v-model="p.radius" type="number" min="1" class="input" /><span>meter</span></div>
            <span class="hint" :class="{ 'err-text': radiusErr }">{{ radiusErr || 'Contoh parameter · Validasi angka > 0' }}</span>
          </div>
        </div>
        <div class="field"><label for="h-url">Base URL BPJS</label><input id="h-url" v-model="p.baseUrl" class="input" /><span class="hint">Referensi endpoint produksi; tidak diakses dalam mode Mock.</span></div>
        <p class="muted" style="font-size: 12px">Perubahan parameter hanya menjadi pratinjau konfigurasi demo. Aktivasi produksi memerlukan kredensial valid dan verifikasi IT.</p>
        <div><button class="btn" @click="simpanParam">Simpan pratinjau</button></div>
      </div>
      <div class="panel">
        <h2>Mode &amp; tes koneksi</h2>
        <div><span class="badge b-teal">Lingkungan demo · MOCK aktif</span></div>
        <button class="btn btn-primary wide" aria-pressed="true">Mock ✓</button>
        <button class="btn wide" disabled>🔒 Produksi · Terkunci</button>
        <p>Produksi tidak aktif tanpa kredensial valid. Data demo tidak otomatis dikirim saat mode diubah.</p>
        <div><button class="btn" @click="tes">Tes Koneksi API BPJS</button></div>
        <div v-if="db.hfis.lastTest" class="guide" style="display: block"><b>✓ Tes Mock berhasil · {{ fmtJam(db.hfis.lastTest) }}</b><br /><span style="font-size: 12px">Respons simulasi 200 · Tidak memvalidasi koneksi atau kredensial produksi.</span></div>
      </div>
    </div>

    <div class="panel" style="margin-top: 16px">
      <h2>Pemetaan subspesialis &amp; dokter</h2>
      <div class="kl-filters" style="margin: 0">
        <label class="sr-only" for="h-q">Cari</label>
        <input id="h-q" v-model="q" class="input q" style="flex: 1" placeholder="⌕ Cari kode / nama subspesialis / dokter" />
        <label class="sr-only" for="h-st">Status</label>
        <select id="h-st" v-model="fSt" class="select"><option value="">Semua status</option><option value="cocok">Cocok</option><option value="perlu">Perlu mapping</option></select>
        <button class="btn" @click="sync">⟳ Sync Master HFIS</button>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Subspesialis SIMRS</th><th>Dokter SIMRS</th><th>Subspesialis HFIS</th><th>Dokter BPJS HFIS</th><th>Kecocokan master</th><th>Mapping</th></tr></thead>
          <tbody>
            <tr v-for="r in tampil" :key="r.d.id" class="click" :class="{ sel: sel?.d.id === r.d.id }" @click="selId = r.d.id">
              <td data-label="Subspesialis SIMRS">{{ r.subSimrs }} · {{ r.poli?.nama || '-' }}</td>
              <td data-label="Dokter SIMRS">{{ r.kodeD }}<div>{{ r.d.nama }}</div></td>
              <td data-label="Subspesialis HFIS">{{ r.sub.kode }} · {{ subNama(r.sub.kode) }}</td>
              <td data-label="Dokter BPJS HFIS"><template v-if="r.md">{{ r.md.kode }}<div>{{ r.md.nama }}</div></template><span v-else>— Belum dipilih</span></td>
              <td data-label="Kecocokan"><span class="badge" :class="r.status === 'cocok' ? 'b-ok' : r.status === 'tidak' ? 'b-err' : 'b-warn'">{{ r.status === 'cocok' ? 'Cocok' : r.status === 'tidak' ? 'Tidak cocok' : 'Perlu mapping' }}</span></td>
              <td data-label="Mapping"><button class="link" @click.stop="selId = r.d.id">{{ r.map ? 'Ubah mapping ▾' : 'Pilih mapping ▾' }}</button></td>
            </tr>
            <tr v-if="!tampil.length"><td colspan="6" class="empty">Tidak ada pemetaan untuk filter ini</td></tr>
          </tbody>
        </table>
      </div>
      <div class="row between">
        <span class="muted" style="font-size: 12px">{{ rows.length }} pemetaan · Kode HFIS adalah contoh demo, bukan master resmi.</span>
        <span v-if="perlu.length" class="badge b-warn">{{ perlu.length }} perlu ditindaklanjuti</span>
      </div>
    </div>

    <div class="kl-cols half" style="margin-top: 16px">
      <div v-if="sel" class="panel">
        <h2>Pilihan mapping · Poli {{ sel.poli?.nama }}</h2>
        <p style="font-weight: 600">SIMRS: {{ sel.subSimrs }} · {{ sel.poli?.nama }}<br />{{ sel.kodeD }} · {{ sel.d.nama }}</p>
        <div class="kl-cols half" style="gap: 16px">
          <div class="field"><label for="m-sub">Subspesialis BPJS HFIS</label>
            <select id="m-sub" v-model="m.sub" class="select" @change="m.dokter = ''"><option v-for="s in db.hfis.master.sub" :key="s.kode" :value="s.kode">{{ s.kode }} · {{ s.nama }}</option></select>
          </div>
          <div class="field"><label for="m-dok">Dokter BPJS HFIS</label>
            <select id="m-dok" v-model="m.dokter" class="select"><option value="">Pilih dokter HFIS</option><option v-for="d in dokterHfis" :key="d.kode" :value="d.kode">{{ d.kode }} · {{ d.nama }}</option></select>
          </div>
        </div>
        <div v-if="tanpaPasangan" class="guide warn">⚠ Dokter {{ sel.kodeD }} belum memiliki pasangan pada master HFIS contoh. Sync Master HFIS lalu pilih kode dokter yang sesuai; jangan gunakan kode dokter lain.</div>
        <div class="kl-actions">
          <button class="btn btn-primary" @click="simpan">Simpan Mapping</button>
          <button class="btn" @click="batal">Batal</button>
        </div>
        <p class="muted" style="font-size: 12px">Baris tidak lengkap akan ditolak saat validasi penyimpanan demo.</p>
      </div>
      <div class="panel">
        <h2>Validasi master &amp; status sinkron</h2>
        <div><span class="badge" :class="perlu.length ? 'b-warn' : 'b-ok'">{{ perlu.length ? `Perlu perbaikan · ${perlu.length} baris` : 'Semua valid' }}</span></div>
        <p>✓ {{ db.hfis.master.sub.length }} subspesialis ditemukan pada master contoh<br />✓ {{ cocok }} kode dokter cocok dan aktif<br /><template v-for="r in perlu" :key="r.d.id">! {{ r.status === 'tidak' ? 'Kode dokter tidak cocok' : 'Kode dokter belum dipilih' }} · {{ r.kodeD }}<br /></template></p>
        <div class="box">
          <b>Sinkron selesai · Mock · {{ fmtJam(db.hfis.lastSync) }}</b>
          <p>Snapshot master demo tersimpan lokal. Tidak ada sinkronisasi ke server HFIS produksi.</p>
        </div>
        <p class="muted" style="font-size: 12px">Simpan memeriksa kelengkapan, kecocokan subspesialis dan dokter, status aktif master, serta duplikasi kode mapping.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wide { width: 100%; justify-content: center; }
.unit { position: relative; }
.unit span { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--text); }
.box { background: #f3f6f8; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
</style>
