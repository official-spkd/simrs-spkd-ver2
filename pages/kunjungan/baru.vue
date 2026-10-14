<script setup lang="ts">
// FO-05 Form Kunjungan (wizard 4 langkah) + FO-06 Panel Penjamin & SEP
const route = useRoute()
const { db, patient, poli, doctor, visit, polisAktifHariIni, doctorsOfPoli, cekKepesertaan, registerVisit, retrySep } = useDb()
const toast = useToast()

const pasienId = computed(() => String(route.query.pasien || ''))
const pt = computed(() => (pasienId.value ? patient(pasienId.value) : null))
const searchOpen = ref(false)

const step = ref(1)
const STEPS = ['Penjamin', 'Poli & Dokter', 'Keterangan', 'Ringkasan']
const f = reactive<any>({
  penjamin: 'Umum', noKartu: '', noRujukan: '', noKontrol: '', asuransiNama: '', noPolis: '', plafon: 0,
  dokumen: [], poliId: '', doctorId: '', tipe: 'baru', keluhan: '', pj: '', persetujuan: false,
})
const kep = ref<any>(null)
const jenisDok = ref('Surat rujukan FKTP')
const err = ref('')
const saving = ref(false)
const doneId = ref('')
const doneVisit = computed(() => (doneId.value ? visit(doneId.value) : null))

watch(pt, (p: any) => {
  if (!p) return
  f.penjamin = p.penjamin
  f.noKartu = p.noKartu || ''
  f.asuransiNama = p.asuransi || ''
  f.noPolis = p.noPolis || ''
  f.pj = p.pjNama || ''
  f.poliId = ''; f.doctorId = ''; f.dokumen = []; f.persetujuan = false; f.keluhan = ''; f.tipe = 'baru'
  kep.value = null; step.value = 1; doneId.value = ''; err.value = ''
}, { immediate: true })

// langkah 1
const cek = () => {
  const r = toast.attempt(() => cekKepesertaan(f.noKartu.trim()))
  if (r && r !== true) {
    kep.value = r
    if (r.aktif) toast.ok('Peserta aktif: ' + r.nama)
    else toast.warn('Kepesertaan tidak aktif')
  }
}
const addFiles = (e: Event) => {
  const el = e.target as HTMLInputElement
  const files = Array.from(el.files || [])
  files.forEach((fl) => {
    if (fl.size > 10 * 1024 * 1024) { toast.err(`${fl.name} melebihi 10 MB`); return }
    f.dokumen.push({ jenis: jenisDok.value, nama: fl.name })
  })
  if (files.length) toast.ok(`${files.length} dokumen dicatat`)
  el.value = ''
}
const delDok = (i: number) => f.dokumen.splice(i, 1)
const dokumenText = computed(() => (f.dokumen.length ? f.dokumen.map((d: any) => d.nama).join(', ') : '-'))

// langkah 2
const polis = computed(() => polisAktifHariIni())
const dokters = computed(() => (f.poliId ? doctorsOfPoli(f.poliId) : []))
const pilihPoli = (id: string) => { f.poliId = id; f.doctorId = '' }
const dokterTerpilih = computed(() => dokters.value.find((d: any) => d.id === f.doctorId))
const preview = computed(() => {
  if (!f.poliId) return '-'
  const n = (db.counters[`${todayStr()}|${f.poliId}`] || 0) + 1
  return `${poli(f.poliId).kode}-${pad(n)}`
})
const sudahAda = computed(() => (pt.value && f.poliId ? db.visits.find((v: any) => v.patientId === pt.value.id && v.poliId === f.poliId && v.tanggal === todayStr() && v.status !== 'dibatalkan') : null))

const validasi = (s: number): string => {
  if (s === 1) {
    if (f.penjamin === 'BPJS') {
      if (!/^\d{13}$/.test(f.noKartu.trim())) return 'No. kartu BPJS harus 13 digit'
      if (kep.value && !kep.value.aktif) return 'Kepesertaan BPJS tidak aktif. Ganti penjamin atau periksa nomor kartu.'
    }
    if (f.penjamin === 'Asuransi' && (!f.asuransiNama.trim() || !f.noPolis.trim())) return 'Nama asuransi dan No. polis wajib diisi'
  }
  if (s === 2) {
    if (!f.poliId) return 'Pilih poli terlebih dahulu'
    if (!f.doctorId) return 'Pilih dokter'
    if (dokterTerpilih.value && dokterTerpilih.value.sesi.sisa <= 0) return 'Kuota dokter sudah habis'
    if (sudahAda.value) return `Pasien sudah punya kunjungan aktif di poli ini hari ini (${sudahAda.value.antreanPoli.nomor})`
  }
  if (s === 3) {
    if (!f.keluhan.trim()) return 'Keluhan singkat wajib diisi'
    if (!f.pj.trim()) return 'Nama penanggung jawab wajib diisi'
    if (!f.persetujuan) return 'Persetujuan umum (general consent) wajib dicentang'
  }
  return ''
}
const lanjut = () => {
  err.value = validasi(step.value)
  if (err.value) { toast.err(err.value); return }
  step.value++
}
const kembali = () => { err.value = ''; if (step.value > 1) step.value-- }

const ticketOpen = ref(false)
const sepOpen = ref(false)
const daftar = (cetak: boolean) => {
  for (let s = 1; s <= 3; s++) {
    const m = validasi(s)
    if (m) { err.value = m; step.value = s; toast.err(m); return }
  }
  saving.value = true
  try {
    const v = registerVisit({
      patientId: pt.value.id, poliId: f.poliId, doctorId: f.doctorId, penjamin: f.penjamin, tipe: f.tipe, keluhan: f.keluhan.trim(), pj: f.pj.trim(),
      kanal: 'loket', persetujuan: f.persetujuan, noRujukan: f.noRujukan.trim(), noKontrol: f.noKontrol.trim(), dokumen: f.dokumen.slice(),
      asuransiNama: f.asuransiNama.trim(), noPolis: f.noPolis.trim(), plafon: Number(f.plafon) || 0,
    })
    doneId.value = v.id
    toast.ok(`Kunjungan terdaftar. Nomor antrean ${v.antreanPoli.nomor}`)
    if (cetak) ticketOpen.value = true
  } catch (e: any) {
    err.value = e.message || String(e)
    toast.err(err.value)
  } finally {
    saving.value = false
  }
}
const kirimUlang = () => { if (doneVisit.value) { retrySep(doneVisit.value.id); toast.info('SEP dikirim ulang, menunggu respons') } }
const printAs = () => {
  document.body.classList.add('print-only')
  const done = () => document.body.classList.remove('print-only')
  window.addEventListener('afterprint', done, { once: true })
  window.print()
  setTimeout(done, 1500)
}
const sepBisaKirim = computed(() => doneVisit.value?.sep && doneVisit.value.sep.status !== 'terbit')
</script>

<template>
  <div>
    <PageHead code="FO-05" role="Front Office" title="Kunjungan Baru" subtitle="Daftarkan kunjungan rawat jalan dalam 4 langkah.">
      <template #actions><NuxtLink to="/fo" class="btn">Kembali ke worklist</NuxtLink></template>
    </PageHead>

    <div v-if="!pt" class="card">
      <h2>Pilih pasien</h2>
      <p class="muted" style="margin-bottom: 12px">Cari pasien terlebih dahulu, atau daftarkan pasien baru.</p>
      <div class="row"><button class="btn btn-primary" @click="searchOpen = true"><AppIcon name="search" /> Cari pasien</button><NuxtLink to="/pasien/baru" class="btn">+ Pasien Baru</NuxtLink></div>
      <PatientSearchModal v-model="searchOpen" />
    </div>

    <template v-else>
      <PatientBanner :patient="pt" />

      <!-- hasil pendaftaran -->
      <div v-if="doneVisit" class="card" style="text-align: center">
        <div class="muted">Kunjungan berhasil didaftarkan · {{ doneVisit.noKunjungan }}</div>
        <div class="bignum">{{ doneVisit.antreanPoli.nomor }}</div>
        <div style="margin-bottom: 12px">{{ poli(doneVisit.poliId)?.nama }} · {{ doctor(doneVisit.doctorId)?.nama }} · {{ poli(doneVisit.poliId)?.ruang }}</div>
        <div class="row" style="justify-content: center; margin-bottom: 14px">
          <StatusBadge :value="doneVisit.status" /><StatusBadge :value="doneVisit.antreanPoli.status" /><StatusBadge :value="doneVisit.penjamin" />
          <template v-if="doneVisit.sep"><span class="muted small">SEP</span><StatusBadge :value="doneVisit.sep.status" /><span v-if="doneVisit.sep.noSep" class="mono small">{{ doneVisit.sep.noSep }}</span></template>
        </div>
        <p v-if="doneVisit.sep && doneVisit.sep.status === 'menunggu'" class="hint" style="margin-bottom: 12px">SEP sedang diproses di latar belakang. Poli tidak diblokir oleh SEP yang masih menunggu.</p>
        <div class="row" style="justify-content: center">
          <button class="btn" @click="ticketOpen = true"><AppIcon name="print" /> Cetak tiket</button>
          <template v-if="doneVisit.sep">
            <button class="btn" :disabled="!sepBisaKirim" @click="kirimUlang">Kirim ulang SEP</button>
            <button class="btn" :disabled="doneVisit.sep.status !== 'terbit'" @click="sepOpen = true">Cetak SEP</button>
          </template>
          <NuxtLink to="/fo" class="btn btn-primary">Kembali ke worklist</NuxtLink>
        </div>
      </div>

      <div v-else class="card">
        <ul class="steps" style="padding: 0; margin: 0 0 20px">
          <li v-for="(s, i) in STEPS" :key="s" :class="{ on: step === i + 1, done: step > i + 1 }"><b>{{ step > i + 1 ? '✓' : i + 1 }}</b> {{ s }}</li>
        </ul>

        <!-- 1. penjamin -->
        <div v-show="step === 1" class="stack" style="gap: 14px">
          <div class="field">
            <span class="lbl">Penjamin kunjungan</span>
            <div class="seg" role="group" aria-label="Penjamin"><button v-for="p in ['Umum', 'BPJS', 'Asuransi']" :key="p" type="button" :class="{ on: f.penjamin === p }" @click="f.penjamin = p; kep = null">{{ p }}</button></div>
          </div>
          <div v-if="f.penjamin === 'BPJS'" class="card" style="background: #f7fafb">
            <h3 style="margin-bottom: 12px">Panel penjamin BPJS &amp; SEP</h3>
            <div class="form-grid">
              <div class="field full">
                <label class="req" for="w-kartu">No. kartu BPJS / NIK</label>
                <div class="row" style="flex-wrap: nowrap"><input id="w-kartu" v-model="f.noKartu" class="input mono" maxlength="13" inputmode="numeric" placeholder="13 digit" /><button type="button" class="btn" @click="cek">Cek kepesertaan</button></div>
              </div>
              <div v-if="kep" class="full alert" :class="kep.aktif ? '' : 'err'">
                <span><b>{{ kep.aktif ? 'Peserta aktif' : 'Tidak aktif' }}</b> · {{ kep.nama }} · {{ kep.kelas }} · {{ kep.noKartu }}</span>
              </div>
              <div class="field"><label for="w-rujuk">No. rujukan (FKTP)</label><input id="w-rujuk" v-model="f.noRujukan" class="input mono" placeholder="Ketik manual" /></div>
              <div class="field"><label for="w-kontrol">No. surat kontrol</label><input id="w-kontrol" v-model="f.noKontrol" class="input mono" placeholder="Bila kunjungan kontrol" /></div>
              <div class="field"><label for="w-jenis">Jenis dokumen</label><select id="w-jenis" v-model="jenisDok" class="select"><option>Surat rujukan FKTP</option><option>Surat kontrol</option><option>Dokumen lain</option></select></div>
              <div class="field"><label for="w-file1">Lampirkan dokumen administratif</label><input id="w-file1" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" class="input" @change="addFiles" /></div>
              <div class="full row"><span class="muted small">Status SEP saat didaftarkan:</span><StatusBadge value="menunggu" /><span class="hint" style="margin: 0">SEP dibuat pending lalu dikirim worker; poli tidak diblokir.</span></div>
            </div>
          </div>
          <div v-if="f.penjamin === 'Asuransi'" class="card" style="background: #f7fafb">
            <h3 style="margin-bottom: 12px">Panel penjamin asuransi</h3>
            <div class="form-grid">
              <div class="field"><label class="req" for="w-asr">Nama asuransi</label><input id="w-asr" v-model="f.asuransiNama" class="input" /></div>
              <div class="field"><label class="req" for="w-pol">No. polis</label><input id="w-pol" v-model="f.noPolis" class="input" /></div>
              <div class="field"><label for="w-plafon">Plafon (Rp)</label><input id="w-plafon" v-model.number="f.plafon" type="number" min="0" class="input" /></div>
            </div>
          </div>
          <p v-if="f.penjamin === 'Umum'" class="muted">Pasien umum membayar langsung di kasir.</p>
        </div>

        <!-- 2. poli & dokter -->
        <div v-show="step === 2" class="stack" style="gap: 14px">
          <div>
            <span class="lbl">Poli aktif hari ini</span>
            <div class="grid g4" style="margin-top: 8px">
              <button v-for="p in polis" :key="p.id" type="button" class="tile" :class="{ on: f.poliId === p.id }" style="min-height: 76px; font-size: 16px" :style="f.poliId === p.id ? 'border-color: var(--teal); background: var(--teal-l)' : ''" @click="pilihPoli(p.id)">{{ p.nama }}<small>{{ p.ruang }}</small></button>
            </div>
            <p v-if="!polis.length" class="muted" style="margin-top: 8px">Tidak ada poli yang berpraktik hari ini.</p>
          </div>
          <div v-if="f.poliId">
            <span class="lbl">Dokter berjadwal</span>
            <div class="grid g3" style="margin-top: 8px">
              <button v-for="d in dokters" :key="d.id" type="button" class="tile" :disabled="d.sesi.sisa <= 0" :class="{ off: d.sesi.sisa <= 0 }" style="min-height: 96px; font-size: 15px" :style="f.doctorId === d.id ? 'border-color: var(--teal); background: var(--teal-l)' : ''" @click="d.sesi.sisa > 0 && (f.doctorId = d.id)">
                {{ d.nama }}
                <small>{{ d.sesi.mulai }}–{{ d.sesi.selesai }} · sisa kuota {{ d.sesi.sisa }}/{{ d.sesi.kuota }}</small>
                <span v-if="d.sesi.cuti" class="badge b-warn" style="align-self: flex-start">Cuti{{ d.sesi.cuti.penggantiId ? ' (ada pengganti)' : '' }}</span>
                <span v-else-if="d.sesi.sisa <= 0" class="badge b-err" style="align-self: flex-start">Kuota penuh</span>
              </button>
            </div>
            <p v-if="!dokters.length" class="muted" style="margin-top: 8px">Tidak ada dokter berjadwal di poli ini hari ini.</p>
          </div>
          <div v-if="sudahAda" class="alert warn">Pasien sudah punya kunjungan aktif di poli ini hari ini ({{ sudahAda.antreanPoli.nomor }}).</div>
        </div>

        <!-- 3. keterangan -->
        <div v-show="step === 3" class="form-grid">
          <div class="field">
            <span class="lbl">Jenis kunjungan</span>
            <div class="seg" role="group" aria-label="Jenis kunjungan"><button type="button" :class="{ on: f.tipe === 'baru' }" @click="f.tipe = 'baru'">Baru</button><button type="button" :class="{ on: f.tipe === 'kontrol' }" @click="f.tipe = 'kontrol'">Kontrol</button></div>
          </div>
          <div class="field"><label class="req" for="w-pj">Penanggung jawab</label><input id="w-pj" v-model="f.pj" class="input" /></div>
          <div class="field full"><label class="req" for="w-kel">Keluhan singkat</label><textarea id="w-kel" v-model="f.keluhan" class="textarea" placeholder="Contoh: batuk 3 hari" /></div>
          <div class="field full">
            <span class="lbl">Dokumen administratif ({{ f.tipe === 'kontrol' ? 'surat kontrol' : 'surat rujukan FKTP' }})</span>
            <div class="row">
              <select v-model="jenisDok" class="select" style="width: auto" aria-label="Jenis dokumen"><option>Surat rujukan FKTP</option><option>Surat kontrol</option><option>Dokumen lain</option></select>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" class="input" style="flex: 1; min-width: 200px" aria-label="Unggah dokumen" @change="addFiles" />
            </div>
            <ul v-if="f.dokumen.length" style="list-style: none; padding: 0; margin: 8px 0 0">
              <li v-for="(d, i) in f.dokumen" :key="i" class="row between" style="padding: 6px 0; border-top: 1px solid var(--line)"><span><span class="badge b-navy">{{ d.jenis }}</span> {{ d.nama }}</span><button type="button" class="btn btn-sm btn-danger" @click="delDok(i)">Hapus</button></li>
            </ul>
            <span class="hint">Nama berkas dicatat sebagai dokumen administratif (PDF/JPG/PNG, maks. 10 MB).</span>
          </div>
          <label class="check full"><input v-model="f.persetujuan" type="checkbox" /><span>Pasien / penanggung jawab telah menyetujui <b>persetujuan umum (general consent)</b>. <span class="muted">(wajib)</span></span></label>
        </div>

        <!-- 4. ringkasan -->
        <div v-show="step === 4" class="grid g2">
          <dl class="kv">
            <dt>Pasien</dt><dd>{{ pt.nama }} · RM {{ pt.rm }}</dd>
            <dt>Penjamin</dt><dd><StatusBadge :value="f.penjamin" /></dd>
            <template v-if="f.penjamin === 'BPJS'"><dt>No. kartu</dt><dd class="mono">{{ f.noKartu }}</dd><dt>Rujukan / kontrol</dt><dd class="mono">{{ f.noRujukan || '-' }} / {{ f.noKontrol || '-' }}</dd><dt>Status SEP</dt><dd><StatusBadge value="menunggu" /></dd></template>
            <template v-if="f.penjamin === 'Asuransi'"><dt>Asuransi</dt><dd>{{ f.asuransiNama }} · {{ f.noPolis }} · plafon {{ fmtRp(f.plafon) }}</dd></template>
            <dt>Poli</dt><dd>{{ f.poliId ? poli(f.poliId)?.nama : '-' }}</dd>
            <dt>Dokter</dt><dd>{{ dokterTerpilih?.nama || '-' }}</dd>
            <dt>Jenis</dt><dd>{{ f.tipe === 'baru' ? 'Baru' : 'Kontrol' }}</dd>
            <dt>Keluhan</dt><dd>{{ f.keluhan }}</dd>
            <dt>Penanggung jawab</dt><dd>{{ f.pj }}</dd>
            <dt>Dokumen</dt><dd>{{ dokumenText }}</dd>
          </dl>
          <div class="card" style="text-align: center; background: var(--teal-l)">
            <div class="muted">Pratinjau nomor antrean</div>
            <div class="bignum">{{ preview }}</div>
            <div class="hint">Nomor final diterbitkan saat Daftarkan; kuota dikunci atomik.</div>
          </div>
          <div v-if="f.penjamin === 'BPJS' && !f.noRujukan && !f.noKontrol" class="alert warn full" style="grid-column: 1 / -1">Belum ada No. rujukan / surat kontrol. SEP tetap dibuat menunggu; lengkapi bila diperlukan.</div>
        </div>

        <p v-if="err" class="err-text" role="alert" style="margin-top: 12px">{{ err }}</p>

        <div class="row between" style="margin-top: 20px">
          <button class="btn" :disabled="step === 1" @click="kembali">Kembali</button>
          <div v-if="step < 4"><button class="btn btn-primary" @click="lanjut">Lanjut</button></div>
          <div v-else class="row"><button class="btn" :disabled="saving" @click="daftar(false)">Daftarkan</button><button class="btn btn-primary" :disabled="saving" @click="daftar(true)"><AppIcon name="print" /> Daftarkan &amp; Cetak</button></div>
        </div>
      </div>
    </template>

    <AppModal v-model="ticketOpen" title="Tiket antrean (80 mm)">
      <div v-if="doneVisit && pt" class="ticket">
        <div class="bold" style="font-size: 14px">RS SPKD</div>
        <div>Tiket Antrean Poliklinik</div>
        <div class="no">{{ doneVisit.antreanPoli.nomor }}</div>
        <div class="bold">{{ poli(doneVisit.poliId)?.nama }} · {{ poli(doneVisit.poliId)?.ruang }}</div>
        <div>{{ doctor(doneVisit.doctorId)?.nama }}</div>
        <hr />
        <div>{{ maskNama(pt.nama) }} · RM {{ pt.rm }}</div>
        <div>{{ doneVisit.penjamin }} · {{ fmtTglPanjang() }} {{ fmtJam(doneVisit.jamDaftar) }}</div>
        <div class="muted">{{ doneVisit.noKunjungan }}</div>
        <div style="margin-top: 8px">Mohon menunggu panggilan.</div>
      </div>
      <template #footer><button class="btn" @click="ticketOpen = false">Tutup</button><button class="btn btn-primary" @click="printAs"><AppIcon name="print" /> Cetak</button></template>
    </AppModal>

    <AppModal v-model="sepOpen" title="Cetak SEP">
      <div v-if="doneVisit && doneVisit.sep && pt" class="stack" style="gap: 8px">
        <dl class="kv">
          <dt>No. SEP</dt><dd class="mono">{{ doneVisit.sep.noSep }}</dd>
          <dt>Peserta</dt><dd>{{ pt.nama }} · {{ pt.noKartu || f.noKartu }}</dd>
          <dt>Poli</dt><dd>{{ poli(doneVisit.poliId)?.nama }}</dd>
          <dt>No. rujukan</dt><dd class="mono">{{ doneVisit.sep.noRujukan || '-' }}</dd>
          <dt>No. kontrol</dt><dd class="mono">{{ doneVisit.sep.noKontrol || '-' }}</dd>
          <dt>Tanggal</dt><dd>{{ fmtTgl(doneVisit.tanggal) }}</dd>
        </dl>
      </div>
      <template #footer><button class="btn" @click="sepOpen = false">Tutup</button><button class="btn btn-primary" @click="printAs"><AppIcon name="print" /> Cetak</button></template>
    </AppModal>
  </div>
</template>

<style>
@media print {
  body.print-only > *:not(.modal-back) { display: none !important; }
  body.print-only .modal-back { position: static; background: none; padding: 0; display: block; }
  body.print-only .modal { box-shadow: none; max-width: none; max-height: none; }
  body.print-only .modal-h, body.print-only .modal-f { display: none; }
}
</style>
