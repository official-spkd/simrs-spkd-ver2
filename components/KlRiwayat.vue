<script setup lang="ts">
// KL-08 Riwayat Kunjungan Pasien (rekam medis longitudinal, baca saja)
// Akun dokter: GET /api/v1/examinations/{id}/history — semua poli & dokter, SOAP hanya yang sudah final.
const props = defineProps<{ visitId: string }>()
const emit = defineEmits(['back'])
const { db, visit, poli, doctor, latestVitals } = useDb()
const { isDokter } = useDokterQueue()
const klinis = useKlinis()

const v = computed(() => visit(props.visitId))
const periode = ref('semua')
const poliNama = ref('')
const q = ref('')
const PERIODE: [string, string, number][] = [['semua', 'Semua periode', 0], ['3', '3 bulan terakhir', 3], ['6', '6 bulan terakhir', 6], ['12', '12 bulan terakhir', 12]]

const server = ref<any[]>([])
const memuat = ref(false)
const muatErr = ref('')
const muat = async () => {
  if (!isDokter.value) return
  memuat.value = true
  muatErr.value = ''
  try { server.value = await klinis.riwayat(props.visitId) } catch (e: any) { muatErr.value = e.message } finally { memuat.value = false }
}
onMounted(muat)
watch(() => props.visitId, muat)

// bentuk seragam untuk tampilan: dari server (akun dokter) atau dari data lokal (role lain)
const dariServer = (x: any) => ({
  id: x.id, tanggal: x.tanggal, waktu: x.soap?.signedAt || x.jamSelesai || x.jamDaftar, poli: x.poli, dokter: x.dokter,
  nomor: x.nomor, final: !!x.soap, status: x.status, soap: x.soap,
  vital: x.soap?.vital ? { td: `${x.soap.vital.systolic_bp}/${x.soap.vital.diastolic_bp}`, nadi: x.soap.vital.pulse } : null,
  lampiran: x.lampiran, order: '', caraPulang: x.caraPulang, tglKontrol: x.soap?.tglKontrol || '',
})
const dariLokal = (x: any) => {
  const s = db.soap[x.id]
  return {
    id: x.id, tanggal: x.tanggal, waktu: s?.signedAt || x.jamSelesai || x.jamDaftar, poli: poli(x.poliId)?.nama, dokter: doctor(x.doctorId)?.nama,
    nomor: `${x.noKunjungan} · ${x.antreanPoli.nomor}`, final: !!s?.signed, status: x.status, soap: s || null, vital: latestVitals(x.id),
    lampiran: s?.lampiran || [], order: (db.orders[x.id] || []).map((o: any) => o.nama + ' ×' + o.jumlah).join(', '),
    caraPulang: x.caraPulang, tglKontrol: x.tglKontrol,
  }
}
const semua = computed(() => (isDokter.value
  ? server.value.map(dariServer)
  : db.visits.filter((x: any) => x.patientId === v.value?.patientId && x.id !== props.visitId && x.status !== 'dibatalkan').map(dariLokal)
).sort((a: any, b: any) => (a.tanggal + a.waktu < b.tanggal + b.waktu ? 1 : -1)))
const polis = computed(() => [...new Set(semua.value.map((x: any) => x.poli).filter(Boolean))])
const list = computed(() => {
  const bln = PERIODE.find((p) => p[0] === periode.value)?.[2] || 0
  const batas = bln ? addDays(todayStr(), -bln * 30) : ''
  const s = q.value.trim().toLowerCase()
  return semua.value.filter((x: any) => {
    if (batas && x.tanggal < batas) return false
    if (poliNama.value && x.poli !== poliNama.value) return false
    if (!s) return true
    const d = x.soap?.diagUtama
    return [d?.kode, d?.nama, x.dokter].some((t) => t && t.toLowerCase().includes(s))
  })
})

const ringkas = (x: any) => {
  const s = x.soap
  if (!s) return ''
  const o = [x.vital ? `TD ${x.vital.td}, nadi ${x.vital.nadi}` : '', s.fisik].filter(Boolean).join('; ')
  return [`S: ${s.s || '-'}`, `O: ${o || '-'}`, `A: ${s.asesmen || s.diagUtama?.nama || '-'}`, `P: ${s.p || '-'}`].join(' ')
}
const lampiran = (x: any) => (x.lampiran.length ? x.lampiran.map((a: any) => `${a.nama} · ${(a.ukuran / 1024).toFixed(0)} KB`).join(', ') : 'Tidak ada lampiran')
const open = ref<string | null>(null)
</script>

<template>
  <div class="kl-cols r300">
    <div class="kl-col">
      <div class="kl-filters" style="margin: 0">
        <select v-model="periode" class="select" aria-label="Periode"><option v-for="p in PERIODE" :key="p[0]" :value="p[0]">{{ p[1] }}</option></select>
        <select v-model="poliNama" class="select" aria-label="Poli"><option value="">Semua poli</option><option v-for="p in polis" :key="p" :value="p">{{ p }}</option></select>
        <input v-model="q" class="input q" placeholder="⌕ Diagnosis / dokter" aria-label="Cari diagnosis atau dokter">
      </div>

      <p v-if="muatErr" class="alert err" role="alert">Gagal memuat riwayat dari server: {{ muatErr }}</p>
      <div v-if="memuat && !semua.length" class="panel"><p class="muted">Memuat riwayat…</p></div>
      <div v-else-if="!list.length" class="panel"><p class="muted">{{ semua.length ? 'Tidak ada riwayat yang cocok dengan filter.' : 'Belum ada kunjungan lain.' }}</p></div>
      <div v-for="x in list" :key="x.id" class="panel">
        <h2>{{ fmtTgl(x.waktu || x.tanggal) }}<template v-if="x.waktu"> · {{ fmtJam(x.waktu) }}</template></h2>
        <div><span v-if="x.final" class="badge b-navy">Final · Baca saja</span><span v-else class="badge b-warn">Belum final · {{ x.status }}</span></div>
        <p class="muted">{{ x.poli }} · {{ x.dokter }}</p>
        <p style="font-size: 16px; font-weight: 600">{{ x.soap?.diagUtama ? x.soap.diagUtama.kode + ' · ' + x.soap.diagUtama.nama : 'Diagnosis belum tercatat' }}</p>
        <p v-if="x.soap">{{ ringkas(x) }}</p>
        <p style="color: var(--teal-d)">⌕ {{ lampiran(x) }}</p>
        <div><button class="btn" :aria-expanded="open === x.id" @click="open = open === x.id ? null : x.id">{{ open === x.id ? 'Tutup detail' : 'Buka detail' }}</button></div>
        <div v-if="open === x.id" class="guide" style="display: block">
          <dl class="kv">
            <dt>No. antrean</dt><dd>{{ x.nomor }}</dd>
            <dt>S · Subjektif</dt><dd>{{ x.soap?.s || '-' }}</dd>
            <dt>O · Objektif</dt><dd>{{ x.soap?.fisik || '-' }}</dd>
            <dt>A · Asesmen</dt><dd>{{ x.soap?.asesmen || '-' }}<template v-if="x.soap?.diagSekunder?.length"> · sekunder: {{ x.soap.diagSekunder.map((d: any) => d.kode).join(', ') }}</template></dd>
            <dt>P · Plan</dt><dd>{{ x.soap?.p || '-' }}</dd>
            <template v-if="x.order"><dt>Order</dt><dd>{{ x.order }}</dd></template>
            <dt>Cara pulang</dt><dd>{{ x.caraPulang || '-' }}<template v-if="x.tglKontrol"> · kontrol {{ fmtTgl(x.tglKontrol) }}</template></dd>
            <template v-if="x.soap?.addenda?.length"><dt>Addendum</dt><dd><div v-for="(a, i) in x.soap.addenda" :key="i">{{ fmtWaktu(a.at) }} — {{ a.teks }}</div></dd></template>
          </dl>
        </div>
      </div>
    </div>

    <div class="kl-col">
      <div v-if="v" class="panel">
        <h2>Episode saat ini</h2>
        <div><span class="badge b-teal">Kunjungan: {{ v.status }}</span></div>
        <h3>{{ fmtTglPanjang(v.tanggal).replace(/^\w+, /, '') }}</h3>
        <p>{{ v.noKunjungan }} · {{ v.antreanPoli.nomor }}</p>
        <p>Poli {{ poli(v.poliId)?.nama }}</p>
        <p>{{ doctor(v.doctorId)?.nama }}</p>
        <div><button class="btn" @click="emit('back')">Kembali ke workspace</button></div>
      </div>
      <div class="guide">Riwayat tidak mengubah episode aktif. SOAP yang dikunci tetap tersimpan; koreksi melalui addendum.</div>
    </div>
  </div>
</template>
