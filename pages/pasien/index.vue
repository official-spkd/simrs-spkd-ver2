<script setup lang="ts">
// Daftar & pencarian data pasien
const { db, lastVisitOf, poli } = useDb()
const { user } = useAuth()
const isFo = computed(() => user.value?.role === 'fo')
const isKasir = computed(() => user.value?.role === 'kasir')
const q = ref('')
const fPenjamin = ref('')
const page = ref(1)
const PER = 10

const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return db.patients
    .filter((p: any) => (!fPenjamin.value || p.penjamin === fPenjamin.value) &&
      (!s || p.nama.toLowerCase().includes(s) || p.rm.includes(s) || p.nik.includes(s) || (p.noKartu || '').includes(s)))
    .slice()
    .sort((a: any, b: any) => (a.rm > b.rm ? 1 : -1))
})
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PER)))
const pageRows = computed(() => rows.value.slice((page.value - 1) * PER, page.value * PER))
watch([q, fPenjamin], () => (page.value = 1))
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
          <input id="ps-q" v-model="q" class="input" style="width: 100%" placeholder="Nama / No. RM / NIK / No. BPJS" inputmode="search" />
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
            <tr v-for="p in pageRows" :key="p.id" class="click" @click="navigateTo('/pasien/' + p.id)">
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
            <tr v-if="!pageRows.length"><td colspan="7" class="empty">Pasien tidak ditemukan.<template v-if="isFo"> <NuxtLink to="/pasien/baru">Daftarkan pasien baru</NuxtLink></template></td></tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span>{{ rows.length }} pasien · halaman {{ page }} / {{ pages }}</span>
        <span><button :disabled="page <= 1" @click="page--">Sebelumnya</button><button :disabled="page >= pages" @click="page++">Berikutnya</button></span>
      </div>
    </div>
  </div>
</template>
