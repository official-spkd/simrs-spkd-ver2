<script setup lang="ts">
// KL-04 Editor SOAP + Lampiran
const props = defineProps<{ visitId: string; editable: boolean }>()
const emit = defineEmits(['goto'])
const { db, visit, doctor, getSoap, latestVitals, signSoap } = useDb()
const toast = useToast()

const v = computed(() => visit(props.visitId))
const soap = computed(() => getSoap(props.visitId))
const locked = computed(() => !props.editable || soap.value.signed)

// ---- riwayat kiri ----
const riwayat = computed(() =>
  db.visits
    .filter((x: any) => x.patientId === v.value.patientId && x.id !== props.visitId && db.soap[x.id])
    .sort((a: any, b: any) => (a.jamDaftar < b.jamDaftar ? 1 : -1)),
)

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
watch(() => [soap.value.s, soap.value.fisik, soap.value.asesmen, soap.value.p, soap.value.tindakLanjut], touch)
let timer: any
onMounted(() => {
  timer = setInterval(() => {
    if (dirty.value && !locked.value) { dirty.value = false; savedAt.value = new Date().toISOString() }
  }, 4000)
})
onBeforeUnmount(() => clearInterval(timer))
const simpanDraf = () => { dirty.value = false; savedAt.value = new Date().toISOString(); toast.ok('Draf SOAP tersimpan') }

// ---- lampiran ----
const MAX = 10 * 1024 * 1024
const TIPE = ['application/pdf', 'image/jpeg', 'image/png']
const fileErr = ref('')
const onFile = (e: Event) => {
  const el = e.target as HTMLInputElement
  const files = Array.from(el.files || [])
  fileErr.value = ''
  for (const file of files) {
    if (!TIPE.includes(file.type)) { fileErr.value = `"${file.name}" ditolak: hanya PDF, JPG, PNG.`; continue }
    if (file.size > MAX) { fileErr.value = `"${file.name}" ditolak: melebihi 10 MB.`; continue }
    soap.value.lampiran.push({ nama: file.name, tipe: file.type, ukuran: file.size, at: new Date().toISOString() })
    toast.ok(`Lampiran ${file.name} dicatat`)
    touch()
  }
  if (fileErr.value) toast.err(fileErr.value)
  el.value = ''
}
const hapusLampiran = (i: number) => { soap.value.lampiran.splice(i, 1); touch() }

// ---- order ----
const showOrder = ref(false)
const orderTab = ref<'resep' | 'tindakan'>('resep')
const bukaOrder = (t: 'resep' | 'tindakan') => { orderTab.value = t; showOrder.value = true }
const nOrder = computed(() => (db.orders[props.visitId] || []).length)

// ---- tanda tangan ----
const showSign = ref(false)
const tandaTangan = () => {
  if (!soap.value.diagUtama) { toast.err('Minimal 1 diagnosis utama sebelum tanda tangan'); showSign.value = false; return }
  if (toast.attempt(() => signSoap(props.visitId), 'SOAP ditandatangani & dikunci')) showSign.value = false
}

// ---- addendum ----
const addendumTeks = ref('')
const tambahAddendum = () => {
  if (addendumTeks.value.trim().length < 5) { toast.err('Isi addendum minimal 5 karakter'); return }
  soap.value.addenda.push({ teks: addendumTeks.value.trim(), at: new Date().toISOString(), by: doctor(v.value.doctorId)?.nama })
  addendumTeks.value = ''
  toast.ok('Addendum ditambahkan')
}
</script>

<template>
  <div class="split">
    <!-- kiri: riwayat -->
    <div class="card">
      <h2>Riwayat SOAP pasien</h2>
      <div v-if="!riwayat.length" class="muted">Belum ada kunjungan terdahulu dengan SOAP.</div>
      <div v-else class="stack" style="gap:12px">
        <div v-for="r in riwayat" :key="r.id" style="border:1px solid var(--line);border-radius:8px;padding:10px">
          <div class="bold">{{ fmtTgl(r.tanggal) }}</div>
          <div class="muted small">{{ r.noKunjungan }}</div>
          <div v-if="db.soap[r.id].diagUtama" class="small" style="margin-top:4px"><b>{{ db.soap[r.id].diagUtama.kode }}</b> {{ db.soap[r.id].diagUtama.nama }}</div>
          <dl class="small" style="margin:6px 0 0">
            <dt class="muted">S</dt><dd style="margin:0 0 4px">{{ db.soap[r.id].s || '-' }}</dd>
            <dt class="muted">A</dt><dd style="margin:0 0 4px">{{ db.soap[r.id].asesmen || '-' }}</dd>
            <dt class="muted">P</dt><dd style="margin:0">{{ db.soap[r.id].p || '-' }}</dd>
          </dl>
        </div>
      </div>
    </div>

    <!-- kanan: SOAP hari ini -->
    <div class="stack">
      <div v-if="soap.signed" class="alert"><span>SOAP telah <b>ditandatangani</b> pada {{ fmtWaktu(soap.signedAt) }} dan terkunci. Perubahan hanya lewat addendum.</span></div>
      <div v-else-if="!editable" class="alert warn"><span>Mode baca: kunjungan tidak berstatus dilayani.</span></div>

      <div class="card">
        <div class="row between"><h2 style="margin:0">SOAP hari ini</h2>
          <span class="badge" :class="soap.signed ? 'b-ok' : 'b-warn'">{{ soap.signed ? 'Ditandatangani' : 'Draf' }}</span>
        </div>

        <div class="field" style="margin-top:14px"><label for="s-s">S — Subjektif (keluhan)</label><textarea id="s-s" v-model="soap.s" class="textarea" :disabled="locked" /></div>

        <div class="field" style="margin-top:14px"><span class="lbl">O — Objektif</span>
          <div class="alert info"><span>{{ ringkasO }}</span></div>
          <textarea v-model="soap.fisik" class="textarea" :disabled="locked" placeholder="Pemeriksaan fisik" aria-label="Pemeriksaan fisik" />
        </div>

        <div class="field" style="margin-top:14px"><span class="lbl req">A — Asesmen: diagnosis utama (ICD-10)</span>
          <div v-if="soap.diagUtama" class="row"><span class="badge b-teal" style="font-size:13px"><b>{{ soap.diagUtama.kode }}</b>&nbsp;{{ soap.diagUtama.nama }}</span><button v-if="!locked" class="btn btn-sm btn-ghost" @click="hapusUtama">Ganti</button></div>
          <div v-if="!soap.diagUtama" style="position:relative">
            <input v-model="qUtama" class="input" placeholder="Ketik kode / nama diagnosis, mis. I10 atau hipertensi" :disabled="locked" autocomplete="off" @focus="focusUtama = true" @blur="lepasFokus(0)">
            <div v-if="focusUtama && saranUtama.length" class="table-wrap" style="position:absolute;z-index:20;left:0;right:0;top:44px;max-height:240px;overflow:auto;box-shadow:var(--shadow)">
              <button v-for="i in saranUtama" :key="i.kode" type="button" class="acc-h" style="background:#fff;min-height:40px" @mousedown.prevent="pilihUtama(i)"><span><b>{{ i.kode }}</b> {{ i.nama }}</span></button>
            </div>
          </div>
          <span class="hint">Tepat satu diagnosis utama.</span>
        </div>

        <div class="field" style="margin-top:14px"><span class="lbl">Diagnosis sekunder</span>
          <div class="row"><span v-for="d in soap.diagSekunder" :key="d.kode" class="badge b-navy"><b>{{ d.kode }}</b>&nbsp;{{ d.nama }}<button v-if="!locked" type="button" class="modal-x" style="font-size:16px;padding:0 0 0 6px" :aria-label="'Hapus ' + d.kode" @click="hapusSek(d.kode)">×</button></span></div>
          <div style="position:relative">
            <input v-model="qSek" class="input" placeholder="Tambah diagnosis sekunder" :disabled="locked" autocomplete="off" @focus="focusSek = true" @blur="lepasFokus(1)">
            <div v-if="focusSek && saranSek.length" class="table-wrap" style="position:absolute;z-index:20;left:0;right:0;top:44px;max-height:240px;overflow:auto;box-shadow:var(--shadow)">
              <button v-for="i in saranSek" :key="i.kode" type="button" class="acc-h" style="background:#fff;min-height:40px" @mousedown.prevent="pilihSek(i)"><span><b>{{ i.kode }}</b> {{ i.nama }}</span></button>
            </div>
          </div>
        </div>

        <div class="field" style="margin-top:14px"><label for="s-a">Teks asesmen</label><textarea id="s-a" v-model="soap.asesmen" class="textarea" :disabled="locked" /></div>

        <div class="field" style="margin-top:14px"><label for="s-p">P — Rencana</label><textarea id="s-p" v-model="soap.p" class="textarea" :disabled="locked" /></div>
        <div class="row" style="margin-top:10px">
          <button class="btn" :disabled="locked" @click="bukaOrder('resep')">+ Tambah resep</button>
          <button class="btn" :disabled="locked" @click="bukaOrder('tindakan')">+ Tambah tindakan</button>
          <button class="btn btn-ghost" @click="emit('goto', 'order')">{{ nOrder }} order — lihat daftar</button>
        </div>

        <div class="field" style="margin-top:14px"><span class="lbl">Tindak lanjut</span>
          <div class="seg">
            <button v-for="o in [['pulang', 'Pulang'], ['kontrol', 'Kontrol'], ['rawat inap', 'Rujuk rawat inap'], ['ICU', 'Rujuk ICU']]" :key="o[0]" type="button" :class="{ on: soap.tindakLanjut === o[0] }" :disabled="locked" @click="soap.tindakLanjut = o[0]">{{ o[1] }}</button>
          </div>
          <span v-if="['rawat inap', 'ICU'].includes(soap.tindakLanjut)" class="hint">Rujuk rawat inap/ICU hanya dicatat di MVP.</span>
        </div>
      </div>

      <div class="card">
        <h2>Lampiran</h2>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple :disabled="locked" aria-label="Unggah lampiran" @change="onFile">
        <p class="hint">PDF / JPG / PNG, maksimal 10 MB. Di MVP hanya metadata berkas yang dicatat.</p>
        <p v-if="fileErr" class="err-text">{{ fileErr }}</p>
        <ul v-if="soap.lampiran.length" style="padding-left:18px;margin:10px 0 0">
          <li v-for="(l, i) in soap.lampiran" :key="i">{{ l.nama }} <span class="muted small">· {{ (l.ukuran / 1024).toFixed(0) }} KB</span> <button v-if="!locked" class="btn btn-sm btn-ghost" @click="hapusLampiran(i)">Hapus</button></li>
        </ul>
      </div>

      <div v-if="soap.signed" class="card">
        <h2>Addendum</h2>
        <div v-if="!soap.addenda.length" class="muted">Belum ada addendum.</div>
        <div v-for="(a, i) in soap.addenda" :key="i" class="alert info" style="margin-bottom:8px"><span><b>{{ fmtWaktu(a.at) }}</b> — {{ a.teks }}</span></div>
        <div class="field" style="margin-top:10px"><label for="ad">Tambah addendum</label><textarea id="ad" v-model="addendumTeks" class="textarea" /></div>
        <div class="row" style="margin-top:10px"><button class="btn btn-primary" @click="tambahAddendum">Simpan addendum</button></div>
      </div>

      <div v-if="!soap.signed" class="card">
        <div class="row between">
          <span class="muted small" aria-live="polite">{{ savedAt ? 'Draf tersimpan ' + fmtJam(savedAt) : dirty ? 'Perubahan belum disimpan…' : 'Draf otomatis tiap 4 detik' }}</span>
          <div class="row">
            <button class="btn" :disabled="locked" @click="simpanDraf">Simpan draf</button>
            <button class="btn btn-primary" :disabled="locked" @click="showSign = true">Tanda tangani & kunci</button>
          </div>
        </div>
      </div>
    </div>

    <KlOrderModal v-model="showOrder" :visit-id="visitId" :initial-tab="orderTab" />

    <AppModal v-model="showSign" title="Tanda tangani & kunci SOAP">
      <p>Setelah ditandatangani, SOAP dan order tidak dapat diubah (hanya addendum).</p>
      <p v-if="soap.diagUtama" style="margin-top:8px">Diagnosis utama: <b>{{ soap.diagUtama.kode }} — {{ soap.diagUtama.nama }}</b></p>
      <div v-else class="alert err" style="margin-top:8px"><span>Diagnosis utama belum dipilih.</span></div>
      <template #footer>
        <button class="btn" @click="showSign = false">Batal</button>
        <button class="btn btn-primary" @click="tandaTangan">Tanda tangani</button>
      </template>
    </AppModal>
  </div>
</template>
