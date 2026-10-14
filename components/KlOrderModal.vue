<script setup lang="ts">
// KL-05 modal order (2 tab: Resep / Tindakan)
const props = defineProps<{ modelValue: boolean; visitId: string; initialTab?: 'resep' | 'tindakan' }>()
const emit = defineEmits(['update:modelValue'])
const { db, visit, doctor, addOrder, removeOrder, hargaDari, billTotals } = useDb()
const toast = useToast()

const v = computed(() => visit(props.visitId))
const tab = ref<string>('resep')
const TABS = [{ key: 'resep', label: 'Resep' }, { key: 'tindakan', label: 'Tindakan' }]
watch(() => props.modelValue, (o) => { if (o) { tab.value = props.initialTab || 'resep'; resetForm() } })

const qObat = ref('')
const qTind = ref('')
const pilih = ref<any>(null)
const form = reactive<any>({ dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '', pelaksana: '' })
const resetForm = () => {
  pilih.value = null; qObat.value = ''; qTind.value = ''
  Object.assign(form, { dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '', pelaksana: doctor(v.value?.doctorId)?.nama || '' })
}
watch(tab, () => { pilih.value = null })

const obatList = computed(() => db.obat.filter((o: any) => o.nama.toLowerCase().includes(qObat.value.trim().toLowerCase())))
const tindList = computed(() => db.tarif.filter((t: any) => t.kategori === 'Tindakan' && t.nama.toLowerCase().includes(qTind.value.trim().toLowerCase())))
const harga = (kind: 'obat' | 'tarif', id: string) => hargaDari(kind, id, v.value.penjamin)

const items = computed(() => (db.orders[props.visitId] || []))
const total = computed(() => billTotals(props.visitId).total)

const tambah = () => {
  if (!pilih.value) { toast.err(tab.value === 'resep' ? 'Pilih obat terlebih dahulu' : 'Pilih tindakan terlebih dahulu'); return }
  const jml = Number(form.jumlah)
  if (!jml || jml < 1) { toast.err('Jumlah minimal 1'); return }
  if (tab.value === 'resep' && !form.aturan.trim()) { toast.err('Aturan pakai wajib diisi'); return }
  const base = tab.value === 'resep'
    ? { jenis: 'resep', nama: pilih.value.nama, refId: pilih.value.id, jumlah: jml, dosis: form.dosis, aturan: form.aturan, racikan: !!form.racikan, catatan: form.catatan }
    : { jenis: 'tindakan', nama: pilih.value.nama, refId: pilih.value.id, jumlah: jml, pelaksana: form.pelaksana, catatan: form.catatan }
  if (toast.attempt(() => addOrder(props.visitId, base), `${pilih.value.nama} ditambahkan`)) {
    pilih.value = null; Object.assign(form, { dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '' })
  }
}
const hapus = (o: any) => toast.attempt(() => removeOrder(props.visitId, o.id), `${o.nama} dihapus`)
const kirim = () => {
  emit('update:modelValue', false)
  toast.ok(items.value.length ? 'Order dikirim — item tagihan terbentuk di kasir' : 'Tidak ada order ditambahkan')
}
</script>

<template>
  <AppModal :model-value="modelValue" title="Order Resep & Tindakan" size="lg" @update:model-value="emit('update:modelValue', $event)">
    <AppTabs v-model="tab" :tabs="TABS" />

    <div v-if="tab === 'resep'" class="stack" style="gap:12px">
      <div class="field"><label for="o-q">Cari obat</label><input id="o-q" v-model="qObat" class="input" placeholder="Nama obat…"></div>
      <div class="table-wrap" style="max-height:200px;overflow:auto">
        <table class="tbl">
          <tbody>
            <tr v-if="!obatList.length"><td class="empty">Obat tidak ditemukan</td></tr>
            <tr v-for="o in obatList" :key="o.id" class="click" :class="{ hl: pilih?.id === o.id }" tabindex="0" @click="pilih = o" @keydown.enter="pilih = o">
              <td>{{ o.nama }}</td><td class="right nowrap">{{ fmtRp(harga('obat', o.id)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pilih" class="alert"><span>Dipilih: <b>{{ pilih.nama }}</b></span></div>
      <div class="form-grid">
        <div class="field"><label for="o-dosis">Dosis</label><input id="o-dosis" v-model="form.dosis" class="input" placeholder="mis. 500 mg"></div>
        <div class="field"><label class="req" for="o-aturan">Aturan pakai</label><input id="o-aturan" v-model="form.aturan" class="input" placeholder="mis. 3 x 1 sesudah makan"></div>
        <div class="field"><label for="o-jml">Jumlah</label><input id="o-jml" v-model.number="form.jumlah" class="input" type="number" min="1" inputmode="numeric"></div>
        <div class="field"><span class="lbl">Jenis</span>
          <div class="seg"><button type="button" :class="{ on: !form.racikan }" @click="form.racikan = false">Non-racikan</button><button type="button" :class="{ on: form.racikan }" @click="form.racikan = true">Racikan</button></div>
        </div>
        <div class="field full"><label for="o-cat">Catatan</label><input id="o-cat" v-model="form.catatan" class="input"></div>
      </div>
      <div class="row"><button class="btn btn-primary" @click="tambah">Tambah resep</button></div>
    </div>

    <div v-else class="stack" style="gap:12px">
      <div class="field"><label for="t-q">Cari tindakan</label><input id="t-q" v-model="qTind" class="input" placeholder="Nama tindakan…"></div>
      <div class="table-wrap" style="max-height:200px;overflow:auto">
        <table class="tbl">
          <tbody>
            <tr v-if="!tindList.length"><td class="empty">Tindakan tidak ditemukan</td></tr>
            <tr v-for="t in tindList" :key="t.id" class="click" :class="{ hl: pilih?.id === t.id }" tabindex="0" @click="pilih = t" @keydown.enter="pilih = t">
              <td>{{ t.nama }}</td><td class="right nowrap">{{ fmtRp(harga('tarif', t.id)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="pilih" class="alert"><span>Dipilih: <b>{{ pilih.nama }}</b></span></div>
      <div class="form-grid">
        <div class="field"><label for="t-jml">Jumlah</label><input id="t-jml" v-model.number="form.jumlah" class="input" type="number" min="1" inputmode="numeric"></div>
        <div class="field"><label for="t-pel">Pelaksana</label><input id="t-pel" v-model="form.pelaksana" class="input"></div>
        <div class="field full"><label for="t-cat">Catatan</label><input id="t-cat" v-model="form.catatan" class="input"></div>
      </div>
      <div class="row"><button class="btn btn-primary" @click="tambah">Tambah tindakan</button></div>
    </div>

    <h3 style="margin:18px 0 8px">Order kunjungan ini ({{ items.length }})</h3>
    <div class="table-wrap">
      <table class="tbl rtable">
        <thead><tr><th>Jenis</th><th>Item</th><th>Qty</th><th class="right">Harga</th><th></th></tr></thead>
        <tbody>
          <tr v-if="!items.length"><td class="empty" colspan="5">Belum ada order.</td></tr>
          <tr v-for="o in items" :key="o.id">
            <td data-label="Jenis"><span class="badge" :class="o.jenis === 'resep' ? 'b-info' : 'b-teal'">{{ o.jenis }}</span></td>
            <td data-label="Item">{{ o.nama }}<div class="muted small">{{ o.jenis === 'resep' ? [o.dosis, o.aturan, o.racikan ? 'racikan' : ''].filter(Boolean).join(' · ') : o.pelaksana }}</div></td>
            <td data-label="Qty">{{ o.jumlah }}</td>
            <td data-label="Harga" class="right">{{ fmtRp(hargaDari(o.jenis === 'resep' ? 'obat' : 'tarif', o.refId, v.penjamin) * o.jumlah) }}</td>
            <td class="right"><button class="btn btn-sm btn-danger" @click="hapus(o)">Hapus</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint">Total sementara tagihan ({{ v.penjamin }}): <b>{{ fmtRp(total) }}</b></p>

    <template #footer>
      <button class="btn" @click="emit('update:modelValue', false)">Tutup</button>
      <button class="btn btn-primary" @click="kirim">Kirim</button>
    </template>
  </AppModal>
</template>
