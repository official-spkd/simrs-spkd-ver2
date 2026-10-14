<script setup lang="ts">
const { db } = useDb()
const toast = useToast()
const route = useRoute()
const PER = 25
const f = reactive({ q: String(route.query.q || ''), aksi: '', role: '', dari: '', sampai: '' })
const page = ref(1)
watch(() => route.query.q, (v) => { f.q = String(v || '') })
watch(f, () => (page.value = 1))

const aksiOpsi = computed(() => [...new Set(db.audit.map((a: any) => a.aksi))].sort() as string[])
const rows = computed(() => {
  const s = f.q.trim().toLowerCase()
  return db.audit.filter((a: any) => {
    const d = dateOf(a.at)
    if (f.aksi && a.aksi !== f.aksi) return false
    if (f.role && a.role !== f.role) return false
    if (f.dari && d < f.dari) return false
    if (f.sampai && d > f.sampai) return false
    if (s && ![a.user, a.aksi, a.objek, a.alasan, a.ip].some((x: any) => String(x || '').toLowerCase().includes(s))) return false
    return true
  })
})
const totalPage = computed(() => Math.max(1, Math.ceil(rows.value.length / PER)))
const view = computed(() => rows.value.slice((page.value - 1) * PER, page.value * PER))
watch(totalPage, (n) => { if (page.value > n) page.value = n })
const reset = () => Object.assign(f, { q: '', aksi: '', role: '', dari: '', sampai: '' })
const ekspor = () => {
  if (!rows.value.length) return toast.warn('Tidak ada data untuk diekspor')
  downloadCsv(`audit-trail-${todayStr()}.csv`, [['Waktu', 'User', 'Role', 'Aksi', 'Objek', 'Alasan', 'IP'], ...rows.value.map((a: any) => [a.at, a.user, a.role, a.aksi, a.objek, a.alasan, a.ip])])
  toast.ok(`Audit diekspor (${rows.value.length} baris)`)
}
</script>

<template>
  <div>
    <PageHead code="IT-06" role="IT & Management" title="Audit Trail" subtitle="Catatan append-only: tidak dapat diubah atau dihapus oleh siapa pun.">
      <template #actions><button class="btn" @click="ekspor">Ekspor CSV</button></template>
    </PageHead>
    <div class="card">
      <div class="filters">
        <div class="field"><label for="a-q">Cari</label><input id="a-q" v-model="f.q" class="input" placeholder="User, objek, alasan, no. kunjungan" style="min-width: 220px" /></div>
        <div class="field"><label for="a-aksi">Aksi</label>
          <select id="a-aksi" v-model="f.aksi" class="select"><option value="">Semua aksi</option><option v-for="a in aksiOpsi" :key="a" :value="a">{{ a }}</option></select>
        </div>
        <div class="field"><label for="a-role">Role</label>
          <select id="a-role" v-model="f.role" class="select"><option value="">Semua role</option><option value="fo">fo</option><option value="dokter">dokter</option><option value="kasir">kasir</option><option value="mgmt">mgmt</option><option value="it">it</option></select>
        </div>
        <div class="field"><label for="a-dari">Dari</label><input id="a-dari" v-model="f.dari" type="date" class="input" /></div>
        <div class="field"><label for="a-sampai">Sampai</label><input id="a-sampai" v-model="f.sampai" type="date" class="input" /></div>
        <button class="btn" @click="reset">Atur ulang</button>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Waktu</th><th>User</th><th>Role</th><th>Aksi</th><th>Objek</th><th>Alasan</th><th>IP</th></tr></thead>
          <tbody>
            <tr v-for="a in view" :key="a.id">
              <td data-label="Waktu" class="nowrap">{{ fmtWaktu(a.at) }}</td>
              <td data-label="User">{{ a.user }}</td>
              <td data-label="Role"><span class="badge b-navy">{{ a.role }}</span></td>
              <td data-label="Aksi"><b>{{ a.aksi }}</b></td>
              <td data-label="Objek">{{ a.objek }}</td>
              <td data-label="Alasan" class="small">{{ a.alasan || '-' }}</td>
              <td data-label="IP" class="mono small">{{ a.ip }}</td>
            </tr>
            <tr v-if="!view.length"><td colspan="7" class="empty">Tidak ada catatan audit pada filter ini</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span>{{ rows.length }} catatan · halaman {{ page }} / {{ totalPage }}</span>
        <span>
          <button :disabled="page <= 1" @click="page--">Sebelumnya</button>
          <button :disabled="page >= totalPage" @click="page++">Berikutnya</button>
        </span>
      </div>
    </div>
  </div>
</template>
