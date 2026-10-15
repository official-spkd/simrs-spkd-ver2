<script setup lang="ts">
// FO-03 Form Pasien Baru
const { create, list } = usePatients()
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
// Kolom angka: huruf/simbol langsung dibuang saat diketik atau ditempel.
watch(() => f.nik, (v) => { const c = onlyDigits(v, 16); if (c !== v) f.nik = c })
watch(() => f.noKartu, (v) => { const c = onlyDigits(v, 13); if (c !== v) f.noKartu = c })
watch(() => f.hp, (v) => { const c = phoneChars(v); if (c !== v) f.hp = c })
watch(() => f.pjHp, (v) => { const c = phoneChars(v); if (c !== v) f.pjHp = c })
const errs = reactive<Record<string, string>>({})
const banner = ref<{ kind: string; msg: string; patientId?: string } | null>(null)
const saving = ref(false)

const tabOf: Record<string, string> = {
  nik: 'demografi', nama: 'demografi', tglLahir: 'demografi', jk: 'demografi', tempatLahir: 'demografi',
  hp: 'kontak', email: 'kontak', alamatKtp: 'kontak', alamatDomisili: 'kontak', pjNama: 'pj', pjHubungan: 'pj', pjHp: 'pj', noKartu: 'penjamin', asuransi: 'penjamin', noPolis: 'penjamin',
}
const validate = () => {
  Object.keys(errs).forEach((k) => delete errs[k])
  const need = (k: string, label: string) => { if (!String(f[k] || '').trim()) errs[k] = `${label} wajib diisi` }
  need('nik', 'NIK'); need('nama', 'Nama'); need('tglLahir', 'Tanggal lahir'); need('jk', 'Jenis kelamin'); need('tempatLahir', 'Tempat lahir')
  need('hp', 'No. HP'); need('alamatKtp', 'Alamat KTP')
  need('pjNama', 'Nama penanggung jawab'); need('pjHubungan', 'Hubungan'); need('pjHp', 'No. HP penanggung jawab')
  if (f.nik && !/^\d{16}$/.test(f.nik)) errs.nik = 'NIK harus 16 digit angka'
  else if (f.nik && !validNik(f.nik)) errs.nik = 'NIK tidak valid (cek kode wilayah & tanggal lahir di NIK)'
  if (f.nama && f.nama.trim().length < 3) errs.nama = 'Nama minimal 3 karakter'
  if (f.alamatKtp && f.alamatKtp.trim().length < 5) errs.alamatKtp = 'Alamat KTP minimal 5 karakter'
  if (f.alamatDomisili && f.alamatDomisili.trim() && f.alamatDomisili.trim().length < 5) errs.alamatDomisili = 'Alamat domisili minimal 5 karakter'
  if (f.pjNama && f.pjNama.trim().length < 3) errs.pjNama = 'Nama penanggung jawab minimal 3 karakter'
  if (f.pjHp && !validHp(f.pjHp)) errs.pjHp = 'No. HP penanggung jawab harus nomor seluler Indonesia (mis. 081234567890)'
  if (f.tglLahir && f.tglLahir > todayStr()) errs.tglLahir = 'Tanggal lahir tidak boleh di masa depan'
  if (f.hp && !validHp(f.hp)) errs.hp = 'No. HP harus nomor seluler Indonesia (mis. 081234567890)'
  if (f.penjamin === 'BPJS' && !/^\d{13}$/.test(f.noKartu || '')) errs.noKartu = 'No. kartu BPJS harus 13 digit'
  if (f.penjamin === 'Asuransi') { need('asuransi', 'Nama asuransi'); need('noPolis', 'No. polis') }
  const first = Object.keys(errs)[0]
  if (first) { tab.value = tabOf[first] || tab.value; toast.err('Lengkapi isian yang wajib: ' + errs[first]); return false }
  return true
}

const clean = () => {
  const d: any = { ...f }
  if (d.penjamin !== 'BPJS') d.noKartu = ''
  if (d.penjamin !== 'Asuransi') { d.asuransi = ''; d.noPolis = '' }
  return d
}
const save = async (thenVisit: boolean) => {
  banner.value = null
  if (!validate()) return
  saving.value = true
  try {
    const p = await create(clean())
    toast.ok(`Pasien tersimpan: ${p.nama}`)
    navigateTo(thenVisit ? '/kunjungan/baru?pasien=' + p.id : '/pasien/' + p.id)
  } catch (e: any) {
    const m: string = e.message || String(e)
    if (e instanceof ApiError && e.status === 409) {
      const o = await list({ search: f.nik, limit: 1 }).then((r) => r.rows.find((x: any) => x.nik === f.nik)).catch(() => null)
      banner.value = { kind: 'err', msg: o ? `NIK sudah terdaftar atas nama ${o.nama}.` : 'NIK sudah terdaftar.', patientId: o?.id }
      tab.value = 'demografi'
      errs.nik = 'NIK sudah terdaftar'
    } else {
      const fe = e instanceof ApiError && e.status === 400 ? serverFieldErrors(m) : {}
      Object.assign(errs, fe)
      const first = Object.keys(fe)[0]
      if (first) tab.value = tabOf[first] || tab.value
      banner.value = { kind: 'err', msg: first ? 'Periksa kembali: ' + Object.values(fe).join('; ') : m }
    }
    toast.err(banner.value!.msg)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHead code="FO-03" role="Front Office" title="Form Pasien Baru" subtitle="Lengkapi identitas pasien · Tanda * wajib diisi · RM dibuat otomatis saat disimpan">
      </PageHead>

    <div v-if="banner" class="alert" :class="banner.kind" role="alert" style="margin-bottom: 14px; flex-wrap: wrap; align-items: center">
      <span style="flex: 1; min-width: 200px">{{ banner.msg }}</span>
      <NuxtLink v-if="banner.patientId" :to="'/pasien/' + banner.patientId" class="btn btn-sm">Buka pasien tersebut</NuxtLink>
    </div>

    <AppTabs v-model="tab" :tabs="TABS" />

    <div class="kl-cols r370">
      <div class="kl-col">
    <div class="panel">
      <h2>{{ TABS.find((t) => t.key === tab)?.label }}</h2>

      <div v-show="tab === 'demografi'" class="form-grid">
        <div class="field"><label class="req" for="b-nik">NIK</label><input id="b-nik" v-model="f.nik" class="input mono" :class="{ err: errs.nik }" maxlength="16" inputmode="numeric" placeholder="16 digit" /><span v-if="errs.nik" class="err-text">{{ errs.nik }}</span></div>
        <div class="field"><label class="req" for="b-nama">Nama lengkap</label><input id="b-nama" v-model="f.nama" class="input" :class="{ err: errs.nama }" /><span v-if="errs.nama" class="err-text">{{ errs.nama }}</span></div>
        <div class="field"><label class="req" for="b-tgl">Tanggal lahir</label><input id="b-tgl" v-model="f.tglLahir" type="date" :max="todayStr()" class="input" :class="{ err: errs.tglLahir }" /><span v-if="errs.tglLahir" class="err-text">{{ errs.tglLahir }}</span></div>
        <div class="field">
          <span class="lbl req">Jenis kelamin</span>
          <div class="seg" role="group" aria-label="Jenis kelamin"><button type="button" :class="{ on: f.jk === 'L' }" @click="f.jk = 'L'">Laki-laki</button><button type="button" :class="{ on: f.jk === 'P' }" @click="f.jk = 'P'">Perempuan</button></div>
          <span v-if="errs.jk" class="err-text">{{ errs.jk }}</span>
        </div>
        <div class="field"><label class="req" for="b-tmp">Tempat lahir</label><input id="b-tmp" v-model="f.tempatLahir" class="input" :class="{ err: errs.tempatLahir }" /><span v-if="errs.tempatLahir" class="err-text">{{ errs.tempatLahir }}</span></div>
        <div class="field"><label for="b-agama">Agama</label>
          <select id="b-agama" v-model="f.agama" class="select"><option value="">-</option><option v-for="a in ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']" :key="a">{{ a }}</option></select></div>
        <div class="field"><label for="b-pend">Pendidikan</label>
          <select id="b-pend" v-model="f.pendidikan" class="select"><option value="">-</option><option v-for="a in ['Tidak sekolah', 'SD', 'SMP', 'SMA', 'Diploma', 'Sarjana', 'Pascasarjana']" :key="a">{{ a }}</option></select></div>
        <div class="field"><label for="b-kerja">Pekerjaan</label><input id="b-kerja" v-model="f.pekerjaan" class="input" /></div>
        <div class="field"><label for="b-kawin">Status perkawinan</label>
          <select id="b-kawin" v-model="f.statusKawin" class="select"><option value="">-</option><option v-for="a in ['Belum kawin', 'Kawin', 'Cerai hidup', 'Cerai mati']" :key="a">{{ a }}</option></select></div>
        <div class="field"><label for="b-gol">Golongan darah</label>
          <select id="b-gol" v-model="f.golDarah" class="select"><option value="">-</option><option v-for="a in ['A', 'B', 'AB', 'O']" :key="a">{{ a }}</option></select></div>
        <div class="field full"><label for="b-alergi">Riwayat alergi</label><input id="b-alergi" v-model="f.alergi" class="input" placeholder="Contoh: Penisilin, seafood" /><span class="hint">Alergi akan tampil merah di Patient Banner.</span></div>
        <div class="guide full">NIK harus unik dan 16 digit. Jika sudah terdaftar, buka RM pemilik; periksa juga kesamaan nama + tanggal lahir.</div>
      </div>

      <div v-show="tab === 'kontak'" class="form-grid">
        <div class="field"><label class="req" for="b-hp">No. HP</label><input id="b-hp" v-model="f.hp" class="input mono" maxlength="15" placeholder="08xxxxxxxxxx" :class="{ err: errs.hp }" inputmode="tel" /><span v-if="errs.hp" class="err-text">{{ errs.hp }}</span></div>
        <div class="field"><label for="b-mail">Email</label><input id="b-mail" v-model="f.email" type="email" class="input" :class="{ err: errs.email }" /><span v-if="errs.email" class="err-text">{{ errs.email }}</span></div>
        <div class="field full"><label class="req" for="b-ktp">Alamat KTP</label><textarea id="b-ktp" v-model="f.alamatKtp" class="textarea" :class="{ err: errs.alamatKtp }" /><span v-if="errs.alamatKtp" class="err-text">{{ errs.alamatKtp }}</span></div>
        <div class="field full"><label for="b-dom">Alamat domisili</label><textarea id="b-dom" v-model="f.alamatDomisili" class="textarea" :class="{ err: errs.alamatDomisili }" placeholder="Kosongkan bila sama dengan KTP" /><span v-if="errs.alamatDomisili" class="err-text">{{ errs.alamatDomisili }}</span></div>
      </div>

      <div v-show="tab === 'pj'" class="form-grid">
        <div class="field"><label class="req" for="b-pjn">Nama penanggung jawab</label><input id="b-pjn" v-model="f.pjNama" class="input" :class="{ err: errs.pjNama }" /><span v-if="errs.pjNama" class="err-text">{{ errs.pjNama }}</span></div>
        <div class="field"><label class="req" for="b-pjh">Hubungan</label>
          <select id="b-pjh" v-model="f.pjHubungan" class="select" :class="{ err: errs.pjHubungan }"><option value="">Pilih</option><option v-for="a in ['Diri sendiri', 'Suami / istri', 'Orang tua', 'Anak', 'Saudara', 'Keluarga', 'Lainnya']" :key="a">{{ a }}</option></select>
          <span v-if="errs.pjHubungan" class="err-text">{{ errs.pjHubungan }}</span></div>
        <div class="field"><label class="req" for="b-pjhp">No. HP penanggung jawab</label><input id="b-pjhp" v-model="f.pjHp" class="input mono" maxlength="15" placeholder="08xxxxxxxxxx" :class="{ err: errs.pjHp }" inputmode="tel" /><span v-if="errs.pjHp" class="err-text">{{ errs.pjHp }}</span></div>
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
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Identitas rekam medis</h2>
          <p class="rm-big">RM otomatis</p>
          <p class="muted" style="font-size: 14px">Nomor RM diterbitkan setelah validasi dan penyimpanan berhasil.</p>
          <div><span class="badge b-teal">Default penjamin: {{ f.penjamin }}</span></div>
        </div>
      </div>
    </div>

    <div class="row" style="margin-top: 16px; gap: 12px">
      <NuxtLink to="/fo" class="btn">Kembali</NuxtLink>
      <button class="btn" :disabled="saving" @click="save(false)">Simpan</button>
      <button class="btn btn-primary" :disabled="saving" @click="save(true)">Simpan &amp; Buat Kunjungan</button>
    </div>
  </div>
</template>

<style scoped>
.kl-cols.r370 { grid-template-columns: minmax(0, 1fr) 370px; }
.rm-big { font-size: 24px !important; font-weight: 600; color: var(--navy); line-height: 1.45; }
@media (max-width: 900px) { .kl-cols.r370 { grid-template-columns: minmax(0, 1fr); } }
</style>
