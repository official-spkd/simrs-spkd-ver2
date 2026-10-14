<script setup lang="ts">
// FO-02 Cari Pasien (modal). Dipakai dari omnibox header (Ctrl+K) dan worklist pendaftaran.
const props = defineProps<{ modelValue: boolean; initialQuery?: string }>()
const emit = defineEmits(['update:modelValue'])
const { lastVisitOf, poli } = useDb()
const { list } = usePatients()
const { user } = useAuth()
const tipe = ref('auto')
const q = ref('')
const hasil = ref<any[] | null>(null)
const err = ref('')
const loading = ref(false)
const isFo = computed(() => user.value?.role === 'fo')

// Server mencari di nama, NIK, No. RM, dan No. HP sekaligus; tipe pencarian menyaring hasilnya.
const cari = async () => {
  err.value = ''
  const s = q.value.trim()
  if (!s) { hasil.value = null; return }
  if (tipe.value === 'nik' && !/^\d{16}$/.test(s)) { err.value = 'NIK harus 16 digit'; hasil.value = null; return }
  loading.value = true
  try {
    const { rows } = await list({ search: s, limit: 50 })
    const low = s.toLowerCase()
    hasil.value = rows.filter((p: any) =>
      tipe.value === 'nik' ? p.nik === s
        : tipe.value === 'nama' ? p.nama.toLowerCase().includes(low)
          : tipe.value === 'hp' ? p.hp.includes(s)
            : tipe.value === 'rm' ? p.rm.toLowerCase().includes(low)
            : true)
  } catch (e: any) {
    err.value = e.message
    hasil.value = null
  } finally {
    loading.value = false
  }
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
        <button v-for="t in [['auto', 'Semua'], ['nik', 'NIK'], ['rm', 'No. RM'], ['nama', 'Nama'], ['hp', 'No. HP']]" :key="t[0]" type="button" :class="{ on: tipe === t[0] }" @click="tipe = t[0]">{{ t[1] }}</button>
      </div>
      <div class="row" style="flex-wrap: nowrap">
        <input v-model="q" class="input" :class="{ err }" placeholder="Cari NIK / No. RM / Nama / No. HP" autofocus inputmode="search" />
        <button class="btn btn-primary" type="submit" :disabled="loading">{{ loading ? 'Mencari…' : 'Cari' }}</button>
      </div>
      <p v-if="err" class="err-text">{{ err }}</p>
      <p class="hint" style="margin: 0">NIK harus 16 digit. Data pasien diambil dari server.</p>
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
