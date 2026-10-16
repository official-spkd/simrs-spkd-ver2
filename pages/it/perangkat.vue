<script setup lang="ts">
// IT-07 Perangkat Terdaftar — otorisasi APM & display antrean. Display terikat ke papan antrean tertentu (bukan parameter URL);
// kode registrasi sekali pakai berlaku 10 menit. Simulasi lokal (belum ada endpoint perangkat di backend).
const { db } = useDb()
const { registerDevice, kodeBaru, aktivasi, cabut, heartbeat } = useIt()
const toast = useToast()
const TIPE: Record<string, string> = { APM: 'APM', Display: 'Display antrean' }

const now = ref(Date.now())
let iv: any
onMounted(() => { heartbeat(); iv = setInterval(() => { now.value = Date.now(); heartbeat() }, 30000) })
onBeforeUnmount(() => clearInterval(iv))

const aktif = computed(() => db.devices.filter((d: any) => d.terdaftar))
const online = computed(() => aktif.value.filter((d: any) => d.online))
const offline = computed(() => aktif.value.filter((d: any) => !d.online))
const menit = (iso: string | null) => (iso ? Math.max(0, Math.round((now.value - new Date(iso).getTime()) / 60000)) : 0)

const fTipe = ref('')
const fUnit = ref('')
const fStatus = ref('')
const unitOpsi = computed(() => [...new Set(db.devices.map((d: any) => d.unit))].sort() as string[])
const status = (d: any) => (!d.terdaftar ? (d.kode ? 'menunggu' : 'dicabut') : d.online ? 'online' : 'offline')
const rows = computed(() => db.devices.filter((d: any) => (!fTipe.value || d.tipe === fTipe.value) && (!fUnit.value || d.unit === fUnit.value) && (!fStatus.value || status(d) === fStatus.value)))
const segarkan = () => { heartbeat(); now.value = Date.now(); toast.ok('Status perangkat diperbarui') }

// ---- registrasi ----
const papan = computed(() => [
  'Registrasi RJ',
  'Papan Loket 1–3',
  ...db.polis.filter((p: any) => p.aktif).map((p: any) => `Poli ${p.nama} · ${p.ruang}`),
])
const blank = () => ({ nama: '', tipe: 'Display', unit: '', terikat: '' })
const f = reactive<any>(blank())
const baru = ref<any>(null)
const pending = computed(() => (baru.value ? db.devices.find((d: any) => d.id === baru.value) : null))
const kodeSisa = computed(() => (pending.value?.kodeExp ? Math.max(0, Math.ceil((new Date(pending.value.kodeExp).getTime() - now.value) / 60000)) : 0))
watch(() => f.tipe, (t) => { if (t === 'APM') f.terikat = 'Registrasi RJ' })
const formEl = ref<HTMLElement | null>(null)
const mulai = () => { Object.assign(f, blank()); baru.value = null; formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }); nextTick(() => document.getElementById('pf-nama')?.focus()) }
const daftar = () => {
  const d = toast.attempt(() => registerDevice({ ...f }))
  if (d) { baru.value = d.id; toast.ok(`Kode registrasi ${d.kode} dibuat · berlaku 10 menit`) }
}
const kodeUlang = (id?: string) => {
  const k = toast.attempt(() => kodeBaru(id || baru.value))
  if (k) { if (id) baru.value = id; toast.ok(`Kode baru ${k} · berlaku 10 menit`) }
}
const showAkt = ref(false)
const kodeIn = ref('')
const aktivasiKode = () => {
  const d = toast.attempt(() => aktivasi(baru.value, kodeIn.value))
  if (d) { showAkt.value = false; kodeIn.value = ''; toast.ok(`${d.nama} aktif · token terikat ke ${d.terikat}`); baru.value = null; Object.assign(f, blank()) }
}
const cabutAkses = (d: any) => {
  if (!confirm(`Cabut akses ${d.nama}? Token perangkat diputus dan perangkat harus registrasi ulang.`)) return
  if (toast.attempt(() => cabut(d.id))) toast.ok(`Akses ${d.nama} dicabut`)
}
const detail = ref<any>(null)
</script>

<template>
  <div>
    <PageHead code="IT-07" role="IT" title="Perangkat Terdaftar" subtitle="Otorisasi APM dan display antrean · Binding papan antrean dikelola server" />

    <div class="grid g3">
      <div class="kl-kpi"><small>Perangkat aktif</small><b>{{ aktif.length }}</b><span>{{ aktif.filter((d: any) => d.tipe === 'APM').length }} APM · {{ aktif.filter((d: any) => d.tipe === 'Display').length }} display</span></div>
      <div class="kl-kpi"><small>Online</small><b>{{ online.length }}</b><span>Heartbeat &lt; 60 detik</span></div>
      <div class="kl-kpi"><small>Offline</small><b>{{ offline.length }}</b><span>{{ offline[0] ? `${offline[0].nama} · sejak ${fmtJam(offline[0].lastSeen)}` : 'Semua perangkat terhubung' }}</span></div>
    </div>

    <div class="kl-cols" style="margin-top: 16px">
      <div class="kl-col">
        <div class="panel">
          <h2>Daftar perangkat</h2>
          <div class="kl-filters" style="margin: 0">
            <label class="sr-only" for="pf-t">Tipe</label>
            <select id="pf-t" v-model="fTipe" class="select"><option value="">Semua tipe</option><option value="APM">APM</option><option value="Display">Display</option></select>
            <label class="sr-only" for="pf-u">Unit</label>
            <select id="pf-u" v-model="fUnit" class="select"><option value="">Semua unit</option><option v-for="u in unitOpsi" :key="u">{{ u }}</option></select>
            <label class="sr-only" for="pf-s">Status</label>
            <select id="pf-s" v-model="fStatus" class="select"><option value="">Semua status</option><option value="online">Online</option><option value="offline">Offline</option><option value="menunggu">Menunggu kode</option><option value="dicabut">Dicabut</option></select>
          </div>
          <div class="kl-actions">
            <button class="btn btn-primary" @click="mulai">+ Registrasi perangkat</button>
            <button class="btn" @click="segarkan">Segarkan</button>
          </div>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Nama / tipe</th><th>Unit</th><th>Binding</th><th>Status</th><th>Terakhir terlihat</th><th>Kode / akses</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="d in rows" :key="d.id" :class="{ sel: baru === d.id }">
                  <td data-label="Nama / tipe">{{ d.nama }}<div>{{ d.tipe }}</div></td>
                  <td data-label="Unit">{{ d.unit }}</td>
                  <td data-label="Binding">{{ d.terikat }}</td>
                  <td data-label="Status">
                    <span v-if="status(d) === 'online'" class="badge b-ok">● Online</span>
                    <span v-else-if="status(d) === 'offline'" class="badge b-warn">○ Offline</span>
                    <span v-else-if="status(d) === 'menunggu'" class="badge b-navy">Menunggu kode</span>
                    <span v-else class="badge b-mute">Dicabut</span>
                  </td>
                  <td data-label="Terakhir terlihat">{{ d.lastSeen ? fmtJamDetik(d.lastSeen) : '—' }}</td>
                  <td data-label="Kode / akses"><template v-if="d.terdaftar">Terpakai sekali</template><span v-else-if="d.kode" class="mono">{{ d.kode }}</span><template v-else>—</template></td>
                  <td data-label="Aksi">
                    <button v-if="d.terdaftar" class="link" @click="cabutAkses(d)">Cabut akses</button>
                    <button v-else class="link" @click="kodeUlang(d.id)">{{ d.kode ? 'Kode baru' : 'Registrasi ulang' }}</button>
                  </td>
                </tr>
                <tr v-if="!rows.length"><td colspan="7" class="empty">Tidak ada perangkat</td></tr>
              </tbody>
            </table>
          </div>
          <p class="muted">{{ aktif.length }} perangkat aktif · Identitas perangkat dan binding tersimpan di database lokal.</p>
          <div class="guide">Display terikat ke papan antrean tertentu, bukan parameter URL. Mencabut akses memutus token perangkat dan dicatat di audit.</div>
        </div>

        <div v-for="d in offline" :key="d.id" class="panel">
          <h2>Perangkat offline · {{ d.nama }}</h2>
          <div><span class="badge b-warn">Offline · {{ menit(d.lastSeen) }} menit</span></div>
          <p>Periksa daya dan jaringan sebelum registrasi ulang. Pasien tetap dapat menggunakan {{ online.find((x: any) => x.tipe === d.tipe)?.nama || 'perangkat lain' }}{{ d.tipe === 'APM' ? ' atau loket' : '' }}.</p>
          <div class="kl-actions">
            <button class="btn" @click="detail = d">Lihat detail perangkat</button>
            <button class="btn" @click="cabutAkses(d)">Cabut akses</button>
          </div>
        </div>
      </div>

      <div class="kl-col">
        <div ref="formEl" class="panel">
          <h2>Registrasi perangkat baru</h2>
          <template v-if="!pending">
            <div class="field"><label class="req" for="pf-nama">Nama perangkat</label><input id="pf-nama" v-model="f.nama" class="input" maxlength="60" placeholder="mis. VWR Poli 03" /></div>
            <div class="field"><label class="req" for="pf-tipe">Tipe</label><select id="pf-tipe" v-model="f.tipe" class="select"><option v-for="(l, k) in TIPE" :key="k" :value="k">{{ l }}</option></select></div>
            <div class="field"><label class="req" for="pf-unit">Unit / lokasi</label><input id="pf-unit" v-model="f.unit" class="input" maxlength="60" placeholder="mis. Koridor timur · Lantai 1" /></div>
            <div class="field"><label class="req" for="pf-papan">Papan antrean terikat</label>
              <select id="pf-papan" v-model="f.terikat" class="select" :disabled="f.tipe === 'APM'"><option value="">Pilih papan</option><option v-for="p in papan" :key="p">{{ p }}</option></select>
            </div>
            <div class="kl-actions">
              <button class="btn btn-primary" @click="daftar">Buat kode registrasi</button>
              <button class="btn" @click="Object.assign(f, blank())">Batal</button>
            </div>
          </template>
          <template v-else>
            <p><b>{{ pending.nama }}</b> · {{ TIPE[pending.tipe] }}<br />{{ pending.unit }} · {{ pending.terikat }}</p>
            <p style="font-weight: 600">Kode registrasi sekali pakai</p>
            <p class="kode mono">{{ pending.kode }}</p>
            <div><span class="badge" :class="kodeSisa ? 'b-warn' : 'b-err'">{{ kodeSisa ? `Belum dipakai · Berakhir ${fmtJam(pending.kodeExp)}` : 'Kedaluwarsa · buat kode baru' }}</span></div>
            <p>Masukkan kode di perangkat yang akan didaftarkan. Kode hanya valid satu kali selama 10 menit.</p>
            <div class="kl-actions">
              <button class="btn btn-primary" :disabled="!kodeSisa" @click="showAkt = true">Daftarkan perangkat</button>
              <button class="btn" @click="kodeUlang()">Buat kode baru</button>
              <button class="btn" @click="baru = null">Batal</button>
            </div>
          </template>
          <div class="guide">Setelah kode ditukar, token unik terikat ke perangkat dan papan yang dipilih.</div>
        </div>
      </div>
    </div>

    <AppModal v-model="showAkt" title="Simulasi penukaran kode di perangkat">
      <p class="muted" style="margin-bottom: 12px">Pada perangkat nyata, kode diketik di layar {{ pending?.nama }}. Untuk demo, masukkan kode di sini.</p>
      <div class="field"><label class="req" for="pf-kode">Kode registrasi</label><input id="pf-kode" v-model="kodeIn" class="input mono" maxlength="9" placeholder="SPKD-XXXX" style="text-transform: uppercase" @keyup.enter="aktivasiKode" /></div>
      <template #footer><button class="btn" @click="showAkt = false">Batal</button><button class="btn btn-primary" @click="aktivasiKode">Tukar kode</button></template>
    </AppModal>

    <AppModal :model-value="!!detail" :title="detail?.nama || ''" @update:model-value="detail = null">
      <dl class="kv">
        <dt>Tipe</dt><dd>{{ detail?.tipe }}</dd>
        <dt>Unit</dt><dd>{{ detail?.unit }}</dd>
        <dt>Binding</dt><dd>{{ detail?.terikat }}</dd>
        <dt>Status</dt><dd>{{ detail ? status(detail) : '' }}</dd>
        <dt>Terakhir terlihat</dt><dd>{{ detail?.lastSeen ? fmtWaktu(detail.lastSeen) + ' (' + menit(detail.lastSeen) + ' menit lalu)' : '—' }}</dd>
      </dl>
      <template #footer><button class="btn btn-primary" @click="detail = null">Tutup</button></template>
    </AppModal>
  </div>
</template>

<style scoped>
.kode { font-size: 32px !important; font-weight: 600; color: var(--navy); letter-spacing: .02em; }
</style>
