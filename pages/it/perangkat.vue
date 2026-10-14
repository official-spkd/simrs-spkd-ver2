<script setup lang="ts">
const { db } = useDb()
const { registerDevice, activateDevice, revokeDevice, reissueDeviceCode, toggleOnline } = useAdmin()
const toast = useToast()
const lokets = [1, 2, 3, 4]
const papan = computed(() => [
  'VWR-01 Display Loket', 'VWR-02 Display Poli',
  ...lokets.map((n) => `Loket ${n}`),
  'Loket pendaftaran',
])

const show = ref(false)
const f = reactive<any>({ nama: '', tipe: 'APM', unit: '', terikat: '' })
const tipeChange = () => { f.terikat = f.tipe === 'APM' ? 'Loket pendaftaran' : 'VWR-01 Display Loket' }
const buka = () => { Object.assign(f, { nama: '', tipe: 'APM', unit: '', terikat: 'Loket pendaftaran' }); show.value = true }
const opsiPapan = computed(() => (f.tipe === 'APM' ? ['Loket pendaftaran', ...lokets.map((n) => `Loket ${n}`)] : ['VWR-01 Display Loket', 'VWR-02 Display Poli']))
const baru = ref<any>(null)
const simpan = () => {
  const d = toast.attempt(() => registerDevice({ ...f }))
  if (!d) return
  show.value = false
  baru.value = { nama: d.nama, kode: d.kode }
  toast.ok(`Perangkat ${d.nama} didaftarkan; menunggu aktivasi`)
}
const kodeInput = reactive<Record<string, string>>({})
const aktivasi = (d: any) => {
  const r = toast.attempt(() => activateDevice(d.id, kodeInput[d.id] || ''), `${d.nama} aktif`)
  if (r) kodeInput[d.id] = ''
}
const cabut = (d: any) => {
  if (!confirm(`Cabut pendaftaran ${d.nama}?${d.tipe === 'APM' ? ' APM yang dicabut tidak dapat memulai pendaftaran.' : ''}`)) return
  toast.attempt(() => revokeDevice(d.id), `${d.nama} dicabut`)
}
const kodeBaru = (d: any) => {
  const k = toast.attempt(() => reissueDeviceCode(d.id))
  if (k) { baru.value = { nama: d.nama, kode: k }; toast.ok('Kode baru diterbitkan') }
}
const online = (d: any) => toast.attempt(() => toggleOnline(d.id), `${d.nama} ${d.online ? 'online' : 'offline'}`)
const toggle = (d: any) => { toast.attempt(() => toggleOnline(d.id)) }
</script>

<template>
  <div>
    <PageHead code="IT-07" role="IT / Superadmin" title="Perangkat Terdaftar" subtitle="APM dan display TV terikat ke papan antrean tertentu, bukan lewat parameter URL.">
      <template #actions><button class="btn btn-primary" @click="buka">+ Daftarkan perangkat</button></template>
    </PageHead>
    <div class="alert info" style="margin-bottom: 16px">Kode pendaftaran bersifat sekali pakai (8 karakter). Perangkat baru berstatus belum terdaftar sampai kode dimasukkan pada perangkat (di sini: simulasi aktivasi). Pencabutan membuat APM menolak memulai pendaftaran.</div>
    <div class="card">
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Perangkat</th><th>Tipe</th><th>Unit</th><th>Terikat ke</th><th>Terdaftar</th><th>Online</th><th>Kode pendaftaran</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="d in db.devices" :key="d.id">
              <td data-label="Perangkat"><b>{{ d.nama }}</b></td>
              <td data-label="Tipe"><span class="badge b-navy">{{ d.tipe }}</span></td>
              <td data-label="Unit">{{ d.unit }}</td>
              <td data-label="Terikat ke">{{ d.terikat }}</td>
              <td data-label="Terdaftar"><span class="badge" :class="d.terdaftar ? 'b-ok' : 'b-warn'">{{ d.terdaftar ? 'Terdaftar' : 'Belum / dicabut' }}</span></td>
              <td data-label="Online">
                <button class="btn btn-sm" :disabled="!d.terdaftar" :title="'Ubah status online (simulasi)'" @click="toggle(d)"><StatusBadge :value="d.online ? 'online' : 'offline'" /></button>
              </td>
              <td data-label="Kode"><span v-if="d.kode" class="mono bold">{{ d.kode }}</span><span v-else class="muted">-</span></td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <template v-if="!d.terdaftar">
                    <input v-if="d.kode" v-model="kodeInput[d.id]" class="input mono" style="width: 120px; min-height: 30px; padding: 4px 8px" placeholder="Kode" maxlength="8" :aria-label="'Kode aktivasi ' + d.nama" />
                    <button v-if="d.kode" class="btn btn-sm btn-primary" @click="aktivasi(d)">Aktivasi</button>
                    <button v-else class="btn btn-sm" @click="kodeBaru(d)">Kode baru</button>
                  </template>
                  <button v-else class="btn btn-sm btn-danger" @click="cabut(d)">Cabut</button>
                </div>
              </td>
            </tr>
            <tr v-if="!db.devices.length"><td colspan="8" class="empty">Belum ada perangkat</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-model="show" title="Daftarkan perangkat">
      <div class="form-grid">
        <div class="field full"><label class="req" for="pf-nama">Nama perangkat</label><input id="pf-nama" v-model="f.nama" class="input" placeholder="mis. APM Lobi 02" /></div>
        <div class="field"><label class="req" for="pf-tipe">Tipe</label>
          <select id="pf-tipe" v-model="f.tipe" class="select" @change="tipeChange"><option>APM</option><option>Display</option></select>
        </div>
        <div class="field"><label class="req" for="pf-unit">Unit / lokasi</label><input id="pf-unit" v-model="f.unit" class="input" placeholder="mis. Lobi utama" /></div>
        <div class="field full"><label class="req" for="pf-papan">Terikat ke papan antrean</label>
          <select id="pf-papan" v-model="f.terikat" class="select"><option v-for="p in opsiPapan" :key="p" :value="p">{{ p }}</option></select>
          <span class="hint">Perangkat hanya menampilkan papan yang diikat di sini.</span>
        </div>
      </div>
      <template #footer><button class="btn" @click="show = false">Batal</button><button class="btn btn-primary" @click="simpan">Daftarkan</button></template>
    </AppModal>

    <AppModal :model-value="!!baru" title="Kode pendaftaran" @update:model-value="baru = null">
      <p>Masukkan kode berikut pada perangkat <b>{{ baru?.nama }}</b>. Kode hanya berlaku sekali dan ditampilkan juga di tabel sampai aktivasi.</p>
      <p class="bignum mono" style="font-size: 44px; letter-spacing: 6px">{{ baru?.kode }}</p>
      <template #footer><button class="btn btn-primary" @click="baru = null">Tutup</button></template>
    </AppModal>
  </div>
</template>
