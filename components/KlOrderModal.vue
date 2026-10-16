<script setup lang="ts">
// KL-05 Order Resep & Tindakan — item baru ditampung dulu, baru tercatat (billable event) saat "Kirim".
const props = defineProps<{ modelValue: boolean; visitId: string; initialTab?: 'resep' | 'tindakan' }>()
const emit = defineEmits(['update:modelValue'])
const { db, visit, patient, doctor, addOrder, removeOrder, hargaDari } = useDb()
const toast = useToast()

const v = computed(() => visit(props.visitId))
const pt = computed(() => (v.value ? patient(v.value.patientId) : null))
const TABS = [{ key: 'resep', label: 'Resep' }, { key: 'tindakan', label: 'Tindakan' }]
const tab = ref<string>('resep')

// form resep & tindakan (dua kolom berdampingan seperti desain; tab memilih kolom pada layar sempit)
const qObat = ref('')
const qTind = ref('')
const obat = ref<any>(null)
const tind = ref<any>(null)
const fokusObat = ref(false)
const fokusTind = ref(false)
const r = reactive<any>({ dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '' })
const t = reactive<any>({ jumlah: 1, pelaksana: '', catatan: '' })
const pending = ref<any[]>([])
const pilihan = ref<string[]>([])

const resetForm = () => {
  obat.value = null; tind.value = null; qObat.value = ''; qTind.value = ''
  Object.assign(r, { dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '' })
  Object.assign(t, { jumlah: 1, pelaksana: doctor(v.value?.doctorId)?.nama || '', catatan: '' })
}
watch(() => props.modelValue, (o) => {
  if (!o) return
  tab.value = props.initialTab || 'resep'
  pending.value = []; pilihan.value = []
  resetForm()
  nextTick(() => document.getElementById(tab.value === 'resep' ? 'o-q' : 't-q')?.focus())
})
watch(tab, (k) => nextTick(() => document.getElementById(k === 'resep' ? 'o-q' : 't-q')?.focus()))

const harga = (kind: 'obat' | 'tarif', id: string) => hargaDari(kind, id, v.value.penjamin)
const obatList = computed(() => db.obat.filter((o: any) => !o.nonaktif?.[v.value.penjamin] && o.nama.toLowerCase().includes(qObat.value.trim().toLowerCase())).slice(0, 8))
const tindList = computed(() => db.tarif.filter((x: any) => x.kategori === 'Tindakan' && !x.nonaktif?.[v.value.penjamin] && x.nama.toLowerCase().includes(qTind.value.trim().toLowerCase())).slice(0, 8))
const pilihObat = (o: any) => { obat.value = o; qObat.value = o.nama; fokusObat.value = false }
const pilihTind = (x: any) => { tind.value = x; qTind.value = x.nama; fokusTind.value = false }
const lepas = (k: 'o' | 't') => setTimeout(() => (k === 'o' ? (fokusObat.value = false) : (fokusTind.value = false)), 150)

const tambahResep = () => {
  if (!obat.value || qObat.value !== obat.value.nama) return toast.err('Pilih obat dari daftar terlebih dahulu')
  if (!r.dosis.trim()) return toast.err('Dosis wajib diisi')
  if (!r.aturan.trim()) return toast.err('Aturan pakai wajib diisi')
  if (!(Number(r.jumlah) >= 1)) return toast.err('Jumlah minimal 1')
  pending.value.push({ key: uidLokal(), jenis: 'resep', nama: obat.value.nama, refId: obat.value.id, jumlah: Number(r.jumlah), dosis: r.dosis, aturan: r.aturan, racikan: !!r.racikan, catatan: r.catatan })
  obat.value = null; qObat.value = ''
  Object.assign(r, { dosis: '', aturan: '', jumlah: 1, racikan: false, catatan: '' })
}
const tambahTindakan = () => {
  if (!tind.value || qTind.value !== tind.value.nama) return toast.err('Pilih tindakan dari daftar terlebih dahulu')
  if (!(Number(t.jumlah) >= 1)) return toast.err('Jumlah minimal 1')
  if (!t.pelaksana.trim()) return toast.err('Pelaksana wajib diisi')
  pending.value.push({ key: uidLokal(), jenis: 'tindakan', nama: tind.value.nama, refId: tind.value.id, jumlah: Number(t.jumlah), pelaksana: t.pelaksana, catatan: t.catatan })
  tind.value = null; qTind.value = ''
  Object.assign(t, { jumlah: 1, catatan: '' })
}
let seq = 0
const uidLokal = () => 'baru-' + ++seq

// tabel: order tersimpan + item baru (belum dikirim)
const rows = computed(() => [
  ...(db.orders[props.visitId] || []).map((o: any) => ({ ...o, key: o.id, baru: false })),
  ...pending.value.map((o: any) => ({ ...o, baru: true })),
])
const tarif = (o: any) => harga(o.jenis === 'resep' ? 'obat' : 'tarif', o.refId)
const detail = (o: any) => (o.jenis === 'resep' ? [o.dosis, o.aturan, o.racikan ? 'racikan' : ''].filter(Boolean).join(' · ') : o.pelaksana || '-')
const hapus = (o: any) => {
  if (o.baru) pending.value = pending.value.filter((x) => x.key !== o.key)
  else toast.attempt(() => removeOrder(props.visitId, o.id), `${o.nama} dihapus`)
  pilihan.value = pilihan.value.filter((k) => k !== o.key)
}
const hapusTerpilih = () => {
  if (!pilihan.value.length) return toast.err('Centang item yang akan dihapus')
  rows.value.filter((o) => pilihan.value.includes(o.key)).forEach(hapus)
}
const total = computed(() => rows.value.reduce((s, o) => s + tarif(o) * o.jumlah, 0))

const tutup = () => emit('update:modelValue', false)
const batal = () => {
  if (pending.value.length && !confirm(`${pending.value.length} item baru belum dikirim. Buang?`)) return
  tutup()
}
const kirim = () => {
  const n = pending.value.length
  for (const o of [...pending.value]) {
    const { key, ...data } = o
    if (!toast.attempt(() => addOrder(props.visitId, data))) return
    pending.value = pending.value.filter((x) => x.key !== key)
  }
  pending.value = []
  tutup()
  toast.ok(n ? `${n} order dikirim — item tagihan terbentuk di kasir` : 'Tidak ada order baru')
}
</script>

<template>
  <AppModal :model-value="modelValue" code="KL-05 · KLINIS" title="Order Resep & Tindakan" subtitle="Item dicatat dalam Plan dan diteruskan sebagai tagihan sesuai tarif penjamin." size="xl" @update:model-value="(o: boolean) => (o ? emit('update:modelValue', o) : batal())">
    <div v-if="v && pt" class="kl-col" style="gap: 20px">
      <PatientBanner :patient="pt" :visit="v" style="margin: 0; box-shadow: none" />
      <AppTabs v-model="tab" :tabs="TABS" style="margin: 0" />

      <div class="kl-cols half kl-order" :data-tab="tab">
        <div class="kl-col kl-o-resep">
          <h2 style="font-size: 17px; font-weight: 600; color: var(--text)">Resep</h2>
          <div class="field"><label class="req" for="o-q">Cari obat</label>
            <div style="position: relative">
              <input id="o-q" v-model="qObat" class="input" placeholder="Nama obat…" autocomplete="off" @focus="fokusObat = true" @blur="lepas('o')" @input="obat = null">
              <div v-if="fokusObat && obatList.length" class="sugg">
                <button v-for="o in obatList" :key="o.id" type="button" @mousedown.prevent="pilihObat(o)"><span>{{ o.nama }}</span><span class="muted">{{ fmtRp(harga('obat', o.id)) }}</span></button>
              </div>
            </div>
          </div>
          <div class="form-grid">
            <div class="field"><label class="req" for="o-dosis">Dosis</label><input id="o-dosis" v-model="r.dosis" class="input" placeholder="mis. 5 mg"></div>
            <div class="field"><label class="req" for="o-aturan">Aturan pakai</label><input id="o-aturan" v-model="r.aturan" class="input" placeholder="mis. 1 tablet 1× sehari, malam"></div>
            <div class="field"><label class="req" for="o-jml">Jumlah</label><input id="o-jml" v-model.number="r.jumlah" class="input" type="number" min="1" inputmode="numeric"></div>
            <div class="field"><label for="o-jenis">Jenis resep</label>
              <select id="o-jenis" v-model="r.racikan" class="select"><option :value="false">Non-racikan</option><option :value="true">Racikan</option></select>
            </div>
          </div>
          <div class="field"><label for="o-cat">Catatan</label><input id="o-cat" v-model="r.catatan" class="input"></div>
          <div><button class="btn btn-primary" @click="tambahResep">Tambah resep</button></div>
        </div>

        <div class="kl-col kl-o-tind">
          <h2 style="font-size: 17px; font-weight: 600; color: var(--text)">Tindakan</h2>
          <div class="field"><label class="req" for="t-q">Cari tindakan</label>
            <div style="position: relative">
              <input id="t-q" v-model="qTind" class="input" placeholder="Nama tindakan…" autocomplete="off" @focus="fokusTind = true" @blur="lepas('t')" @input="tind = null">
              <div v-if="fokusTind && tindList.length" class="sugg">
                <button v-for="x in tindList" :key="x.id" type="button" @mousedown.prevent="pilihTind(x)"><span>{{ x.nama }}</span><span class="muted">{{ fmtRp(harga('tarif', x.id)) }}</span></button>
              </div>
            </div>
          </div>
          <div class="form-grid">
            <div class="field"><label class="req" for="t-jml">Jumlah</label><input id="t-jml" v-model.number="t.jumlah" class="input" type="number" min="1" inputmode="numeric"></div>
            <div class="field"><label class="req" for="t-pel">Pelaksana</label><input id="t-pel" v-model="t.pelaksana" class="input"></div>
          </div>
          <div class="field"><label for="t-cat">Catatan tindakan</label><input id="t-cat" v-model="t.catatan" class="input"></div>
          <div><button class="btn" @click="tambahTindakan">Tambah tindakan</button></div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th style="width: 36px"><span class="sr-only">Pilih</span></th><th>Jenis / item</th><th>Dosis / pelaksanaan</th><th>Jumlah</th><th>Tarif {{ v.penjamin }}</th><th>Subtotal</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="7">Belum ada order.</td></tr>
            <tr v-for="o in rows" :key="o.key" :class="{ sel: pilihan.includes(o.key) }">
              <td><input v-model="pilihan" type="checkbox" :value="o.key" :aria-label="'Pilih ' + o.nama"></td>
              <td data-label="Jenis / item">{{ o.jenis === 'resep' ? 'Resep' : 'Tindakan' }} · {{ o.nama }} <span v-if="o.baru" class="badge b-warn">baru</span></td>
              <td data-label="Dosis / pelaksanaan">{{ detail(o) }}</td>
              <td data-label="Jumlah">{{ o.jumlah }}</td>
              <td data-label="Tarif">{{ fmtRp(tarif(o)) }}</td>
              <td data-label="Subtotal">{{ fmtRp(tarif(o) * o.jumlah) }}</td>
              <td data-label="Aksi"><button class="btn btn-sm btn-ghost" @click="hapus(o)">Hapus</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint" style="margin: 0">Total order ({{ v.penjamin }}): <b>{{ fmtRp(total) }}</b><template v-if="pending.length"> · {{ pending.length }} item baru belum dikirim</template></p>
      <div class="guide"><AppIcon name="info" :size="18" /> Resep hanya catatan Plan dan item tagihan. Tidak membuat antrean atau workflow farmasi. Kedua jenis item membentuk billable event untuk kasir.</div>
    </div>

    <template #footer>
      <button class="btn" @click="batal">Batal</button>
      <button class="btn" @click="hapusTerpilih">Hapus terpilih</button>
      <button class="btn btn-primary" @click="kirim">Kirim</button>
    </template>
  </AppModal>
</template>
