<script setup lang="ts">
import type { ApiRole, ApiUser } from '~/composables/useUsers'
import type { ApiPoli } from '~/composables/usePolis'
import type { ApiDoctor } from '~/composables/useDoctors'
// IT-01 User & Role — akun dan role dari backend (khusus superadmin); matriks akses masih lokal.
const { db } = useDb()
const { setMatrix } = useAdmin()
const { user } = useAuth()
const svc = useUsers()
const toast = useToast()
const tab = ref('user')
const KEYS = [['lihat', 'Lihat'], ['input', 'Input'], ['edit', 'Edit'], ['hapus', 'Hapus'], ['verifikasi', 'Verifikasi']]

// ---------- role (backend) ----------
const roleList = ref<ApiRole[]>([])
const roleErr = ref('')
const roleName = (name: string) => roleList.value.find((r) => r.name === name)?.display_name || name
const loadRoles = async () => {
  roleErr.value = ''
  try { roleList.value = await svc.roles() } catch (e: any) { roleErr.value = e.message }
}

// ---------- daftar user ----------
const cari = ref('')
const fRole = ref('')
const fStatus = ref('')
const page = ref(1)
const rows = ref<ApiUser[]>([])
const total = ref(0)
const pages = ref(1)
const loading = ref(false)
const err = ref('')
let seq = 0
const load = async () => {
  const my = ++seq
  loading.value = true
  err.value = ''
  try {
    const r = await svc.list({ search: cari.value, role: fRole.value, status: fStatus.value, page: page.value })
    if (my !== seq) return
    rows.value = r.data
    total.value = r.pagination?.total_items ?? r.data.length
    pages.value = Math.max(1, r.pagination?.total_pages ?? 1)
  } catch (e: any) {
    if (my !== seq) return
    rows.value = []
    err.value = e.message
  } finally {
    if (my === seq) loading.value = false
  }
}
let timer: any
const reload = () => (page.value === 1 ? load() : (page.value = 1))
watch(cari, () => { clearTimeout(timer); timer = setTimeout(reload, 350) })
watch([fRole, fStatus], reload)
watch(page, load)
onMounted(() => { load(); loadRoles() })
onBeforeUnmount(() => clearTimeout(timer))
const isSelf = (u: ApiUser) => u.id === user.value?.id

// ---------- tambah / ubah user ----------
const show = ref(false)
const saving = ref(false)
const formErr = ref('')
const DOKTER = 'doctor'
const empty = () => ({ id: '', name: '', nip: '', email: '', role: 'front_office', origRole: '', poli_id: '', doctorId: '', sip_number: '', str_number: '', orig: { poli_id: '', sip_number: '', str_number: '' } })
const form = reactive(empty())
watch(() => form.nip, (v) => { const c = onlyDigits(v, 30); if (c !== v) form.nip = c })
const isDokter = computed(() => form.role === DOKTER)

// poli aktif (server mewajibkan poli aktif) + master dokter (/doctors) untuk mengisi SIP/STR
const poliOpsi = ref<ApiPoli[]>([])
const dokterOpsi = ref<ApiDoctor[]>([])
const loadPoli = async () => {
  try {
    const [p, d] = await Promise.all([usePolis().all(), useDoctors().all({ is_active: true })])
    poliOpsi.value = p.filter((x) => x.is_active)
    dokterOpsi.value = d
    // ubah user: dokter master milik user ini (doctor_id), cadangan lewat SIP
    if (!form.doctorId && form.sip_number) form.doctorId = d.find((x) => x.sip_number === form.sip_number)?.id || ''
    else isiDariDokter()
  } catch (e: any) { formErr.value = `Gagal memuat poli/dokter: ${e.message}` }
}
// master dokter yang sudah punya akun (user.doctor_id) — satu data dokter hanya boleh dipakai satu akun
const terpakai = ref(new Set<string>())
const loadTerpakai = async () => {
  const ids = new Set<string>()
  try {
    for (let page = 1; ; page++) {
      const r = await svc.list({ role: DOKTER, status: '', page, limit: 100 })
      for (const u of r.data) if (u.doctor_id && u.id !== form.id) ids.add(u.doctor_id)
      if (!r.pagination?.has_next_page) break
    }
    terpakai.value = ids
  } catch (e: any) { formErr.value = `Gagal memuat user dokter: ${e.message}` }
}
watch(isDokter, (v) => {
  if (!v || !show.value) return
  if (!poliOpsi.value.length) loadPoli()
  loadTerpakai()
})
const dokterPoli = computed(() => dokterOpsi.value.filter((d) =>
  (!form.poli_id || d.poli?.id === form.poli_id) && (d.id === form.doctorId || !terpakai.value.has(d.id))))
// pilih dokter master → isi SIP/STR dan poli-nya
const isiDariDokter = () => {
  const d = dokterOpsi.value.find((x) => x.id === form.doctorId)
  if (d) { form.sip_number = d.sip_number; form.str_number = d.str_number; form.poli_id = d.poli?.id || form.poli_id }
  else if (!form.id) { form.sip_number = ''; form.str_number = '' }
}
watch(() => form.doctorId, isiDariDokter)
// ganti poli → lepas pemetaan dokter yang bukan dari poli itu
watch(() => form.poli_id, () => {
  if (form.doctorId && !dokterPoli.value.some((d) => d.id === form.doctorId)) form.doctorId = ''
})

const buka = (u?: ApiUser) => {
  Object.assign(form, empty())
  if (u) {
    const dp = u.doctor_profile
    const doc = { poli_id: dp?.poli?.id || '', sip_number: dp?.sip_number || '', str_number: dp?.str_number || '' }
    Object.assign(form, { id: u.id, name: u.name, nip: u.nip, email: u.email, role: u.role, origRole: u.role, doctorId: u.doctor_id || '', ...doc, orig: { ...doc } })
  }
  formErr.value = ''
  show.value = true
  if (isDokter.value) loadTerpakai()
  if (isDokter.value && !poliOpsi.value.length) loadPoli()
  else if (!form.doctorId && form.sip_number) form.doctorId = dokterOpsi.value.find((x) => x.sip_number === form.sip_number)?.id || ''
}
/** Profil dokter: wajib lengkap saat register / ganti role ke doctor. */
const cekDokter = () => {
  if (!form.poli_id) return 'Poli dokter wajib dipilih'
  if (form.sip_number.trim().length < 5) return 'No. SIP minimal 5 karakter'
  if (form.str_number.trim().length < 5) return 'No. STR minimal 5 karakter'
  return ''
}
const dokterFields = () => ({ poli_id: form.poli_id, sip_number: form.sip_number.trim(), str_number: form.str_number.trim() })
/** Untuk PUT: hanya field dokter yang berubah (sesuai kontrak API). */
const dokterBerubah = () => {
  const d: Record<string, string> = dokterFields()
  return Object.fromEntries(Object.entries(d).filter(([k, v]) => v !== (form.orig as any)[k]))
}
const hasil = ref<{ judul: string; user: string; pw: string } | null>(null)
const simpan = async () => {
  formErr.value = ''
  const f = { name: form.name.trim(), nip: form.nip.trim(), email: form.email.trim().toLowerCase() }
  if (!f.name || !f.nip || !f.email) { formErr.value = 'Nama, NIP, dan email wajib diisi'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { formErr.value = 'Format email tidak valid'; return }
  if (!form.role) { formErr.value = 'Role wajib dipilih'; return }
  if (isDokter.value) {
    // Register cukup doctor_id (profil diambil server dari master dokter); ubah user masih pakai poli/SIP/STR.
    const e = form.id ? cekDokter() : !form.doctorId ? 'Data dokter wajib dipilih' : ''
    if (e) { formErr.value = e; return }
  }
  saving.value = true
  try {
    if (!form.id) {
      const pw = tempPassword()
      await svc.create({ ...f, password: pw, role: form.role, ...(isDokter.value ? { doctor_id: form.doctorId } : {}) })
      hasil.value = { judul: 'User ditambahkan', user: f.email, pw }
      toast.ok(`User ${f.name} ditambahkan`)
    } else {
      // Tetap dokter → profil ikut PUT. Jadi dokter → profil dikirim lewat PATCH role (PUT menolaknya untuk role lain).
      const tetapDokter = isDokter.value && form.origRole === DOKTER
      await svc.update(form.id, { ...f, ...(tetapDokter ? dokterBerubah() : {}) })
      if (form.role !== form.origRole) await svc.setRole(form.id, form.role, isDokter.value ? dokterFields() : {})
      toast.ok(`User ${f.name} diperbarui`)
    }
    show.value = false
    load()
  } catch (e: any) {
    formErr.value = e instanceof ApiError && e.status === 409 ? 'NIP atau email sudah dipakai user lain' : e.message
  } finally {
    saving.value = false
  }
}

// ---------- aksi per baris ----------
const busy = ref('')
const aksi = async (u: ApiUser, kerja: () => Promise<any>, pesan: string) => {
  busy.value = u.id
  try { await kerja(); toast.ok(pesan); await load(); return true } catch (e: any) { toast.err(e.message); return false } finally { busy.value = '' }
}
const ubahStatus = (u: ApiUser) => aksi(u, () => svc.setStatus(u.id, !u.is_active), `${u.name} ${u.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)

const resetTarget = ref<ApiUser | null>(null)
const resetPw = async () => {
  const u = resetTarget.value!
  const pw = tempPassword()
  resetTarget.value = null
  if (await aksi(u, () => svc.resetPassword(u.id, pw), 'Password sementara dibuat')) hasil.value = { judul: 'Password direset', user: u.email, pw }
}
const hapusTarget = ref<ApiUser | null>(null)
const hapusUser = async () => {
  const u = hapusTarget.value!
  hapusTarget.value = null
  await aksi(u, () => svc.remove(u.id), `User ${u.name} dihapus`)
}

// ---------- kelola role (backend) ----------
const rShow = ref(false)
const rSaving = ref(false)
const rErr = ref('')
const rForm = reactive({ id: '', name: '', display_name: '', description: '' })
watch(() => rForm.name, (v) => { const c = v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 50); if (c !== v) rForm.name = c })
const bukaRole = (r?: ApiRole) => {
  Object.assign(rForm, { id: r?.id || '', name: r?.name || '', display_name: r?.display_name || '', description: r?.description || '' })
  rErr.value = ''
  rShow.value = true
}
const simpanRole = async () => {
  rErr.value = ''
  const f = { display_name: rForm.display_name.trim(), description: rForm.description.trim() }
  if (!rForm.id && rForm.name.length < 2) { rErr.value = 'Kode role minimal 2 karakter (huruf kecil, angka, garis bawah)'; return }
  if (!f.display_name) { rErr.value = 'Nama tampilan wajib diisi'; return }
  rSaving.value = true
  try {
    if (rForm.id) await svc.updateRole(rForm.id, f)
    else await svc.createRole({ name: rForm.name, ...f })
    toast.ok(`Role ${f.display_name} disimpan`)
    rShow.value = false
    loadRoles()
  } catch (e: any) {
    rErr.value = e instanceof ApiError && e.status === 409 ? 'Kode role sudah dipakai' : e.message
  } finally {
    rSaving.value = false
  }
}
const hapusRoleTarget = ref<ApiRole | null>(null)
const hapusRole = async () => {
  const r = hapusRoleTarget.value!
  hapusRoleTarget.value = null
  try {
    await svc.removeRole(r.id)
    toast.ok(`Role ${r.display_name} dihapus`)
    loadRoles()
  } catch (e: any) {
    toast.err(e instanceof ApiError && e.status === 409 ? `Role ${r.display_name} masih dipakai user, tidak dapat dihapus` : e.message)
  }
}
/** Role backend yang belum punya menu di aplikasi ini — user dengan role tsb. tidak bisa login. */
const tanpaMenu = (name: string) => !BACKEND_ROLE[name]

// ---------- matriks role x modul (lokal) ----------
const matrixRoles = computed(() => Object.keys(db.matrix))
const lbl = (r: string) => (ROLE_LABEL as any)[r] || r
const roleAktif = ref('fo')
const ubahMatriks = (modul: string, key: string, e: Event) => {
  const el = e.target as HTMLInputElement
  const r = toast.attempt(() => setMatrix(roleAktif.value, modul, key, el.checked))
  if (!r) el.checked = !el.checked
}
</script>

<template>
  <div>
    <PageHead code="IT-01" role="Superadmin" title="User & Role (RBAC)" subtitle="Kelola akun dan role pengguna. Data tersimpan di server.">
      <template #actions>
        <button v-if="tab === 'user'" class="btn btn-primary" @click="buka()">+ Tambah user</button>
        <button v-else-if="tab === 'role'" class="btn btn-primary" @click="bukaRole()">+ Tambah role</button>
      </template>
    </PageHead>
    <AppTabs v-model="tab" :tabs="[{ key: 'user', label: 'Daftar user' }, { key: 'role', label: 'Role' }, { key: 'matriks', label: 'Matriks role x modul' }]" />

    <div v-if="tab === 'user'" class="card">
      <div class="filters">
        <div class="field" style="flex: 1; min-width: 220px"><label for="u-cari">Cari</label><input id="u-cari" v-model="cari" class="input" style="width: 100%" placeholder="Nama / NIP / email" inputmode="search" /></div>
        <div class="field"><label for="u-role">Role</label>
          <select id="u-role" v-model="fRole" class="select"><option value="">Semua role</option><option v-for="r in roleList" :key="r.id" :value="r.name">{{ r.display_name }}</option></select>
        </div>
        <div class="field"><label for="u-status">Status</label>
          <select id="u-status" v-model="fStatus" class="select"><option value="">Semua</option><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Nama</th><th>NIP</th><th>Email</th><th>Role</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="u in rows" :key="u.id">
              <td data-label="Nama"><b>{{ u.name }}</b><span v-if="isSelf(u)" class="badge b-navy" style="margin-left: 6px">Anda</span></td>
              <td data-label="NIP" class="mono">{{ u.nip }}</td>
              <td data-label="Email">{{ u.email }}</td>
              <td data-label="Role"><span class="badge b-navy">{{ roleName(u.role) }}</span><div v-if="u.doctor_profile?.poli" class="muted small">{{ u.doctor_profile.poli.name }}</div></td>
              <td data-label="Status"><StatusBadge :value="u.is_active ? 'aktif' : 'nonaktif'" /></td>
              <td data-label="Dibuat">{{ fmtWaktu(u.created_at) }}</td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px; flex-wrap: wrap">
                  <button class="btn btn-sm" :disabled="busy === u.id" @click="buka(u)">Ubah</button>
                  <button v-if="!isSelf(u)" class="btn btn-sm" :class="u.is_active ? 'btn-danger' : ''" :disabled="busy === u.id" @click="ubahStatus(u)">{{ u.is_active ? 'Nonaktifkan' : 'Aktifkan' }}</button>
                  <button class="btn btn-sm" :disabled="busy === u.id" @click="resetTarget = u">Reset password</button>
                  <button v-if="!isSelf(u)" class="btn btn-sm btn-danger" :disabled="busy === u.id" @click="hapusTarget = u">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="loading && !rows.length"><td colspan="7" class="empty">Memuat data user…</td></tr>
            <tr v-else-if="err"><td colspan="7" class="empty" role="alert">{{ err }} <button class="btn btn-sm" style="margin-left: 8px" @click="load">Coba lagi</button></td></tr>
            <tr v-else-if="!rows.length"><td colspan="7" class="empty">Tidak ada user</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span>{{ total }} user · halaman {{ page }} / {{ pages }}<template v-if="loading"> · memuat…</template></span>
        <span><button :disabled="page <= 1 || loading" @click="page--">Sebelumnya</button><button :disabled="page >= pages || loading" @click="page++">Berikutnya</button></span>
      </div>
      <p class="hint">Akun sendiri tidak dapat dinonaktifkan, dihapus, atau diganti role-nya.</p>
    </div>

    <div v-else-if="tab === 'role'" class="card">
      <p v-if="roleErr" class="alert err" role="alert" style="margin-bottom: 12px">{{ roleErr }}</p>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kode</th><th>Nama tampilan</th><th>Keterangan</th><th>Jenis</th><th>Menu aplikasi</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="r in roleList" :key="r.id">
              <td data-label="Kode" class="mono">{{ r.name }}</td>
              <td data-label="Nama"><b>{{ r.display_name }}</b></td>
              <td data-label="Keterangan">{{ r.description || '-' }}</td>
              <td data-label="Jenis"><span class="badge" :class="r.is_system ? 'b-navy' : ''">{{ r.is_system ? 'Bawaan' : 'Tambahan' }}</span></td>
              <td data-label="Menu">
                <span v-if="tanpaMenu(r.name)" class="badge b-warn">Belum ada menu (tidak bisa login)</span>
                <span v-else>{{ lbl(BACKEND_ROLE[r.name]) }}</span>
              </td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="bukaRole(r)">Ubah</button>
                  <button v-if="!r.is_system" class="btn btn-sm btn-danger" @click="hapusRoleTarget = r">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="!roleList.length && !roleErr"><td colspan="6" class="empty">Memuat role…</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Role bawaan tidak dapat dihapus. Role baru perlu dipetakan ke menu aplikasi oleh developer sebelum penggunanya bisa login.</p>
    </div>

    <div v-else class="card">
      <div class="row between" style="margin-bottom: 14px">
        <div class="seg" role="group" aria-label="Pilih role">
          <button v-for="r in matrixRoles" :key="r" :class="{ on: roleAktif === r }" @click="roleAktif = r">{{ lbl(r) }}</button>
        </div>
        <span v-if="roleAktif === 'it'" class="badge b-warn">Hak akses penuh, tidak dapat diubah</span>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Modul</th><th v-for="k in KEYS" :key="k[0]" class="center">{{ k[1] }}</th></tr></thead>
          <tbody>
            <tr v-for="m in db.modules" :key="m">
              <td data-label="Modul"><b>{{ m }}</b></td>
              <td v-for="k in KEYS" :key="k[0]" class="center" :data-label="k[1]">
                <input type="checkbox" style="width: 20px; height: 20px; accent-color: var(--teal)" :checked="db.matrix[roleAktif][m][k[0]]" :disabled="roleAktif === 'it'" :aria-label="`${m} ${k[1]}`" @change="ubahMatriks(m, k[0], $event)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Matriks ini masih prototipe lokal (belum ada endpoint di backend); penegakan akses memakai menu per role dan pengecekan role di server.</p>
    </div>

    <AppModal v-model="show" :title="form.id ? 'Ubah user' : 'Tambah user'">
      <div class="form-grid">
        <div class="field"><label class="req" for="uf-nama">Nama lengkap</label><input id="uf-nama" v-model="form.name" class="input" maxlength="150" /></div>
        <div class="field"><label class="req" for="uf-nip">NIP</label><input id="uf-nip" v-model="form.nip" class="input mono" maxlength="30" inputmode="numeric" /></div>
        <div class="field"><label class="req" for="uf-email">Email</label><input id="uf-email" v-model="form.email" type="email" class="input" maxlength="150" autocapitalize="none" /></div>
        <div class="field"><label class="req" for="uf-role">Role</label>
          <select id="uf-role" v-model="form.role" class="select" :disabled="!!form.id && form.id === user?.id">
            <option v-for="r in roleList" :key="r.id" :value="r.name">{{ r.display_name }}{{ tanpaMenu(r.name) ? ' (belum ada menu)' : '' }}</option>
          </select>
          <span v-if="form.id && form.id === user?.id" class="hint">Role akun sendiri tidak dapat diubah.</span>
        </div>
        <template v-if="isDokter">
          <div class="field"><label :class="{ req: form.id }" for="uf-poli">Poli</label>
            <select id="uf-poli" v-model="form.poli_id" class="select">
              <option value="">{{ poliOpsi.length ? 'Pilih poli' : 'Memuat poli…' }}</option>
              <option v-for="p in poliOpsi" :key="p.id" :value="p.id">{{ p.name }}</option>
              <option v-if="form.poli_id && !poliOpsi.some((p) => p.id === form.poli_id)" :value="form.poli_id" disabled>Poli saat ini (nonaktif)</option>
            </select>
          </div>
          <div class="field"><label :class="{ req: !form.id }" for="uf-dr">{{ form.id ? 'Data dokter (opsional, mengisi SIP/STR)' : 'Data dokter' }}</label>
            <select id="uf-dr" v-model="form.doctorId" class="select"><option value="">{{ form.id ? 'Tidak dipetakan' : 'Pilih dokter' }}</option><option v-for="d in dokterPoli" :key="d.id" :value="d.id">{{ d.name }}</option></select>
            <span v-if="!form.id && dokterOpsi.length && !dokterPoli.length" class="hint">Semua dokter{{ form.poli_id ? ' di poli ini' : '' }} sudah punya akun.</span>
          </div>
          <div class="field"><label :class="{ req: form.id }" for="uf-sip">No. SIP</label><input id="uf-sip" v-model="form.sip_number" class="input mono" maxlength="50" :placeholder="form.id ? 'mis. 446/001/SIP-D/2026' : 'Terisi dari data dokter'" :disabled="!form.id" /></div>
          <div class="field"><label :class="{ req: form.id }" for="uf-str">No. STR</label><input id="uf-str" v-model="form.str_number" class="input mono" maxlength="50" :placeholder="form.id ? '' : 'Terisi dari data dokter'" :disabled="!form.id" /></div>
        </template>
      </div>
      <p v-if="form.id && form.origRole === DOKTER && !isDokter" class="hint">Mengganti role dari Doctor akan menghapus profil dokter (poli, SIP, STR) user ini.</p>
      <p v-if="formErr" class="alert err" role="alert" style="margin-top: 12px">{{ formErr }}</p>
      <p v-if="!form.id" class="hint">Password sementara dibuat otomatis dan ditampilkan sekali setelah disimpan.</p>
      <template #footer>
        <button class="btn" :disabled="saving" @click="show = false">Batal</button>
        <button class="btn btn-primary" :disabled="saving" @click="simpan">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
      </template>
    </AppModal>

    <AppModal v-model="rShow" :title="rForm.id ? 'Ubah role' : 'Tambah role'">
      <div class="form-grid">
        <div class="field"><label class="req" for="rf-name">Kode role</label><input id="rf-name" v-model="rForm.name" class="input mono" :disabled="!!rForm.id" placeholder="mis. nurse" /><span class="hint">Huruf kecil, angka, garis bawah. Tidak dapat diubah setelah dibuat.</span></div>
        <div class="field"><label class="req" for="rf-disp">Nama tampilan</label><input id="rf-disp" v-model="rForm.display_name" class="input" maxlength="100" placeholder="mis. Nurse" /></div>
        <div class="field full"><label for="rf-desc">Keterangan</label><input id="rf-desc" v-model="rForm.description" class="input" maxlength="255" /></div>
      </div>
      <p v-if="rErr" class="alert err" role="alert" style="margin-top: 12px">{{ rErr }}</p>
      <template #footer>
        <button class="btn" :disabled="rSaving" @click="rShow = false">Batal</button>
        <button class="btn btn-primary" :disabled="rSaving" @click="simpanRole">{{ rSaving ? 'Menyimpan…' : 'Simpan' }}</button>
      </template>
    </AppModal>

    <AppModal :model-value="!!resetTarget" title="Reset password" @update:model-value="resetTarget = null">
      <p>Reset password <b>{{ resetTarget?.name }}</b> ({{ resetTarget?.email }})? Password lama tidak berlaku lagi.</p>
      <template #footer><button class="btn" @click="resetTarget = null">Batal</button><button class="btn btn-primary" @click="resetPw">Reset</button></template>
    </AppModal>

    <AppModal :model-value="!!hapusTarget" title="Hapus user" @update:model-value="hapusTarget = null">
      <p>Hapus akun <b>{{ hapusTarget?.name }}</b> ({{ hapusTarget?.email }})? Pengguna tidak dapat login lagi.</p>
      <template #footer><button class="btn" @click="hapusTarget = null">Batal</button><button class="btn btn-danger" @click="hapusUser">Hapus</button></template>
    </AppModal>

    <AppModal :model-value="!!hapusRoleTarget" title="Hapus role" @update:model-value="hapusRoleTarget = null">
      <p>Hapus role <b>{{ hapusRoleTarget?.display_name }}</b> (<span class="mono">{{ hapusRoleTarget?.name }}</span>)? Role yang masih dipakai user tidak dapat dihapus.</p>
      <template #footer><button class="btn" @click="hapusRoleTarget = null">Batal</button><button class="btn btn-danger" @click="hapusRole">Hapus</button></template>
    </AppModal>

    <AppModal :model-value="!!hasil" :title="hasil?.judul || ''" @update:model-value="hasil = null">
      <p>Password sementara untuk <b>{{ hasil?.user }}</b>. Sampaikan ke pengguna secara langsung. Password ini tidak akan ditampilkan lagi.</p>
      <p class="bignum mono" style="font-size: 34px; word-break: break-all">{{ hasil?.pw }}</p>
      <template #footer><button class="btn btn-primary" @click="hasil = null">Tutup</button></template>
    </AppModal>
  </div>
</template>
