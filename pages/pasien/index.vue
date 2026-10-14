<script setup lang="ts">
// Daftar & pencarian data pasien (sumber: backend /api/v1/patients)
const { lastVisitOf, poli } = useDb()
const { list } = usePatients()
const { user } = useAuth()
const isFo = computed(() => user.value?.role === 'fo')
const isKasir = computed(() => user.value?.role === 'kasir')
const q = ref('')
const fPenjamin = ref('')
const page = ref(1)
const PER = 10

const rows = ref<any[]>([])
const total = ref(0)
const pages = ref(1)
const loading = ref(false)
const error = ref('')

let seq = 0
const load = async () => {
  const my = ++seq
  loading.value = true
  error.value = ''
  try {
    const r = await list({ search: q.value, penjamin: fPenjamin.value, page: page.value, limit: PER })
    if (my !== seq) return
    rows.value = r.rows
    total.value = r.pagination?.total_items ?? r.rows.length
    pages.value = Math.max(1, r.pagination?.total_pages ?? 1)
  } catch (e: any) {
    if (my !== seq) return
    rows.value = []
    total.value = 0
    error.value = e.message
  } finally {
    if (my === seq) loading.value = false
  }
}
let timer: any
watch(q, () => { clearTimeout(timer); timer = setTimeout(() => { page.value === 1 ? load() : (page.value = 1) }, 350) })
watch(fPenjamin, () => { page.value === 1 ? load() : (page.value = 1) })
watch(page, load)
onMounted(load)
onBeforeUnmount(() => clearTimeout(timer))
const terakhir = (p: any) => { const v = lastVisitOf(p.id); return v ? `${fmtTgl(v.tanggal)} · ${poli(v.poliId)?.nama}` : '-' }
</script>

<template>
  <div>
    <PageHead title="Data Pasien" subtitle="Cari dan buka data pasien. Perubahan identitas hanya dapat dilakukan Front Office.">
      <template #actions>
        <NuxtLink v-if="isFo" to="/pasien/baru" class="btn btn-primary"><AppIcon name="plus" /> Pasien Baru</NuxtLink>
      </template>
    </PageHead>
    <div class="card">
      <div class="filters">
        <div class="field" style="flex: 1; min-width: 220px">
          <label for="ps-q" class="small">Cari</label>
          <input id="ps-q" v-model="q" class="input" style="width: 100%" placeholder="Nama / No. RM / NIK / No. HP" inputmode="search" />
        </div>
        <div class="field">
          <label for="ps-pj" class="small">Penjamin</label>
          <select id="ps-pj" v-model="fPenjamin" class="select">
            <option value="">Semua</option>
            <option v-for="p in ['Umum', 'BPJS', 'Asuransi']" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>No. RM</th><th>Nama</th><th>Tgl lahir</th><th v-if="!isKasir">NIK</th><th>Penjamin</th><th>Kunjungan terakhir</th><th /></tr></thead>
          <tbody>
            <tr v-for="p in rows" :key="p.id" class="click" @click="navigateTo('/pasien/' + p.id)">
              <td data-label="No. RM" class="mono">{{ p.rm }}</td>
              <td data-label="Nama" class="bold">{{ p.nama }}<span v-if="p.alergi" class="alergi-tag" style="margin-left: 8px">Alergi</span></td>
              <td data-label="Tgl lahir">{{ fmtTgl(p.tglLahir) }} ({{ umur(p.tglLahir) }} th)</td>
              <td v-if="!isKasir" data-label="NIK" class="mono">{{ maskNik(p.nik) }}</td>
              <td data-label="Penjamin"><StatusBadge :value="p.penjamin" /></td>
              <td data-label="Terakhir">{{ terakhir(p) }}</td>
              <td data-label="">
                <div class="row" style="justify-content: flex-end; flex-wrap: nowrap" @click.stop>
                  <NuxtLink :to="'/pasien/' + p.id" class="btn btn-sm">Detail</NuxtLink>
                  <NuxtLink v-if="isFo" :to="'/kunjungan/baru?pasien=' + p.id" class="btn btn-sm btn-primary">+ Kunjungan</NuxtLink>
                </div>
              </td>
            </tr>
            <tr v-if="loading && !rows.length"><td colspan="7" class="empty">Memuat data pasien…</td></tr>
            <tr v-else-if="error"><td colspan="7" class="empty" role="alert">{{ error }} <button class="btn btn-sm" style="margin-left: 8px" @click="load">Coba lagi</button></td></tr>
            <tr v-else-if="!rows.length"><td colspan="7" class="empty">Pasien tidak ditemukan.<template v-if="isFo"> <NuxtLink to="/pasien/baru">Daftarkan pasien baru</NuxtLink></template></td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span>{{ total }} pasien · halaman {{ page }} / {{ pages }}<template v-if="loading"> · memuat…</template></span>
        <span><button :disabled="page <= 1 || loading" @click="page--">Sebelumnya</button><button :disabled="page >= pages || loading" @click="page++">Berikutnya</button></span>
      </div>
    </div>
  </div>
</template>
