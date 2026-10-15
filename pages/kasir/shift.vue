<script setup lang="ts">
// KS-05 Rekap Penerimaan Shift
const { db, shiftSummary, closeShift, currentShift } = useDb()
const { user } = useAuth()
const toast = useToast()

const bolehTutup = computed(() => user.value?.role === 'kasir')
const tgl = ref(todayStr())
const fKasir = ref('')
const fShift = ref('')
const label = (s: any) => `${s.kasir} ${fmtJam(s.mulai)}–${s.selesai ? fmtJam(s.selesai) : 'berjalan'}`

const semua = computed(() => db.shifts.filter((s: any) => dateOf(s.mulai) === tgl.value))
const kasirList = computed(() => [...new Set(db.shifts.map((s: any) => s.kasir))] as string[])
const rows = computed(() => semua.value
  .filter((s: any) => (!fKasir.value || s.kasir === fKasir.value) && (!fShift.value || s.id === fShift.value))
  .map((s: any) => ({ s, sum: shiftSummary(s) })))
const grand = computed(() => rows.value.reduce((a: any, r: any) => ({ transaksi: a.transaksi + r.sum.transaksi, tunai: a.tunai + r.sum.tunai, qris: a.qris + r.sum.qris, va: a.va + r.sum.va, total: a.total + r.sum.total }), { transaksi: 0, tunai: 0, qris: 0, va: 0, total: 0 }))
const jmlTrx = (m: string) => rows.value.reduce((n: number, r: any) => n + Object.values(db.bills).flatMap((b: any) => b.payments || []).filter((p: any) => (p.shiftId === r.s.id || (!p.shiftId && r.s.id === 'sh1')) && p.metode === m).length, 0)

// ---- rekonsiliasi shift terbuka ----
const aktif = computed(() => currentShift())
const aktifSum = computed(() => (aktif.value ? shiftSummary(aktif.value) : null))
const hitung = ref<number | null>(null)
const catatan = ref('')
const cek = reactive({ tunai: false, digital: false, tertunda: false })
const tunaiHitung = computed(() => (hitung.value === null ? aktifSum.value?.tunai || 0 : Number(hitung.value) || 0))
const selisihTunai = computed(() => tunaiHitung.value - (aktifSum.value?.tunai || 0))
const rekon = computed(() => !aktifSum.value ? [] : [
  { metode: 'Tunai', sistem: aktifSum.value.tunai, konfirmasi: tunaiHitung.value },
  { metode: 'QRIS · simulasi', sistem: aktifSum.value.qris, konfirmasi: aktifSum.value.qris },
  { metode: 'VA · simulasi', sistem: aktifSum.value.va, konfirmasi: aktifSum.value.va },
])
const belumLunas = computed(() => db.visits.filter((v: any) => v.tanggal === tgl.value && v.status === 'selesai' && db.bills[v.id]?.status === 'final').length)
const siapTutup = computed(() => bolehTutup.value && !!aktif.value && cek.tunai && cek.digital && cek.tertunda && (selisihTunai.value === 0 || catatan.value.trim().length >= 10))
const showClose = ref(false)
const mintaTutup = () => {
  if (!cek.tunai || !cek.digital || !cek.tertunda) { toast.err('Lengkapi seluruh checklist sebelum menutup shift'); return }
  if (selisihTunai.value !== 0 && catatan.value.trim().length < 10) { toast.err('Selisih kas: isi catatan rekonsiliasi (min. 10 karakter)'); return }
  showClose.value = true
}
const tutup = () => {
  const s = aktif.value
  if (toast.attempt(() => closeShift(s.id, { tunaiHitung: tunaiHitung.value, catatan: catatan.value }), `Shift ${s.kasir} ditutup — shift baru dimulai`)) {
    showClose.value = false; hitung.value = null; catatan.value = ''; Object.assign(cek, { tunai: false, digital: false, tertunda: false })
  }
}

const ekspor = () => {
  const head = ['Kasir', 'Mulai', 'Selesai', 'Status', 'Transaksi', 'Tunai', 'QRIS', 'VA', 'Total']
  const lines = rows.value.map(({ s, sum }: any) => [s.kasir, fmtWaktu(s.mulai), s.selesai ? fmtWaktu(s.selesai) : '', s.closed ? 'Ditutup' : 'Terbuka', sum.transaksi, sum.tunai, sum.qris, sum.va, sum.total])
  downloadCsv(`rekap-shift-${tgl.value}.csv`, [head, ...lines, ['Total', '', '', '', grand.value.transaksi, grand.value.tunai, grand.value.qris, grand.value.va, grand.value.total]])
  toast.ok('Rekap shift diekspor (CSV, dapat dibuka di Excel)')
}
</script>

<template>
  <div>
    <PageHead code="KS-05" role="Kasir" title="Rekap Penerimaan Shift" :subtitle="`Rekonsiliasi metode pembayaran · ${fmtTgl(tgl)} · ${aktif ? 'Shift aktif masih terbuka' : 'Tidak ada shift terbuka'}`" />

    <div class="filters">
      <input v-model="tgl" type="date" class="input" aria-label="Tanggal">
      <select v-model="fKasir" class="select" aria-label="Filter kasir"><option value="">Semua kasir</option><option v-for="k in kasirList" :key="k">{{ k }}</option></select>
      <select v-model="fShift" class="select" aria-label="Filter shift"><option value="">Semua shift</option><option v-for="s in semua" :key="s.id" :value="s.id">{{ label(s) }}</option></select>
      <button class="btn" @click="ekspor">Export Excel</button>
    </div>

    <div class="grid g4">
      <div class="kpi"><small>Tunai</small><b>{{ fmtRp(grand.tunai) }}</b><span>{{ jmlTrx('Tunai') }} transaksi</span></div>
      <div class="kpi"><small>QRIS · simulasi</small><b>{{ fmtRp(grand.qris) }}</b><span>{{ jmlTrx('QRIS') }} transaksi</span></div>
      <div class="kpi"><small>VA · simulasi</small><b>{{ fmtRp(grand.va) }}</b><span>{{ jmlTrx('VA') }} transaksi</span></div>
      <div class="kpi"><small>Total diterima</small><b>{{ fmtRp(grand.total) }}</b><span>{{ grand.transaksi }} transaksi lunas</span></div>
    </div>

    <div class="card" style="margin-top: 16px">
      <h2>Penerimaan per kasir &amp; shift</h2>
      <div v-if="!bolehTutup" class="alert info" style="margin-bottom: 12px"><span>Mode lihat saja. Penutupan shift dilakukan oleh kasir.</span></div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kasir / shift</th><th>Status</th><th>Transaksi</th><th>Tunai</th><th>QRIS</th><th>VA</th><th>Total</th></tr></thead>
          <tbody>
            <tr v-if="!rows.length"><td class="empty" colspan="7">Tidak ada shift pada filter ini.</td></tr>
            <tr v-for="(r, n) in rows" :key="r.s.id" :class="{ 'row-hl': !r.s.closed && n === 0 }">
              <td data-label="Kasir / shift">{{ r.s.kasir }}<div>{{ fmtJam(r.s.mulai) }}–{{ r.s.selesai ? fmtJam(r.s.selesai) : 'berjalan' }}</div></td>
              <td data-label="Status"><b v-if="!r.s.closed" style="color: var(--teal-d)">Terbuka</b><template v-else>Ditutup {{ fmtJam(r.s.selesai) }}</template></td>
              <td data-label="Transaksi">{{ r.sum.transaksi }}</td>
              <td data-label="Tunai">{{ fmtRp(r.sum.tunai) }}</td>
              <td data-label="QRIS">{{ fmtRp(r.sum.qris) }}</td>
              <td data-label="VA">{{ fmtRp(r.sum.va) }}</td>
              <td data-label="Total" class="num-link">{{ fmtRp(r.sum.total) }}</td>
            </tr>
            <tr v-if="rows.length">
              <td data-label="Kasir / shift">Total hari ini</td><td data-label="Status">{{ grand.transaksi }} lunas</td><td data-label="Transaksi">{{ grand.transaksi }}</td>
              <td data-label="Tunai">{{ fmtRp(grand.tunai) }}</td><td data-label="QRIS">{{ fmtRp(grand.qris) }}</td><td data-label="VA">{{ fmtRp(grand.va) }}</td><td data-label="Total" class="num-link">{{ fmtRp(grand.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="alert" style="margin-top: 14px"><span>Shift yang ditutup tidak dapat diubah. QRIS dan VA memakai gateway stub / simulasi; bukan transaksi produksi.</span></div>
    </div>

    <div v-if="aktif && aktifSum" class="split-r" style="margin-top: 16px; grid-template-columns: minmax(0, 1fr) 380px">
      <div class="card">
        <h2>Rekonsiliasi shift {{ aktif.kasir.split(' ')[0] }} · Terbuka</h2>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead><tr><th>Metode</th><th>Sistem</th><th>Terkonfirmasi</th><th>Selisih</th></tr></thead>
            <tbody>
              <tr v-for="(m, n) in rekon" :key="m.metode" :class="{ 'row-hl': n === 0 }">
                <td data-label="Metode">{{ m.metode }}</td><td data-label="Sistem">{{ fmtRp(m.sistem) }}</td><td data-label="Terkonfirmasi">{{ fmtRp(m.konfirmasi) }}</td>
                <td data-label="Selisih" :class="m.konfirmasi - m.sistem ? '' : 'num-link'" :style="m.konfirmasi - m.sistem ? 'color: var(--err); font-weight: 600' : ''">{{ fmtRp(m.konfirmasi - m.sistem) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="field" style="margin-top: 16px"><label for="uang">Uang tunai terhitung</label><input id="uang" class="input" type="number" min="0" inputmode="numeric" :value="hitung === null ? aktifSum.tunai : hitung" :disabled="!bolehTutup" @input="hitung = Number(($event.target as HTMLInputElement).value)"></div>
        <div class="field" style="margin-top: 14px"><label for="cat">Catatan rekonsiliasi</label><input id="cat" v-model="catatan" class="input" placeholder="Seluruh penerimaan sesuai. Tidak ada selisih." :disabled="!bolehTutup"></div>
        <p v-if="selisihTunai !== 0" class="err-text" style="margin-top: 6px">Selisih kas {{ fmtRp(selisihTunai) }} — wajib dijelaskan pada catatan.</p>
      </div>

      <div class="card">
        <h2>Tutup shift dengan aman</h2>
        <span class="tag" :class="belumLunas ? 't-warn' : 't-ok'">{{ aktifSum.transaksi }} transaksi · {{ belumLunas ? `${belumLunas} tagihan final belum lunas` : 'seluruhnya lunas' }}</span>
        <p style="margin-top: 14px">Pastikan kas fisik sesuai dan semua pembayaran digital terkonfirmasi.</p>
        <div class="chk-list">
          <label class="check"><input v-model="cek.tunai" type="checkbox" :disabled="!bolehTutup"> Tunai telah dihitung</label>
          <label class="check"><input v-model="cek.digital" type="checkbox" :disabled="!bolehTutup"> QRIS / VA telah direkonsiliasi</label>
          <label class="check"><input v-model="cek.tertunda" type="checkbox" :disabled="!bolehTutup"> Tidak ada pembayaran tertunda</label>
        </div>
        <div class="alert"><span>Menutup shift mengunci rekap {{ fmtRp(aktifSum.total) }} dan mencatat waktu serta operator di audit trail.</span></div>
        <div class="row" style="margin-top: 16px"><button class="btn" @click="ekspor">Export rekap</button><button class="btn btn-primary" :disabled="!bolehTutup" @click="mintaTutup">Tutup shift</button></div>
      </div>
    </div>

    <AppModal v-model="showClose" title="Tutup shift">
      <p>Tutup shift <b>{{ aktif?.kasir }}</b> dengan total {{ fmtRp(aktifSum?.total) }}? Rekap shift ini akan terkunci dan shift baru dimulai otomatis.</p>
      <template #footer><button class="btn" @click="showClose = false">Batal</button><button class="btn btn-primary" :disabled="!siapTutup" @click="tutup">Tutup shift</button></template>
    </AppModal>
  </div>
</template>
