<script setup lang="ts">
// KL-05 Daftar Resep & Tindakan
const props = defineProps<{ visitId: string; editable: boolean }>()
const { db, visit, getSoap, removeOrder, hargaDari, billTotals } = useDb()
const toast = useToast()

const v = computed(() => visit(props.visitId))
const locked = computed(() => !props.editable || getSoap(props.visitId).signed)
const show = ref(false)
const initial = ref<'resep' | 'tindakan'>('resep')
const buka = (t: 'resep' | 'tindakan') => { initial.value = t; show.value = true }

const all = computed(() => db.orders[props.visitId] || [])
const resep = computed(() => all.value.filter((o: any) => o.jenis === 'resep'))
const tindakan = computed(() => all.value.filter((o: any) => o.jenis === 'tindakan'))
const totals = computed(() => billTotals(props.visitId))
const harga = (o: any) => hargaDari(o.jenis === 'resep' ? 'obat' : 'tarif', o.refId, v.value.penjamin)
const hapus = (o: any) => toast.attempt(() => removeOrder(props.visitId, o.id), `${o.nama} dihapus`)
</script>

<template>
  <div class="stack">
    <div v-if="getSoap(visitId).signed" class="alert info"><span>SOAP sudah ditandatangani — order terkunci.</span></div>
    <div class="card">
      <div class="row between"><h2 style="margin:0">Resep (catatan resep)</h2><button class="btn btn-primary" :disabled="locked" @click="buka('resep')">+ Tambah resep</button></div>
      <div class="table-wrap" style="margin-top:12px">
        <table class="tbl rtable">
          <thead><tr><th>Obat</th><th>Dosis</th><th>Aturan pakai</th><th>Jumlah</th><th>Jenis</th><th class="right">Harga ({{ v.penjamin }})</th><th></th></tr></thead>
          <tbody>
            <tr v-if="!resep.length"><td class="empty" colspan="7">Belum ada resep.</td></tr>
            <tr v-for="o in resep" :key="o.id">
              <td data-label="Obat">{{ o.nama }}<div v-if="o.catatan" class="muted small">{{ o.catatan }}</div></td>
              <td data-label="Dosis">{{ o.dosis || '-' }}</td><td data-label="Aturan">{{ o.aturan }}</td><td data-label="Jumlah">{{ o.jumlah }}</td>
              <td data-label="Jenis">{{ o.racikan ? 'Racikan' : 'Non-racikan' }}</td>
              <td data-label="Harga" class="right">{{ fmtRp(harga(o) * o.jumlah) }}</td>
              <td class="right"><button v-if="!locked" class="btn btn-sm btn-danger" @click="hapus(o)">Hapus</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="row between"><h2 style="margin:0">Tindakan</h2><button class="btn btn-primary" :disabled="locked" @click="buka('tindakan')">+ Tambah tindakan</button></div>
      <div class="table-wrap" style="margin-top:12px">
        <table class="tbl rtable">
          <thead><tr><th>Tindakan</th><th>Jumlah</th><th>Pelaksana</th><th class="right">Harga ({{ v.penjamin }})</th><th></th></tr></thead>
          <tbody>
            <tr v-if="!tindakan.length"><td class="empty" colspan="5">Belum ada tindakan.</td></tr>
            <tr v-for="o in tindakan" :key="o.id">
              <td data-label="Tindakan">{{ o.nama }}</td><td data-label="Jumlah">{{ o.jumlah }}</td><td data-label="Pelaksana">{{ o.pelaksana || '-' }}</td>
              <td data-label="Harga" class="right">{{ fmtRp(harga(o) * o.jumlah) }}</td>
              <td class="right"><button v-if="!locked" class="btn btn-sm btn-danger" @click="hapus(o)">Hapus</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card row between">
      <span class="muted">Total sementara tagihan (termasuk karcis & konsultasi)</span>
      <b style="font-size:18px">{{ fmtRp(totals.total) }}</b>
    </div>
    <KlOrderModal v-model="show" :visit-id="visitId" :initial-tab="initial" />
  </div>
</template>
