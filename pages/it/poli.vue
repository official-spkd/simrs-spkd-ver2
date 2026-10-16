<script setup lang="ts">
import type { ApiPoli } from '~/composables/usePolis'
import type { ApiDoctor } from '~/composables/useDoctors'
// IT-02 Master Poli & Dokter — langsung dari server (/api/v1/polis, /api/v1/doctors), lalu disalin ke db.polis/db.doctors
// untuk jadwal & pendaftaran. Prefix poli dipakai penomoran antrean harian (PD-012).
const { db } = useDb()
const toast = useToast()
const tab = ref('poli')

// ---- poli ----
const polisSvc = usePolis()
const polis = ref<ApiPoli[]>([])
const loading = ref(false)
const loadErr = ref('')
const muat = async () => {
  loading.value = true
  loadErr.value = ''
  try { polis.value = await polisSvc.refresh() } catch (e: any) { loadErr.value = e.message } finally { loading.value = false }
}
const blankP = () => ({ id: '', name: '', prefix_code: '', room: '', is_active: true })
const fp = reactive<any>(blankP())
const editP = ref(false)
const saving = ref(false)
const bukaP = (p?: ApiPoli) => {
  Object.assign(fp, blankP(), p ? { id: p.id, name: p.name, prefix_code: p.prefix_code, room: p.room, is_active: p.is_active } : {})
  editP.value = true
  tab.value = 'poli'
}
const batalP = () => { editP.value = false; Object.assign(fp, blankP()) }
// kunjungan lokal yang memakai poli ini (ID lokal dipetakan lewat serverId)
const poliLokal = (id: string) => db.polis.find((x: any) => x.serverId === id || x.id === id)
const dipakaiKunjungan = (id: string) => { const l = poliLokal(id); return !!l && db.visits.some((v: any) => v.poliId === l.id && !['dibatalkan', 'lunas'].includes(v.status)) }
const cekP = () => {
  if (!/^[A-Za-z]{1,5}$/.test(fp.prefix_code.trim())) return 'Prefix antrean wajib 1–5 huruf'
  if (polis.value.some((p) => p.id !== fp.id && p.prefix_code.toUpperCase() === fp.prefix_code.trim().toUpperCase())) return `Prefix ${fp.prefix_code.toUpperCase()} sudah dipakai poli lain`
  if (fp.name.trim().length < 3) return 'Nama poli minimal 3 karakter'
  if (!fp.room.trim()) return 'Ruang pelayanan wajib diisi'
  return ''
}
const simpanP = async () => {
  const err = cekP()
  if (err) return toast.err(err)
  saving.value = true
  try {
    const r = fp.id ? await polisSvc.update(fp.id, fp) : await polisSvc.create(fp)
    toast.ok(`Poli ${r.name} disimpan`)
    await muat()
    bukaP(polis.value.find((p) => p.id === r.id))
  } catch (e: any) { toast.err(e.message) } finally { saving.value = false }
}
const toggleP = async (p: ApiPoli) => {
  if (p.is_active && dipakaiKunjungan(p.id) && !confirm(`Poli ${p.name} masih punya kunjungan aktif hari ini. Nonaktifkan untuk menghentikan pendaftaran baru?`)) return
  try { await polisSvc.setStatus(p, !p.is_active); toast.ok(`Poli ${p.name} ${p.is_active ? 'dinonaktifkan' : 'diaktifkan'}`); await muat() } catch (e: any) { toast.err(e.message) }
}
const hapusP = async () => {
  const p = polis.value.find((x) => x.id === fp.id)
  if (!p) return
  if (dipakaiKunjungan(p.id)) return toast.err('Poli dengan kunjungan aktif tidak dapat dihapus. Nonaktifkan saja.')
  if (!confirm(`Hapus poli ${p.name}? Kunjungan lama tetap menyimpan nama poli.`)) return
  try { await polisSvc.remove(p.id); toast.ok(`Poli ${p.name} dihapus`); batalP(); await muat() } catch (e: any) { toast.err(e.message) }
}

// ---- dokter ----
const doctorsSvc = useDoctors()
const doctors = ref<ApiDoctor[]>([])
const loadingD = ref(false)
const loadErrD = ref('')
const muatD = async () => {
  loadingD.value = true
  loadErrD.value = ''
  try { doctors.value = await doctorsSvc.refresh() } catch (e: any) { loadErrD.value = e.message } finally { loadingD.value = false }
}
const muatSemua = async () => {
  await muat()
  await muatD()
  if (!editP.value && polis.value[0]) bukaP(polis.value[0])
}
onMounted(muatSemua)

const filterPoli = ref('')
const cariD = ref('')
const dokters = computed(() => {
  const q = cariD.value.trim().toLowerCase()
  return doctors.value.filter((d) => (!filterPoli.value || d.poli?.id === filterPoli.value) && (!q || d.name.toLowerCase().includes(q)))
})
const tanpaIhs = computed(() => doctors.value.filter((d) => d.is_active && !d.ihs_number))
const poliAktif = computed(() => polis.value.filter((p) => p.is_active))
const savingD = ref(false)
const editD = ref(false)
const blank = () => ({ id: '', name: '', specialization: '', poli_id: '', poli: null, sip_number: '', str_number: '', ihs_number: '', is_active: true })
const fd = reactive<any>(blank())
const bukaD = (d?: ApiDoctor) => {
  Object.assign(fd, blank(), d ? { ...d, poli_id: d.poli?.id || '', ihs_number: d.ihs_number || '' } : {})
  editD.value = true
  tab.value = 'dokter'
}
const batalD = () => { editD.value = false; Object.assign(fd, blank()) }
const cekD = () => {
  const n = (s: string) => (s || '').trim().length
  if (n(fd.name) < 3) return 'Nama dokter minimal 3 karakter'
  if (!n(fd.specialization)) return 'Spesialisasi wajib diisi'
  if (!fd.poli_id) return 'Poli wajib dipilih'
  if (n(fd.sip_number) < 5) return 'No. SIP minimal 5 karakter'
  if (n(fd.str_number) < 5) return 'No. STR minimal 5 karakter'
  if (n(fd.ihs_number) && n(fd.ihs_number) < 5) return 'IHS minimal 5 karakter (atau kosongkan)'
  return ''
}
const simpanD = async () => {
  const err = cekD()
  if (err) return toast.err(err)
  savingD.value = true
  try {
    const r = fd.id ? await doctorsSvc.update(fd.id, fd) : await doctorsSvc.create(fd)
    toast.ok(`Dokter ${r.name} disimpan`)
    await muat(); await muatD()
    bukaD(doctors.value.find((d) => d.id === r.id))
  } catch (e: any) { toast.err(e.message) } finally { savingD.value = false }
}
const hapusD = async () => {
  const d = doctors.value.find((x) => x.id === fd.id)
  if (!d) return
  if (!confirm(`Hapus data dokter ${d.name}? Hanya dokter yang belum dipakai kunjungan yang dapat dihapus.`)) return
  try { await doctorsSvc.remove(d.id); toast.ok(`Dokter ${d.name} dihapus`); batalD(); await muat(); await muatD() } catch (e: any) {
    toast.err(e.status === 409 ? `${e.message}. Nonaktifkan dokter ini sebagai gantinya.` : e.message)
  }
}
</script>

<template>
  <div>
    <PageHead code="IT-02" role="IT" title="Master Poli & Dokter" subtitle="Referensi layanan rawat jalan · Prefix nomor antrean harian dan identitas tenaga medis" />
    <AppTabs v-model="tab" :tabs="[{ key: 'poli', label: 'Poli' }, { key: 'dokter', label: 'Dokter' }]" />

    <div class="kl-cols">
      <div class="kl-col">
        <div class="panel" :style="{ order: tab === 'dokter' ? 2 : 1 }">
          <h2>Daftar poli</h2>
          <div class="kl-actions">
            <button class="btn btn-primary" @click="bukaP()">+ Tambah poli</button>
            <button class="btn" @click="bukaD()">+ Tambah dokter</button>
          </div>
          <p v-if="loadErr" class="alert err" role="alert">Gagal memuat poli dari server: {{ loadErr }} <button class="btn btn-sm" @click="muat">Coba lagi</button></p>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Kode / prefix</th><th>Nama poli</th><th>Ruang</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="p in polis" :key="p.id" :class="{ sel: tab === 'poli' && editP && fp.id === p.id }">
                  <td data-label="Kode / prefix" class="mono">{{ p.prefix_code }}</td>
                  <td data-label="Nama poli">{{ p.name }}</td>
                  <td data-label="Ruang">{{ p.room || '-' }}</td>
                  <td data-label="Status"><span class="badge" :class="p.is_active ? 'b-ok' : 'b-mute'">{{ p.is_active ? 'Aktif' : 'Nonaktif' }}</span></td>
                  <td data-label="Aksi"><button class="link" @click="bukaP(p)">Edit</button> / <button class="link" @click="toggleP(p)">{{ p.is_active ? 'Nonaktifkan' : 'Aktifkan' }}</button></td>
                </tr>
                <tr v-if="loading && !polis.length"><td colspan="5" class="empty">Memuat poli dari server…</td></tr>
                <tr v-else-if="!polis.length && !loadErr"><td colspan="5" class="empty">Belum ada poli</td></tr>
              </tbody>
            </table>
          </div>
          <div class="guide">Prefix dipakai untuk antrean per poli per hari, misalnya PD-012 dan AN-007. Prefix harus unik dan tidak diubah pada kunjungan yang sudah terbit.</div>
        </div>

        <div class="panel" :style="{ order: tab === 'dokter' ? 1 : 2 }">
          <h2>Dokter terdaftar</h2>
          <div class="kl-filters" style="margin: 0">
            <label class="sr-only" for="d-poli">Poli</label>
            <select id="d-poli" v-model="filterPoli" class="select"><option value="">Semua poli</option><option v-for="p in polis" :key="p.id" :value="p.id">{{ p.name }}</option></select>
            <label class="sr-only" for="d-cari">Cari dokter</label>
            <input id="d-cari" v-model="cariD" class="input q" placeholder="⌕ Nama dokter" inputmode="search" />
            <button v-if="tab === 'dokter'" class="btn btn-primary" @click="bukaD()">+ Tambah dokter</button>
          </div>
          <p v-if="loadErrD" class="alert err" role="alert">Gagal memuat dokter dari server: {{ loadErrD }} <button class="btn btn-sm" @click="muatSemua">Coba lagi</button></p>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Nama / spesialisasi</th><th>Poli</th><th>SIP / STR</th><th>IHS</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="d in dokters" :key="d.id" :class="{ sel: tab === 'dokter' && editD && fd.id === d.id }">
                  <td data-label="Nama / spesialisasi">{{ d.name }}<div>{{ d.specialization || '-' }}</div><span v-if="!d.is_active" class="badge b-mute">Nonaktif</span></td>
                  <td data-label="Poli">{{ d.poli?.prefix_code || '-' }}</td>
                  <td data-label="SIP / STR" class="mono">{{ d.sip_number }}<div>{{ d.str_number }}</div></td>
                  <td data-label="IHS"><span v-if="d.ihs_number" class="mono">{{ d.ihs_number }}</span><span v-else class="badge b-warn">Belum ada</span></td>
                  <td data-label="Aksi"><button class="link" @click="bukaD(d)">Edit</button></td>
                </tr>
                <tr v-if="loadingD && !doctors.length"><td colspan="5" class="empty">Memuat dokter dari server…</td></tr>
                <tr v-else-if="!dokters.length && !loadErrD"><td colspan="5" class="empty">Tidak ada dokter</td></tr>
              </tbody>
            </table>
          </div>
          <p class="muted">Identitas IHS untuk integrasi Satu Sehat. Data demo fiktif.</p>
        </div>
      </div>

      <div class="kl-col">
        <template v-if="tab === 'poli'">
          <div class="panel">
            <template v-if="editP">
              <h2>{{ fp.id ? `Edit poli · ${fp.name}` : 'Tambah poli' }}</h2>
              <div class="field"><label for="p-kode">Kode poli</label><input id="p-kode" :value="fp.prefix_code.toUpperCase()" class="input mono" disabled /><span class="hint">Mengikuti prefix antrean.</span></div>
              <div class="field"><label class="req" for="p-prefix">Prefix antrean</label><input id="p-prefix" v-model="fp.prefix_code" class="input mono" maxlength="5" style="text-transform: uppercase" /></div>
              <div class="field"><label class="req" for="p-nama">Nama poli</label><input id="p-nama" v-model="fp.name" class="input" maxlength="100" /></div>
              <div class="field"><label class="req" for="p-ruang">Ruang pelayanan</label><input id="p-ruang" v-model="fp.room" class="input" maxlength="100" placeholder="mis. PD 01 · Lantai 1" /></div>
              <div class="field"><label for="p-status">Status</label>
                <select id="p-status" v-model="fp.is_active" class="select"><option :value="true">Aktif</option><option :value="false">Nonaktif</option></select>
              </div>
              <div class="kl-actions">
                <button class="btn btn-primary" :disabled="saving" @click="simpanP">{{ saving ? 'Menyimpan…' : 'Simpan poli' }}</button>
                <button class="btn" @click="batalP">Batal</button>
                <button v-if="fp.id" class="btn btn-ghost err-text" @click="hapusP">Hapus</button>
              </div>
            </template>
            <template v-else>
              <h2>Edit poli</h2>
              <p class="muted">Pilih poli pada daftar atau tambah poli baru.</p>
            </template>
            <div class="guide">Poli dengan kunjungan aktif tidak dapat dihapus. Nonaktifkan untuk menghentikan pendaftaran baru.</div>
          </div>
          <div class="panel">
            <h2>Validasi dokter</h2>
            <div><span class="badge b-navy">SIP / STR wajib</span></div>
            <p>Nama, spesialisasi, poli, SIP / STR, dan IHS diisi saat tambah atau edit dokter.</p>
            <p v-if="tanpaIhs.length" class="muted">{{ tanpaIhs.length }} dokter aktif belum punya IHS Satu Sehat.</p>
            <div class="kl-actions">
              <button v-if="tanpaIhs[0]" class="btn" @click="bukaD(tanpaIhs[0])">Edit dokter {{ tanpaIhs[0].name.replace(/^(dr|drg)\.\s*/, '').split(/[ ,]/)[0] }}</button>
              <button class="btn" @click="bukaD()">+ Tambah dokter</button>
            </div>
          </div>
        </template>

        <div v-else class="panel">
          <template v-if="editD">
            <h2>{{ fd.id ? `Edit dokter · ${fd.name}` : 'Tambah dokter' }}</h2>
            <div class="field"><label class="req" for="dk-nama">Nama (dengan gelar)</label><input id="dk-nama" v-model="fd.name" class="input" maxlength="150" /></div>
            <div class="field"><label class="req" for="dk-sp">Spesialisasi</label><input id="dk-sp" v-model="fd.specialization" class="input" maxlength="100" /></div>
            <div class="field"><label class="req" for="dk-poli">Poli</label>
              <select id="dk-poli" v-model="fd.poli_id" class="select">
                <option value="">Pilih poli</option>
                <option v-for="p in poliAktif" :key="p.id" :value="p.id">{{ p.prefix_code }} · {{ p.name }}</option>
                <option v-if="fd.poli_id && !poliAktif.some((p) => p.id === fd.poli_id)" :value="fd.poli_id" disabled>{{ fd.poli?.name || 'Poli' }} (nonaktif)</option>
              </select>
            </div>
            <div class="field"><label class="req" for="dk-sip">No. SIP</label><input id="dk-sip" v-model="fd.sip_number" class="input mono" maxlength="50" /></div>
            <div class="field"><label class="req" for="dk-str">No. STR</label><input id="dk-str" v-model="fd.str_number" class="input mono" maxlength="50" /></div>
            <div class="field"><label for="dk-ihs">IHS (Satu Sehat)</label><input id="dk-ihs" v-model="fd.ihs_number" class="input mono" maxlength="20" placeholder="mis. 10000000128" /><span class="hint">Boleh kosong; pengiriman Encounter memerlukan IHS dokter.</span></div>
            <div class="field"><label for="dk-st">Status</label>
              <select id="dk-st" v-model="fd.is_active" class="select"><option :value="true">Aktif</option><option :value="false">Nonaktif</option></select>
            </div>
            <div class="kl-actions">
              <button class="btn btn-primary" :disabled="savingD" @click="simpanD">{{ savingD ? 'Menyimpan…' : 'Simpan dokter' }}</button>
              <button class="btn" @click="batalD">Batal</button>
              <button v-if="fd.id" class="btn btn-ghost err-text" @click="hapusD">Hapus draf dokter</button>
            </div>
          </template>
          <template v-else>
            <h2>Edit dokter</h2>
            <p class="muted">Pilih dokter pada daftar atau tambah dokter baru.</p>
          </template>
          <div class="guide">Dokter yang sudah dipakai kunjungan tidak dapat dihapus; nonaktifkan agar tidak muncul di pendaftaran.</div>
        </div>
      </div>
    </div>
  </div>
</template>
