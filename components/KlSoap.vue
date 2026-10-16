<script setup lang="ts">
// KL-04 Editor SOAP + Lampiran
const props = defineProps<{ visitId: string; editable: boolean }>()
const emit = defineEmits(['goto'])
const { db, visit, poli, doctor, getSoap, latestVitals, signSoap } = useDb()
const { isDokter } = useDokterQueue()
const klinis = useKlinis()
const toast = useToast()

const v = computed(() => visit(props.visitId))
const soap = computed(() => getSoap(props.visitId))
const locked = computed(() => !props.editable || soap.value.signed)

// ---- SOAP sebelumnya (kiri, baca saja) ----
// Akun dokter: SOAP final terakhir dari riwayat server (semua poli/dokter); role lain: data lokal.
const riwayatServer = ref<any[]>([])
onMounted(async () => {
  if (!isDokter.value) return
  try { riwayatServer.value = await klinis.riwayat(props.visitId) } catch {}
})
const riwayatLokal = computed(() =>
  db.visits
    .filter((x: any) => x.patientId === v.value.patientId && x.id !== props.visitId && db.soap[x.id])
    .sort((a: any, b: any) => (a.jamDaftar < b.jamDaftar ? 1 : -1)),
)
// bentuk seragam: { tanggal, poliNama, dokterNama, soap, vital } — vital berbentuk lokal (td, nadi)
const prev = computed(() => {
  if (isDokter.value) {
    const x = riwayatServer.value.find((h: any) => h.soap && h.tanggal <= v.value.tanggal)
    if (!x) return null
    const vt = x.soap.vital
    return { tanggal: x.tanggal, poliNama: x.poli, dokterNama: x.dokter, soap: x.soap, vital: vt && { td: `${vt.systolic_bp}/${vt.diastolic_bp}`, nadi: vt.pulse } }
  }
  const x = riwayatLokal.value[0]
  return x ? { tanggal: x.tanggal, poliNama: poli(x.poliId)?.nama, dokterNama: doctor(x.doctorId)?.nama, soap: db.soap[x.id], vital: latestVitals(x.id) } : null
})
const prevSoap = computed(() => prev.value?.soap || null)
const prevO = computed(() => {
  if (!prev.value) return ''
  const x = prev.value.vital
  return [x ? `TD ${x.td} mmHg; nadi ${x.nadi}` : '', prevSoap.value?.fisik].filter(Boolean).join('; ') || '-'
})
const tglHariIni = computed(() => fmtTglPanjang(v.value.tanggal).replace(/^\w+, /, ''))
const jamDetik = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours(), 2)}.${pad(d.getMinutes(), 2)}.${pad(d.getSeconds(), 2)}` }

// ---- O otomatis ----
const vt = computed(() => latestVitals(props.visitId))
const ringkasO = computed(() => {
  const x = vt.value
  if (!x) return 'Vital sign belum diisi (isi di tab Vital & Pengkajian).'
  return `TD ${x.td} mmHg, nadi ${x.nadi}x/mnt, RR ${x.rr}x/mnt, suhu ${x.suhu} °C, SpO2 ${x.spo2}%` + (x.tb && x.bb ? `, TB ${x.tb} cm, BB ${x.bb} kg` + (x.bmi ? ` (BMI ${x.bmi})` : '') : '') + `, kesadaran ${x.kesadaran}, nyeri ${x.nyeri}/10.`
})

// ---- ICD-10 ----
const qUtama = ref('')
const qSek = ref('')
const focusUtama = ref(false)
const focusSek = ref(false)
const lepasFokus = (k: number) => setTimeout(() => { if (k === 0) focusUtama.value = false; else focusSek.value = false }, 150)
const saran = (q: string) => {
  const s = q.trim().toLowerCase()
  if (!s) return []
  return db.icd10.filter((i: any) => i.kode.toLowerCase().includes(s) || i.nama.toLowerCase().includes(s)).slice(0, 8)
}
const saranUtama = computed(() => saran(qUtama.value))
const saranSek = computed(() => saran(qSek.value).filter((i: any) => !soap.value.diagSekunder.some((d: any) => d.kode === i.kode) && soap.value.diagUtama?.kode !== i.kode))
const pilihUtama = (i: any) => {
  soap.value.diagUtama = { kode: i.kode, nama: i.nama }
  soap.value.diagSekunder = soap.value.diagSekunder.filter((d: any) => d.kode !== i.kode)
  qUtama.value = ''
  touch()
}
const pilihSek = (i: any) => { soap.value.diagSekunder.push({ kode: i.kode, nama: i.nama }); qSek.value = ''; touch() }
const hapusUtama = () => { soap.value.diagUtama = null; touch() }
const hapusSek = (kode: string) => { soap.value.diagSekunder = soap.value.diagSekunder.filter((d: any) => d.kode !== kode); touch() }

// ---- draf otomatis tiap 4 detik ----
const dirty = ref(false)
const savedAt = ref<string | null>(null)
const touch = () => { dirty.value = true }
watch(() => [soap.value.s, soap.value.fisik, soap.value.asesmen, soap.value.p, soap.value.tindakLanjut, soap.value.tglKontrol, soap.value.catatanRujukan], touch)
// Akun dokter: draf dikirim ke server (PUT soap-note); role lain hanya menandai waktu simpan lokal.
const menyimpan = ref(false)
const gagalSimpan = ref('')
const kirimDraf = async () => {
  if (menyimpan.value) return false
  dirty.value = false
  menyimpan.value = true
  try {
    if (isDokter.value) await klinis.simpanSoap(props.visitId)
    savedAt.value = new Date().toISOString()
    gagalSimpan.value = ''
    return true
  } catch (e: any) {
    dirty.value = true
    if (gagalSimpan.value !== e.message) toast.err(e.message)
    gagalSimpan.value = e.message
    return false
  } finally {
    menyimpan.value = false
  }
}
// autosave berhenti setelah gagal (mis. konflik versi) sampai petugas menekan "Simpan draf" lagi
let timer: any
onMounted(() => {
  timer = setInterval(() => { if (dirty.value && !locked.value && !gagalSimpan.value) kirimDraf() }, 4000)
})
onBeforeUnmount(() => { clearInterval(timer); if (dirty.value && !locked.value) kirimDraf() })
const simpanDraf = async () => { gagalSimpan.value = ''; if (await kirimDraf()) toast.ok('Draf SOAP tersimpan') }

// ---- lampiran ----
const MAX = 10 * 1024 * 1024
const TIPE = ['application/pdf', 'image/jpeg', 'image/png']
const fileErr = ref('')
const mengunggah = ref(false)
const onFile = async (e: Event) => {
  const el = e.target as HTMLInputElement
  const files = Array.from(el.files || [])
  el.value = ''
  fileErr.value = ''
  mengunggah.value = true
  for (const file of files) {
    if (!TIPE.includes(file.type)) { fileErr.value = `"${file.name}" ditolak: hanya PDF, JPG, PNG.`; continue }
    if (file.size > MAX) { fileErr.value = `"${file.name}" ditolak: melebihi 10 MB.`; continue }
    if (isDokter.value) {
      try { await klinis.unggah(props.visitId, file) } catch (err: any) { fileErr.value = `"${file.name}": ${err.message}`; continue }
      toast.ok(`Lampiran ${file.name} terunggah`)
      continue
    }
    const l = { nama: file.name, tipe: file.type, ukuran: file.size, at: new Date().toISOString() }
    simpanUrlLampiran(l, file)
    soap.value.lampiran.push(l)
    toast.ok(`Lampiran ${file.name} dicatat`)
    touch()
  }
  mengunggah.value = false
  if (fileErr.value) toast.err(fileErr.value)
}
const hapusLampiran = async (i: number) => {
  const l = soap.value.lampiran[i]
  if (!l.id) { soap.value.lampiran.splice(i, 1); touch(); return }
  try { await klinis.hapusLampiran(props.visitId, l.id); toast.ok(`Lampiran ${l.nama} dihapus`) } catch (e: any) { toast.err(e.message) }
}
const lihatLampiran = async (l: any) => {
  if (l.id) { try { await klinis.bukaLampiran(l.id) } catch (e: any) { toast.err(e.message) } return }
  if (urlLampiran(l)) window.open(urlLampiran(l), '_blank')
  else toast.warn('Pratinjau hanya tersedia pada sesi saat berkas diunggah (MVP menyimpan metadata).')
}

// ---- order ----
const showOrder = ref(false)
const orderTab = ref<'resep' | 'tindakan'>('resep')
const bukaOrder = (t: 'resep' | 'tindakan') => { orderTab.value = t; showOrder.value = true }
const nOrder = computed(() => (db.orders[props.visitId] || []).length)

// ---- tanda tangan ----
const showSign = ref(false)
const tandaTangan = async () => {
  if (!soap.value.diagUtama) { toast.err('Minimal 1 diagnosis utama sebelum tanda tangan'); showSign.value = false; return }
  if (soap.value.tindakLanjut === 'kontrol' && !soap.value.tglKontrol) { toast.err('Isi tanggal kontrol untuk tindak lanjut kontrol'); showSign.value = false; return }
  if (['rawat inap', 'ICU'].includes(soap.value.tindakLanjut) && !String(soap.value.catatanRujukan || '').trim()) { toast.err('Isi catatan rujukan'); showSign.value = false; return }
  menyimpan.value = true
  try {
    if (isDokter.value) await klinis.tandaTangan(props.visitId)
    else signSoap(props.visitId)
    dirty.value = false
    showSign.value = false
    toast.ok('SOAP ditandatangani & dikunci')
  } catch (e: any) {
    toast.err(e.message)
  } finally {
    menyimpan.value = false
  }
}

// ---- addendum ----
const addendumTeks = ref('')
const tambahAddendum = async () => {
  if (addendumTeks.value.trim().length < 5) { toast.err('Isi addendum minimal 5 karakter'); return }
  try {
    if (isDokter.value) await klinis.addendum(props.visitId, addendumTeks.value)
    else soap.value.addenda.push({ teks: addendumTeks.value.trim(), at: new Date().toISOString(), by: doctor(v.value.doctorId)?.nama })
  } catch (e: any) { toast.err(e.message); return }
  addendumTeks.value = ''
  toast.ok('Addendum ditambahkan')
}
</script>

<template>
  <div class="kl-col">
    <div class="kl-actions" style="gap: 16px">
      <span v-if="soap.signed" class="badge b-ok">SOAP ditandatangani · {{ jamDetik(soap.signedAt) }}</span>
      <template v-else>
        <span v-if="gagalSimpan" class="badge b-err" aria-live="polite">Gagal menyimpan draf · {{ gagalSimpan }}</span>
        <span v-else class="badge b-ok" aria-live="polite">{{ savedAt ? `Draf tersimpan ${isDokter ? 'di server' : 'lokal'} · ` + jamDetik(savedAt) : dirty ? 'Perubahan belum disimpan…' : 'Draf belum diubah' }}</span>
        <span class="badge b-teal">Autosave setiap 4 detik</span>
      </template>
    </div>

    <div class="kl-cols l330">
      <!-- kiri: SOAP sebelumnya -->
      <div class="kl-col">
        <div class="panel">
          <h2>SOAP sebelumnya</h2>
          <template v-if="prev && prevSoap">
            <div><span class="badge b-navy">{{ fmtTgl(prev.tanggal) }} · Baca saja</span></div>
            <p class="muted">{{ prev.poliNama }} · {{ prev.dokterNama }}</p>
            <p class="soap-sec">S · Subjektif</p><p class="soap-txt">{{ prevSoap.s || '-' }}</p>
            <p class="soap-sec">O · Objektif</p><p class="soap-txt">{{ prevO }}</p>
            <p class="soap-sec">A · Asesmen</p><p class="soap-txt">{{ prevSoap.diagUtama ? prevSoap.diagUtama.kode + ' · ' + prevSoap.diagUtama.nama : prevSoap.asesmen || '-' }}</p>
            <p class="soap-sec">P · Plan</p><p class="soap-txt">{{ prevSoap.p || '-' }}</p>
            <p v-if="prevSoap.signedAt" class="muted" style="font-size: 12px">SOAP ditandatangani {{ fmtTgl(prevSoap.signedAt) }} · {{ fmtJam(prevSoap.signedAt) }}</p>
            <div><button class="btn" @click="emit('goto', 'riwayat')">Buka detail riwayat</button></div>
          </template>
          <p v-else class="muted">Belum ada kunjungan terdahulu dengan SOAP.</p>
        </div>
        <div class="guide"><AppIcon name="info" :size="18" /> Setelah ditandatangani dan dikunci, SOAP hanya dapat ditambah melalui addendum; isi final tetap tersimpan.</div>
      </div>

      <!-- kanan: SOAP hari ini -->
      <div class="kl-col">
        <div v-if="soap.signed" class="alert"><span>SOAP telah <b>ditandatangani</b> pada {{ fmtWaktu(soap.signedAt) }} dan terkunci. Perubahan hanya lewat addendum.</span></div>
        <div v-else-if="!editable" class="alert warn"><span>Mode baca: kunjungan tidak berstatus dilayani.</span></div>

        <div class="panel">
          <h2>SOAP hari ini · {{ tglHariIni }}</h2>
          <div class="field"><label class="req" for="s-s">S · Keluhan / anamnesis</label><textarea id="s-s" v-model="soap.s" class="textarea" :disabled="locked" /></div>

          <div class="field"><label for="s-o">O · Vital otomatis + pemeriksaan fisik</label>
            <div class="alert info"><span>{{ ringkasO }}</span></div>
            <textarea id="s-o" v-model="soap.fisik" class="textarea" :disabled="locked" placeholder="Keadaan umum, pemeriksaan fisik" />
          </div>

          <div class="form-grid">
            <div class="field"><span class="lbl req">A · Diagnosis utama ICD-10</span>
              <div v-if="soap.diagUtama" class="input" style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff">
                <span>{{ soap.diagUtama.kode }} · {{ soap.diagUtama.nama }} ✓</span>
                <button v-if="!locked" type="button" class="btn btn-sm btn-ghost" @click="hapusUtama">Ganti</button>
              </div>
              <div v-else style="position:relative">
                <input v-model="qUtama" class="input" placeholder="Cari kode / nama diagnosis" :disabled="locked" autocomplete="off" aria-label="Diagnosis utama ICD-10" @focus="focusUtama = true" @blur="lepasFokus(0)">
                <div v-if="focusUtama && saranUtama.length" class="sugg">
                  <button v-for="i in saranUtama" :key="i.kode" type="button" @mousedown.prevent="pilihUtama(i)"><span><b>{{ i.kode }}</b> {{ i.nama }}</span></button>
                </div>
              </div>
            </div>
            <div class="field"><span class="lbl">Diagnosis sekunder ICD-10</span>
              <div style="position:relative">
                <input v-model="qSek" class="input" placeholder="Cari kode / nama diagnosis" :disabled="locked" autocomplete="off" aria-label="Diagnosis sekunder ICD-10" @focus="focusSek = true" @blur="lepasFokus(1)">
                <div v-if="focusSek && saranSek.length" class="sugg">
                  <button v-for="i in saranSek" :key="i.kode" type="button" @mousedown.prevent="pilihSek(i)"><span><b>{{ i.kode }}</b> {{ i.nama }}</span></button>
                </div>
              </div>
              <div v-if="soap.diagSekunder.length" class="kl-actions" style="gap:6px">
                <span v-for="d in soap.diagSekunder" :key="d.kode" class="badge b-navy">{{ d.kode }} · {{ d.nama }}<button v-if="!locked" type="button" class="modal-x" style="font-size:16px;padding:0 0 0 6px" :aria-label="'Hapus ' + d.kode" @click="hapusSek(d.kode)">×</button></span>
              </div>
            </div>
          </div>

          <div class="field"><label for="s-a">Asesmen klinis</label><textarea id="s-a" v-model="soap.asesmen" class="textarea" :disabled="locked" /></div>
          <div class="field"><label for="s-p">P · Rencana pelayanan</label><textarea id="s-p" v-model="soap.p" class="textarea" :disabled="locked" /></div>
          <div class="kl-actions">
            <button class="btn" :disabled="locked" @click="bukaOrder('resep')">Tambah resep</button>
            <button class="btn" :disabled="locked" @click="bukaOrder('tindakan')">Tambah tindakan</button>
            <button v-if="nOrder" class="btn btn-ghost" @click="emit('goto', 'order')">{{ nOrder }} order — lihat daftar</button>
          </div>

          <div class="field"><label for="s-tl">Tindak lanjut</label>
            <select id="s-tl" v-model="soap.tindakLanjut" class="select" :disabled="locked">
              <option value="pulang">Pulang</option><option value="kontrol">Kontrol</option><option value="rawat inap">Rujuk rawat inap</option><option value="ICU">Rujuk ICU</option>
            </select>
            <span class="hint">Pilihan: pulang / kontrol / rujuk rawat inap–ICU (hanya dicatat, tanpa modul rawat inap).</span>
          </div>
          <div v-if="soap.tindakLanjut === 'kontrol'" class="field"><label class="req" for="s-tk">Tanggal kontrol</label>
            <input id="s-tk" v-model="soap.tglKontrol" class="input" type="date" :min="addDays(todayStr(), 1)" :max="addDays(todayStr(), 90)" :disabled="locked">
          </div>
          <div v-if="['rawat inap', 'ICU'].includes(soap.tindakLanjut)" class="field"><label class="req" for="s-rj">Catatan rujukan</label>
            <textarea id="s-rj" v-model="soap.catatanRujukan" class="textarea" :disabled="locked" placeholder="Alasan &amp; tujuan rujukan" />
          </div>
        </div>

        <div class="panel">
          <h2>Lampiran medis</h2>
          <div class="field"><span class="lbl">Unggah lampiran</span>
            <label class="file-pick" :class="{ off: locked }">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple :disabled="locked || mengunggah" aria-label="Unggah lampiran" @change="onFile">
              {{ mengunggah ? 'Mengunggah…' : '＋ Pilih file PDF / JPG / PNG · maksimal 10 MB per file' }}
            </label>
            <p v-if="fileErr" class="err-text">{{ fileErr }}</p>
          </div>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>File</th><th>Ukuran</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-if="!soap.lampiran.length"><td class="empty" colspan="4">Belum ada lampiran.</td></tr>
                <tr v-for="(l, i) in soap.lampiran" :key="i">
                  <td data-label="File">{{ l.nama }}</td>
                  <td data-label="Ukuran">{{ (l.ukuran / 1024).toFixed(0) }} KB</td>
                  <td data-label="Status">{{ l.id ? 'Tersimpan di server' : 'Tersimpan lokal' }}</td>
                  <td data-label="Aksi"><button class="btn btn-sm btn-ghost" @click="lihatLampiran(l)">Lihat</button><button v-if="!locked" class="btn btn-sm btn-ghost" @click="hapusLampiran(Number(i))">Hapus</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="soap.signed" class="panel">
          <h2>Addendum</h2>
          <p v-if="!soap.addenda.length" class="muted">Belum ada addendum.</p>
          <div v-for="(a, i) in soap.addenda" :key="i" class="guide"><span><b>{{ fmtWaktu(a.at) }}</b> — {{ a.teks }}</span></div>
          <div class="field"><label for="ad">Tambah addendum</label><textarea id="ad" v-model="addendumTeks" class="textarea" /></div>
          <div><button class="btn btn-primary" @click="tambahAddendum">Simpan addendum</button></div>
        </div>
      </div>
    </div>

    <div v-if="!soap.signed" class="kl-actions">
      <button class="btn" :disabled="locked || menyimpan" @click="simpanDraf">Simpan draf</button>
      <button class="btn btn-primary" :disabled="locked || menyimpan" @click="showSign = true">Tanda tangani &amp; kunci</button>
    </div>

    <KlOrderModal v-model="showOrder" :visit-id="visitId" :initial-tab="orderTab" />

    <AppModal v-model="showSign" title="Tanda tangani & kunci SOAP">
      <p>Setelah ditandatangani, SOAP dan order tidak dapat diubah (hanya addendum).</p>
      <p v-if="soap.diagUtama" style="margin-top:8px">Diagnosis utama: <b>{{ soap.diagUtama.kode }} — {{ soap.diagUtama.nama }}</b></p>
      <div v-else class="alert err" style="margin-top:8px"><span>Diagnosis utama belum dipilih.</span></div>
      <div v-if="!String(soap.s || '').trim()" class="alert warn" style="margin-top:8px"><span>S · Keluhan / anamnesis masih kosong.</span></div>
      <template #footer>
        <button class="btn" @click="showSign = false">Batal</button>
        <button class="btn btn-primary" :disabled="menyimpan" @click="tandaTangan">Tanda tangani</button>
      </template>
    </AppModal>
  </div>
</template>
