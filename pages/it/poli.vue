<script setup lang="ts">
const { db, poli } = useDb()
const { savePoli, deletePoli, saveDoctor, deleteDoctor, poliTerpakai, doctorTerpakai } = useAdmin()
const toast = useToast()
const tab = ref('poli')

// ---- poli ----
const showP = ref(false)
const fp = reactive<any>({ id: '', kode: '', nama: '', ruang: '', aktif: true })
const bukaP = (p?: any) => {
  Object.assign(fp, { id: '', kode: '', nama: '', ruang: '', aktif: true }, p ? { ...p } : {})
  showP.value = true
}
const simpanP = () => {
  const r = toast.attempt(() => savePoli({ ...fp }))
  if (r) { showP.value = false; toast.ok(`Poli ${r.nama} disimpan`) }
}
const hapusP = (p: any) => {
  if (!confirm(`Hapus poli ${p.nama}?`)) return
  toast.attempt(() => deletePoli(p.id), `Poli ${p.nama} dihapus`)
}
const toggleP = (p: any) => {
  const r = toast.attempt(() => savePoli({ ...p, aktif: !p.aktif }))
  if (r) toast.ok(`Poli ${p.nama} ${p.aktif ? 'diaktifkan' : 'dinonaktifkan'}`)
}

// ---- dokter ----
const filterPoli = ref('')
const dokters = computed(() => db.doctors.filter((d: any) => !filterPoli.value || d.poliId === filterPoli.value))
const showD = ref(false)
const blank = () => ({ id: '', nama: '', spesialis: '', poliId: '', sip: '', str: '', ihs: '' })
const fd = reactive<any>(blank())
const bukaD = (d?: any) => {
  Object.assign(fd, blank(), d ? { ...d } : {})
  showD.value = true
}
const simpanD = () => {
  const r = toast.attempt(() => saveDoctor({ ...fd }))
  if (r) { showD.value = false; toast.ok(`Dokter ${r.nama} disimpan`) }
}
const hapusD = (d: any) => {
  if (!confirm(`Hapus dokter ${d.nama}?`)) return
  toast.attempt(() => deleteDoctor(d.id), `Dokter ${d.nama} dihapus`)
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
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Prefix</th><th>Nama poli</th><th>Ruang</th><th>Dokter</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="p in db.polis" :key="p.id">
              <td data-label="Prefix"><span class="badge b-navy mono">{{ p.kode }}</span></td>
              <td data-label="Nama poli"><b>{{ p.nama }}</b></td>
              <td data-label="Ruang">{{ p.ruang || '-' }}</td>
              <td data-label="Dokter">{{ db.doctors.filter((d: any) => d.poliId === p.id).length }}</td>
              <td data-label="Status"><StatusBadge :value="p.aktif ? 'aktif' : 'nonaktif'" /></td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="bukaP(p)">Ubah</button>
                  <button class="btn btn-sm" @click="toggleP(p)">{{ p.aktif ? 'Nonaktifkan' : 'Aktifkan' }}</button>
                  <button class="btn btn-sm btn-danger" :title="poliTerpakai(p.id) ? 'Sudah dipakai kunjungan: nonaktifkan saja' : 'Hapus'" @click="hapusP(p)">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="!db.polis.length"><td colspan="6" class="empty">Belum ada poli</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hint">Poli yang sudah dipakai kunjungan tidak dapat dihapus; nonaktifkan agar tidak muncul di pendaftaran.</p>
    </div>

    <div v-else class="card">
      <div class="filters">
        <div class="field"><label for="d-poli">Poli</label>
          <select id="d-poli" v-model="filterPoli" class="select"><option value="">Semua poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Nama</th><th>Spesialisasi</th><th>Poli</th><th>SIP</th><th>STR</th><th>IHS (Satu Sehat)</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="d in dokters" :key="d.id">
              <td data-label="Nama"><b>{{ d.nama }}</b></td>
              <td data-label="Spesialisasi">{{ d.spesialis }}</td>
              <td data-label="Poli">{{ poli(d.poliId)?.nama }}</td>
              <td data-label="SIP" class="mono">{{ d.sip }}</td>
              <td data-label="STR" class="mono">{{ d.str }}</td>
              <td data-label="IHS"><span v-if="d.ihs" class="mono">{{ d.ihs }}</span><span v-else class="badge b-warn">Belum ada</span></td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" @click="bukaD(d)">Ubah</button>
                  <button class="btn btn-sm btn-danger" :title="doctorTerpakai(d.id) ? 'Sudah punya kunjungan' : 'Hapus'" @click="hapusD(d)">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="!dokters.length"><td colspan="7" class="empty">Belum ada dokter</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-model="showP" :title="fp.id ? 'Ubah poli' : 'Tambah poli'">
      <div class="form-grid">
        <div class="field"><label class="req" for="p-kode">Kode prefix (2 huruf)</label><input id="p-kode" v-model="fp.kode" class="input mono" maxlength="2" style="text-transform: uppercase" /></div>
        <div class="field"><label class="req" for="p-nama">Nama poli</label><input id="p-nama" v-model="fp.nama" class="input" /></div>
        <div class="field"><label for="p-ruang">Ruang</label><input id="p-ruang" v-model="fp.ruang" class="input" /></div>
        <label class="check" style="align-self: end; min-height: 40px"><input v-model="fp.aktif" type="checkbox" /><span>Poli aktif</span></label>
      </div>
      <template #footer><button class="btn" @click="showP = false">Batal</button><button class="btn btn-primary" @click="simpanP">Simpan</button></template>
    </AppModal>

    <AppModal v-model="showD" :title="fd.id ? 'Ubah dokter' : 'Tambah dokter'">
      <div class="form-grid">
        <div class="field full"><label class="req" for="dk-nama">Nama (dengan gelar)</label><input id="dk-nama" v-model="fd.nama" class="input" /></div>
        <div class="field"><label for="dk-sp">Spesialisasi</label><input id="dk-sp" v-model="fd.spesialis" class="input" /></div>
        <div class="field"><label class="req" for="dk-poli">Poli</label>
          <select id="dk-poli" v-model="fd.poliId" class="select"><option value="">Pilih poli</option><option v-for="p in db.polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
        </div>
        <div class="field"><label class="req" for="dk-sip">No. SIP</label><input id="dk-sip" v-model="fd.sip" class="input" /></div>
        <div class="field"><label class="req" for="dk-str">No. STR</label><input id="dk-str" v-model="fd.str" class="input" /></div>
        <div class="field full"><label for="dk-ihs">IHS Number (Satu Sehat)</label><input id="dk-ihs" v-model="fd.ihs" class="input" placeholder="mis. N10000001" /><span class="hint">Boleh kosong; pengiriman Encounter memerlukan IHS dokter.</span></div>
      </div>
      <template #footer><button class="btn" @click="showD = false">Batal</button><button class="btn btn-primary" @click="simpanD">Simpan</button></template>
    </AppModal>
  </div>
</template>
