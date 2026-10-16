<script setup lang="ts">
// KS-05 Rekap Penerimaan Shift: rekap per kasir & shift, rekonsiliasi, tutup shift (data dari /api/v1/cashier/shifts)
const { user } = useAuth()
const toast = useToast()
const bolehTutup = computed(() => user.value?.role === 'kasir')

// filter
const tanggal = ref(todayStr())
const kasir = ref('')
const shiftId = ref('')
const shiftHari = ref<any[]>([])
const tertunda = ref(0) // pembayaran tertunda = tagihan final (belum lunas)
const loading = ref(false)
const galat = ref('')
const muat = async () => {
  loading.value = true
  try {
    // tagihan tertunda hanya dipakai kasir saat menutup shift; manajemen cukup melihat rekap
    const [list, final] = await Promise.all([kasirApi.shifts(tanggal.value), bolehTutup.value ? kasirApi.dokumen('', 'final') : Promise.resolve([])])
    shiftHari.value = list
    tertunda.value = final.length
    galat.value = ''
  } catch (e: any) {
    galat.value = e instanceof ApiError && e.status === 403 ? 'Akun ini tidak memiliki akses ke rekap shift kasir.' : pesanKasir(e)
  } finally {
    loading.value = false
  }
}
onMounted(muat)
watch(tanggal, () => { shiftId.value = ''; muat() })
const daftarKasir = computed(() => [...new Set(shiftHari.value.map((s: any) => s.kasir))])
const rows = computed(() => shiftHari.value
  .filter((s: any) => (!kasir.value || s.kasir === kasir.value) && (!shiftId.value || s.id === shiftId.value))
  .map((s: any) => ({ s, sum: s.sum })))
watch(kasir, () => (shiftId.value = ''))

const total = computed(() => rows.value.reduce((a, r) => ({
  transaksi: a.transaksi + r.sum.transaksi, tunai: a.tunai + r.sum.tunai, qris: a.qris + r.sum.qris, va: a.va + r.sum.va, total: a.total + r.sum.total,
}), { transaksi: 0, tunai: 0, qris: 0, va: 0, total: 0 }))
// jumlah transaksi per metode memakai rekap yang sama dari server
const jumlahPer = (k: 'nTunai' | 'nQris' | 'nVa') => rows.value.reduce((a, r) => a + r.sum[k], 0)
const jam = (s: any) => `${fmtJam(s.mulai)}–${s.selesai ? fmtJam(s.selesai) : 'sekarang'}`
const terbuka = computed(() => shiftHari.value.find((s: any) => !s.closed && s.kasirId === user.value?.id) || shiftHari.value.find((s: any) => !s.closed))
const subjudul = computed(() => `Rekonsiliasi metode pembayaran · ${fmtTglPanjang(tanggal.value).replace(/^\w+, /, '')} · ${terbuka.value ? 'Shift aktif masih terbuka' : 'Semua shift ditutup'}`)

// rekonsiliasi shift terbuka (server hanya mengizinkan kasir pemilik shift menutupnya)
const target = computed(() => (shiftId.value ? shiftHari.value.find((s: any) => s.id === shiftId.value && !s.closed) : null) || terbuka.value)
const sumTarget = computed(() => target.value?.sum || { transaksi: 0, tunai: 0, qris: 0, va: 0, total: 0, nTunai: 0, nQris: 0, nVa: 0 })
const rekon = reactive({ tunai: 0, catatan: '', cekTunai: false, cekDigital: false, cekTertunda: false })
watch(() => [target.value?.id, sumTarget.value.tunai], () => { rekon.tunai = sumTarget.value.tunai }, { immediate: true })
const selisihTunai = computed(() => (Number(rekon.tunai) || 0) - sumTarget.value.tunai)
const milikSaya = computed(() => !!target.value && target.value.kasirId === user.value?.id)
const bisaTutup = computed(() => bolehTutup.value && milikSaya.value && rekon.cekTunai && rekon.cekDigital && rekon.cekTertunda && (selisihTunai.value === 0 || rekon.catatan.trim().length >= 10))
const showClose = ref(false)
const tutup = async () => {
  showClose.value = false
  const t = target.value
  const terkunci = sumTarget.value.total
  if (await aksiKasir(() => kasirApi.tutupShift(t.id, Number(rekon.tunai) || 0, rekon.catatan), `Shift ${t.kasir} ditutup · rekap ${fmtRp(terkunci)} terkunci`)) {
    Object.assign(rekon, { catatan: '', cekTunai: false, cekDigital: false, cekTertunda: false })
    shiftId.value = ''
    await muat()
  }
}

// ekspor Excel (tabel HTML .xls agar terbuka langsung di Excel)
const ekspor = (hanyaTarget = false) => {
  const data = hanyaTarget && target.value ? [{ s: target.value, sum: sumTarget.value }] : rows.value
  const head = ['Kasir', 'Shift', 'Status', 'Transaksi', 'Tunai', 'QRIS', 'VA', 'Total']
  const tr = (c: any[]) => '<tr>' + c.map((x) => `<td>${String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`).join('') + '</tr>'
  const body = data.map(({ s, sum }: any) => tr([s.kasir, jam(s), s.closed ? 'Ditutup ' + fmtJam(s.selesai) : 'Terbuka', sum.transaksi, sum.tunai, sum.qris, sum.va, sum.total])).join('')
  const html = `<html><head><meta charset="utf-8"></head><body><table><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${body}</table></body></html>`
  const url = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/vnd.ms-excel' }))
  const a = document.createElement('a')
  a.href = url; a.download = `rekap-shift-${tanggal.value}.xls`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast.ok('Rekap shift diekspor (Excel)')
}
</script>

<template>
  <div>
    <PageHead code="KS-05" :role="bolehTutup ? 'Kasir' : 'Kasir & Manajemen'" title="Rekap Penerimaan Shift" :subtitle="subjudul" />

    <div class="kl-filters">
      <input v-model="tanggal" class="input" type="date" aria-label="Tanggal">
      <select v-model="kasir" class="select" aria-label="Kasir"><option value="">Semua kasir</option><option v-for="k in daftarKasir" :key="k" :value="k">{{ k }}</option></select>
      <select v-model="shiftId" class="select" aria-label="Shift"><option value="">Semua shift</option><option v-for="s in shiftHari.filter((x: any) => !kasir || x.kasir === kasir)" :key="s.id" :value="s.id">{{ s.kasir }} · {{ jam(s) }}</option></select>
      <button class="btn" :disabled="loading" @click="muat">{{ loading ? 'Memuat…' : 'Segarkan' }}</button>
      <button class="btn" @click="ekspor()">Export Excel</button>
    </div>
    <div v-if="galat" class="guide warn" style="margin-bottom: 16px">{{ galat }}</div>

    <div class="grid g4" style="margin-bottom: 16px">
      <div class="kl-kpi"><small>Tunai</small><b>{{ fmtRp(total.tunai) }}</b><span>{{ jumlahPer('nTunai') }} transaksi</span></div>
      <div class="kl-kpi"><small>QRIS · simulasi</small><b>{{ fmtRp(total.qris) }}</b><span>{{ jumlahPer('nQris') }} transaksi</span></div>
      <div class="kl-kpi"><small>VA · simulasi</small><b>{{ fmtRp(total.va) }}</b><span>{{ jumlahPer('nVa') }} transaksi</span></div>
      <div class="kl-kpi"><small>Total diterima</small><b>{{ fmtRp(total.total) }}</b><span>{{ total.transaksi }} transaksi</span></div>
    </div>

    <div class="panel">
      <h2>Penerimaan per kasir &amp; shift</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kasir / shift</th><th>Status</th><th>Transaksi</th><th>Tunai</th><th>QRIS</th><th>VA</th><th>Total</th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="7">Belum ada shift pada tanggal ini.</td></tr>
            <tr v-for="r in rows" :key="r.s.id" :class="{ sel: !r.s.closed }">
              <td data-label="Kasir / shift">{{ r.s.kasir }}<div>{{ jam(r.s) }}</div></td>
              <td data-label="Status"><span v-if="!r.s.closed" class="badge b-teal">Terbuka</span><span v-else>Ditutup {{ fmtJam(r.s.selesai) }}</span></td>
              <td data-label="Transaksi">{{ r.sum.transaksi }}</td>
              <td data-label="Tunai">{{ fmtRp(r.sum.tunai) }}</td>
              <td data-label="QRIS">{{ fmtRp(r.sum.qris) }}</td>
              <td data-label="VA">{{ fmtRp(r.sum.va) }}</td>
              <td data-label="Total" style="color: var(--teal-d)">{{ fmtRp(r.sum.total) }}</td>
            </tr>
            <tr v-if="rows.length > 1">
              <td data-label="Kasir / shift">Total hari ini</td><td data-label="Status">{{ total.transaksi }} transaksi</td><td data-label="Transaksi">{{ total.transaksi }}</td>
              <td data-label="Tunai">{{ fmtRp(total.tunai) }}</td><td data-label="QRIS">{{ fmtRp(total.qris) }}</td><td data-label="VA">{{ fmtRp(total.va) }}</td>
              <td data-label="Total" style="color: var(--teal-d)">{{ fmtRp(total.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="guide">Shift yang ditutup tidak dapat diubah. QRIS dan VA memakai gateway stub / simulasi; bukan transaksi produksi.</div>
    </div>

    <div v-if="target" class="kl-cols" style="margin-top: 16px">
      <div class="panel">
        <h2>Rekonsiliasi shift {{ target.kasir }} · Terbuka</h2>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Metode</th><th>Sistem</th><th>Terkonfirmasi</th><th>Selisih</th></tr></thead>
            <tbody>
              <tr><td>Tunai</td><td>{{ fmtRp(sumTarget.tunai) }}</td><td>{{ fmtRp(Number(rekon.tunai) || 0) }}</td><td :style="selisihTunai ? 'color: var(--err)' : 'color: var(--teal-d)'">{{ fmtRp(selisihTunai) }}</td></tr>
              <tr><td>QRIS · simulasi</td><td>{{ fmtRp(sumTarget.qris) }}</td><td>{{ fmtRp(sumTarget.qris) }}</td><td style="color: var(--teal-d)">{{ fmtRp(0) }}</td></tr>
              <tr><td>VA · simulasi</td><td>{{ fmtRp(sumTarget.va) }}</td><td>{{ fmtRp(sumTarget.va) }}</td><td style="color: var(--teal-d)">{{ fmtRp(0) }}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="field"><label for="rk-t">Uang tunai terhitung</label><input id="rk-t" v-model.number="rekon.tunai" class="input" type="number" min="0" inputmode="numeric" :disabled="!bolehTutup"></div>
        <div class="field"><label :class="{ req: selisihTunai !== 0 }" for="rk-c">Catatan rekonsiliasi</label><input id="rk-c" v-model="rekon.catatan" class="input" :disabled="!bolehTutup" :placeholder="selisihTunai ? 'Wajib: jelaskan penyebab selisih (min. 10 karakter)' : 'Seluruh penerimaan sesuai. Tidak ada selisih.'"></div>
      </div>
      <div class="panel">
        <h2>Tutup shift dengan aman</h2>
        <div><span class="badge" :class="tertunda ? 'b-warn' : 'b-ok'">{{ sumTarget.transaksi }} transaksi · {{ tertunda ? tertunda + ' tagihan final belum dibayar' : 'seluruhnya lunas' }}</span></div>
        <p>Pastikan kas fisik sesuai dan semua pembayaran digital terkonfirmasi.</p>
        <label class="check"><input v-model="rekon.cekTunai" type="checkbox" :disabled="!bolehTutup"> Tunai telah dihitung</label>
        <label class="check"><input v-model="rekon.cekDigital" type="checkbox" :disabled="!bolehTutup"> QRIS / VA telah direkonsiliasi</label>
        <label class="check"><input v-model="rekon.cekTertunda" type="checkbox" :disabled="!bolehTutup"> Tidak ada pembayaran tertunda</label>
        <div class="guide">Menutup shift mengunci rekap {{ fmtRp(sumTarget.total) }} dan mencatat waktu serta operator di audit trail.</div>
        <div v-if="!bolehTutup" class="guide warn">Mode lihat saja. Penutupan shift dilakukan oleh kasir.</div>
        <div v-else-if="!milikSaya" class="guide warn">Shift ini milik {{ target.kasir }}; hanya kasir tersebut yang dapat menutupnya.</div>
        <div class="kl-actions">
          <button class="btn" @click="ekspor(true)">Export rekap</button>
          <button class="btn btn-primary" :disabled="!bisaTutup" @click="showClose = true">Tutup shift</button>
        </div>
      </div>
    </div>
    <div v-else class="guide" style="margin-top: 16px">Tidak ada shift terbuka. Shift baru dimulai otomatis setelah shift sebelumnya ditutup.</div>

    <AppModal v-model="showClose" title="Tutup shift">
      <p>Tutup shift <b>{{ target?.kasir }}</b> ({{ target ? jam(target) : '' }})? Rekap {{ fmtRp(sumTarget.total) }} akan terkunci dan shift baru dimulai otomatis.</p>
      <p v-if="selisihTunai" class="err-text" style="margin-top: 8px">Selisih tunai {{ fmtRp(selisihTunai) }} · {{ rekon.catatan }}</p>
      <template #footer><button class="btn" @click="showClose = false">Batal</button><button class="btn btn-primary" @click="tutup">Tutup shift</button></template>
    </AppModal>
  </div>
</template>
