<script setup lang="ts">
// KS-02 Detail Tagihan
const route = useRoute()
const { db, visit, patient, poli, doctor, billItems, billTotals, setSkema, addManualItem, setDiskon, finalizeBill } = useDb()
const toast = useToast()

const id = computed(() => String(route.params.id))
const v = computed(() => visit(id.value))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const bill = computed(() => db.bills[id.value])
const status = computed(() => bill.value?.status || 'draf')
const locked = computed(() => status.value !== 'draf')
const items = computed(() => billItems(id.value))
const totals = computed(() => billTotals(id.value))
const CATS = ['Administrasi', 'Konsultasi', 'Tindakan', 'Obat/resep', 'Lainnya']
const grouped = computed(() => CATS.map((c) => {
  const rows = items.value.filter((i: any) => (CATS.includes(i.kategori) ? i.kategori : 'Lainnya') === c)
  return { cat: c, rows, sub: rows.reduce((s: number, i: any) => s + i.subtotal, 0) }
}))
const openCat = reactive<Record<string, boolean>>({ Administrasi: true, Konsultasi: true, Tindakan: true, 'Obat/resep': true, Lainnya: true })

// ---- skema bayar ----
const sk = reactive({ skema: 'Tunai', plafon: 0, selisih: 0 })
const syncSk = () => {
  sk.skema = bill.value?.skema || (v.value?.penjamin === 'BPJS' ? 'BPJS' : v.value?.penjamin === 'Asuransi' ? 'Asuransi' : 'Tunai')
  sk.plafon = bill.value?.plafon || 0
  sk.selisih = bill.value?.selisih || 0
}
syncSk()
watch(() => [id.value, bill.value?.skema, bill.value?.plafon, bill.value?.selisih], syncSk)
const terapkan = () => toast.attempt(() => setSkema(id.value, sk.skema, sk.plafon, sk.selisih), `Skema bayar: ${sk.skema}`)
const pilihSkema = (s: string) => { if (!locked.value) { sk.skema = s; terapkan() } }

// ---- item manual ----
const showManual = ref(false)
const man = reactive({ nama: '', tarif: 0, qty: 1, alasan: '' })
const bukaManual = () => { Object.assign(man, { nama: '', tarif: 0, qty: 1, alasan: '' }); showManual.value = true }
const simpanManual = () => {
  if (!man.nama.trim()) { toast.err('Nama item wajib diisi'); return }
  if (!(man.tarif > 0) || !(man.qty > 0)) { toast.err('Tarif dan qty harus lebih dari 0'); return }
  if (toast.attempt(() => addManualItem(id.value, { ...man }), 'Item manual ditambahkan')) showManual.value = false
}

// ---- diskon ----
const showDiskon = ref(false)
const dk = reactive({ nominal: 0, alasan: '' })
const bukaDiskon = () => { dk.nominal = bill.value?.diskon?.nominal || 0; dk.alasan = bill.value?.diskon?.alasan || ''; showDiskon.value = true }
const simpanDiskon = () => {
  if (dk.nominal < 0 || dk.nominal > totals.value.total) { toast.err('Nominal diskon tidak valid'); return }
  if (toast.attempt(() => setDiskon(id.value, dk.nominal, dk.alasan), dk.nominal > 0 ? 'Diskon diterapkan' : 'Diskon dihapus')) showDiskon.value = false
}

// ---- finalisasi ----
const showFinal = ref(false)
const bisaFinal = computed(() => v.value?.status === 'selesai' && status.value === 'draf')
const finalkan = () => {
  if (toast.attempt(() => finalizeBill(id.value), 'Tagihan difinalkan — baris dibekukan')) showFinal.value = false
  else showFinal.value = false
}
</script>

<template>
  <div v-if="v && pt">
    <PageHead code="KS-02" role="Kasir" title="Detail Tagihan" :crumbs="['Kasir', 'Worklist tagihan', v.noKunjungan]">
      <template #actions>
        <NuxtLink to="/kasir" class="btn">Kembali</NuxtLink>
        <NuxtLink v-if="status === 'final'" :to="'/kasir/' + id + '/bayar'" class="btn btn-primary">Lanjut ke pembayaran</NuxtLink>
        <NuxtLink v-if="status === 'lunas'" :to="'/kasir/' + id + '/invoice'" class="btn btn-primary">Lihat invoice & kwitansi</NuxtLink>
      </template>
    </PageHead>

    <PatientBanner :patient="pt" :visit="v">
      <div class="f"><small>Poli</small><b>{{ poli(v.poliId).nama }} · {{ doctor(v.doctorId).nama }}</b></div>
      <div class="f"><small>Status kunjungan</small><StatusBadge :value="v.status" /></div>
      <div class="f"><small>Tagihan</small><StatusBadge :value="status" /> <b v-if="bill?.noInv" class="mono small">{{ bill.noInv }}</b></div>
    </PatientBanner>

    <div v-if="v.status !== 'selesai' && v.status !== 'lunas'" class="alert warn" style="margin-bottom:14px"><span>Kunjungan masih <b>{{ v.status }}</b> di poli. Total masih sementara; finalisasi diblokir sampai status selesai.</span></div>
    <div v-if="locked" class="alert" style="margin-bottom:14px"><span>Tagihan sudah <b>{{ status }}</b>: baris dibekukan dan semua kontrol terkunci.</span></div>

    <div class="split-r">
      <div class="card">
        <div class="row between" style="margin-bottom:12px"><h2 style="margin:0">Rincian tagihan</h2>
          <button class="btn btn-sm" :disabled="locked" @click="bukaManual">+ Tambah item manual</button></div>
        <div v-for="g in grouped" :key="g.cat" class="acc">
          <button class="acc-h" :aria-expanded="openCat[g.cat]" @click="openCat[g.cat] = !openCat[g.cat]">
            <span>{{ openCat[g.cat] ? '▾' : '▸' }} {{ g.cat }} <span class="muted small">({{ g.rows.length }})</span></span><b>{{ fmtRp(g.sub) }}</b>
          </button>
          <div v-if="openCat[g.cat]" class="acc-b">
            <div class="table-wrap" style="border:0;border-radius:0">
              <table class="tbl rtable">
                <thead><tr><th>Item</th><th>Sumber</th><th class="right">Tarif</th><th class="right">Qty</th><th class="right">Subtotal</th></tr></thead>
                <tbody>
                  <tr v-if="!g.rows.length"><td class="empty" colspan="5">Tidak ada item.</td></tr>
                  <tr v-for="i in g.rows" :key="i.id">
                    <td data-label="Item">{{ i.nama }}<div v-if="i.manual" class="muted small">Manual: {{ i.alasan }}</div></td>
                    <td data-label="Sumber"><span class="small">{{ i.sumber }}</span><div class="muted small">{{ fmtJam(i.at) }}</div></td>
                    <td data-label="Tarif" class="right">{{ fmtRp(i.tarif) }}</td>
                    <td data-label="Qty" class="right">{{ i.qty }}</td>
                    <td data-label="Subtotal" class="right bold">{{ fmtRp(i.subtotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <h2>Skema bayar</h2>
          <div class="seg" role="group" aria-label="Skema bayar">
            <button v-for="s in ['Tunai', 'BPJS', 'Asuransi']" :key="s" type="button" :class="{ on: sk.skema === s }" :disabled="locked" @click="pilihSkema(s)">{{ s }}</button>
          </div>
          <div v-if="sk.skema === 'Asuransi'" class="field" style="margin-top:12px"><label for="plafon">Plafon asuransi (Rp)</label><input id="plafon" v-model.number="sk.plafon" class="input" type="number" min="0" inputmode="numeric" :disabled="locked" @change="terapkan"></div>
          <div v-if="sk.skema === 'BPJS'" class="field" style="margin-top:12px"><label for="selisih">Selisih / naik kelas dibayar pasien (Rp)</label><input id="selisih" v-model.number="sk.selisih" class="input" type="number" min="0" inputmode="numeric" :disabled="locked" @change="terapkan"><span class="hint">BPJS: porsi pasien Rp 0 kecuali selisih/naik kelas.</span></div>
        </div>

        <div class="card">
          <h2>Ringkasan</h2>
          <dl class="kv" style="grid-template-columns:1fr auto">
            <dt>Subtotal</dt><dd class="right">{{ fmtRp(totals.total) }}</dd>
            <dt>Diskon <span v-if="bill?.diskon?.alasan" class="small">({{ bill.diskon.alasan }})</span></dt><dd class="right">- {{ fmtRp(totals.diskon) }}</dd>
            <dt class="bold">Total tagihan</dt><dd class="right bold">{{ fmtRp(totals.net) }}</dd>
            <dt>Ditanggung penjamin</dt><dd class="right">{{ fmtRp(totals.penjamin) }}</dd>
            <dt>Selisih</dt><dd class="right">{{ fmtRp(totals.selisih) }}</dd>
            <dt class="bold">Dibayar pasien</dt><dd class="right bold" style="color:var(--teal-d);font-size:16px">{{ fmtRp(totals.pasien) }}</dd>
          </dl>
          <div class="row" style="margin-top:12px"><button class="btn" :disabled="locked" @click="bukaDiskon">Beri diskon</button></div>
        </div>

        <div class="card">
          <button v-if="status === 'draf'" class="btn btn-primary btn-lg btn-block" :disabled="!bisaFinal" @click="showFinal = true">Finalkan tagihan</button>
          <p v-if="status === 'draf' && !bisaFinal" class="hint">Finalisasi hanya untuk kunjungan berstatus selesai.</p>
          <NuxtLink v-if="status === 'final'" :to="'/kasir/' + id + '/bayar'" class="btn btn-primary btn-lg btn-block">Lanjut ke pembayaran</NuxtLink>
          <NuxtLink v-if="status === 'lunas'" :to="'/kasir/' + id + '/invoice'" class="btn btn-primary btn-lg btn-block">Lihat invoice & kwitansi</NuxtLink>
        </div>
      </div>
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

    <AppModal v-model="showDiskon" title="Diskon tagihan">
      <div class="form-grid">
        <div class="field full"><label for="d-n">Nominal diskon (Rp)</label><input id="d-n" v-model.number="dk.nominal" class="input" type="number" min="0" inputmode="numeric"></div>
        <div class="field full"><label for="d-a">Alasan (min. 15 karakter)</label><textarea id="d-a" v-model="dk.alasan" class="textarea" /></div>
      </div>
      <template #footer><button class="btn" @click="showDiskon = false">Batal</button><button class="btn btn-primary" @click="simpanDiskon">Simpan diskon</button></template>
    </AppModal>

    <AppModal v-model="showFinal" title="Finalkan tagihan">
      <p>Total tagihan <b>{{ fmtRp(totals.net) }}</b>, dibayar pasien <b>{{ fmtRp(totals.pasien) }}</b> ({{ sk.skema }}).</p>
      <p class="hint">Setelah difinalkan, nomor INV terbit, baris dibekukan, dan skema/diskon/item tidak dapat diubah.</p>
      <template #footer><button class="btn" @click="showFinal = false">Batal</button><button class="btn btn-primary" @click="finalkan">Finalkan</button></template>
    </AppModal>
  </div>
  <div v-else class="card"><h2>Tagihan tidak ditemukan</h2><NuxtLink to="/kasir" class="btn">Kembali</NuxtLink></div>
</template>
