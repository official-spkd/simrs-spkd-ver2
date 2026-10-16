<script setup lang="ts">
// APM-05 Form pasien baru (ringkas) + keyboard di layar. Asuransi dilayani di loket.
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const toast = useToast()
// Disimpan lewat POST /api/v1/apm/patients — aturan sama dengan form Front Office (tempat lahir & penanggung jawab wajib).
type Kolom = 'nik' | 'nama' | 'tempat' | 'hp' | 'alamat' | 'noKartu' | 'pjNama' | 'pjHp'
const f = reactive({ nik: '', nama: '', tgl: '', tempat: '', jk: '', hp: '', alamat: '', penjamin: 'Umum', noKartu: '', pjNama: '', pjHub: '', pjHp: '' })
const ANGKA: Kolom[] = ['nik', 'hp', 'noKartu', 'pjHp']
const MAKS: Record<Kolom, number> = { nik: 16, nama: 60, tempat: 60, hp: 14, alamat: 120, noKartu: 13, pjNama: 60, pjHp: 14 }
const HUBUNGAN = ['Suami', 'Istri', 'Orang tua', 'Anak', 'Saudara', 'Lainnya']
const aktif = ref<Kolom>('nik')
const mode = ref<'abc' | '123'>('123')
const fokus = (k: Kolom) => { aktif.value = k; mode.value = ANGKA.includes(k) ? '123' : 'abc' }

// tanggal lahir dipilih lewat kalender pop-up (input date → "YYYY-MM-DD"), bukan keyboard di layar
const tglIso = computed(() => f.tgl)
const hariIni = todayStr()
/** Buka kalender saat kolom disentuh di mana saja (bukan hanya ikon kalender). */
const bukaKalender = (e: Event) => { try { (e.target as HTMLInputElement).showPicker?.() } catch {} }
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
  if (ANGKA.includes(k)) v = v.replace(/\D/g, '')
  f[k] = v.slice(0, MAKS[k])
}

const coba = ref(false)
const galat = ref('')
const dupe = ref(false)
const err = computed(() => ({
  nik: f.nik.length !== 16 ? 'NIK harus 16 digit' : '',
  nama: f.nama.trim().length < 3 ? 'Nama lengkap wajib diisi' : '',
  tgl: !tglValid.value ? 'Pilih tanggal lahir' : '',
  jk: !f.jk ? 'Pilih jenis kelamin' : '',
  tempat: f.tempat.trim().length < 2 ? 'Tempat lahir wajib diisi' : '',
  hp: !validHp(f.hp) ? 'No. HP seluler, mis. 081234567890' : '',
  alamat: f.alamat.trim().length < 5 ? 'Alamat wajib diisi' : '',
  pjNama: f.pjNama.trim().length < 3 ? 'Nama penanggung jawab wajib diisi' : '',
  pjHub: !f.pjHub ? 'Pilih hubungan' : '',
  pjHp: !validHp(f.pjHp) ? 'No. HP seluler, mis. 081234567890' : '',
  noKartu: f.penjamin === 'BPJS' && f.noKartu.length !== 13 ? 'No. kartu BPJS harus 13 digit' : '',
}))
const busy = ref(false)
const simpan = async () => {
  coba.value = true
  galat.value = ''
  dupe.value = false
  if (Object.values(err.value).some(Boolean)) return toast.err('Lengkapi kolom yang ditandai merah')
  if (busy.value) return
  busy.value = true
  try {
    const p = await apmApi.daftarPasien({
      nik: f.nik, full_name: f.nama.trim(), birth_date: tglIso.value, birth_place: f.tempat.trim(), gender: f.jk === 'P' ? 'Female' : 'Male',
      phone: f.hp, id_card_address: f.alamat.trim(), payer: f.penjamin === 'BPJS' ? 'BPJS' : 'General',
      ...(f.penjamin === 'BPJS' ? { bpjs_number: f.noKartu } : {}),
      emergency_contact_name: f.pjNama.trim(), emergency_contact_relationship: f.pjHub, emergency_contact_phone: f.pjHp,
    })
    apm.state.value.patientId = p.id
    apm.state.value.srvPasien = p
    apm.state.value.baruRm = p.rm
    apm.state.value.pendamping = f.pjNama.trim()
    apm.state.value.confirmed = true
    apm.state.value.tokenExp = 0
    toast.ok(`Data tersimpan. No. RM Anda ${p.rm}`)
    navigateTo('/apm/poli')
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 409) dupe.value = true
    else galat.value = apmPesan(e)
  } finally {
    busy.value = false
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
        <input id="b-tgl" v-model="f.tgl" type="date" class="apm-input tgl" :class="{ err: coba && err.tgl }" min="1900-01-01" :max="hariIni" @click="bukaKalender">
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
    <div class="g2">
      <div class="apm-field"><label for="b-tempat">Tempat lahir *</label>
        <input id="b-tempat" :value="f.tempat" class="apm-input" :class="{ aktif: aktif === 'tempat', err: coba && err.tempat }" inputmode="none" autocomplete="off" @focus="fokus('tempat')" @input="ketikFisik('tempat', $event)">
        <span v-if="coba && err.tempat" class="apm-err">{{ err.tempat }}</span>
      </div>
      <div class="apm-field"><label for="b-alamat">Alamat sesuai KTP *</label>
        <input id="b-alamat" :value="f.alamat" class="apm-input" :class="{ aktif: aktif === 'alamat', err: coba && err.alamat }" inputmode="none" autocomplete="off" @focus="fokus('alamat')" @input="ketikFisik('alamat', $event)">
        <span v-if="coba && err.alamat" class="apm-err">{{ err.alamat }}</span>
      </div>
    </div>
    <div class="g3">
      <div class="apm-field"><label for="b-pjnama">Penanggung jawab *</label>
        <input id="b-pjnama" :value="f.pjNama" class="apm-input" :class="{ aktif: aktif === 'pjNama', err: coba && err.pjNama }" inputmode="none" placeholder="Nama keluarga / kerabat" autocomplete="off" @focus="fokus('pjNama')" @input="ketikFisik('pjNama', $event)">
        <span v-if="coba && err.pjNama" class="apm-err">{{ err.pjNama }}</span>
      </div>
      <div class="apm-field"><label for="b-pjhub">Hubungan *</label>
        <select id="b-pjhub" v-model="f.pjHub" class="apm-input" :class="{ err: coba && err.pjHub }">
          <option value="" disabled>Pilih</option><option v-for="h in HUBUNGAN" :key="h" :value="h">{{ h }}</option>
        </select>
        <span v-if="coba && err.pjHub" class="apm-err">{{ err.pjHub }}</span>
      </div>
      <div class="apm-field"><label for="b-pjhp">No. HP penanggung jawab *</label>
        <input id="b-pjhp" :value="f.pjHp" class="apm-input" :class="{ aktif: aktif === 'pjHp', err: coba && err.pjHp }" inputmode="none" autocomplete="off" @focus="fokus('pjHp')" @input="ketikFisik('pjHp', $event)">
        <span v-if="coba && err.pjHp" class="apm-err">{{ err.pjHp }}</span>
      </div>
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
    <div class="apm-row"><button type="button" class="apm-btn pri" :disabled="busy" @click="simpan">{{ busy ? 'Menyimpan…' : 'Simpan &amp; lanjut' }}</button></div>
  </ApmShell>
</template>
<style scoped>
.tgl { cursor: pointer; }
.tgl::-webkit-calendar-picker-indicator { width: 28px; height: 28px; cursor: pointer; }
.g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.apm-input:disabled { background: #f3f6f8; }
@media (max-width: 899px) { .g2, .g3 { grid-template-columns: minmax(0, 1fr); } }
</style>
