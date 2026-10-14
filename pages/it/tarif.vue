<script setup lang="ts">
const { db } = useDb()
const { layananList, saveTarif, deleteTarif } = useAdmin()
const toast = useToast()
const PJ = ['Umum', 'BPJS', 'Asuransi']
const KATS = ['Administrasi', 'Konsultasi', 'Tindakan', 'Obat']
const fKat = ref('')
const cari = ref('')
const rows = computed(() => {
  const s = cari.value.trim().toLowerCase()
  return layananList().filter((x: any) => (!fKat.value || x.kategori === fKat.value) && (!s || x.nama.toLowerCase().includes(s) || (x.kode || '').toLowerCase().includes(s)))
})

const show = ref(false)
const blank = () => ({ id: '', src: 'tarif', kode: '', nama: '', kategori: 'Tindakan', harga: { Umum: 0, BPJS: 0, Asuransi: 0 }, berlaku: todayStr() })
const f = reactive<any>(blank())
const asli = ref<any>(null)
const buka = (x?: any) => {
  Object.assign(f, blank())
  asli.value = null
  if (x) {
    Object.assign(f, { id: x.id, src: x.src, kode: x.kode, nama: x.nama, kategori: x.kategori, harga: { ...x.harga }, berlaku: todayStr() })
    asli.value = x
  }
  show.value = true
}
watch(() => f.kategori, (k) => { if (!f.id) f.src = k === 'Obat' ? 'obat' : 'tarif' })
const berubah = computed(() => !!asli.value && PJ.some((p) => Number(f.harga[p]) !== (asli.value.harga[p] ?? 0)))
const simpan = () => {
  const r = toast.attempt(() => saveTarif({ ...f, harga: { ...f.harga } }))
  if (!r) return
  show.value = false
  toast.ok(r.versiBaru ? `Versi baru v${r.item.versi} dibuat untuk ${r.item.nama}` : `${r.item.nama} disimpan`)
}
const hapus = (x: any) => {
  if (!confirm(`Hapus layanan ${x.nama}?`)) return
  toast.attempt(() => deleteTarif(x.src, x.id), 'Layanan dihapus')
}
const riwayat = ref<any>(null)
const lihatRiwayat = (x: any) => { riwayat.value = x }
const semuaVersi = computed(() => {
  const x = riwayat.value
  if (!x) return []
  return [...(x.riwayat || []), { versi: x.versi || 1, berlaku: x.berlaku, harga: x.harga, aktif: true }].reverse()
})
</script>

<template>
  <div>
    <PageHead code="IT-04" role="IT / Superadmin" title="Master Tarif & Penjamin" subtitle="Tarif per layanan x penjamin dengan tanggal berlaku dan versi.">
      <template #actions><button class="btn btn-primary" @click="buka()">+ Tambah layanan</button></template>
    </PageHead>

    <div class="alert info" style="margin-bottom: 16px">Mengubah harga membuat versi baru (versi + 1), bukan menimpa. Tagihan yang sudah final tidak berubah saat tarif berubah, karena barisnya dibekukan saat finalisasi.</div>

    <div class="card" style="margin-bottom: 16px">
      <div class="filters">
        <div class="field"><label for="t-cari">Cari</label><input id="t-cari" v-model="cari" class="input" placeholder="Nama / kode layanan" /></div>
        <div class="field"><label for="t-kat">Kategori</label>
          <select id="t-kat" v-model="fKat" class="select"><option value="">Semua</option><option v-for="k in KATS" :key="k">{{ k }}</option></select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kode</th><th>Layanan</th><th>Kategori</th><th class="right">Umum</th><th class="right">BPJS</th><th class="right">Asuransi</th><th>Berlaku</th><th>Versi</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="x in rows" :key="x.src + x.id">
              <td data-label="Kode" class="mono">{{ x.kode }}</td>
              <td data-label="Layanan"><b>{{ x.nama }}</b></td>
              <td data-label="Kategori"><span class="badge b-navy">{{ x.kategori }}</span></td>
              <td data-label="Umum" class="right">{{ fmtRp(x.harga.Umum) }}</td>
              <td data-label="BPJS" class="right">{{ fmtRp(x.harga.BPJS) }}</td>
              <td data-label="Asuransi" class="right">{{ fmtRp(x.harga.Asuransi) }}</td>
              <td data-label="Berlaku">{{ fmtTgl(x.berlaku) }}</td>
              <td data-label="Versi"><span class="badge b-teal">v{{ x.versi || 1 }}</span></td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="buka(x)">Ubah</button>
                  <button class="btn btn-sm" @click="lihatRiwayat(x)">Riwayat</button>
                  <button class="btn btn-sm btn-danger" @click="hapus(x)">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length"><td colspan="9" class="empty">Tidak ada layanan</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Tarif BPJS Rp 0 berarti ditanggung paket INA-CBG; selisih/naik kelas diisi manual di kasir.</p>
    </div>

    <div class="card">
      <h2>Daftar penjamin</h2>
      <div class="grid g3">
        <div class="kpi"><small>Umum</small><b style="font-size: 18px">Tunai / pribadi</b><span>bayar penuh oleh pasien</span></div>
        <div class="kpi"><small>BPJS</small><b style="font-size: 18px">JKN</b><span>porsi pasien Rp 0 kecuali selisih / naik kelas</span></div>
        <div class="kpi"><small>Asuransi</small><b style="font-size: 18px">Asuransi swasta</b><span>plafon dan selisih diisi manual di kasir</span></div>
      </div>
      <p class="hint">Ketiganya satu kategori penjamin; tidak ada master asuransi per perusahaan pada MVP.</p>
    </div>

    <AppModal v-model="show" :title="f.id ? 'Ubah layanan' : 'Tambah layanan'">
      <div class="form-grid">
        <div v-if="!f.id && f.src === 'tarif'" class="field"><label class="req" for="tf-kode">Kode</label><input id="tf-kode" v-model="f.kode" class="input mono" /></div>
        <div class="field" :class="{ full: f.id || f.src === 'obat' }"><label class="req" for="tf-nama">Nama layanan</label><input id="tf-nama" v-model="f.nama" class="input" /></div>
        <div class="field"><label for="tf-kat">Kategori</label>
          <select id="tf-kat" v-model="f.kategori" class="select" :disabled="!!f.id && f.src === 'obat'"><option v-for="k in (f.id && f.src === 'tarif' ? KATS.slice(0, 3) : KATS)" :key="k">{{ k }}</option></select>
        </div>
        <div v-for="p in PJ" :key="p" class="field"><label class="req" :for="'tf-' + p">Harga {{ p }} (Rp)</label><input :id="'tf-' + p" v-model.number="f.harga[p]" type="number" min="0" class="input" /></div>
        <div class="field"><label class="req" for="tf-berlaku">Berlaku mulai</label><input id="tf-berlaku" v-model="f.berlaku" type="date" class="input" :max="todayStr()" /></div>
      </div>
      <div v-if="berubah" class="alert warn" style="margin-top: 12px">Harga berubah: akan dibuat versi v{{ (asli?.versi || 1) + 1 }}. Versi lama tersimpan di riwayat dan tagihan final tidak terpengaruh.</div>
      <template #footer><button class="btn" @click="show = false">Batal</button><button class="btn btn-primary" @click="simpan">Simpan</button></template>
    </AppModal>

    <AppModal :model-value="!!riwayat" :title="'Riwayat versi · ' + (riwayat?.nama || '')" @update:model-value="riwayat = null">
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Versi</th><th>Berlaku</th><th class="right">Umum</th><th class="right">BPJS</th><th class="right">Asuransi</th></tr></thead>
          <tbody>
            <tr v-for="v in semuaVersi" :key="v.versi">
              <td data-label="Versi">v{{ v.versi }} <span v-if="v.aktif" class="badge b-ok">aktif</span></td>
              <td data-label="Berlaku">{{ fmtTgl(v.berlaku) }}</td>
              <td data-label="Umum" class="right">{{ fmtRp(v.harga.Umum) }}</td>
              <td data-label="BPJS" class="right">{{ fmtRp(v.harga.BPJS) }}</td>
              <td data-label="Asuransi" class="right">{{ fmtRp(v.harga.Asuransi) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer><button class="btn btn-primary" @click="riwayat = null">Tutup</button></template>
    </AppModal>
  </div>
</template>
