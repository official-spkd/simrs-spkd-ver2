<script setup lang="ts">
// Menu "Invoice & kwitansi": daftar dokumen INV/KW hari ini; buka untuk pratinjau & cetak (KS-04).
const { db, visit, patient } = useDb()
const q = ref('')
const docs = computed(() => Object.values(db.bills)
  .filter((b: any) => b.status !== 'draf' && visit(b.visitId))
  .map((b: any) => ({ b, v: visit(b.visitId), p: patient(visit(b.visitId).patientId), at: b.payments?.[b.payments.length - 1]?.at || b.finalAt }))
  .filter((d: any) => !q.value.trim() || [d.p?.nama, d.p?.rm, d.b.noInv, d.b.noKw, d.v.noKunjungan].some((t) => t && t.toLowerCase().includes(q.value.trim().toLowerCase())))
  .sort((a: any, b: any) => ((b.at || '') > (a.at || '') ? 1 : -1)))
</script>
<template>
  <div>
    <PageHead code="KS-04" role="Kasir" title="Invoice & Kwitansi" subtitle="Dokumen pembayaran · pilih dokumen untuk preview cetak A4" />
    <div class="kl-filters"><input v-model="q" class="input q" placeholder="⌕ Nama / RM / No. INV / KW" aria-label="Cari dokumen"></div>
    <div class="panel">
      <h2>Dokumen INV / KW</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Invoice / Kwitansi</th><th>Pasien / RM</th><th>Kunjungan</th><th>Status</th><th>Waktu</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-if="!docs.length"><td class="empty" colspan="6">Belum ada tagihan final atau lunas.</td></tr>
            <tr v-for="d in docs" :key="d.b.visitId" class="click" @click="navigateTo(`/kasir/${d.b.visitId}/invoice`)">
              <td data-label="Invoice / Kwitansi">{{ d.b.noInv }}<div class="muted small">{{ d.b.noKw || '-' }}</div></td>
              <td data-label="Pasien / RM">{{ d.p?.nama }}<div>{{ d.p?.rm }}</div></td>
              <td data-label="Kunjungan">{{ d.v.noKunjungan }}</td>
              <td data-label="Status"><span class="badge" :class="statusTagihan(d.b).cls">{{ statusTagihan(d.b).label }}</span></td>
              <td data-label="Waktu">{{ fmtWaktu(d.at) }}</td>
              <td data-label="Aksi"><button class="btn btn-sm btn-ghost" @click.stop="navigateTo(`/kasir/${d.b.visitId}/invoice`)">Buka</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="guide">INV dan KW berasal dari layanan penomoran. Setiap cetak dan cetak ulang dicatat audit.</div>
    </div>
  </div>
</template>
