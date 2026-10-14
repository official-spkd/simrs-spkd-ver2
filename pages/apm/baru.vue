<script setup lang="ts">
definePageMeta({ layout: 'kiosk' })
const apm = useApm()
const { createPatient, takeLoketTicket } = useDb()

const f = reactive({ nik: '', nama: '', tglLahir: '', jk: '', hp: '', alamat: '', penjamin: 'Umum', noKartu: '' })
const hariIni = todayStr()
const coba = ref(false)
const galat = ref('')
const dupe = ref(false)
const hasil = ref<any>(null)
const tiket = ref<any>(null)
const digits = (k: 'nik' | 'hp' | 'noKartu') => (f[k] = f[k].replace(/\D/g, ''))

const err = computed(() => ({
  nik: f.nik.length !== 16 ? 'NIK harus 16 digit' : '',
  nama: f.nama.trim().length < 3 ? 'Nama lengkap wajib diisi' : '',
  tglLahir: !f.tglLahir ? 'Tanggal lahir wajib diisi' : f.tglLahir > todayStr() ? 'Tanggal lahir tidak boleh di masa depan' : '',
  jk: !f.jk ? 'Pilih jenis kelamin' : '',
  hp: f.hp.length < 10 || f.hp.length > 14 ? 'No. HP 10-14 digit' : '',
  alamat: f.alamat.trim().length < 5 ? 'Alamat wajib diisi' : '',
  noKartu: f.penjamin === 'BPJS' && f.noKartu.length !== 13 ? 'No. BPJS harus 13 digit' : '',
}))
const adaErr = computed(() => Object.values(err.value).some(Boolean))
const asuransi = computed(() => f.penjamin === 'Asuransi')

const simpan = () => {
  coba.value = true
  galat.value = ''
  dupe.value = false
  if (adaErr.value || asuransi.value) return
  try {
    const p = createPatient({
      nik: f.nik, nama: f.nama.trim(), tglLahir: f.tglLahir, jk: f.jk, hp: f.hp, alamatKtp: f.alamat.trim(),
      penjamin: f.penjamin, noKartu: f.penjamin === 'BPJS' ? f.noKartu : '', pjNama: '', _abaikanDuplikat: false,
    })
    hasil.value = p
    apm.state.value.patientId = p.id
    apm.state.value.baruRm = p.rm
    apm.state.value.confirmed = true
    apm.state.value.tokenExp = 0
  } catch (e: any) {
    const m: string = e.message || String(e)
    if (m.startsWith('409') || m.startsWith('DUPLIKAT')) dupe.value = true
    else galat.value = m
  }
}
const pakaiLama = () => {
  apm.state.value.mode = 'lama'
  apm.state.value.idTipe = 'nik'
  navigateTo('/apm/identifikasi')
}
const bantuan = () => {
  tiket.value = takeLoketTicket('apm')
}
const lanjut = () => navigateTo('/apm/poli')
</script>
<template>
  <ApmShell kode="APM-05" langkah="Langkah 2 · Data pasien baru">
    <template v-if="!hasil">
      <h1>Isi data diri Anda</h1>
      <div v-if="dupe" class="alert err big-alert">
        <div>
          <b>Data Anda sudah terdaftar.</b>
          <p>NIK atau nama dan tanggal lahir yang sama sudah ada di sistem. Silakan gunakan menu Pasien Lama.</p>
          <div class="row" style="margin-top: 12px; gap: 12px">
            <button class="btn btn-primary" @click="pakaiLama">Gunakan Pasien Lama</button>
            <button v-if="!tiket" class="btn" @click="bantuan">Bantuan loket</button>
            <span v-else>Nomor loket Anda: <b class="tkb">{{ tiket.nomor }}</b></span>
          </div>
        </div>
      </div>
      <div v-if="galat" class="alert err big-alert">{{ galat }}</div>

      <form class="form-grid" novalidate @submit.prevent="simpan">
        <div class="field">
          <label class="req" for="nik">NIK (16 digit)</label>
          <input id="nik" v-model="f.nik" class="input" :class="{ err: coba && err.nik }" inputmode="numeric" autocomplete="off" maxlength="16" @input="digits('nik')" />
          <span v-if="coba && err.nik" class="err-text big">{{ err.nik }}</span>
        </div>
        <div class="field">
          <label class="req" for="nama">Nama lengkap sesuai KTP</label>
          <input id="nama" v-model="f.nama" class="input" :class="{ err: coba && err.nama }" autocomplete="off" />
          <span v-if="coba && err.nama" class="err-text big">{{ err.nama }}</span>
        </div>
        <div class="field">
          <label class="req" for="tgl">Tanggal lahir</label>
          <input id="tgl" v-model="f.tglLahir" type="date" class="input" :class="{ err: coba && err.tglLahir }" :max="hariIni" />
          <span v-if="coba && err.tglLahir" class="err-text big">{{ err.tglLahir }}</span>
        </div>
        <div class="field">
          <span class="lbl req">Jenis kelamin</span>
          <div class="seg">
            <button type="button" :class="{ on: f.jk === 'L' }" @click="f.jk = 'L'">Laki-laki</button>
            <button type="button" :class="{ on: f.jk === 'P' }" @click="f.jk = 'P'">Perempuan</button>
          </div>
          <span v-if="coba && err.jk" class="err-text big">{{ err.jk }}</span>
        </div>
        <div class="field">
          <label class="req" for="hp">No. HP</label>
          <input id="hp" v-model="f.hp" class="input" :class="{ err: coba && err.hp }" inputmode="tel" autocomplete="off" maxlength="14" @input="digits('hp')" />
          <span v-if="coba && err.hp" class="err-text big">{{ err.hp }}</span>
        </div>
        <div class="field">
          <label class="req" for="alamat">Alamat</label>
          <input id="alamat" v-model="f.alamat" class="input" :class="{ err: coba && err.alamat }" autocomplete="off" />
          <span v-if="coba && err.alamat" class="err-text big">{{ err.alamat }}</span>
        </div>
        <div class="field full">
          <span class="lbl req">Penjamin</span>
          <div class="seg">
            <button type="button" :class="{ on: f.penjamin === 'Umum' }" @click="f.penjamin = 'Umum'">Umum</button>
            <button type="button" :class="{ on: f.penjamin === 'BPJS' }" @click="f.penjamin = 'BPJS'">BPJS</button>
            <button type="button" :class="{ on: f.penjamin === 'Asuransi' }" @click="f.penjamin = 'Asuransi'">Asuransi</button>
          </div>
        </div>
        <div v-if="f.penjamin === 'BPJS'" class="field full">
          <label class="req" for="bpjs">No. kartu BPJS (13 digit)</label>
          <input id="bpjs" v-model="f.noKartu" class="input" :class="{ err: coba && err.noKartu }" inputmode="numeric" autocomplete="off" maxlength="13" @input="digits('noKartu')" />
          <span v-if="coba && err.noKartu" class="err-text big">{{ err.noKartu }}</span>
        </div>
        <div v-if="asuransi" class="alert warn big-alert full">Pendaftaran dengan penjamin Asuransi dilayani di loket. Silakan ambil nomor loket atau pilih penjamin lain.</div>

        <div class="row act full">
          <NuxtLink class="btn" to="/apm/menu">Kembali</NuxtLink>
          <button v-if="asuransi" type="button" class="btn btn-primary go" :disabled="!!tiket" @click="bantuan">Ambil nomor loket</button>
          <button v-else type="submit" class="btn btn-primary go">Simpan &amp; lanjut</button>
        </div>
        <div v-if="asuransi && tiket" class="alert big-alert full">Nomor loket Anda: <b class="tkb">{{ tiket.nomor }}</b>. Silakan menuju loket pendaftaran.</div>
      </form>
    </template>

    <div v-else class="card ok-card">
      <h1>Pendaftaran berhasil</h1>
      <p>No. Rekam Medis Anda</p>
      <div class="rm">{{ hasil.rm }}</div>
      <p class="hint">Kartu pasien dicetak otomatis. Simpan No. RM ini untuk kunjungan berikutnya.</p>
      <button class="btn btn-primary go" @click="lanjut">Lanjut pilih poli</button>
    </div>
  </ApmShell>
</template>
<style scoped>
.form-grid { gap: 20px 28px; margin-top: 8px; }
.big-alert { font-size: 20px; padding: 18px 20px; margin-bottom: 16px; }
.big-alert p { margin: 6px 0 0; }
.err-text.big { font-size: 16px; }
.tkb { font-size: 28px; }
.act { justify-content: space-between; margin-top: 12px; }
.go { min-width: 260px; }
.ok-card { text-align: center; padding: 40px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.rm { font-size: 96px; font-weight: 800; color: var(--teal-d); letter-spacing: 6px; line-height: 1.1; font-family: ui-monospace, Consolas, monospace; }
@media (max-width: 767px) { .rm { font-size: 60px; } .go { min-width: 0; flex: 1; } }
</style>
