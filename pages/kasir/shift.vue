<script setup lang="ts">
// KS-05 Rekap Penerimaan Shift
const { db, shiftSummary, closeShift } = useDb()
const { user } = useAuth()
const toast = useToast()

const bolehTutup = computed(() => user.value?.role === 'kasir')
const rows = computed(() => db.shifts.slice().reverse().map((s: any) => ({ s, sum: shiftSummary(s) })))
const grand = computed(() => rows.value.reduce((a: number, r: any) => a + r.sum.total, 0))

const target = ref<any>(null)
const showClose = ref(false)
const minta = (s: any) => { target.value = s; showClose.value = true }
const tutup = () => {
  if (toast.attempt(() => closeShift(target.value.id), `Shift ${target.value.kasir} ditutup — shift baru dimulai`)) showClose.value = false
}

const ekspor = () => {
  const head = ['Kasir', 'Mulai', 'Selesai', 'Status', 'Transaksi', 'Tunai', 'QRIS', 'VA', 'Total']
  const lines = rows.value.map(({ s, sum }: any) => [s.kasir, fmtWaktu(s.mulai), s.selesai ? fmtWaktu(s.selesai) : '', s.closed ? 'Ditutup' : 'Berjalan', sum.transaksi, sum.tunai, sum.qris, sum.va, sum.total])
  const csv = [head, ...lines].map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = `rekap-shift-${todayStr()}.csv`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast.ok('Rekap shift diekspor (CSV)')
}
</script>

<template>
  <div>
    <PageHead code="KS-05" role="Kasir & Manajemen" title="Rekap Penerimaan Shift" subtitle="Penerimaan per kasir per shift. Shift yang ditutup tidak dapat diubah." :crumbs="['Kasir', 'Rekap shift']">
      <template #actions><button class="btn" @click="ekspor">Ekspor CSV</button></template>
    </PageHead>
    <div class="grid g3" style="margin-bottom:16px">
      <div class="kpi"><small>Total penerimaan</small><b>{{ fmtRp(grand) }}</b><span>seluruh shift</span></div>
      <div class="kpi"><small>Shift berjalan</small><b>{{ db.shifts.filter((s: any) => !s.closed).length }}</b><span>belum ditutup</span></div>
      <div class="kpi"><small>Shift ditutup</small><b>{{ db.shifts.filter((s: any) => s.closed).length }}</b><span>terkunci</span></div>
    </div>
    <div class="card">
      <div v-if="!bolehTutup" class="alert info" style="margin-bottom:12px"><span>Mode lihat saja. Penutupan shift dilakukan oleh kasir.</span></div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kasir</th><th>Mulai</th><th>Selesai</th><th class="right">Transaksi</th><th class="right">Tunai</th><th class="right">QRIS</th><th class="right">VA</th><th class="right">Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="10">Belum ada shift.</td></tr>
            <tr v-for="r in rows" :key="r.s.id">
              <td data-label="Kasir"><b>{{ r.s.kasir }}</b></td>
              <td data-label="Mulai">{{ fmtJam(r.s.mulai) }}</td>
              <td data-label="Selesai">{{ r.s.selesai ? fmtJam(r.s.selesai) : '-' }}</td>
              <td data-label="Transaksi" class="right">{{ r.sum.transaksi }}</td>
              <td data-label="Tunai" class="right">{{ fmtRp(r.sum.tunai) }}</td>
              <td data-label="QRIS" class="right">{{ fmtRp(r.sum.qris) }}</td>
              <td data-label="VA" class="right">{{ fmtRp(r.sum.va) }}</td>
              <td data-label="Total" class="right bold">{{ fmtRp(r.sum.total) }}</td>
              <td data-label="Status"><span class="badge" :class="r.s.closed ? 'b-mute' : 'b-ok'">{{ r.s.closed ? 'Ditutup' : 'Berjalan' }}</span></td>
              <td class="right"><button v-if="bolehTutup && !r.s.closed" class="btn btn-sm btn-primary" @click="minta(r.s)">Tutup shift</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-model="showClose" title="Tutup shift">
      <p>Tutup shift <b>{{ target?.kasir }}</b>? Rekap shift ini akan terkunci dan shift baru dimulai otomatis.</p>
      <template #footer><button class="btn" @click="showClose = false">Batal</button><button class="btn btn-primary" @click="tutup">Tutup shift</button></template>
    </AppModal>
  </div>
</template>
