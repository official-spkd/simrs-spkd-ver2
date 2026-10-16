<script setup lang="ts">
import type { ApiRole, ApiUser } from '~/composables/useUsers'
import type { ApiPoli } from '~/composables/usePolis'
import type { ApiDoctor } from '~/composables/useDoctors'
// IT-01 User & Role (RBAC) — akun & role dari backend (khusus superadmin); matriks izin masih lokal (belum ada endpoint).
const { db } = useDb()
useIt()
const { setMatrix } = useAdmin()
const { user } = useAuth()
const svc = useUsers()
const toast = useToast()
const KEYS = [['lihat', 'L', 'Lihat'], ['input', 'I', 'Input'], ['edit', 'E', 'Edit'], ['hapus', 'H', 'Hapus draf'], ['verifikasi', 'V', 'Verifikasi']]
const ROLE5: [string, string][] = [['fo', 'FO / Admin'], ['dokter', 'Dokter / Perawat'], ['kasir', 'Kasir'], ['mgmt', 'Manajemen'], ['it', 'IT']]
const UNIT: Record<string, string> = { front_office: 'Loket', cashier: 'Kasir RJ', management: 'Manajemen', it: 'Sistem', superadmin: 'Sistem' }

// ---------- role (backend) ----------
const roleList = ref<ApiRole[]>([])
const roleErr = ref('')
const roleName = (name: string) => {
  const r = BACKEND_ROLE[name]
  return r ? ROLE5.find((x) => x[0] === r)?.[1] || ROLE_LABEL[r] : roleList.value.find((x) => x.name === name)?.display_name || name
}
const loadRoles = async () => {
  roleErr.value = ''
  try { roleList.value = await svc.roles() } catch (e: any) { roleErr.value = e.message }
}

// ---------- daftar user ----------
const cari = ref('')
const fRole = ref('')
const fStatus = ref('aktif')
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
    const r = await svc.list({ search: cari.value, role: fRole.value, status: fStatus.value, page: page.value, limit: 10 })
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
const unitOf = (u: ApiUser) => (u.role === 'doctor' ? u.doctor_profile?.poli?.prefix_code || '-' : UNIT[u.role] || '-')
// login terakhir: server belum menyediakan; pakai jejak login di audit lokal bila ada
const loginTerakhir = (u: ApiUser) => db.audit.find((a: any) => a.aksi === 'login' && (a.objek === u.nip || a.objek === u.email || a.user === u.name))?.at

// ---------- panel tambah / ubah user ----------
const show = ref(false)
const saving = ref(false)
const formErr = ref('')
const DOKTER = 'doctor'
const empty = () => ({ id: '', name: '', nip: '', email: '', role: 'front_office', origRole: '', is_active: true, poli_id: '', doctorId: '', sip_number: '', str_number: '', orig: { poli_id: '', sip_number: '', str_number: '' } })
const form = reactive(empty())
watch(() => form.nip, (v) => { const c = onlyDigits(v, 30); if (c !== v) form.nip = c })
const isDokter = computed(() => form.role === DOKTER)
const target = computed(() => rows.value.find((u) => u.id === form.id) || null)

const poliOpsi = ref<ApiPoli[]>([])
const dokterOpsi = ref<ApiDoctor[]>([])
const loadPoli = async () => {
  try {
    const [p, d] = await Promise.all([usePolis().all(), useDoctors().all({ is_active: true })])
    poliOpsi.value = p.filter((x) => x.is_active)
    dokterOpsi.value = d
    if (!form.doctorId && form.sip_number) form.doctorId = d.find((x) => x.sip_number === form.sip_number)?.id || ''
    else isiDariDokter()
  } catch (e: any) { formErr.value = `Gagal memuat poli/dokter: ${e.message}` }
}
// master dokter yang sudah punya akun — satu data dokter hanya boleh dipakai satu akun
const terpakai = ref(new Set<string>())
const loadTerpakai = async () => {
  const ids = new Set<string>()
  try {
    for (let p = 1; ; p++) {
      const r = await svc.list({ role: DOKTER, status: '', page: p, limit: 100 })
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
const isiDariDokter = () => {
  const d = dokterOpsi.value.find((x) => x.id === form.doctorId)
  if (d) { form.sip_number = d.sip_number; form.str_number = d.str_number; form.poli_id = d.poli?.id || form.poli_id }
  else if (!form.id) { form.sip_number = ''; form.str_number = '' }
}
watch(() => form.doctorId, isiDariDokter)
watch(() => form.poli_id, () => {
  if (form.doctorId && !dokterPoli.value.some((d) => d.id === form.doctorId)) form.doctorId = ''
})
const kredensialLengkap = computed(() => !isDokter.value || (!!form.poli_id && form.sip_number.trim().length >= 5 && form.str_number.trim().length >= 5))

const buka = (u?: ApiUser) => {
  Object.assign(form, empty())
  if (u) {
    const dp = u.doctor_profile
    const doc = { poli_id: dp?.poli?.id || '', sip_number: dp?.sip_number || '', str_number: dp?.str_number || '' }
    Object.assign(form, { id: u.id, name: u.name, nip: u.nip, email: u.email, role: u.role, origRole: u.role, is_active: u.is_active, doctorId: u.doctor_id || '', ...doc, orig: { ...doc } })
  }
  formErr.value = ''
  show.value = true
  if (isDokter.value) loadTerpakai()
  if (isDokter.value && !poliOpsi.value.length) loadPoli()
  else if (!form.doctorId && form.sip_number) form.doctorId = dokterOpsi.value.find((x) => x.sip_number === form.sip_number)?.id || ''
}
const cekDokter = () => {
  if (!form.poli_id) return 'Penugasan poli wajib dipilih'
  if (form.sip_number.trim().length < 5) return 'No. SIP minimal 5 karakter'
  if (form.str_number.trim().length < 5) return 'No. STR minimal 5 karakter'
  return ''
}
const dokterFields = () => ({ poli_id: form.poli_id, sip_number: form.sip_number.trim(), str_number: form.str_number.trim() })
const dokterBerubah = () => {
  const d: Record<string, string> = dokterFields()
  return Object.fromEntries(Object.entries(d).filter(([k, v]) => v !== (form.orig as any)[k]))
}
const hasil = ref<{ judul: string; user: string; pw: string } | null>(null)
const simpan = async () => {
  formErr.value = ''
  const f = { name: form.name.trim(), nip: form.nip.trim(), email: form.email.trim().toLowerCase() }
  if (!f.name || !f.nip || !f.email) { formErr.value = 'Nama, username (NIP), dan email wajib diisi'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { formErr.value = 'Format email tidak valid'; return }
  if (!form.role) { formErr.value = 'Role wajib dipilih'; return }
  if (isDokter.value) {
    // Register cukup doctor_id (profil diambil server dari master dokter); ubah user memakai poli/SIP/STR.
    const e = form.id ? cekDokter() : !form.doctorId ? 'Dokter / nakes wajib dipilih' : ''
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

// ---------- aksi akun ----------
const busy = ref(false)
const aksi = async (kerja: () => Promise<any>, pesan: string) => {
  busy.value = true
  try { await kerja(); toast.ok(pesan); await load(); return true } catch (e: any) { toast.err(e.message); return false } finally { busy.value = false }
}
const ubahStatus = async () => {
  const u = target.value
  if (!u) return
  if (await aksi(() => svc.setStatus(u.id, !u.is_active), `${u.name} ${u.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)) form.is_active = !u.is_active
}
const resetTarget = ref<ApiUser | null>(null)
const resetPw = async () => {
  const u = resetTarget.value!
  const pw = tempPassword()
  resetTarget.value = null
  if (await aksi(() => svc.resetPassword(u.id, pw), 'Password sementara dibuat')) hasil.value = { judul: 'Password direset', user: u.email, pw }
}
const hapusTarget = ref<ApiUser | null>(null)
const hapusUser = async () => {
  const u = hapusTarget.value!
  hapusTarget.value = null
  if (await aksi(() => svc.remove(u.id), `User ${u.name} dihapus`)) show.value = false
}

// ---------- kelola role (backend) ----------
const rList = ref(false)
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
const tanpaMenu = (name: string) => !BACKEND_ROLE[name]

// ---------- matriks role × modul (lokal) ----------
const editMx = ref(false)
const roleAktif = ref('fo')
const sel = (r: string, m: string) => {
  const c = db.matrix[r]?.[m]
  if (!c) return '—'
  const s = KEYS.filter((k) => c[k[0]]).map((k) => k[1]).join(' ')
  return s ? s + (c.cat ? ' ' + c.cat : '') : '—'
}
const ubahMatriks = (modul: string, key: string, e: Event) => {
  const el = e.target as HTMLInputElement
  const r = toast.attempt(() => setMatrix(roleAktif.value, modul, key, el.checked))
  if (!r) el.checked = !el.checked
}
const bukaMatriks = () => {
  editMx.value = true
  nextTick(() => document.getElementById('mx-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
</script>

<template>
  <div>
    <PageHead code="IT-01" role="IT" title="User & Role (RBAC)" subtitle="Kelola akun, penugasan unit, dan izin akses · 5 role default" />
    <div class="kl-actions" style="margin-bottom: 24px">
      <button class="btn btn-primary" @click="buka()">+ Tambah user</button>
      <button class="btn" @click="bukaMatriks">Edit matriks izin</button>
    </div>

    <div class="kl-cols">
      <div class="panel">
        <h2>Pengguna terdaftar</h2>
        <div class="kl-filters" style="margin: 0">
          <label class="sr-only" for="u-cari">Cari nama / username</label>
          <input id="u-cari" v-model="cari" class="input q" placeholder="⌕ Nama / username" inputmode="search" />
          <label class="sr-only" for="u-role">Role</label>
          <select id="u-role" v-model="fRole" class="select"><option value="">Semua role</option><option v-for="r in roleList" :key="r.id" :value="r.name">{{ roleName(r.name) }}</option></select>
          <label class="sr-only" for="u-status">Status</label>
          <select id="u-status" v-model="fStatus" class="select"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option><option value="">Semua status</option></select>
        </div>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead><tr><th>Nama / username</th><th>Role</th><th>Unit / poli</th><th>Status</th><th>Login terakhir</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="u in rows" :key="u.id" :class="{ sel: show && form.id === u.id }">
                <td data-label="Nama / username">{{ u.name }}<span v-if="isSelf(u)" class="badge b-navy" style="margin-left: 6px">Anda</span><div>{{ u.nip || u.email }}</div></td>
                <td data-label="Role">{{ roleName(u.role) }}</td>
                <td data-label="Unit / poli">{{ unitOf(u) }}</td>
                <td data-label="Status"><span class="badge" :class="u.is_active ? 'b-ok' : 'b-mute'">{{ u.is_active ? 'Aktif' : 'Nonaktif' }}</span></td>
                <td data-label="Login terakhir">{{ loginTerakhir(u) ? fmtTglPendek(loginTerakhir(u)) + ' ' + fmtJam(loginTerakhir(u)) : '—' }}</td>
                <td data-label="Aksi"><button class="link" @click="buka(u)">Edit</button></td>
              </tr>
              <tr v-if="loading && !rows.length"><td colspan="6" class="empty">Memuat data user…</td></tr>
              <tr v-else-if="err"><td colspan="6" class="empty" role="alert">{{ err }} <button class="btn btn-sm" style="margin-left: 8px" @click="load">Coba lagi</button></td></tr>
              <tr v-else-if="!rows.length"><td colspan="6" class="empty">Tidak ada user</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pager-kl">
          <span>{{ total }} pengguna · Satu akun Dokter / Perawat untuk pelayanan klinis bersama.</span>
          <template v-if="pages > 1">
            <button :disabled="page <= 1 || loading" @click="page--">‹ Sebelumnya</button>
            <span>{{ page }} / {{ pages }}</span>
            <button :disabled="page >= pages || loading" @click="page++">Berikutnya ›</button>
          </template>
        </div>
      </div>

      <div class="panel">
        <template v-if="show">
          <h2>{{ form.id ? `Edit user · ${form.name || 'tanpa nama'}` : 'Tambah user' }}</h2>
          <div class="field"><label class="req" for="uf-nama">Nama lengkap</label><input id="uf-nama" v-model="form.name" class="input" maxlength="150" /></div>
          <div class="field"><label class="req" for="uf-nip">Username (NIP)</label><input id="uf-nip" v-model="form.nip" class="input mono" maxlength="30" inputmode="numeric" /></div>
          <div class="field"><label class="req" for="uf-email">Email</label><input id="uf-email" v-model="form.email" type="email" class="input" maxlength="150" autocapitalize="none" /></div>
          <div class="field"><label class="req" for="uf-role">Role</label>
            <select id="uf-role" v-model="form.role" class="select" :disabled="!!form.id && form.id === user?.id">
              <option v-for="r in roleList" :key="r.id" :value="r.name">{{ roleName(r.name) }}{{ tanpaMenu(r.name) ? ' (belum ada menu)' : '' }}</option>
            </select>
            <span v-if="form.id && form.id === user?.id" class="hint">Role akun sendiri tidak dapat diubah.</span>
          </div>
          <template v-if="isDokter">
            <div class="field"><label class="req" for="uf-poli">Penugasan poli</label>
              <select id="uf-poli" v-model="form.poli_id" class="select">
                <option value="">{{ poliOpsi.length ? 'Pilih poli' : 'Memuat poli…' }}</option>
                <option v-for="p in poliOpsi" :key="p.id" :value="p.id">{{ p.name }}</option>
                <option v-if="form.poli_id && !poliOpsi.some((p) => p.id === form.poli_id)" :value="form.poli_id" disabled>Poli saat ini (nonaktif)</option>
              </select>
            </div>
            <div class="field"><label :class="{ req: !form.id }" for="uf-dr">Dokter / nakes</label>
              <select id="uf-dr" v-model="form.doctorId" class="select"><option value="">{{ form.id ? 'Tidak dipetakan' : 'Pilih dokter' }}</option><option v-for="d in dokterPoli" :key="d.id" :value="d.id">{{ d.name }}{{ d.ihs_number ? ' · ' + d.ihs_number : '' }}</option></select>
              <span v-if="!form.id && dokterOpsi.length && !dokterPoli.length" class="hint">Semua dokter{{ form.poli_id ? ' di poli ini' : '' }} sudah punya akun.</span>
            </div>
            <div class="field"><label class="req">SIP / STR</label>
              <div class="sipstr">
                <input v-model="form.sip_number" class="input mono" maxlength="50" aria-label="No. SIP" :placeholder="form.id ? 'No. SIP' : 'Terisi dari data dokter'" :disabled="!form.id" />
                <input v-model="form.str_number" class="input mono" maxlength="50" aria-label="No. STR" :placeholder="form.id ? 'No. STR' : 'Terisi dari data dokter'" :disabled="!form.id" />
              </div>
            </div>
          </template>
          <div v-if="form.id"><span class="badge" :class="form.is_active && kredensialLengkap ? 'b-ok' : 'b-warn'">{{ form.is_active ? 'Aktif' : 'Nonaktif' }}{{ isDokter ? (kredensialLengkap ? ' · Kredensial lengkap' : ' · Kredensial belum lengkap') : '' }}</span></div>
          <p v-if="form.id && form.origRole === DOKTER && !isDokter" class="hint">Mengganti role dari Dokter menghapus profil dokter (poli, SIP, STR) user ini.</p>
          <p v-if="formErr" class="alert err" role="alert">{{ formErr }}</p>
          <p v-if="!form.id" class="hint">Password sementara dibuat otomatis dan ditampilkan sekali setelah disimpan.</p>
          <div class="kl-actions">
            <button class="btn btn-primary" :disabled="saving" @click="simpan">{{ saving ? 'Menyimpan…' : form.id ? 'Simpan perubahan' : 'Simpan user' }}</button>
            <template v-if="target">
              <button class="btn" :disabled="busy" @click="resetTarget = target">Reset password</button>
              <button v-if="!isSelf(target)" class="btn" :disabled="busy" @click="ubahStatus">{{ target.is_active ? 'Nonaktifkan' : 'Aktifkan' }}</button>
              <button v-if="!isSelf(target)" class="btn btn-ghost err-text" :disabled="busy" @click="hapusTarget = target">Hapus</button>
            </template>
            <button v-else class="btn" @click="show = false">Batal</button>
          </div>
        </template>
        <template v-else>
          <h2>Detail user</h2>
          <p class="muted">Pilih <b>Edit</b> pada daftar pengguna untuk mengubah akun, atau tambah user baru.</p>
          <div class="guide">Role Dokter / Perawat wajib dipetakan ke poli dan data nakes (SIP / STR).</div>
          <div><button class="btn btn-primary" @click="buka()">+ Tambah user</button></div>
        </template>
      </div>
    </div>

    <div id="mx-panel" class="panel" style="margin-top: 16px">
      <h2>Matriks izin · 5 role × modul</h2>
      <p>L = lihat · I = input · E = edit · H = hapus draf · V = verifikasi. — = tidak diizinkan.</p>
      <div v-if="!editMx" class="table-wrap">
        <table class="tbl rtable mx">
          <thead><tr><th>Modul</th><th v-for="r in ROLE5" :key="r[0]">{{ r[1] }}</th></tr></thead>
          <tbody>
            <tr v-for="(m, i) in db.modules" :key="m" :class="{ sel: i === 0 }">
              <td data-label="Modul">{{ m }}</td>
              <td v-for="r in ROLE5" :key="r[0]" :data-label="r[1]" :class="{ it: r[0] === 'it' }">{{ sel(r[0], m) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template v-else>
        <div class="row between">
          <div class="seg" role="group" aria-label="Pilih role">
            <button v-for="r in ROLE5" :key="r[0]" :class="{ on: roleAktif === r[0] }" @click="roleAktif = r[0]">{{ r[1] }}</button>
          </div>
          <span v-if="roleAktif === 'it'" class="badge b-warn">Hak akses IT tidak dapat diubah</span>
        </div>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead><tr><th>Modul</th><th v-for="k in KEYS" :key="k[0]" class="center">{{ k[2] }}</th></tr></thead>
            <tbody>
              <tr v-for="m in db.modules" :key="m">
                <td data-label="Modul"><b>{{ m }}</b><span v-if="db.matrix[roleAktif][m].cat" class="muted"> · {{ db.matrix[roleAktif][m].cat }}</span></td>
                <td v-for="k in KEYS" :key="k[0]" class="center" :data-label="k[2]">
                  <input type="checkbox" style="width: 20px; height: 20px; accent-color: var(--teal)" :checked="db.matrix[roleAktif][m][k[0]]" :disabled="roleAktif === 'it'" :aria-label="`${m} ${k[2]}`" @change="ubahMatriks(m, k[0], $event)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <div class="guide">Hapus hanya untuk draf / master yang belum dipakai. SOAP final, tagihan final, dan audit tidak dapat dihapus. Role Dokter / Perawat adalah satu role bersama; penugasan dokter membutuhkan poli dan SIP / STR.</div>
      <div class="kl-actions">
        <button class="btn" :class="{ 'btn-primary': editMx }" @click="editMx = !editMx">{{ editMx ? 'Selesai mengedit' : 'Edit matriks izin' }}</button>
        <button class="btn" @click="rList = true">Kelola role server</button>
      </div>
      <p class="hint" style="margin: 0">Matriks izin masih prototipe lokal (belum ada endpoint backend); penegakan akses memakai menu per role dan pengecekan role di server. Setiap perubahan tercatat di audit.</p>
    </div>

    <AppModal v-model="rList" title="Role di server" size="lg">
      <p v-if="roleErr" class="alert err" role="alert" style="margin-bottom: 12px">{{ roleErr }}</p>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Kode</th><th>Nama tampilan</th><th>Jenis</th><th>Menu aplikasi</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="r in roleList" :key="r.id">
              <td data-label="Kode" class="mono">{{ r.name }}</td>
              <td data-label="Nama"><b>{{ r.display_name }}</b><div class="muted small">{{ r.description }}</div></td>
              <td data-label="Jenis"><span class="badge" :class="r.is_system ? 'b-navy' : ''">{{ r.is_system ? 'Bawaan' : 'Tambahan' }}</span></td>
              <td data-label="Menu"><span v-if="tanpaMenu(r.name)" class="badge b-warn">Belum ada menu</span><span v-else>{{ roleName(r.name) }}</span></td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="bukaRole(r)">Ubah</button>
                  <button v-if="!r.is_system" class="btn btn-sm btn-danger" @click="hapusRoleTarget = r">Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Role bawaan tidak dapat dihapus. Role baru perlu dipetakan ke menu aplikasi sebelum penggunanya bisa login.</p>
      <template #footer><button class="btn" @click="rList = false">Tutup</button><button class="btn btn-primary" @click="bukaRole()">+ Tambah role</button></template>
    </AppModal>

    <AppModal v-model="rShow" :title="rForm.id ? 'Ubah role' : 'Tambah role'">
      <div class="form-grid">
        <div class="field"><label class="req" for="rf-name">Kode role</label><input id="rf-name" v-model="rForm.name" class="input mono" :disabled="!!rForm.id" placeholder="mis. nurse" /><span class="hint">Huruf kecil, angka, garis bawah. Tidak dapat diubah setelah dibuat.</span></div>
        <div class="field"><label class="req" for="rf-disp">Nama tampilan</label><input id="rf-disp" v-model="rForm.display_name" class="input" maxlength="100" /></div>
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

<style scoped>
.sipstr { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mx td.it { color: var(--teal-d); }
</style>
