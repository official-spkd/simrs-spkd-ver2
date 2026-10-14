<script setup lang="ts">
const { db } = useDb()
const { saveUser, toggleUser, resetPassword, setMatrix } = useAdmin()
const toast = useToast()
const tab = ref('user')
const roles = Object.keys(ROLE_LABEL) as string[]
const lbl = (r: string) => (ROLE_LABEL as any)[r] || r
const KEYS =[['lihat', 'Lihat'], ['input', 'Input'], ['edit', 'Edit'], ['hapus', 'Hapus'], ['verifikasi', 'Verifikasi']]

const cari = ref('')
const fRole = ref('')
const rows = computed(() => {
  const s = cari.value.trim().toLowerCase()
  return db.users.filter((u: any) => (!fRole.value || u.role === fRole.value) && (!s || u.nama.toLowerCase().includes(s) || u.username.includes(s)))
})

const show = ref(false)
const empty = () => ({ id: '', nama: '', username: '', role: 'fo', unit: '', poliId: '', doctorId: '', sip: '', str: '' })
const form = reactive<any>(empty())
const buka = (u?: any) => {
  Object.assign(form, empty())
  if (u) {
    const [sip, str] = (u.nakes || '').split(' / ')
    Object.assign(form, { id: u.id, nama: u.nama, username: u.username, role: u.role, unit: u.unit, poliId: u.poliId || '', doctorId: u.doctorId || '', sip: sip || '', str: str || '' })
  }
  show.value = true
}
const dokterPoli = computed(() => db.doctors.filter((d: any) => !form.poliId || d.poliId === form.poliId))
watch(() => form.doctorId, (id) => {
  const d = db.doctors.find((x: any) => x.id === id)
  if (d) { form.sip = d.sip; form.str = d.str; form.poliId = d.poliId }
})
watch(() => form.poliId, () => {
  if (form.doctorId && !dokterPoli.value.some((d: any) => d.id === form.doctorId)) form.doctorId = ''
})
const hasil = ref<{ judul: string; user: string; pw: string } | null>(null)
const simpan = () => {
  const r = toast.attempt(() => saveUser({ ...form }))
  if (!r) return
  show.value = false
  if (r.tempPassword) {
    hasil.value = { judul: 'User ditambahkan', user: r.user.username, pw: r.tempPassword }
    toast.ok(`User ${r.user.username} ditambahkan`)
  } else toast.ok(`User ${r.user.username} diperbarui`)
}
const ubahStatus = (u: any) => {
  const r = toast.attempt(() => toggleUser(u.id))
  if (r) toast.ok(`${u.username} ${u.aktif ? 'diaktifkan' : 'dinonaktifkan'}`)
}
const reset = (u: any) => {
  if (!confirm(`Reset password ${u.username}? Password lama tidak berlaku lagi.`)) return
  const pw = toast.attempt(() => resetPassword(u.id))
  if (pw) { hasil.value = { judul: 'Password direset', user: u.username, pw }; toast.ok('Password sementara dibuat') }
}

const roleAktif = ref('fo')
const ubahMatriks = (modul: string, key: string, e: Event) => {
  const el = e.target as HTMLInputElement
  const r = toast.attempt(() => setMatrix(roleAktif.value, modul, key, el.checked))
  if (!r) el.checked = !el.checked
}
</script>

<template>
  <div>
    <PageHead code="IT-01" role="IT / Superadmin" title="User & Role (RBAC)" subtitle="Kelola akun, pemetaan dokter ke poli, dan matriks hak akses. Setiap perubahan tercatat di audit trail.">
      <template #actions><button class="btn btn-primary" @click="buka()">+ Tambah user</button></template>
    </PageHead>
    <AppTabs v-model="tab" :tabs="[{ key: 'user', label: 'Daftar user' }, { key: 'matriks', label: 'Matriks role x modul' }]" />

    <div v-if="tab === 'user'" class="card">
      <div class="filters">
        <div class="field"><label for="u-cari">Cari</label><input id="u-cari" v-model="cari" class="input" placeholder="Nama / username" /></div>
        <div class="field"><label for="u-role">Role</label>
          <select id="u-role" v-model="fRole" class="select"><option value="">Semua role</option><option v-for="r in roles" :key="r" :value="r">{{ lbl(r) }}</option></select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Unit / poli</th><th>Status</th><th>Login terakhir</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="u in rows" :key="u.id">
              <td data-label="Nama"><b>{{ u.nama }}</b><div v-if="u.nakes" class="muted small">{{ u.nakes }}</div></td>
              <td data-label="Username" class="mono">{{ u.username }}</td>
              <td data-label="Role"><span class="badge b-navy">{{ lbl(u.role) }}</span></td>
              <td data-label="Unit / poli">{{ u.unit }}</td>
              <td data-label="Status"><StatusBadge :value="u.aktif ? 'aktif' : 'nonaktif'" /></td>
              <td data-label="Login terakhir">{{ fmtWaktu(u.loginTerakhir) }}</td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="buka(u)">Ubah</button>
                  <button class="btn btn-sm" :class="u.aktif ? 'btn-danger' : ''" @click="ubahStatus(u)">{{ u.aktif ? 'Nonaktifkan' : 'Aktifkan' }}</button>
                  <button class="btn btn-sm" @click="reset(u)">Reset password</button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length"><td colspan="7" class="empty">Tidak ada user</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Akun dokter dan perawat memakai satu role bersama: "Dokter / Perawat".</p>
    </div>

    <div v-else class="card">
      <div class="row between" style="margin-bottom: 14px">
        <div class="seg" role="group" aria-label="Pilih role">
          <button v-for="r in roles" :key="r" :class="{ on: roleAktif === r }" @click="roleAktif = r">{{ lbl(r) }}</button>
        </div>
        <span v-if="roleAktif === 'it'" class="badge b-warn">Superadmin: hak akses penuh, tidak dapat diubah</span>
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
      <p class="hint">Mencabut "Lihat" otomatis mencabut hak lain; mencentang hak lain otomatis mencentang "Lihat". Prototipe: matriks mencatat kebijakan, penegakan akses utama memakai menu per role.</p>
    </div>

    <AppModal v-model="show" :title="form.id ? 'Ubah user' : 'Tambah user'">
      <div class="form-grid">
        <div class="field"><label class="req" for="uf-nama">Nama lengkap</label><input id="uf-nama" v-model="form.nama" class="input" /></div>
        <div class="field"><label class="req" for="uf-user">Username</label><input id="uf-user" v-model="form.username" class="input" autocapitalize="none" /></div>
        <div class="field"><label class="req" for="uf-role">Role</label>
          <select id="uf-role" v-model="form.role" class="select"><option v-for="r in roles" :key="r" :value="r">{{ lbl(r) }}</option></select>
        </div>
        <div v-if="form.role !== 'dokter'" class="field"><label class="req" for="uf-unit">Unit kerja</label><input id="uf-unit" v-model="form.unit" class="input" placeholder="mis. Loket 1 · Rawat Jalan" /></div>
        <template v-else>
          <div class="field"><label class="req" for="uf-poli">Poli</label>
            <select id="uf-poli" v-model="form.poliId" class="select"><option value="">Pilih poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
          </div>
          <div class="field"><label for="uf-dr">Data dokter (opsional, mengisi SIP/STR)</label>
            <select id="uf-dr" v-model="form.doctorId" class="select"><option value="">Tidak dipetakan</option><option v-for="d in dokterPoli" :key="d.id" :value="d.id">{{ d.nama }}</option></select>
          </div>
          <div class="field"><label class="req" for="uf-sip">No. SIP</label><input id="uf-sip" v-model="form.sip" class="input" /></div>
          <div class="field"><label class="req" for="uf-str">No. STR</label><input id="uf-str" v-model="form.str" class="input" /></div>
        </template>
      </div>
      <p v-if="!form.id" class="hint">Password sementara dibuat otomatis dan ditampilkan sekali setelah disimpan.</p>
      <template #footer>
        <button class="btn" @click="show = false">Batal</button>
        <button class="btn btn-primary" @click="simpan">Simpan</button>
      </template>
    </AppModal>

    <AppModal :model-value="!!hasil" :title="hasil?.judul || ''" @update:model-value="hasil = null">
      <p>Password sementara untuk <b>{{ hasil?.user }}</b>. Sampaikan ke pengguna dan minta diganti setelah masuk. Password ini tidak akan ditampilkan lagi.</p>
      <p class="bignum mono" style="font-size: 34px; word-break: break-all">{{ hasil?.pw }}</p>
      <template #footer><button class="btn btn-primary" @click="hasil = null">Tutup</button></template>
    </AppModal>
  </div>
</template>
