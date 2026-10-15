<script setup lang="ts">
// KS-02 Detail Tagihan
const route = useRoute()
const { db, visit, patient, billItems, billTotals, setSkema, addManualItem, setDiskon, finalizeBill } = useDb()
const toast = useToast()

const id = computed(() => String(route.params.id))
const v = computed(() => visit(id.value))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const bill = computed(() => db.bills[id.value])
const status = computed(() => bill.value?.status || 'draf')
const locked = computed(() => status.value !== 'draf')
const items = computed(() => billItems(id.value))
const totals = computed(() => billTotals(id.value))
const SKEMA = [{ key: 'Tunai', label: 'Umum' }, { key: 'BPJS', label: 'BPJS' }, { key: 'Asuransi', label: 'Asuransi' }]
const labelSkema = computed(() => SKEMA.find((s) => s.key === sk.skema)?.label || sk.skema)
const adaLainnya = computed(() => items.value.some((i: any) => i.kategori === 'Lainnya'))

// ---- skema bayar ----
const sk = reactive({ skema: 'Tunai', plafon: 0, selisih: 0 })
const syncSk = () => {
  sk.skema = bill.value?.skema || (v.value?.penjamin === 'BPJS' ? 'BPJS' : v.value?.penjamin === 'Asuransi' ? 'Asuransi' : 'Tunai')
  sk.plafon = bill.value?.plafon || 0
  sk.selisih = bill.value?.selisih || 0
}
syncSk()
watch(() => [id.value, bill.value?.skema, bill.value?.plafon, bill.value?.selisih], syncSk)
const terapkan = () => toast.attempt(() => setSkema(id.value, sk.skema, sk.plafon, sk.selisih), `Skema bayar: ${labelSkema.value}`)
const pilihSkema = (s: string) => { if (!locked.value) { sk.skema = s; terapkan() } }
const skemaEl = ref<HTMLElement | null>(null)
const ubahSkema = () => skemaEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })

// ---- item manual (modal) ----
const showManual = ref(false)
const man = reactive({ nama: '', tarif: 0, qty: 1, alasan: '' })
const bukaManual = () => { Object.assign(man, { nama: '', tarif: 0, qty: 1, alasan: '' }); showManual.value = true }
const simpanManual = () => {
  if (!man.nama.trim()) { toast.err('Nama item wajib diisi'); return }
  if (!(man.tarif > 0) || !(man.qty > 0)) { toast.err('Tarif dan qty harus lebih dari 0'); return }
  if (toast.attempt(() => addManualItem(id.value, { ...man }), 'Item manual ditambahkan')) showManual.value = false
}

// ---- penyesuaian manual & diskon (inline) ----
const adj = reactive({ nilai: 0, diskon: 0, alasanAdj: '', alasanDiskon: '' })
watch(() => [id.value, bill.value?.diskon?.nominal, bill.value?.diskon?.alasan], () => { adj.diskon = bill.value?.diskon?.nominal || 0; adj.alasanDiskon = bill.value?.diskon?.alasan || '' }, { immediate: true })
const terapkanPenyesuaian = (): boolean => {
  if (adj.nilai < 0 || adj.diskon < 0) { toast.err('Nominal tidak boleh negatif'); return false }
  if (adj.diskon > totals.value.total + adj.nilai) { toast.err('Diskon melebihi total tagihan'); return false }
  if (adj.nilai > 0) {
    if (!toast.attempt(() => addManualItem(id.value, { nama: 'Penyesuaian manual', tarif: adj.nilai, qty: 1, alasan: adj.alasanAdj }))) return false
    adj.nilai = 0; adj.alasanAdj = ''
  }
  if (adj.diskon !== (bill.value?.diskon?.nominal || 0) || adj.alasanDiskon !== (bill.value?.diskon?.alasan || '')) {
    if (!toast.attempt(() => setDiskon(id.value, adj.diskon, adj.alasanDiskon))) return false
  }
  return true
}
const simpanPenyesuaian = () => { if (terapkanPenyesuaian()) toast.ok('Penyesuaian tersimpan (tercatat audit)') }

// ---- finalisasi ----
const showFinal = ref(false)
const bisaFinal = computed(() => v.value?.status === 'selesai' && status.value === 'draf')
const mintaFinal = () => { if (terapkanPenyesuaian()) showFinal.value = true }
const finalkan = () => {
  toast.attempt(() => finalizeBill(id.value), 'Tagihan difinalkan — baris dibekukan')
  showFinal.value = false
}
</script>

<template>
  <div v-if="v && pt">
    <PageHead code="KS-02" role="Kasir" title="Detail Tagihan" :subtitle="`Draf tagihan dari pelayanan klinis · Tarif v1.3 / berlaku 01 Oktober 2026`" />

    <KasirBanner :patient="pt" :visit="v" />

    <div class="row" style="margin-bottom: 16px">
      <span class="tag" :class="status === 'draf' ? 't-warn' : status === 'final' ? 't-navy' : 't-ok'">Tagihan: {{ status === 'draf' ? 'Draf' : status === 'final' ? 'Final' : 'Lunas' }}<template v-if="bill?.noInv"> · {{ bill.noInv }}</template></span>
      <span class="tag" :class="['selesai', 'lunas'].includes(v.status) ? 't-ok' : 't-warn'">{{ ['selesai', 'lunas'].includes(v.status) ? 'SOAP final · pelayanan selesai' : `Pelayanan belum selesai (${v.status})` }}</span>
    </div>

    <div v-if="!['selesai', 'lunas'].includes(v.status)" class="alert warn" style="margin-bottom: 14px"><span>Kunjungan masih <b>{{ v.status }}</b> di poli. Total masih sementara; finalisasi diblokir sampai status selesai.</span></div>
    <div v-if="locked" class="alert" style="margin-bottom: 14px"><span>Tagihan sudah <b>{{ status }}</b>: baris dibekukan dan semua kontrol terkunci.</span></div>

    <div class="split-r">
      <div class="stack">
        <div class="card">
          <h2>Rincian item pelayanan</h2>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Kategori / item</th><th>Sumber / waktu</th><th>Tarif</th><th>Qty</th><th>Subtotal</th></tr></thead>
              <tbody>
                <tr v-for="(i, n) in items" :key="i.id" :class="{ 'row-hl': n === 0 }">
                  <td data-label="Kategori / item">{{ i.kategori }} / {{ i.nama }}<div v-if="i.manual" class="muted small">Manual: {{ i.alasan }}</div></td>
                  <td data-label="Sumber / waktu">{{ i.sumber }} · {{ fmtJam(i.at) }}</td>
                  <td data-label="Tarif">{{ fmtRp(i.tarif) }}</td>
                  <td data-label="Qty">{{ i.qty }}</td>
                  <td data-label="Subtotal" class="num-link">{{ fmtRp(i.subtotal) }}</td>
                </tr>
                <tr v-if="!adaLainnya">
                  <td data-label="Kategori / item">Lainnya</td><td data-label="Sumber / waktu">Tidak ada item</td><td data-label="Tarif">Rp 0</td><td data-label="Qty">0</td><td data-label="Subtotal" class="num-link">Rp 0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="row" style="margin-top: 16px">
            <button class="btn" :disabled="locked" @click="bukaManual">Tambah item</button>
            <button class="btn" :disabled="locked" @click="ubahSkema">Ubah skema</button>
          </div>
          <div class="alert" style="margin-top: 16px"><span>Finalisasi membekukan baris dan menerbitkan nomor INV. Tarif berikutnya tidak mengubah tagihan final.</span></div>
        </div>

        <div class="card">
          <h2>Penyesuaian manual</h2>
          <div class="form-grid">
            <div class="field"><label for="adj-n">Nilai penyesuaian</label><input id="adj-n" v-model.number="adj.nilai" class="input" type="number" min="0" inputmode="numeric" placeholder="Rp 0" :disabled="locked"></div>
            <div class="field"><label for="adj-d">Diskon</label><input id="adj-d" v-model.number="adj.diskon" class="input" type="number" min="0" inputmode="numeric" placeholder="Rp 0" :disabled="locked"></div>
            <div class="field full"><label for="adj-a">Alasan penyesuaian manual · minimal 15 karakter</label><input id="adj-a" v-model="adj.alasanAdj" class="input" placeholder="Tidak ada penyesuaian pada tagihan ini" :disabled="locked"></div>
            <div class="field full"><label for="adj-ad">Alasan diskon · wajib jika memberi diskon</label><input id="adj-ad" v-model="adj.alasanDiskon" class="input" placeholder="Tidak ada diskon" :disabled="locked"></div>
          </div>
          <div class="row between" style="margin-top: 12px">
            <p class="hint" style="margin: 0">Setiap perubahan item, skema, dan diskon tercatat audit.</p>
            <button class="btn btn-sm" :disabled="locked" @click="simpanPenyesuaian">Simpan penyesuaian</button>
          </div>
        </div>
      </div>

      <div class="stack">
        <div ref="skemaEl" class="card">
          <h2>Skema pembayaran</h2>
          <div class="tabs-pill" role="group" aria-label="Skema pembayaran">
            <button v-for="s in SKEMA" :key="s.key" type="button" :class="{ on: sk.skema === s.key }" :disabled="locked" @click="pilihSkema(s.key)">{{ s.label }}</button>
          </div>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Komponen</th><th>Nominal</th></tr></thead>
              <tbody>
                <tr class="row-hl"><td>Subtotal</td><td class="num-link">{{ fmtRp(totals.total) }}</td></tr>
                <tr><td>Diskon</td><td class="num-link">{{ fmtRp(totals.diskon) }}</td></tr>
                <tr><td>Total tagihan</td><td class="num-link">{{ fmtRp(totals.net) }}</td></tr>
                <tr><td>Ditanggung penjamin</td><td class="num-link">{{ fmtRp(totals.penjamin) }}</td></tr>
                <tr><td>Porsi pasien</td><td class="num-link">{{ fmtRp(totals.pasien) }}</td></tr>
                <tr><td>Selisih</td><td class="num-link">{{ fmtRp(totals.selisih) }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="total-big">{{ fmtRp(totals.pasien) }}</div>
          <p class="muted">Total dibayar pasien · {{ labelSkema }}</p>
        </div>

        <div class="card">
          <h2>Aturan penjamin</h2>
          <p>BPJS: porsi pasien Rp 0, kecuali selisih / naik kelas.</p>
          <div class="form-grid" style="margin-top: 14px">
            <div class="field"><label for="plafon">Plafon Asuransi · manual</label><input id="plafon" v-model.number="sk.plafon" class="input" type="number" min="0" inputmode="numeric" :disabled="locked" @change="terapkan"></div>
            <div class="field"><label for="selisih">Selisih bila BPJS / naik kelas</label><input id="selisih" v-model.number="sk.selisih" class="input" type="number" min="0" inputmode="numeric" :disabled="locked" @change="terapkan"></div>
          </div>
          <p class="hint">Plafon dipakai pada skema Asuransi, selisih pada skema BPJS. Skema aktif: {{ labelSkema }}; total pasien {{ fmtRp(totals.pasien) }}.</p>
        </div>
      </div>
    </div>

    <div class="row" style="margin-top: 16px">
      <NuxtLink to="/kasir" class="btn">Kembali</NuxtLink>
      <button v-if="status === 'draf'" class="btn btn-primary" :disabled="!bisaFinal" @click="mintaFinal">Finalkan tagihan (INV)</button>
      <NuxtLink v-if="status === 'final'" :to="'/kasir/pembayaran?id=' + id" class="btn btn-primary">Lanjut ke pembayaran</NuxtLink>
      <NuxtLink v-if="status === 'lunas'" :to="'/kasir/invoice?id=' + id" class="btn btn-primary">Lihat invoice &amp; kwitansi</NuxtLink>
      <span v-if="status === 'draf' && !bisaFinal" class="hint" style="margin: 0">Finalisasi hanya untuk kunjungan berstatus selesai.</span>
    </div>

    <AppModal v-model="showManual" title="Tambah item manual">
      <div class="form-grid">
        <div class="field full"><label class="req" for="m-n">Nama item</label><input id="m-n" v-model="man.nama" class="input"></div>
        <div class="field"><label class="req" for="m-t">Tarif (Rp)</label><input id="m-t" v-model.number="man.tarif" class="input" type="number" min="0" inputmode="numeric"></div>
        <div class="field"><label class="req" for="m-q">Qty</label><input id="m-q" v-model.number="man.qty" class="input" type="number" min="1" inputmode="numeric"></div>
        <div class="field full"><label class="req" for="m-a">Alasan (min. 15 karakter)</label><textarea id="m-a" v-model="man.alasan" class="textarea" /><span class="hint" :class="{ 'err-text': man.alasan.trim().length < 15 }">{{ man.alasan.trim().length }} / 15</span></div>
      </div>
      <template #footer><button class="btn" @click="showManual = false">Batal</button><button class="btn btn-primary" @click="simpanManual">Tambah</button></template>
    </AppModal>

    <AppModal v-model="showFinal" title="Finalkan tagihan">
      <p>Total tagihan <b>{{ fmtRp(totals.net) }}</b>, dibayar pasien <b>{{ fmtRp(totals.pasien) }}</b> ({{ labelSkema }}).</p>
      <p class="hint">Setelah difinalkan, nomor INV terbit, baris dibekukan, dan skema/diskon/item tidak dapat diubah.</p>
      <template #footer><button class="btn" @click="showFinal = false">Batal</button><button class="btn btn-primary" @click="finalkan">Finalkan</button></template>
    </AppModal>
  </div>
  <div v-else class="card"><h2>Tagihan tidak ditemukan</h2><NuxtLink to="/kasir" class="btn">Kembali</NuxtLink></div>
</template>
