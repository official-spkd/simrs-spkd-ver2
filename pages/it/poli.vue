<script setup lang="ts">
import type { ApiPoli } from '~/composables/usePolis'
import type { ApiDoctor } from '~/composables/useDoctors'
const toast = useToast()
const tab = ref('poli')

// ---- poli — langsung dari server (/api/v1/polis), lalu disalin ke db.polis untuk dokter/jadwal/pendaftaran ----
const polisSvc = usePolis()
const polis = ref<ApiPoli[]>([])
const loading = ref(false)
const loadErr = ref('')
const muat = async () => {
  loading.value = true
  loadErr.value = ''
  try { polis.value = await polisSvc.refresh() } catch (e: any) { loadErr.value = e.message } finally { loading.value = false }
}

const showP = ref(false)
const saving = ref(false)
const blankP = () => ({ id: '', name: '', prefix_code: '', room: '', is_active: true })
const fp = reactive<any>(blankP())
const bukaP = (p?: ApiPoli) => {
  Object.assign(fp, blankP(), p ? { ...p } : {})
  showP.value = true
}
const cekP = () => {
  if (!/^[A-Za-z]{1,5}$/.test(fp.prefix_code.trim())) return 'Kode prefix wajib 1–5 huruf'
  if (fp.name.trim().length < 3) return 'Nama poli minimal 3 karakter'
  if (!fp.room.trim()) return 'Ruang wajib diisi'
  return ''
}
const simpanP = async () => {
  const err = cekP()
  if (err) return toast.err(err)
  saving.value = true
  try {
    const r = fp.id ? await polisSvc.update(fp.id, fp) : await polisSvc.create(fp)
    showP.value = false
    toast.ok(`Poli ${r.name} disimpan`)
    await muat()
  } catch (e: any) { toast.err(e.message) } finally { saving.value = false }
}
const hapusP = async (p: ApiPoli) => {
  if (!confirm(`Hapus poli ${p.name}? Kunjungan lama tetap menyimpan nama poli.`)) return
  try { await polisSvc.remove(p.id); toast.ok(`Poli ${p.name} dihapus`); await muat() } catch (e: any) { toast.err(e.message) }
}
const toggleP = async (p: ApiPoli) => {
  try { await polisSvc.setStatus(p, !p.is_active); toast.ok(`Poli ${p.name} ${p.is_active ? 'dinonaktifkan' : 'diaktifkan'}`); await muat() } catch (e: any) { toast.err(e.message) }
}

// ---- dokter — langsung dari server (/api/v1/doctors), lalu disalin ke db.doctors untuk jadwal/pendaftaran ----
const doctorsSvc = useDoctors()
const doctors = ref<ApiDoctor[]>([])
const loadingD = ref(false)
const loadErrD = ref('')
const muatD = async () => {
  loadingD.value = true
  loadErrD.value = ''
  try { doctors.value = await doctorsSvc.refresh() } catch (e: any) { loadErrD.value = e.message } finally { loadingD.value = false }
}
// db.doctors memetakan poli lewat db.polis, jadi poli disinkronkan dulu; jumlah dokter per poli dihitung server
const muatSemua = async () => { await muat(); await muatD() }
onMounted(muatSemua)

const filterPoli = ref('')
const dokters = computed(() => doctors.value.filter((d) => !filterPoli.value || d.poli?.id === filterPoli.value))
const poliAktif = computed(() => polis.value.filter((p) => p.is_active))
const showD = ref(false)
const savingD = ref(false)
const blank = () => ({ id: '', name: '', specialization: '', poli_id: '', poli: null, sip_number: '', str_number: '', ihs_number: '', is_active: true })
const fd = reactive<any>(blank())
const bukaD = (d?: ApiDoctor) => {
  Object.assign(fd, blank(), d ? { ...d, poli_id: d.poli?.id || '', ihs_number: d.ihs_number || '' } : {})
  showD.value = true
}
const cekD = () => {
  const n = (s: string) => (s || '').trim().length
  if (n(fd.name) < 3) return 'Nama dokter minimal 3 karakter'
  if (!n(fd.specialization)) return 'Spesialisasi wajib diisi'
  if (!fd.poli_id) return 'Poli wajib dipilih'
  if (n(fd.sip_number) < 5) return 'No. SIP minimal 5 karakter'
  if (n(fd.str_number) < 5) return 'No. STR minimal 5 karakter'
  if (n(fd.ihs_number) && n(fd.ihs_number) < 5) return 'IHS Number minimal 5 karakter (atau kosongkan)'
  return ''
}
const simpanD = async () => {
  const err = cekD()
  if (err) return toast.err(err)
  savingD.value = true
  try {
    const r = fd.id ? await doctorsSvc.update(fd.id, fd) : await doctorsSvc.create(fd)
    showD.value = false
    toast.ok(`Dokter ${r.name} disimpan`)
    await muatSemua()
  } catch (e: any) { toast.err(e.message) } finally { savingD.value = false }
}
const hapusD = async (d: ApiDoctor) => {
  if (!confirm(`Hapus dokter ${d.name}?`)) return
  try { await doctorsSvc.remove(d.id); toast.ok(`Dokter ${d.name} dihapus`); await muatSemua() } catch (e: any) {
    // 409 = dokter sudah dipakai kunjungan; server menyarankan nonaktifkan
    toast.err(e.status === 409 ? `${e.message}. Nonaktifkan dokter ini sebagai gantinya.` : e.message)
  }
}
const toggleD = async (d: ApiDoctor) => {
  try { await doctorsSvc.setStatus(d, !d.is_active); toast.ok(`Dokter ${d.name} ${d.is_active ? 'dinonaktifkan' : 'diaktifkan'}`); await muatSemua() } catch (e: any) { toast.err(e.message) }
}
</script>

<template>
  <div>
    <PageHead code="IT-02" role="IT / Superadmin" title="Master Poli & Dokter" subtitle="Kode prefix poli dipakai sebagai awalan nomor antrean (mis. PD-001).">
      <template #actions>
        <button v-if="tab === 'poli'" class="btn btn-primary" @click="bukaP()">+ Tambah poli</button>
        <button v-else class="btn btn-primary" @click="bukaD()">+ Tambah dokter</button>
      </template>
    </PageHead>
    <AppTabs v-model="tab" :tabs="[{ key: 'poli', label: 'Poli' }, { key: 'dokter', label: 'Dokter' }]" />

    <div v-if="tab === 'poli'" class="card">
      <div class="row between" style="margin-bottom: 12px">
        <span class="muted small">{{ polis.length }} poli di server</span>
        <button class="btn btn-sm" :disabled="loading" @click="muat">{{ loading ? 'Memuat…' : 'Muat ulang' }}</button>
      </div>
      <p v-if="loadErr" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat poli dari server: {{ loadErr }}</p>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Prefix</th><th>Nama poli</th><th>Ruang</th><th>Dokter</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="p in polis" :key="p.id">
              <td data-label="Prefix"><span class="badge b-navy mono">{{ p.prefix_code }}</span></td>
              <td data-label="Nama poli"><b>{{ p.name }}</b></td>
              <td data-label="Ruang">{{ p.room || '-' }}</td>
              <td data-label="Dokter">{{ p.doctor_count }}</td>
              <td data-label="Status"><StatusBadge :value="p.is_active ? 'aktif' : 'nonaktif'" /></td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="bukaP(p)">Ubah</button>
                  <button class="btn btn-sm" @click="toggleP(p)">{{ p.is_active ? 'Nonaktifkan' : 'Aktifkan' }}</button>
                  <button class="btn btn-sm btn-danger" @click="hapusP(p)">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="loading && !polis.length"><td colspan="6" class="empty">Memuat poli dari server…</td></tr>
            <tr v-else-if="!polis.length && !loadErr"><td colspan="6" class="empty">Belum ada poli</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Data langsung dari server. Kunjungan lama tetap menyimpan nama poli walau poli dihapus; nonaktifkan agar tidak muncul di pendaftaran.</p>
    </div>

    <div v-else class="card">
      <div class="filters">
        <div class="field"><label for="d-poli">Poli</label>
          <select id="d-poli" v-model="filterPoli" class="select"><option value="">Semua poli</option><option v-for="p in polis" :key="p.id" :value="p.id">{{ p.name }}</option></select>
        </div>
      </div>
      <div class="row between" style="margin-bottom: 12px">
        <span class="muted small">{{ dokters.length }} dokter di server</span>
        <button class="btn btn-sm" :disabled="loadingD" @click="muatSemua">{{ loadingD ? 'Memuat…' : 'Muat ulang' }}</button>
      </div>
      <p v-if="loadErrD" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat dokter dari server: {{ loadErrD }}</p>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Nama</th><th>Spesialisasi</th><th>Poli</th><th>SIP</th><th>STR</th><th>IHS (Satu Sehat)</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="d in dokters" :key="d.id">
              <td data-label="Nama"><b>{{ d.name }}</b></td>
              <td data-label="Spesialisasi">{{ d.specialization || '-' }}</td>
              <td data-label="Poli">{{ d.poli?.name || '-' }}</td>
              <td data-label="SIP" class="mono">{{ d.sip_number }}</td>
              <td data-label="STR" class="mono">{{ d.str_number }}</td>
              <td data-label="IHS"><span v-if="d.ihs_number" class="mono">{{ d.ihs_number }}</span><span v-else class="badge b-warn">Belum ada</span></td>
              <td data-label="Status"><StatusBadge :value="d.is_active ? 'aktif' : 'nonaktif'" /></td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="bukaD(d)">Ubah</button>
                  <button class="btn btn-sm" @click="toggleD(d)">{{ d.is_active ? 'Nonaktifkan' : 'Aktifkan' }}</button>
                  <button class="btn btn-sm btn-danger" @click="hapusD(d)">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="loadingD && !doctors.length"><td colspan="8" class="empty">Memuat dokter dari server…</td></tr>
            <tr v-else-if="!dokters.length && !loadErrD"><td colspan="8" class="empty">Belum ada dokter</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Data langsung dari server. Dokter yang sudah punya kunjungan tidak bisa dihapus; nonaktifkan agar tidak muncul di pendaftaran.</p>
    </div>

    <AppModal v-model="showP" :title="fp.id ? 'Ubah poli' : 'Tambah poli'">
      <form class="form-grid" @submit.prevent="simpanP">
        <div class="field"><label class="req" for="p-kode">Kode prefix (1–5 huruf)</label><input id="p-kode" v-model="fp.prefix_code" class="input mono" maxlength="5" style="text-transform: uppercase" /></div>
        <div class="field"><label class="req" for="p-nama">Nama poli</label><input id="p-nama" v-model="fp.name" class="input" maxlength="100" /></div>
        <div class="field"><label class="req" for="p-ruang">Ruang</label><input id="p-ruang" v-model="fp.room" class="input" maxlength="100" /></div>
        <label class="check" style="align-self: end; min-height: 40px"><input v-model="fp.is_active" type="checkbox" /><span>Poli aktif</span></label>
      </form>
      <template #footer><button class="btn" @click="showP = false">Batal</button><button class="btn btn-primary" :disabled="saving" @click="simpanP">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button></template>
    </AppModal>

    <AppModal v-model="showD" :title="fd.id ? 'Ubah dokter' : 'Tambah dokter'">
      <form class="form-grid" @submit.prevent="simpanD">
        <div class="field full"><label class="req" for="dk-nama">Nama (dengan gelar)</label><input id="dk-nama" v-model="fd.name" class="input" maxlength="150" /></div>
        <div class="field"><label class="req" for="dk-sp">Spesialisasi</label><input id="dk-sp" v-model="fd.specialization" class="input" maxlength="100" /></div>
        <div class="field"><label class="req" for="dk-poli">Poli</label>
          <select id="dk-poli" v-model="fd.poli_id" class="select">
            <option value="">Pilih poli</option>
            <option v-for="p in poliAktif" :key="p.id" :value="p.id">{{ p.name }}</option>
            <option v-if="fd.poli_id && !poliAktif.some((p) => p.id === fd.poli_id)" :value="fd.poli_id" disabled>{{ fd.poli?.name || 'Poli' }} (nonaktif)</option>
          </select>
          <span class="hint">Hanya poli aktif yang bisa dipilih.</span>
        </div>
        <div class="field"><label class="req" for="dk-sip">No. SIP</label><input id="dk-sip" v-model="fd.sip_number" class="input mono" maxlength="50" /></div>
        <div class="field"><label class="req" for="dk-str">No. STR</label><input id="dk-str" v-model="fd.str_number" class="input mono" maxlength="50" /></div>
        <div class="field full"><label for="dk-ihs">IHS Number (Satu Sehat)</label><input id="dk-ihs" v-model="fd.ihs_number" class="input mono" maxlength="20" placeholder="mis. 10009880728" /><span class="hint">Boleh kosong; pengiriman Encounter memerlukan IHS dokter.</span></div>
        <label class="check" style="min-height: 40px"><input v-model="fd.is_active" type="checkbox" /><span>Dokter aktif</span></label>
      </form>
      <template #footer><button class="btn" @click="showD = false">Batal</button><button class="btn btn-primary" :disabled="savingD" @click="simpanD">{{ savingD ? 'Menyimpan…' : 'Simpan' }}</button></template>
    </AppModal>
  </div>
</template>
