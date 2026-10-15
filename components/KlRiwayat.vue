<script setup lang="ts">
// KL-08 Riwayat Kunjungan Pasien (rekam medis longitudinal, baca saja)
const props = defineProps<{ visitId: string }>()
const emit = defineEmits(['back'])
const { db, visit, poli, doctor, latestVitals } = useDb()

const v = computed(() => visit(props.visitId))
const periode = ref('semua')
const poliId = ref('')
const q = ref('')
const PERIODE: [string, string, number][] = [['semua', 'Semua periode', 0], ['3', '3 bulan terakhir', 3], ['6', '6 bulan terakhir', 6], ['12', '12 bulan terakhir', 12]]

const semua = computed(() => db.visits
  .filter((x: any) => x.patientId === v.value?.patientId && x.id !== props.visitId && x.status !== 'dibatalkan')
  .sort((a: any, b: any) => (a.tanggal + a.jamDaftar < b.tanggal + b.jamDaftar ? 1 : -1)))
const polis = computed(() => [...new Set(semua.value.map((x: any) => x.poliId))].map((id) => poli(id as string)).filter(Boolean))
const list = computed(() => {
  const bln = PERIODE.find((p) => p[0] === periode.value)?.[2] || 0
  const batas = bln ? addDays(todayStr(), -bln * 30) : ''
  const s = q.value.trim().toLowerCase()
  return semua.value.filter((x: any) => {
    if (batas && x.tanggal < batas) return false
    if (poliId.value && x.poliId !== poliId.value) return false
    if (!s) return true
    const d = db.soap[x.id]?.diagUtama
    return [d?.kode, d?.nama, doctor(x.doctorId)?.nama].some((t) => t && t.toLowerCase().includes(s))
  })
})

const soapOf = (id: string) => db.soap[id]
const waktu = (x: any) => soapOf(x.id)?.signedAt || x.jamSelesai || x.jamDaftar
const ringkas = (x: any) => {
  const s = soapOf(x.id)
  if (!s) return ''
  const vt = latestVitals(x.id)
  const o = [vt ? `TD ${vt.td}, nadi ${vt.nadi}` : '', s.fisik].filter(Boolean).join('; ')
  return [`S: ${s.s || '-'}`, `O: ${o || '-'}`, `A: ${s.asesmen || s.diagUtama?.nama || '-'}`, `P: ${s.p || '-'}`].join(' ')
}
const lampiran = (x: any) => {
  const l = soapOf(x.id)?.lampiran || []
  return l.length ? l.map((a: any) => `${a.nama} · ${(a.ukuran / 1024).toFixed(0)} KB`).join(', ') : 'Tidak ada lampiran'
}
const open = ref<string | null>(null)
</script>

<template>
  <div class="kl-cols r300">
    <div class="kl-col">
      <div class="kl-filters" style="margin: 0">
        <select v-model="periode" class="select" aria-label="Periode"><option v-for="p in PERIODE" :key="p[0]" :value="p[0]">{{ p[1] }}</option></select>
        <select v-model="poliId" class="select" aria-label="Poli"><option value="">Semua poli</option><option v-for="p in polis" :key="p.id" :value="p.id">{{ p.nama }}</option></select>
        <input v-model="q" class="input q" placeholder="⌕ Diagnosis / dokter" aria-label="Cari diagnosis atau dokter">
      </div>

      <div v-if="!list.length" class="panel"><p class="muted">{{ semua.length ? 'Tidak ada riwayat yang cocok dengan filter.' : 'Belum ada kunjungan terdahulu.' }}</p></div>
      <div v-for="x in list" :key="x.id" class="panel">
        <h2>{{ fmtTgl(waktu(x)) }} · {{ fmtJam(waktu(x)) }}</h2>
        <div><span v-if="soapOf(x.id)?.signed" class="badge b-navy">Final · Baca saja</span><span v-else class="badge b-warn">Belum final · {{ x.status }}</span></div>
        <p class="muted">{{ poli(x.poliId)?.nama }} · {{ doctor(x.doctorId)?.nama }}</p>
        <p style="font-size: 16px; font-weight: 600">{{ soapOf(x.id)?.diagUtama ? soapOf(x.id).diagUtama.kode + ' · ' + soapOf(x.id).diagUtama.nama : 'Diagnosis belum tercatat' }}</p>
        <p v-if="soapOf(x.id)">{{ ringkas(x) }}</p>
        <p style="color: var(--teal-d)">⌕ {{ lampiran(x) }}</p>
        <div><button class="btn" :aria-expanded="open === x.id" @click="open = open === x.id ? null : x.id">{{ open === x.id ? 'Tutup detail' : 'Buka detail' }}</button></div>
        <div v-if="open === x.id" class="guide" style="display: block">
          <dl class="kv">
            <dt>No. kunjungan</dt><dd>{{ x.noKunjungan }} · {{ x.antreanPoli.nomor }}</dd>
            <dt>S · Subjektif</dt><dd>{{ soapOf(x.id)?.s || '-' }}</dd>
            <dt>O · Objektif</dt><dd>{{ soapOf(x.id)?.fisik || '-' }}</dd>
            <dt>A · Asesmen</dt><dd>{{ soapOf(x.id)?.asesmen || '-' }}<template v-if="soapOf(x.id)?.diagSekunder?.length"> · sekunder: {{ soapOf(x.id).diagSekunder.map((d: any) => d.kode).join(', ') }}</template></dd>
            <dt>P · Plan</dt><dd>{{ soapOf(x.id)?.p || '-' }}</dd>
            <dt>Order</dt><dd>{{ (db.orders[x.id] || []).map((o: any) => o.nama + ' ×' + o.jumlah).join(', ') || '-' }}</dd>
            <dt>Cara pulang</dt><dd>{{ x.caraPulang || '-' }}<template v-if="x.tglKontrol"> · kontrol {{ fmtTgl(x.tglKontrol) }}</template></dd>
            <template v-if="soapOf(x.id)?.addenda?.length"><dt>Addendum</dt><dd><div v-for="(a, i) in soapOf(x.id).addenda" :key="i">{{ fmtWaktu(a.at) }} — {{ a.teks }}</div></dd></template>
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
