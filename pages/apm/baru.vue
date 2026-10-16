<script setup lang="ts">
// APM-05 Form pasien baru (ringkas) + keyboard di layar. Asuransi dilayani di loket.
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
const { createPatient } = useDb()

type Kolom = 'nik' | 'nama' | 'tgl' | 'hp' | 'alamat' | 'noKartu'
const f = reactive({ nik: '', nama: '', tgl: '', jk: '', hp: '', alamat: '', penjamin: 'Umum', noKartu: '' })
const ANGKA: Kolom[] = ['nik', 'tgl', 'hp', 'noKartu']
const MAKS: Record<Kolom, number> = { nik: 16, nama: 60, tgl: 8, hp: 14, alamat: 120, noKartu: 13 }
const aktif = ref<Kolom>('nik')
const mode = ref<'abc' | '123'>('123')
const fokus = (k: Kolom) => { aktif.value = k; mode.value = ANGKA.includes(k) ? '123' : 'abc' }

// tanggal lahir diketik 8 digit (DDMMYYYY) → tampil "DD / MM / YYYY"
const tglTampil = computed(() => [f.tgl.slice(0, 2), f.tgl.slice(2, 4), f.tgl.slice(4, 8)].filter(Boolean).join(' / '))
const tglIso = computed(() => (f.tgl.length === 8 ? `${f.tgl.slice(4)}-${f.tgl.slice(2, 4)}-${f.tgl.slice(0, 2)}` : ''))
const tglValid = computed(() => {
  if (!tglIso.value) return false
  // bandingkan komponen tanggal lokal (toISOString = UTC akan bergeser sehari di WIB)
  const [y, m, dd] = tglIso.value.split('-').map(Number)
  const d = new Date(y, m - 1, dd)
  return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === dd && tglIso.value <= todayStr() && tglIso.value >= '1900-01-01'
})

const tekan = (c: string) => {
  const k = aktif.value
  if (k === 'noKartu' && f.penjamin !== 'BPJS') return
  if (ANGKA.includes(k) && !/^\d$/.test(c)) return
  if (f[k].length < MAKS[k]) f[k] += c
}
const mundur = () => { const k = aktif.value; f[k] = f[k].slice(0, -1) }
const ketikFisik = (k: Kolom, e: Event) => {
  const el = e.target as HTMLInputElement
  let v = el.value
  if (k === 'tgl') v = v.replace(/\D/g, '')
  else if (ANGKA.includes(k)) v = v.replace(/\D/g, '')
  f[k] = v.slice(0, MAKS[k])
  if (k === 'tgl') el.value = tglTampil.value
}

const coba = ref(false)
const galat = ref('')
const dupe = ref(false)
const err = computed(() => ({
  nik: f.nik.length !== 16 ? 'NIK harus 16 digit' : '',
  nama: f.nama.trim().length < 3 ? 'Nama lengkap wajib diisi' : '',
  tgl: !tglValid.value ? 'Tanggal lahir tidak valid (DD / MM / YYYY)' : '',
  jk: !f.jk ? 'Pilih jenis kelamin' : '',
  hp: f.hp.length < 10 || f.hp.length > 14 ? 'No. HP 10–14 digit' : '',
  alamat: f.alamat.trim().length < 5 ? 'Alamat wajib diisi' : '',
  noKartu: f.penjamin === 'BPJS' && f.noKartu.length !== 13 ? 'No. kartu BPJS harus 13 digit' : '',
}))
const simpan = () => {
  coba.value = true
  galat.value = ''
  dupe.value = false
  if (Object.values(err.value).some(Boolean)) return toast.err('Lengkapi kolom yang ditandai merah')
  try {
    const p = createPatient({
      nik: f.nik, nama: f.nama.trim(), tglLahir: tglIso.value, jk: f.jk, hp: f.hp, alamatKtp: f.alamat.trim(),
      penjamin: f.penjamin, noKartu: f.penjamin === 'BPJS' ? f.noKartu : '', pjNama: '', _abaikanDuplikat: false,
    })
    apm.state.value.patientId = p.id
    apm.state.value.baruRm = p.rm
    apm.state.value.confirmed = true
    apm.state.value.tokenExp = 0
    toast.ok(`Data tersimpan. No. RM Anda ${p.rm}`)
    navigateTo('/apm/poli')
  } catch (e: any) {
    const m: string = e.message || String(e)
    if (m.startsWith('409') || m.startsWith('DUPLIKAT')) dupe.value = true
    else galat.value = m
  }
}
const pakaiLama = () => { apm.reset(); apm.state.value.mode = 'lama'; navigateTo('/apm/identifikasi') }
const pilihPenjamin = (p: string) => { f.penjamin = p; if (p === 'BPJS') fokus('noKartu'); else f.noKartu = '' }

const BARIS_ABC = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['Z', 'X', 'C', 'V', 'B', 'N', 'M']]
const BARIS_123 = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ['.', ',', '-', '/', '(', ')']]
const baris = computed(() => (mode.value === 'abc' ? BARIS_ABC : BARIS_123))
const huruf = (c: string) => (/^[A-Z]$/.test(c) && f[aktif.value].length && !f[aktif.value].endsWith(' ') ? c.toLowerCase() : c)
</script>
<template>
  <ApmShell kode="APM-05" langkah="Langkah 2 · Identitas · Semua kolom * wajib">
    <h1 class="apm-h1">Lengkapi data pasien baru</h1>
    <div v-if="dupe" class="apm-alert" role="alert">
      <b>Sudah terdaftar, gunakan Pasien Lama.</b> NIK atau nama dan tanggal lahir yang sama sudah ada di sistem.
      <div class="apm-row" style="margin-top: 12px"><button type="button" class="apm-btn pri" @click="pakaiLama">Gunakan Pasien Lama</button></div>
    </div>
    <div v-if="galat" class="apm-alert" role="alert">{{ galat }}</div>

    <div class="g2">
      <div class="apm-field"><label for="b-nik">NIK * · 16 digit</label>
        <input id="b-nik" :value="f.nik" class="apm-input" :class="{ aktif: aktif === 'nik', err: coba && err.nik }" inputmode="none" autocomplete="off" @focus="fokus('nik')" @input="ketikFisik('nik', $event)">
        <span v-if="coba && err.nik" class="apm-err">{{ err.nik }}</span>
      </div>
      <div class="apm-field"><label for="b-nama">Nama lengkap *</label>
        <input id="b-nama" :value="f.nama" class="apm-input" :class="{ aktif: aktif === 'nama', err: coba && err.nama }" inputmode="none" autocomplete="off" @focus="fokus('nama')" @input="ketikFisik('nama', $event)">
        <span v-if="coba && err.nama" class="apm-err">{{ err.nama }}</span>
      </div>
    </div>
    <div class="g3">
      <div class="apm-field"><label for="b-tgl">Tanggal lahir *</label>
        <input id="b-tgl" :value="tglTampil" class="apm-input" :class="{ aktif: aktif === 'tgl', err: coba && err.tgl }" inputmode="none" placeholder="DD / MM / YYYY" autocomplete="off" @focus="fokus('tgl')" @input="ketikFisik('tgl', $event)">
        <span v-if="coba && err.tgl" class="apm-err">{{ err.tgl }}</span>
      </div>
      <div class="apm-field"><label for="b-jk">Jenis kelamin *</label>
        <select id="b-jk" v-model="f.jk" class="apm-input" :class="{ err: coba && err.jk }">
          <option value="" disabled>Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option>
        </select>
        <span v-if="coba && err.jk" class="apm-err">{{ err.jk }}</span>
      </div>
      <div class="apm-field"><label for="b-hp">No. HP *</label>
        <input id="b-hp" :value="f.hp" class="apm-input" :class="{ aktif: aktif === 'hp', err: coba && err.hp }" inputmode="none" autocomplete="off" @focus="fokus('hp')" @input="ketikFisik('hp', $event)">
        <span v-if="coba && err.hp" class="apm-err">{{ err.hp }}</span>
      </div>
    </div>
    <div class="apm-field"><label for="b-alamat">Alamat *</label>
      <input id="b-alamat" :value="f.alamat" class="apm-input" :class="{ aktif: aktif === 'alamat', err: coba && err.alamat }" inputmode="none" autocomplete="off" @focus="fokus('alamat')" @input="ketikFisik('alamat', $event)">
      <span v-if="coba && err.alamat" class="apm-err">{{ err.alamat }}</span>
    </div>
    <div class="apm-row" role="radiogroup" aria-label="Penjamin">
      <button v-for="p in ['Umum', 'BPJS']" :key="p" type="button" role="radio" class="apm-btn" :class="{ pri: f.penjamin === p }" :aria-checked="f.penjamin === p" @click="pilihPenjamin(p)">{{ p }}{{ f.penjamin === p ? ' ✓' : '' }}</button>
    </div>
    <div class="apm-field"><label for="b-bpjs">No. kartu BPJS · 13 digit jika memilih BPJS</label>
      <input id="b-bpjs" :value="f.noKartu" class="apm-input" :class="{ aktif: aktif === 'noKartu', err: coba && err.noKartu }" :disabled="f.penjamin !== 'BPJS'" inputmode="none" placeholder="Ketik nomor kartu bila memilih BPJS" autocomplete="off" @focus="fokus('noKartu')" @input="ketikFisik('noKartu', $event)">
      <span v-if="coba && err.noKartu" class="apm-err">{{ err.noKartu }}</span>
    </div>
    <p class="apm-note">Asuransi dilayani di loket. Nomor RM dibuat otomatis setelah data tersimpan.</p>

    <div class="apm-keys" aria-label="Keyboard di layar">
      <div v-for="(r, i) in baris" :key="mode + i" class="kr">
        <button v-for="c in r" :key="c" type="button" class="apm-key" @mousedown.prevent @click="tekan(huruf(c))">{{ c }}</button>
      </div>
      <div class="kr">
        <button type="button" class="apm-key" @mousedown.prevent @click="mode = mode === 'abc' ? '123' : 'abc'">{{ mode === 'abc' ? '123' : 'ABC' }}</button>
        <button type="button" class="apm-key" @mousedown.prevent @click="tekan(' ')">Spasi</button>
        <button type="button" class="apm-key" @mousedown.prevent @click="mundur">Hapus</button>
      </div>
    </div>
    <div class="apm-guide">Jika NIK sudah ada: “Sudah terdaftar, gunakan Pasien Lama”. Sistem tidak membuat rekam medis ganda.</div>
    <div class="apm-row"><button type="button" class="apm-btn pri" @click="simpan">Simpan &amp; lanjut</button></div>
  </ApmShell>
</template>
<style scoped>
.g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.apm-input:disabled { background: #f3f6f8; }
@media (max-width: 899px) { .g2, .g3 { grid-template-columns: minmax(0, 1fr); } }
</style>
