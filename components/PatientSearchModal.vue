<script setup lang="ts">
// FO-02 Cari Pasien (modal). Dipakai dari omnibox header (Ctrl+K) dan worklist pendaftaran.
const props = defineProps<{ modelValue: boolean; initialQuery?: string }>()
const emit = defineEmits(['update:modelValue'])
const { searchPatients, lastVisitOf, poli } = useDb()
const { user } = useAuth()
const tipe = ref('auto')
const q = ref('')
const hasil = ref<any[] | null>(null)
const err = ref('')
const isFo = computed(() => user.value?.role === 'fo')

const cari = () => {
  err.value = ''
  const s = q.value.trim()
  if (tipe.value === 'nik' && !/^\d{16}$/.test(s)) { err.value = 'NIK harus 16 digit'; hasil.value = null; return }
  if (tipe.value === 'bpjs' && !/^\d{13}$/.test(s)) { err.value = 'No. BPJS harus 13 digit'; hasil.value = null; return }
  hasil.value = searchPatients(s, tipe.value)
}
watch(() => props.modelValue, (v) => {
  if (v) { q.value = props.initialQuery || ''; hasil.value = null; err.value = ''; tipe.value = 'auto'; if (q.value) nextTick(cari) }
})
const close = () => emit('update:modelValue', false)
const go = (path: string) => { close(); navigateTo(path) }
const terakhir = (p: any) => { const v = lastVisitOf(p.id); return v ? `${fmtTgl(v.tanggal)} · ${poli(v.poliId)?.nama}` : '-' }
</script>

<template>
  <AppModal :model-value="modelValue" title="Cari pasien" size="lg" @update:model-value="close">
    <form class="stack" style="gap: 12px" @submit.prevent="cari">
      <div class="seg" role="group" aria-label="Tipe pencarian">
        <button v-for="t in [['auto', 'Semua'], ['nik', 'NIK'], ['bpjs', 'No. BPJS'], ['rm', 'No. RM'], ['nama', 'Nama']]" :key="t[0]" type="button" :class="{ on: tipe === t[0] }" @click="tipe = t[0]">{{ t[1] }}</button>
      </div>
      <div class="row" style="flex-wrap: nowrap">
        <input v-model="q" class="input" :class="{ err }" placeholder="Cari NIK / No. BPJS / No. RM / Nama" autofocus inputmode="search" />
        <button class="btn btn-primary" type="submit">Cari</button>
      </div>
      <p v-if="err" class="err-text">{{ err }}</p>
      <p class="hint" style="margin: 0">NIK harus 16 digit, No. BPJS 13 digit. Hasil pencarian dicatat di audit.</p>
    </form>

    <div v-if="hasil" style="margin-top: 16px">
      <div v-if="hasil.length" class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>No. RM</th><th>Nama</th><th>Tgl lahir</th><th>NIK</th><th>Penjamin</th><th>Kunjungan terakhir</th><th /></tr></thead>
          <tbody>
            <tr v-for="p in hasil" :key="p.id">
              <td data-label="No. RM" class="mono">{{ p.rm }}</td>
              <td data-label="Nama" class="bold">{{ p.nama }}</td>
              <td data-label="Tgl lahir">{{ fmtTgl(p.tglLahir) }}</td>
              <td data-label="NIK" class="mono">{{ maskNik(p.nik) }}</td>
              <td data-label="Penjamin"><StatusBadge :value="p.penjamin" /></td>
              <td data-label="Terakhir">{{ terakhir(p) }}</td>
              <td data-label="">
                <div class="row" style="justify-content: flex-end; flex-wrap: nowrap">
                  <button class="btn btn-sm" @click="go('/pasien/' + p.id)">Detail</button>
                  <button v-if="isFo" class="btn btn-sm btn-primary" @click="go('/kunjungan/baru?pasien=' + p.id)">+ Kunjungan</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="alert warn" style="align-items: center; justify-content: space-between; flex-wrap: wrap">
        <span>Pasien tidak ditemukan.<template v-if="isFo"> Daftarkan sebagai pasien baru.</template></span>
        <button v-if="isFo" class="btn btn-primary btn-sm" @click="go('/pasien/baru' + (/^\d{16}$/.test(q) ? '?nik=' + q : ''))">Daftarkan baru</button>
      </div>
    </div>
  </AppModal>
</template>
