<script setup lang="ts">
// IT-04 Master Tarif & Penjamin — tarif per layanan × kelas × penjamin dengan versi & tanggal efektif.
// Baris tagihan final menyimpan snapshot tarif, jadi perubahan master tidak mengubah tagihan final. Simulasi lokal.
const { db } = useDb()
const { layananList, saveTarif } = useAdmin()
const { versiBaru, setTarifPj, toggleTarifPj } = useIt()
const toast = useToast()
const PJ = ['Umum', 'BPJS', 'Asuransi']
const KAT = ['Administrasi', 'Konsultasi', 'Tindakan', 'Obat']
const PER = 6
const tv = computed(() => db.tarifVersi)
const kodeTampil = (k: string) => k.replace(/^([A-Z]+)(\d+)$/, '$1-$2')

const fKat = ref('')
const fPj = ref('')
const rows = computed(() => layananList().flatMap((l: any) => PJ.map((pj) => ({ key: l.id + '|' + pj, l, pj, harga: l.harga[pj] ?? 0, aktif: !l.nonaktif?.[pj] })))
  .filter((r: any) => (!fKat.value || r.l.kategori === fKat.value) && (!fPj.value || r.pj === fPj.value)))
const page = ref(1)
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PER)))
watch([fKat, fPj], () => (page.value = 1))
const tampil = computed(() => rows.value.slice((page.value - 1) * PER, page.value * PER))

// ---- panel edit / tambah ----
const mode = ref<'edit' | 'baru' | ''>('')
const f = reactive<any>({ id: '', src: '', kode: '', nama: '', kategori: 'Konsultasi', pj: 'Umum', harga: 0, efektif: todayStr() })
const sel = computed(() => (mode.value === 'edit' ? rows.value.find((r: any) => r.key === f.id + '|' + f.pj) || layananList().find((l: any) => l.id === f.id) : null))
const item = computed(() => layananList().find((l: any) => l.id === f.id))
const buka = (r: any) => {
  Object.assign(f, { id: r.l.id, src: r.l.src, kode: r.l.kode, nama: r.l.nama, kategori: r.l.kategori, pj: r.pj, harga: r.harga, efektif: todayStr() })
  mode.value = 'edit'
}
// ganti penjamin di panel → muat tarif penjamin tsb.
watch(() => f.pj, (pj) => { if (mode.value === 'edit' && item.value) f.harga = item.value.harga[pj] ?? 0 })
const tambah = () => { Object.assign(f, { id: '', src: 'tarif', kode: '', nama: '', kategori: 'Tindakan', pj: 'Umum', harga: 0, efektif: todayStr() }); mode.value = 'baru' }
onMounted(() => { if (tampil.value[0]) buka(tampil.value[0]) })
const simpan = () => {
  if (mode.value === 'baru') {
    const h = Number(f.harga)
    const src = f.kategori === 'Obat' ? 'obat' : 'tarif'
    const r = toast.attempt(() => saveTarif({ src, kode: f.kode, nama: f.nama, kategori: f.kategori, berlaku: f.efektif, harga: { Umum: h, BPJS: f.pj === 'BPJS' ? h : 0, Asuransi: h } }))
    if (r) { toast.ok(`Tarif ${r.item.nama} ditambahkan`); buka({ l: { ...r.item, src, kategori: r.item.kategori || 'Obat', kode: r.item.kode || '' }, pj: f.pj, harga: r.item.harga[f.pj] }) }
    return
  }
  const r = toast.attempt(() => setTarifPj(f.id, f.pj, { harga: Number(f.harga), efektif: f.efektif, nama: f.nama, kategori: f.kategori }))
  if (r) toast.ok('Tarif disimpan · tagihan final tidak berubah')
}
const toggle = () => {
  const on = toast.attempt(() => toggleTarifPj(f.id, f.pj))
  if (on !== undefined) toast.ok(on ? 'Tarif diaktifkan' : 'Tarif dinonaktifkan untuk item baru')
}
const aktifSel = computed(() => !item.value?.nonaktif?.[f.pj])

// ---- versi ----
const showV = ref(false)
const vDup = ref(false)
const v = reactive({ efektif: todayStr(), ket: '' })
const bukaV = (dup: boolean) => { vDup.value = dup; Object.assign(v, { efektif: todayStr(), ket: dup ? `Duplikasi dari v${tv.value.versi}` : '' }); showV.value = true }
const simpanV = () => {
  const r = toast.attempt(() => versiBaru(v.efektif, v.ket.trim(), vDup.value))
  if (r) { showV.value = false; toast.ok(`Versi tarif v${r} aktif`) }
}
const showR = ref(false)
</script>

<template>
  <div>
    <PageHead code="IT-04" role="IT" title="Master Tarif & Penjamin" :subtitle="`Tarif v${tv.versi} · Efektif ${fmtTglPanjang(tv.efektif).split(', ')[1]} · Versi baru tidak mengubah tagihan final`" />
    <div class="kl-filters" style="margin-bottom: 24px">
      <button class="btn" @click="showR = true">Versi v{{ tv.versi }} · Aktif ▾</button>
      <label class="sr-only" for="t-kat">Kategori</label>
      <select id="t-kat" v-model="fKat" class="select"><option value="">Semua kategori</option><option v-for="k in KAT" :key="k">{{ k }}</option></select>
      <label class="sr-only" for="t-pj">Penjamin</label>
      <select id="t-pj" v-model="fPj" class="select"><option value="">Semua penjamin</option><option v-for="p in PJ" :key="p">{{ p }}</option></select>
      <label class="sr-only" for="t-kls">Kelas</label>
      <select id="t-kls" class="select"><option>Rawat Jalan</option></select>
      <button class="btn" @click="bukaV(false)">+ Versi baru</button>
    </div>

    <div class="kl-cols">
      <div class="kl-col">
        <div class="panel">
          <h2>Daftar tarif pelayanan</h2>
          <div class="kl-actions">
            <button class="btn btn-primary" @click="tambah">+ Tambah tarif</button>
            <button class="btn" @click="bukaV(true)">Duplikasi versi</button>
            <button class="btn" @click="showR = true">Riwayat versi</button>
          </div>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Kode / layanan</th><th>Kategori</th><th>Kelas</th><th>Penjamin</th><th>Tarif</th><th>Efektif</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="r in tampil" :key="r.key" :class="{ sel: mode === 'edit' && f.id === r.l.id && f.pj === r.pj }">
                  <td data-label="Kode / layanan">{{ kodeTampil(r.l.kode) }} /<div>{{ r.l.nama }}</div></td>
                  <td data-label="Kategori">{{ r.l.kategori }}</td>
                  <td data-label="Kelas">RJ</td>
                  <td data-label="Penjamin"><span class="badge b-navy">{{ r.pj }}</span></td>
                  <td data-label="Tarif" :style="{ textDecoration: r.aktif ? '' : 'line-through' }">{{ fmtRp(r.harga) }}</td>
                  <td data-label="Efektif">{{ fmtTgl(r.l.berlaku > tv.efektif ? r.l.berlaku : tv.efektif) }}<span v-if="!r.aktif" class="badge b-mute" style="margin-left: 4px">Nonaktif</span></td>
                  <td data-label="Aksi"><button class="link" @click="buka(r)">Edit</button></td>
                </tr>
                <tr v-if="!tampil.length"><td colspan="7" class="empty">Tidak ada tarif</td></tr>
              </tbody>
            </table>
          </div>
          <div class="pager-kl">
            <span>{{ tampil.length }} dari {{ rows.length }} tarif ·</span>
            <button :disabled="page <= 1" @click="page--">‹</button>
            <button v-for="n in pages" :key="n" :class="{ on: n === page }" @click="page = n">{{ n }}</button>
            <button :disabled="page >= pages" @click="page++">›</button>
            <span>· Hapus hanya tarif draf yang belum digunakan.</span>
          </div>
        </div>

        <div class="panel">
          <h2>Kategori penjamin</h2>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Penjamin</th><th>Aturan pembayaran</th><th>Pengelolaan</th></tr></thead>
              <tbody>
                <tr><td data-label="Penjamin"><span class="badge b-navy">Umum</span></td><td data-label="Aturan">Pasien membayar seluruh tagihan</td><td data-label="Pengelolaan" class="tl">Aktif</td></tr>
                <tr><td data-label="Penjamin"><span class="badge b-navy">BPJS</span></td><td data-label="Aturan">Porsi pasien Rp0 kecuali selisih / naik kelas</td><td data-label="Pengelolaan" class="tl">Aktif</td></tr>
                <tr><td data-label="Penjamin"><span class="badge b-navy">Asuransi</span></td><td data-label="Aturan">Plafon dan selisih diisi manual di kasir</td><td data-label="Pengelolaan" class="tl">Kategori generik</td></tr>
              </tbody>
            </table>
          </div>
          <div class="guide">Tidak ada master perusahaan Asuransi tambahan. Kasir memasukkan plafon dan selisih secara manual sesuai skema aktif.</div>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <template v-if="mode">
            <h2>{{ mode === 'baru' ? 'Tambah tarif' : `Edit tarif · ${f.nama}` }}</h2>
            <div class="field"><label class="req" for="tf-kode">Kode layanan</label><input id="tf-kode" v-model="f.kode" class="input mono" maxlength="10" :disabled="mode === 'edit'" placeholder="mis. TND06" /></div>
            <div class="field"><label class="req" for="tf-nama">Nama layanan</label><input id="tf-nama" v-model="f.nama" class="input" maxlength="100" /></div>
            <div class="field"><label class="req" for="tf-kat">Kategori</label>
              <select id="tf-kat" v-model="f.kategori" class="select" :disabled="mode === 'edit' && f.src === 'obat'"><option v-for="k in KAT" :key="k" :disabled="mode === 'edit' && f.src !== 'obat' && k === 'Obat'">{{ k }}</option></select>
            </div>
            <div class="field"><label class="req" for="tf-kls">Kelas pelayanan</label><select id="tf-kls" class="select"><option>Rawat Jalan</option></select></div>
            <div class="field"><label class="req" for="tf-pj">Penjamin</label><select id="tf-pj" v-model="f.pj" class="select"><option v-for="p in PJ" :key="p">{{ p }}</option></select></div>
            <div class="field"><label class="req" for="tf-h">Tarif (Rp)</label><input id="tf-h" v-model.number="f.harga" type="number" min="0" step="500" class="input" /><span class="hint">{{ fmtRp(f.harga) }}</span></div>
            <div class="field"><label class="req" for="tf-ef">Tanggal efektif</label><input id="tf-ef" v-model="f.efektif" type="date" class="input" :max="todayStr()" /></div>
            <div><span class="badge b-navy">Versi v{{ tv.versi }} · Aktif</span><span v-if="mode === 'edit' && !aktifSel" class="badge b-mute" style="margin-left: 6px">Tarif nonaktif</span></div>
            <div class="kl-actions">
              <button class="btn btn-primary" @click="simpan">{{ mode === 'baru' ? 'Simpan tarif' : 'Simpan perubahan' }}</button>
              <button v-if="mode === 'edit'" class="btn" @click="toggle">{{ aktifSel ? 'Nonaktifkan tarif' : 'Aktifkan tarif' }}</button>
              <button class="btn" @click="mode = ''">Batal</button>
            </div>
          </template>
          <template v-else>
            <h2>Edit tarif</h2>
            <p class="muted">Pilih tarif pada daftar atau tambah tarif baru.</p>
          </template>
        </div>
        <div class="guide">Baris tagihan final menyimpan snapshot tarif. Perubahan master hanya berlaku untuk item baru sesuai tanggal efektif.</div>
      </div>
    </div>

    <AppModal v-model="showV" :title="vDup ? 'Duplikasi versi tarif' : 'Versi tarif baru'">
      <p class="muted" style="margin-bottom: 12px">Versi v{{ tv.versi }} disalin menjadi versi baru. Tagihan yang sudah final tetap memakai tarif lama.</p>
      <div class="form-grid">
        <div class="field"><label class="req" for="v-ef">Tanggal efektif</label><input id="v-ef" v-model="v.efektif" type="date" class="input" :min="tv.efektif" /></div>
        <div class="field"><label for="v-ket">Keterangan</label><input id="v-ket" v-model="v.ket" class="input" maxlength="120" /></div>
      </div>
      <template #footer><button class="btn" @click="showV = false">Batal</button><button class="btn btn-primary" @click="simpanV">Buat versi</button></template>
    </AppModal>

    <AppModal v-model="showR" title="Riwayat versi tarif" size="lg">
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Versi</th><th>Efektif</th><th>Status</th><th>Keterangan</th></tr></thead>
          <tbody>
            <tr><td data-label="Versi"><b>v{{ tv.versi }}</b></td><td data-label="Efektif">{{ fmtTgl(tv.efektif) }}</td><td data-label="Status"><span class="badge b-ok">Aktif</span></td><td data-label="Keterangan">{{ tv.ket || '-' }}</td></tr>
            <tr v-for="r in tv.riwayat" :key="r.versi + r.at"><td data-label="Versi">v{{ r.versi }}</td><td data-label="Efektif">{{ fmtTgl(r.efektif) }}</td><td data-label="Status"><span class="badge b-mute">Arsip</span></td><td data-label="Keterangan">{{ r.ket || '-' }} · diganti {{ fmtWaktu(r.at) }}{{ r.user ? ' oleh ' + r.user : '' }}</td></tr>
          </tbody>
        </table>
      </div>
      <template v-if="item?.riwayat?.length">
        <h3 style="margin: 16px 0 8px">Perubahan harga · {{ item.nama }}</h3>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead><tr><th>Versi item</th><th>Berlaku</th><th v-for="p in PJ" :key="p">{{ p }}</th></tr></thead>
            <tbody>
              <tr><td data-label="Versi">v{{ item.versi }} (aktif)</td><td data-label="Berlaku">{{ fmtTgl(item.berlaku) }}</td><td v-for="p in PJ" :key="p" :data-label="p">{{ fmtRp(item.harga[p]) }}</td></tr>
              <tr v-for="h in [...item.riwayat].reverse()" :key="h.versi"><td data-label="Versi">v{{ h.versi }}</td><td data-label="Berlaku">{{ fmtTgl(h.berlaku) }}</td><td v-for="p in PJ" :key="p" :data-label="p">{{ fmtRp(h.harga[p]) }}</td></tr>
            </tbody>
          </table>
        </div>
      </template>
      <template #footer><button class="btn btn-primary" @click="showR = false">Tutup</button></template>
    </AppModal>
  </div>
</template>

<style scoped>
.tl { color: var(--teal-d); }
</style>
