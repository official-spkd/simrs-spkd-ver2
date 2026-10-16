<script setup lang="ts">
// IT-06 Audit Trail — append-only: hanya baca, tidak ada edit/hapus event. Filter, detail event, dan ekspor.
const { db, patient, poli } = useDb()
useIt()
const toast = useToast()
const route = useRoute()
const PER = 8
const t = todayStr()
const blank = () => ({ q: String(route.query.q || ''), user: '', aksi: '', role: '', dari: t, sampai: t })
const draft = reactive(blank())
const f = reactive(blank())
const page = ref(1)
const terapkan = () => { Object.assign(f, draft); page.value = 1 }
watch(() => route.query.q, (v) => { draft.q = String(v || ''); terapkan() })
watch(() => [draft.user, draft.role, draft.aksi, draft.dari, draft.sampai], terapkan)

const ROLE_AUDIT: Record<string, string> = { fo: 'FO / Admin', dokter: 'Dokter / Perawat', kasir: 'Kasir', mgmt: 'Manajemen', it: 'IT', superadmin: 'IT / Superadmin', apm: 'Perangkat APM' }
const roleTampil = (r: string) => ROLE_AUDIT[r] || r
const userOpsi = computed(() => [...new Set(db.audit.map((a: any) => a.user))].sort() as string[])
const aksiOpsi = computed(() => [...new Set(db.audit.map((a: any) => a.aksi))].sort() as string[])
const rows = computed(() => {
  const s = f.q.trim().toLowerCase()
  return db.audit.filter((a: any) => {
    const d = dateOf(a.at)
    if (f.user && a.user !== f.user) return false
    if (f.aksi && a.aksi !== f.aksi) return false
    if (f.role && a.role !== f.role) return false
    if (f.dari && d < f.dari) return false
    if (f.sampai && d > f.sampai) return false
    if (s && !String(a.objek || '').toLowerCase().includes(s)) return false
    return true
  })
})
const totalPage = computed(() => Math.max(1, Math.ceil(rows.value.length / PER)))
const view = computed(() => rows.value.slice((page.value - 1) * PER, page.value * PER))
watch(totalPage, (n) => { if (page.value > n) page.value = n })
const halaman = computed(() => {
  const n = totalPage.value, p = page.value
  if (n <= 5) return Array.from({ length: n }, (_, i) => i + 1)
  return [...new Set([1, 2, 3, p, n].filter((x) => x >= 1 && x <= n))].sort((a, b) => a - b)
})
const hariIni = computed(() => db.audit.filter((a: any) => dateOf(a.at) === t).length)

// ---- detail event ----
const selId = ref('')
const ev = computed(() => rows.value.find((a: any) => a.id === selId.value) || view.value[0] || null)
const eventId = (a: any) => {
  const idx = db.audit.filter((x: any) => dateOf(x.at) === dateOf(a.at)).reverse().findIndex((x: any) => x.id === a.id)
  return `AUD-${dateOf(a.at).slice(2).replace(/-/g, '')}-${String(idx + 1).padStart(4, '0')}`
}
const kunj = computed(() => (ev.value ? db.visits.find((v: any) => ev.value.objek?.includes(v.noKunjungan)) : null))
const pas = computed(() => (ev.value ? db.patients.find((p: any) => ev.value.objek?.includes('RM ' + p.rm) || ev.value.objek?.includes(p.rm + ' ')) : null))
const dampak = computed(() => {
  const a = ev.value
  if (!a) return ''
  if (/batal kunjungan/.test(a.aksi)) return `Kuota: dilepas +1 · SEP: ${kunj.value?.penjamin === 'BPJS' ? 'dibatalkan (simulasi)' : 'tidak berlaku'}`
  if (/finalkan tagihan/.test(a.aksi)) return 'Tagihan dikunci · snapshot tarif tersimpan'
  if (/terima pembayaran/.test(a.aksi)) return 'Kwitansi terbit · rekap shift bertambah'
  if (/buat kunjungan/.test(a.aksi)) return 'Kuota sesi berkurang 1 · Encounter diantrekan ke outbox'
  if (/ubah identitas|buat pasien/.test(a.aksi)) return 'Resource Patient diantrekan ke outbox Satu Sehat'
  if (/login/.test(a.aksi)) return 'Sesi pengguna dibuat'
  if (/tarif/.test(a.aksi)) return 'Berlaku untuk item baru; tagihan final tidak berubah'
  if (/perangkat/.test(a.aksi)) return 'Token perangkat diperbarui'
  return 'Perubahan tersimpan di database lokal'
})
const sumber = (a: any) => (a.role === 'fo' ? 'Loket' : a.role === 'kasir' ? 'Kasir RJ' : a.role === 'dokter' ? 'Poli' : a.role === 'apm' ? 'APM' : 'Sistem')

const baris = (list: any[]) => [['Event ID', 'Waktu', 'User', 'Role', 'Aksi', 'Objek', 'Alasan / detail', 'IP'], ...list.map((a: any) => [eventId(a), a.at, a.user, roleTampil(a.role), a.aksi, a.objek, a.alasan, a.ip])]
const ekspor = () => {
  if (!rows.value.length) return toast.warn('Tidak ada data untuk diekspor')
  downloadCsv(`audit-trail-${f.dari || 'awal'}_${f.sampai || t}.csv`, baris(rows.value))
  toast.ok(`Audit diekspor (${rows.value.length} event) · buka dengan Excel`)
}
const eksporSatu = () => { if (ev.value) { downloadCsv(`${eventId(ev.value)}.csv`, baris([ev.value])); toast.ok('Event diekspor') } }
const objek = ref<any>(null)
const lihatObjek = () => {
  const v = kunj.value
  if (v) {
    const p = patient(v.patientId)
    objek.value = { judul: `Kunjungan ${v.noKunjungan}`, data: { noKunjungan: v.noKunjungan, pasien: p?.nama, rm: p?.rm, poli: poli(v.poliId)?.nama, antrean: v.antreanPoli?.nomor, penjamin: v.penjamin, status: v.status, pembatalan: v.pembatalan || undefined } }
  } else if (pas.value) objek.value = { judul: `Pasien RM ${pas.value.rm}`, data: { rm: pas.value.rm, nama: pas.value.nama, nik: maskNik(pas.value.nik), penjamin: pas.value.penjamin } }
  else toast.warn('Objek bukan kunjungan/pasien atau tidak ditemukan di database lokal')
}
</script>

<template>
  <div>
    <PageHead code="IT-06" role="IT" title="Audit Trail" subtitle="Jejak aktivitas append-only · Hanya baca · Tidak tersedia edit atau hapus event" />
    <div class="kl-filters" style="margin-bottom: 24px">
      <label class="sr-only" for="a-dari">Dari tanggal</label>
      <input id="a-dari" v-model="draft.dari" type="date" class="input" />
      <span class="muted">–</span>
      <label class="sr-only" for="a-sampai">Sampai tanggal</label>
      <input id="a-sampai" v-model="draft.sampai" type="date" class="input" />
      <label class="sr-only" for="a-user">User</label>
      <select id="a-user" v-model="draft.user" class="select"><option value="">Semua user</option><option v-for="u in userOpsi" :key="u">{{ u }}</option></select>
      <label class="sr-only" for="a-role">Role</label>
      <select id="a-role" v-model="draft.role" class="select"><option value="">Semua role</option><option v-for="(l, r) in ROLE_AUDIT" :key="r" :value="r">{{ l }}</option></select>
      <label class="sr-only" for="a-aksi">Aksi</label>
      <select id="a-aksi" v-model="draft.aksi" class="select"><option value="">Semua aksi</option><option v-for="x in aksiOpsi" :key="x">{{ x }}</option></select>
      <label class="sr-only" for="a-q">ID objek</label>
      <input id="a-q" v-model="draft.q" class="input" style="min-width: 140px" placeholder="⌕ ID objek" @keyup.enter="terapkan" />
      <button class="btn" @click="terapkan">Terapkan</button>
      <button class="btn" @click="ekspor">Export Excel</button>
    </div>

    <div class="guide" style="margin-bottom: 24px">Event ditambahkan permanen dengan waktu, pengguna, role, alasan, dan IP. Rekaman tidak dapat ditimpa atau dihapus.</div>

    <div class="panel">
      <h2>Aktivitas sistem</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Waktu</th><th>User / role</th><th>Aksi</th><th>Objek</th><th>Alasan / detail</th><th>IP</th></tr></thead>
          <tbody>
            <tr v-for="a in view" :key="a.id" class="click" :class="{ sel: ev?.id === a.id }" @click="selId = a.id">
              <td data-label="Waktu">{{ fmtTglPendek(a.at) }} {{ fmtJamDetik(a.at) }}</td>
              <td data-label="User / role">{{ a.user }}<div>{{ roleTampil(a.role) }}</div></td>
              <td data-label="Aksi">{{ a.aksi }}</td>
              <td data-label="Objek">{{ a.objek }}</td>
              <td data-label="Alasan / detail">{{ a.alasan || '-' }}</td>
              <td data-label="IP" style="color: var(--teal-d)">{{ a.ip }}</td>
            </tr>
            <tr v-if="!view.length"><td colspan="6" class="empty">Tidak ada event untuk filter ini</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager-kl">
        <span>{{ view.length }} dari {{ rows.length }} event{{ f.dari === t && f.sampai === t ? ' hari ini' : '' }} ·</span>
        <button :disabled="page <= 1" @click="page--">‹ Sebelumnya</button>
        <button v-for="n in halaman" :key="n" :class="{ on: n === page }" @click="page = n">{{ n }}</button>
        <button :disabled="page >= totalPage" @click="page++">Berikutnya ›</button>
      </div>
    </div>

    <div v-if="ev" class="kl-cols half" style="margin-top: 16px">
      <div class="panel">
        <h2>Detail event · {{ ev.aksi }}</h2>
        <div><span class="badge b-navy">Event tersimpan permanen</span></div>
        <p>{{ fmtTglPanjang(ev.at).split(', ')[1] }} · {{ fmtJamDetik(ev.at) }} · {{ ev.user }} · {{ roleTampil(ev.role) }}</p>
        <p>Objek: {{ ev.objek }}<template v-if="kunj"> · {{ patient(kunj.patientId)?.nama }} · {{ kunj.antreanPoli?.nomor }}</template></p>
        <p v-if="kunj?.pembatalan">Status awal: terdaftar → dibatalkan · {{ kunj.pembatalan.alasan }}</p>
        <p>Alasan: {{ ev.alasan || '-' }}</p>
      </div>
      <div class="panel">
        <h2>Dampak tercatat</h2>
        <p>{{ dampak }}</p>
        <p>IP: {{ ev.ip }} · Sumber: {{ sumber(ev) }}</p>
        <p>Event ID: {{ eventId(ev) }} · {{ kunj ? 'Kunjungan tetap tersimpan.' : 'Data asal tetap tersimpan.' }}</p>
        <div class="kl-actions">
          <button class="btn" @click="eksporSatu">Export event ini</button>
          <button class="btn" :disabled="!kunj && !pas" @click="lihatObjek">{{ kunj ? 'Lihat objek kunjungan' : 'Lihat objek' }}</button>
        </div>
      </div>
    </div>

    <AppModal :model-value="!!objek" :title="objek?.judul || ''" @update:model-value="objek = null">
      <p class="muted small" style="margin-bottom: 8px">Hanya baca · dari database lokal.</p>
      <pre class="json-box">{{ JSON.stringify(objek?.data, null, 2) }}</pre>
      <template #footer><button class="btn btn-primary" @click="objek = null">Tutup</button></template>
    </AppModal>
  </div>
</template>
