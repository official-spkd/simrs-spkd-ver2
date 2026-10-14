<script setup lang="ts">
// FO-03 Form Pasien Baru
const { db, createPatient } = useDb()
const toast = useToast()
const route = useRoute()

const tab = ref('demografi')
const TABS = [
  { key: 'demografi', label: 'Demografi' },
  { key: 'kontak', label: 'Kontak' },
  { key: 'pj', label: 'Penanggung jawab' },
  { key: 'penjamin', label: 'Penjamin' },
]
const f = reactive<any>({
  nik: String(route.query.nik || ''), nama: '', tglLahir: '', jk: '', tempatLahir: '', agama: '', pendidikan: '', pekerjaan: '', statusKawin: '', golDarah: '',
  hp: '', email: '', alamatKtp: '', alamatDomisili: '', pjNama: '', pjHubungan: '', pjHp: '', penjamin: 'Umum', noKartu: '', asuransi: '', noPolis: '', alergi: '',
})
const errs = reactive<Record<string, string>>({})
const banner = ref<{ kind: string; msg: string; patientId?: string } | null>(null)
const saving = ref(false)

const tabOf: Record<string, string> = {
  nik: 'demografi', nama: 'demografi', tglLahir: 'demografi', jk: 'demografi',
  hp: 'kontak', alamatKtp: 'kontak', pjNama: 'pj', pjHubungan: 'pj', pjHp: 'pj', noKartu: 'penjamin', asuransi: 'penjamin', noPolis: 'penjamin',
}
const validate = () => {
  Object.keys(errs).forEach((k) => delete errs[k])
  const need = (k: string, label: string) => { if (!String(f[k] || '').trim()) errs[k] = `${label} wajib diisi` }
  need('nik', 'NIK'); need('nama', 'Nama'); need('tglLahir', 'Tanggal lahir'); need('jk', 'Jenis kelamin')
  need('hp', 'No. HP'); need('alamatKtp', 'Alamat KTP')
  need('pjNama', 'Nama penanggung jawab'); need('pjHubungan', 'Hubungan'); need('pjHp', 'No. HP penanggung jawab')
  if (f.nik && !/^\d{16}$/.test(f.nik)) errs.nik = 'NIK harus 16 digit angka'
  if (f.tglLahir && f.tglLahir > todayStr()) errs.tglLahir = 'Tanggal lahir tidak boleh di masa depan'
  if (f.hp && !/^[0-9+\-\s]{8,16}$/.test(f.hp)) errs.hp = 'No. HP tidak valid'
  if (f.penjamin === 'BPJS' && !/^\d{13}$/.test(f.noKartu || '')) errs.noKartu = 'No. kartu BPJS harus 13 digit'
  if (f.penjamin === 'Asuransi') { need('asuransi', 'Nama asuransi'); need('noPolis', 'No. polis') }
  const first = Object.keys(errs)[0]
  if (first) { tab.value = tabOf[first] || tab.value; toast.err('Lengkapi isian yang wajib: ' + errs[first]); return false }
  return true
}

const clean = (abaikan: boolean) => {
  const d: any = { ...f }
  if (d.penjamin !== 'BPJS') d.noKartu = ''
  if (d.penjamin !== 'Asuransi') { d.asuransi = ''; d.noPolis = '' }
  if (abaikan) d._abaikanDuplikat = true
  return d
}
const save = (thenVisit: boolean, abaikan = false) => {
  banner.value = null
  if (!validate()) return
  saving.value = true
  try {
    const p = createPatient(clean(abaikan))
    toast.ok(`Pasien tersimpan. No. RM ${p.rm}`)
    navigateTo(thenVisit ? '/kunjungan/baru?pasien=' + p.id : '/pasien/' + p.id)
  } catch (e: any) {
    const m: string = e.message || String(e)
    if (m.startsWith('409')) {
      const o = db.patients.find((x: any) => x.nik === f.nik)
      banner.value = { kind: 'err', msg: m, patientId: o?.id }
      tab.value = 'demografi'
      errs.nik = 'NIK sudah terdaftar'
    } else if (m.startsWith('DUPLIKAT')) {
      const o = db.patients.find((x: any) => x.nama.toLowerCase() === f.nama.toLowerCase() && x.tglLahir === f.tglLahir)
      banner.value = { kind: 'warn', msg: m, patientId: o?.id }
      pendingVisit.value = thenVisit
    } else {
      banner.value = { kind: 'err', msg: m }
    }
    toast.err(m)
  } finally {
    saving.value = false
  }
}
const pendingVisit = ref(false)
const forceSave = () => save(pendingVisit.value, true)
</script>

<template>
  <div>
    <PageHead code="FO-03" role="Front Office" title="Pasien Baru" subtitle="No. RM dibangkitkan otomatis. Kolom bertanda * wajib diisi.">
      <template #actions><NuxtLink to="/fo" class="btn">Batal</NuxtLink></template>
    </PageHead>

    <div v-if="banner" class="alert" :class="banner.kind" role="alert" style="margin-bottom: 14px; flex-wrap: wrap; align-items: center">
      <span style="flex: 1; min-width: 200px">{{ banner.msg }}</span>
      <NuxtLink v-if="banner.patientId" :to="'/pasien/' + banner.patientId" class="btn btn-sm">Buka pasien tersebut</NuxtLink>
      <button v-if="banner.kind === 'warn'" class="btn btn-sm btn-primary" @click="forceSave">Tetap simpan (bukan duplikat)</button>
    </div>

    <div class="card">
      <AppTabs v-model="tab" :tabs="TABS" />

      <div v-show="tab === 'demografi'" class="form-grid">
        <div class="field"><label class="req" for="b-nik">NIK</label><input id="b-nik" v-model="f.nik" class="input mono" :class="{ err: errs.nik }" maxlength="16" inputmode="numeric" placeholder="16 digit" /><span v-if="errs.nik" class="err-text">{{ errs.nik }}</span></div>
        <div class="field"><label class="req" for="b-nama">Nama lengkap</label><input id="b-nama" v-model="f.nama" class="input" :class="{ err: errs.nama }" /><span v-if="errs.nama" class="err-text">{{ errs.nama }}</span></div>
        <div class="field"><label class="req" for="b-tgl">Tanggal lahir</label><input id="b-tgl" v-model="f.tglLahir" type="date" :max="todayStr()" class="input" :class="{ err: errs.tglLahir }" /><span v-if="errs.tglLahir" class="err-text">{{ errs.tglLahir }}</span></div>
        <div class="field">
          <span class="lbl req">Jenis kelamin</span>
          <div class="seg" role="group" aria-label="Jenis kelamin"><button type="button" :class="{ on: f.jk === 'L' }" @click="f.jk = 'L'">Laki-laki</button><button type="button" :class="{ on: f.jk === 'P' }" @click="f.jk = 'P'">Perempuan</button></div>
          <span v-if="errs.jk" class="err-text">{{ errs.jk }}</span>
        </div>
        <div class="field"><label for="b-tmp">Tempat lahir</label><input id="b-tmp" v-model="f.tempatLahir" class="input" /></div>
        <div class="field"><label for="b-agama">Agama</label>
          <select id="b-agama" v-model="f.agama" class="select"><option value="">-</option><option v-for="a in ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']" :key="a">{{ a }}</option></select></div>
        <div class="field"><label for="b-pend">Pendidikan</label>
          <select id="b-pend" v-model="f.pendidikan" class="select"><option value="">-</option><option v-for="a in ['Tidak sekolah', 'SD', 'SMP', 'SMA', 'Diploma', 'Sarjana', 'Pascasarjana']" :key="a">{{ a }}</option></select></div>
        <div class="field"><label for="b-kerja">Pekerjaan</label><input id="b-kerja" v-model="f.pekerjaan" class="input" /></div>
        <div class="field"><label for="b-kawin">Status kawin</label>
          <select id="b-kawin" v-model="f.statusKawin" class="select"><option value="">-</option><option v-for="a in ['Belum kawin', 'Kawin', 'Cerai hidup', 'Cerai mati']" :key="a">{{ a }}</option></select></div>
        <div class="field"><label for="b-gol">Golongan darah</label>
          <select id="b-gol" v-model="f.golDarah" class="select"><option value="">-</option><option v-for="a in ['A', 'B', 'AB', 'O']" :key="a">{{ a }}</option></select></div>
        <div class="field full"><label for="b-alergi">Alergi (teks bebas)</label><input id="b-alergi" v-model="f.alergi" class="input" placeholder="Contoh: Penisilin, seafood" /><span class="hint">Alergi akan tampil merah di Patient Banner.</span></div>
      </div>

      <div v-show="tab === 'kontak'" class="form-grid">
        <div class="field"><label class="req" for="b-hp">No. HP</label><input id="b-hp" v-model="f.hp" class="input" :class="{ err: errs.hp }" inputmode="tel" /><span v-if="errs.hp" class="err-text">{{ errs.hp }}</span></div>
        <div class="field"><label for="b-mail">Email</label><input id="b-mail" v-model="f.email" type="email" class="input" /></div>
        <div class="field full"><label class="req" for="b-ktp">Alamat KTP</label><textarea id="b-ktp" v-model="f.alamatKtp" class="textarea" :class="{ err: errs.alamatKtp }" /><span v-if="errs.alamatKtp" class="err-text">{{ errs.alamatKtp }}</span></div>
        <div class="field full"><label for="b-dom">Alamat domisili</label><textarea id="b-dom" v-model="f.alamatDomisili" class="textarea" placeholder="Kosongkan bila sama dengan KTP" /></div>
      </div>

      <div v-show="tab === 'pj'" class="form-grid">
        <div class="field"><label class="req" for="b-pjn">Nama penanggung jawab</label><input id="b-pjn" v-model="f.pjNama" class="input" :class="{ err: errs.pjNama }" /><span v-if="errs.pjNama" class="err-text">{{ errs.pjNama }}</span></div>
        <div class="field"><label class="req" for="b-pjh">Hubungan</label>
          <select id="b-pjh" v-model="f.pjHubungan" class="select" :class="{ err: errs.pjHubungan }"><option value="">Pilih</option><option v-for="a in ['Diri sendiri', 'Suami / istri', 'Orang tua', 'Anak', 'Saudara', 'Keluarga', 'Lainnya']" :key="a">{{ a }}</option></select>
          <span v-if="errs.pjHubungan" class="err-text">{{ errs.pjHubungan }}</span></div>
        <div class="field"><label class="req" for="b-pjhp">No. HP penanggung jawab</label><input id="b-pjhp" v-model="f.pjHp" class="input" :class="{ err: errs.pjHp }" inputmode="tel" /><span v-if="errs.pjHp" class="err-text">{{ errs.pjHp }}</span></div>
      </div>

      <div v-show="tab === 'penjamin'" class="stack" style="gap: 14px">
        <div class="field">
          <span class="lbl">Penjamin default</span>
          <div class="seg" role="group" aria-label="Penjamin"><button v-for="p in ['Umum', 'BPJS', 'Asuransi']" :key="p" type="button" :class="{ on: f.penjamin === p }" @click="f.penjamin = p">{{ p }}</button></div>
        </div>
        <div v-if="f.penjamin === 'BPJS'" class="field" style="max-width: 420px"><label class="req" for="b-kartu">No. kartu BPJS</label><input id="b-kartu" v-model="f.noKartu" class="input mono" :class="{ err: errs.noKartu }" maxlength="13" inputmode="numeric" placeholder="13 digit" /><span v-if="errs.noKartu" class="err-text">{{ errs.noKartu }}</span></div>
        <div v-if="f.penjamin === 'Asuransi'" class="form-grid">
          <div class="field"><label class="req" for="b-asr">Nama asuransi</label><input id="b-asr" v-model="f.asuransi" class="input" :class="{ err: errs.asuransi }" /><span v-if="errs.asuransi" class="err-text">{{ errs.asuransi }}</span></div>
          <div class="field"><label class="req" for="b-pol">No. polis</label><input id="b-pol" v-model="f.noPolis" class="input" :class="{ err: errs.noPolis }" /><span v-if="errs.noPolis" class="err-text">{{ errs.noPolis }}</span></div>
        </div>
        <p v-if="f.penjamin === 'Umum'" class="muted">Pasien umum membayar langsung di kasir.</p>
      </div>
    </div>

    <div class="row" style="margin-top: 16px; justify-content: flex-end">
      <NuxtLink to="/fo" class="btn">Batal</NuxtLink>
      <button class="btn" :disabled="saving" @click="save(false)">Simpan</button>
      <button class="btn btn-primary" :disabled="saving" @click="save(true)">Simpan &amp; Buat Kunjungan</button>
    </div>
  </div>
</template>
