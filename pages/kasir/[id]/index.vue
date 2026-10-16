<script setup lang="ts">
// KS-02 Detail Tagihan
const route = useRoute()
const { db, visit, patient, getSoap, billItems, billTotals, setSkema, addManualItem, setDiskon, finalizeBill } = useDb()
const toast = useToast()

const id = computed(() => String(route.params.id))
const v = computed(() => visit(id.value))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const bill = computed(() => db.bills[id.value])
const status = computed(() => bill.value?.status || 'draf')
const locked = computed(() => status.value !== 'draf')
const items = computed(() => billItems(id.value))
const totals = computed(() => billTotals(id.value))
const soapFinal = computed(() => !!(v.value && getSoap(id.value).signed))
onMounted(() => { try { localStorage.setItem(KS_AKTIF_KEY, id.value) } catch {} })

// versi tarif aktif (master IT-04)
const tarifAktif = computed(() => db.tarif.reduce((m: any, t: any) => (!m || t.berlaku > m.berlaku ? t : m), null))
const subjudul = computed(() => `${locked.value ? 'Tagihan final · baris dibekukan' : 'Draf tagihan dari pelayanan klinis'} · Tarif v${tarifAktif.value?.versi || 1} / berlaku ${fmtTglPanjang(tarifAktif.value?.berlaku).replace(/^\w+, /, '')}`)

// baris rincian berurutan per kategori; kategori kosong "Lainnya" tetap ditampilkan
const LABEL: Record<string, string> = { Administrasi: 'Administrasi / karcis', Konsultasi: 'Konsultasi', Tindakan: 'Tindakan', 'Obat/resep': 'Obat / resep', Lainnya: 'Lainnya' }
const URUT = ['Administrasi', 'Konsultasi', 'Tindakan', 'Obat/resep', 'Lainnya']
const baris = computed(() => {
  const list = items.value.slice().sort((a: any, b: any) => URUT.indexOf(URUT.includes(a.kategori) ? a.kategori : 'Lainnya') - URUT.indexOf(URUT.includes(b.kategori) ? b.kategori : 'Lainnya'))
  return list.map((i: any) => ({ ...i, label: i.kategori === 'Administrasi' ? 'Administrasi / karcis' : i.kategori === 'Konsultasi' ? i.nama : `${LABEL[i.kategori] || 'Lainnya'} · ${i.nama}` }))
})
const adaLainnya = computed(() => items.value.some((i: any) => !['Administrasi', 'Konsultasi', 'Tindakan', 'Obat/resep'].includes(i.kategori)))
const sumber = (i: any) => `${String(i.sumber || '-').replace(/^KL-05 · /, '')} · ${fmtJam(i.at)}`

// ---- skema bayar (Tunai internal = "Umum") ----
const SKEMA = [{ key: 'Tunai', label: 'Umum' }, { key: 'BPJS', label: 'BPJS' }, { key: 'Asuransi', label: 'Asuransi' }]
const sk = reactive({ skema: 'Tunai', plafon: 0, selisih: 0 })
const syncSk = () => {
  sk.skema = bill.value?.skema || (v.value?.penjamin === 'BPJS' ? 'BPJS' : v.value?.penjamin === 'Asuransi' ? 'Asuransi' : 'Tunai')
  sk.plafon = bill.value?.plafon || 0
  sk.selisih = bill.value?.selisih || 0
}
syncSk()
watch(() => [id.value, bill.value?.skema, bill.value?.plafon, bill.value?.selisih], syncSk)
const terapkan = () => toast.attempt(() => setSkema(id.value, sk.skema, sk.plafon, sk.selisih), `Skema bayar: ${labelSkema(sk.skema)}`)
const pilihSkema = (s: string) => { if (!locked.value && s !== sk.skema) { sk.skema = s; terapkan() } }
const skemaEl = ref<HTMLElement | null>(null)
const ubahSkema = () => skemaEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
const selisihAsuransi = computed(() => Math.max(0, totals.value.net - (Number(sk.plafon) || 0)))

// ---- tambah item (modal) ----
const showManual = ref(false)
const man = reactive({ nama: '', tarif: 0, qty: 1, alasan: '' })
const bukaManual = () => { Object.assign(man, { nama: '', tarif: 0, qty: 1, alasan: '' }); showManual.value = true }
const simpanManual = () => {
  if (!man.nama.trim()) return toast.err('Nama item wajib diisi')
  if (!(man.tarif > 0) || !(man.qty > 0)) return toast.err('Tarif dan qty harus lebih dari 0')
  if (toast.attempt(() => addManualItem(id.value, { ...man }), 'Item manual ditambahkan')) showManual.value = false
}

// ---- penyesuaian manual & diskon (inline) ----
const adj = reactive({ nilai: 0, diskon: 0, alasanNilai: '', alasanDiskon: '' })
const muatDiskon = () => { adj.diskon = bill.value?.diskon?.nominal || 0; adj.alasanDiskon = bill.value?.diskon?.alasan || '' }
muatDiskon()
watch(() => [id.value, bill.value?.diskon?.nominal], muatDiskon)
const simpanPenyesuaian = () => {
  const nilai = Number(adj.nilai) || 0
  const diskon = Number(adj.diskon) || 0
  if (nilai > 0 && adj.alasanNilai.trim().length < 15) return toast.err('Alasan penyesuaian manual minimal 15 karakter')
  if (diskon > 0 && adj.alasanDiskon.trim().length < 15) return toast.err('Alasan diskon minimal 15 karakter')
  if (diskon < 0 || diskon > totals.value.total + nilai) return toast.err('Nominal diskon tidak valid')
  if (nilai > 0 && !toast.attempt(() => addManualItem(id.value, { nama: 'Penyesuaian manual', tarif: nilai, qty: 1, alasan: adj.alasanNilai.trim() }))) return
  if (diskon !== (bill.value?.diskon?.nominal || 0) || adj.alasanDiskon !== (bill.value?.diskon?.alasan || '')) {
    if (!toast.attempt(() => setDiskon(id.value, diskon, adj.alasanDiskon.trim()))) return
  }
  adj.nilai = 0; adj.alasanNilai = ''
  toast.ok('Penyesuaian disimpan · tercatat audit')
}

// ---- finalisasi ----
const showFinal = ref(false)
const bisaFinal = computed(() => v.value?.status === 'selesai' && status.value === 'draf')
const finalkan = () => {
  showFinal.value = false
  if (toast.attempt(() => finalizeBill(id.value), 'Tagihan difinalkan — nomor INV terbit, baris dibekukan')) navigateTo('/kasir/' + id.value + '/bayar')
}
</script>

<template>
  <div v-if="v && pt">
    <PageHead code="KS-02" role="Kasir" title="Detail Tagihan" :subtitle="subjudul" />
    <PatientBanner :patient="pt" :visit="v" />

    <div class="kl-actions" style="margin-bottom: 16px; gap: 16px">
      <span class="badge" :class="statusTagihan(bill).cls">Tagihan: {{ status === 'draf' ? 'Draf' : status === 'final' ? 'Final · ' + bill.noInv : 'Lunas · ' + bill.noKw }}</span>
      <span class="badge" :class="v.status === 'selesai' || v.status === 'lunas' ? 'b-ok' : 'b-warn'">{{ v.status === 'selesai' || v.status === 'lunas' ? (soapFinal ? 'SOAP final · pelayanan selesai' : 'Pelayanan selesai') : 'Pelayanan masih ' + v.status + ' di poli' }}</span>
    </div>
    <div v-if="v.status !== 'selesai' && v.status !== 'lunas'" class="guide warn" style="margin-bottom: 16px">Kunjungan masih <b>&nbsp;{{ v.status }}&nbsp;</b> di poli. Total masih sementara; finalisasi diblokir sampai status selesai.</div>

    <div class="kl-cols" style="grid-template-columns: minmax(0, 1fr) 345px">
      <div class="kl-col">
        <div class="panel">
          <h2>Rincian item pelayanan</h2>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Kategori / item</th><th>Sumber / waktu</th><th>Tarif</th><th>Qty</th><th>Subtotal</th></tr></thead>
              <tbody>
                <tr v-for="i in baris" :key="i.id">
                  <td data-label="Kategori / item">{{ i.label }}<div v-if="i.manual" class="muted small">Manual: {{ i.alasan }}</div></td>
                  <td data-label="Sumber / waktu">{{ sumber(i) }}</td>
                  <td data-label="Tarif">{{ fmtRp(i.tarif) }}</td>
                  <td data-label="Qty">{{ i.qty }}</td>
                  <td data-label="Subtotal" style="color: var(--teal-d)">{{ fmtRp(i.subtotal) }}</td>
                </tr>
                <tr v-if="!adaLainnya"><td data-label="Kategori / item">Lainnya</td><td data-label="Sumber / waktu">Tidak ada item</td><td data-label="Tarif">{{ fmtRp(0) }}</td><td data-label="Qty">0</td><td data-label="Subtotal" style="color: var(--teal-d)">{{ fmtRp(0) }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="kl-actions">
            <button class="btn" :disabled="locked" @click="bukaManual">Tambah item</button>
            <button class="btn" :disabled="locked" @click="ubahSkema">Ubah skema</button>
          </div>
          <div class="guide"><AppIcon name="info" :size="18" /> Finalisasi membekukan baris dan menerbitkan nomor INV. Tarif berikutnya tidak mengubah tagihan final.</div>
        </div>

        <div class="panel">
          <h2>Penyesuaian manual</h2>
          <div class="form-grid">
            <div class="field"><label for="a-nilai">Nilai penyesuaian (Rp)</label><input id="a-nilai" v-model.number="adj.nilai" class="input" type="number" min="0" inputmode="numeric" :disabled="locked"></div>
            <div class="field"><label for="a-disk">Diskon (Rp)</label><input id="a-disk" v-model.number="adj.diskon" class="input" type="number" min="0" inputmode="numeric" :disabled="locked"></div>
          </div>
          <div class="field"><label for="a-al">Alasan penyesuaian manual · minimal 15 karakter</label><input id="a-al" v-model="adj.alasanNilai" class="input" :disabled="locked" placeholder="Tidak ada penyesuaian pada tagihan ini"></div>
          <div class="field"><label for="a-ad">Alasan diskon · wajib jika memberi diskon</label><input id="a-ad" v-model="adj.alasanDiskon" class="input" :disabled="locked" placeholder="Tidak ada diskon"></div>
          <div class="kl-actions" style="align-items: center">
            <button class="btn" :disabled="locked" @click="simpanPenyesuaian">Simpan penyesuaian</button>
            <span class="hint" style="margin: 0">Setiap perubahan item, skema, dan diskon tercatat audit.</span>
          </div>
        </div>
      </div>

      <div class="kl-col">
        <div ref="skemaEl" class="panel">
          <h2>Skema pembayaran</h2>
          <div class="tabs" role="tablist" style="margin: 0">
            <button v-for="s in SKEMA" :key="s.key" type="button" role="tab" :class="{ on: sk.skema === s.key }" :aria-selected="sk.skema === s.key" :disabled="locked" @click="pilihSkema(s.key)">{{ s.label }}</button>
          </div>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Komponen</th><th>Nominal</th></tr></thead>
              <tbody>
                <tr><td>Subtotal</td><td style="color: var(--teal-d)">{{ fmtRp(totals.total) }}</td></tr>
                <tr><td>Diskon</td><td style="color: var(--teal-d)">{{ fmtRp(totals.diskon) }}</td></tr>
                <tr><td>Total tagihan</td><td style="color: var(--teal-d)">{{ fmtRp(totals.net) }}</td></tr>
                <tr><td>Ditanggung penjamin</td><td style="color: var(--teal-d)">{{ fmtRp(totals.penjamin) }}</td></tr>
                <tr><td>Porsi pasien</td><td style="color: var(--teal-d)">{{ fmtRp(totals.pasien) }}</td></tr>
                <tr><td>Selisih</td><td style="color: var(--teal-d)">{{ fmtRp(totals.selisih) }}</td></tr>
              </tbody>
            </table>
          </div>
          <p style="font-size: 30px; font-weight: 600; color: var(--navy)">{{ fmtRp(totals.pasien) }}</p>
          <p class="muted">Total dibayar pasien · {{ labelSkema(sk.skema) }}</p>
        </div>

        <div class="panel">
          <h2>Aturan penjamin</h2>
          <p>BPJS: porsi pasien Rp0, kecuali selisih / naik kelas.</p>
          <div class="form-grid">
            <div class="field"><label for="plafon">Plafon Asuransi · manual</label><input id="plafon" v-model.number="sk.plafon" class="input" type="number" min="0" inputmode="numeric" :disabled="locked || sk.skema !== 'Asuransi'" @change="terapkan"></div>
            <div class="field"><label for="sa">Selisih bila Asuransi</label><input id="sa" :value="fmtRp(selisihAsuransi)" class="input" disabled></div>
          </div>
          <div v-if="sk.skema === 'BPJS'" class="field"><label for="selisih">Selisih / naik kelas BPJS (Rp)</label><input id="selisih" v-model.number="sk.selisih" class="input" type="number" min="0" inputmode="numeric" :disabled="locked" @change="terapkan"></div>
          <p class="hint" style="margin: 0">Skema aktif {{ labelSkema(sk.skema) }}; total pasien {{ fmtRp(totals.pasien) }}. Plafon dan selisih diisi manual di MVP.</p>
        </div>
      </div>
    </div>

    <div class="kl-actions" style="margin-top: 16px">
      <NuxtLink to="/kasir" class="btn">Kembali</NuxtLink>
      <button v-if="status === 'draf'" class="btn btn-primary" :disabled="!bisaFinal" :title="bisaFinal ? '' : 'Hanya kunjungan berstatus selesai yang dapat difinalkan'" @click="showFinal = true">Finalkan tagihan (INV)</button>
      <NuxtLink v-else-if="status === 'final'" :to="'/kasir/' + id + '/bayar'" class="btn btn-primary">Lanjut ke pembayaran</NuxtLink>
      <NuxtLink v-else :to="'/kasir/' + id + '/invoice'" class="btn btn-primary">Lihat invoice &amp; kwitansi</NuxtLink>
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
      <p>Total tagihan <b>{{ fmtRp(totals.net) }}</b>, dibayar pasien <b>{{ fmtRp(totals.pasien) }}</b> ({{ labelSkema(sk.skema) }}).</p>
      <p class="hint">Setelah difinalkan, nomor INV terbit, baris dibekukan, dan skema/diskon/item tidak dapat diubah.</p>
      <template #footer><button class="btn" @click="showFinal = false">Batal</button><button class="btn btn-primary" @click="finalkan">Finalkan</button></template>
    </AppModal>
  </div>
  <div v-else class="card"><h2>Tagihan tidak ditemukan</h2><NuxtLink to="/kasir" class="btn">Kembali</NuxtLink></div>
</template>
