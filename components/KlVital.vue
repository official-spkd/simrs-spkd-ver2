<script setup lang="ts">
// KL-03 Vital Sign & Pengkajian Awal
const props = defineProps<{ visitId: string; editable: boolean }>()
const emit = defineEmits(['next', 'back'])
const { db, visit, patient, saveVitals, latestVitals } = useDb()
const { isDokter } = useDokterQueue()
const klinis = useKlinis()
const toast = useToast()

const versions = computed(() => db.vitals[props.visitId] || [])
const latest = computed(() => latestVitals(props.visitId))
// datetime-local butuh waktu lokal "YYYY-MM-DDTHH:mm"
const lokal = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}T${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}`
}
const blank = () => ({ td: '', nadi: '', rr: '', suhu: '', spo2: '', tb: '', bb: '', kesadaran: 'Compos mentis', nyeri: 0, risikoJatuh: 'tidak', levelJatuh: 'rendah', waktu: lokal(), keluhan: visit(props.visitId)?.keluhan || '', alergi: patient(visit(props.visitId).patientId).alergi || '' })
const f = reactive<any>(blank())
const alasan = ref('')
const err = ref('')

const load = () => {
  const l = latest.value
  Object.assign(f, l ? { ...blank(), ...l, waktu: lokal(l.waktu || l.at) } : blank())
  alasan.value = ''
}
load()
watch(() => props.visitId, load)
// data server tiba setelah komponen tampil (workspace memuat ulang saat dibuka)
watch(() => latest.value?.serverVersion, load)

const num = (x: any) => (x === '' || x === null || x === undefined ? NaN : Number(x))
const sistolDiastol = computed(() => {
  const m = String(f.td || '').match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/)
  return m ? [Number(m[1]), Number(m[2])] : null
})
const bmi = computed(() => {
  const tb = num(f.tb), bb = num(f.bb)
  return tb > 0 && bb > 0 ? Math.round((bb / Math.pow(tb / 100, 2)) * 10) / 10 : null
})
// pesan abnormal: '' = normal
const abn = computed(() => {
  const sd = sistolDiastol.value
  const nadi = num(f.nadi), rr = num(f.rr), suhu = num(f.suhu), spo2 = num(f.spo2)
  const atas = 'Di atas rentang rujukan · perlu evaluasi', bawah = 'Di bawah rentang rujukan · perlu evaluasi'
  return {
    td: !sd ? '' : sd[0] >= 140 || sd[1] >= 90 ? atas : sd[0] <= 90 || sd[1] <= 60 ? bawah : '',
    nadi: isNaN(nadi) ? '' : nadi > 100 ? atas : nadi < 60 ? bawah : '',
    rr: isNaN(rr) ? '' : rr > 20 ? atas : rr < 12 ? bawah : '',
    suhu: isNaN(suhu) ? '' : suhu >= 37.5 ? atas : suhu < 36 ? bawah : '',
    spo2: !isNaN(spo2) && spo2 < 95 ? bawah : '',
    bmi: bmi.value === null ? '' : bmi.value > 25 ? atas : bmi.value < 18.5 ? bawah : '',
  }
})
const NYERI = ['tidak nyeri', 'ringan', 'ringan', 'ringan', 'sedang', 'sedang', 'sedang', 'berat', 'berat', 'berat', 'sangat berat']

const isCorrection = computed(() => versions.value.length > 0)
const validate = () => {
  if (!sistolDiastol.value) return 'Tekanan darah harus berformat sistol/diastol, mis. 120/80'
  for (const [k, lbl] of [['nadi', 'Nadi'], ['rr', 'RR'], ['suhu', 'Suhu'], ['spo2', 'SpO2']] as const) {
    if (isNaN(num(f[k]))) return `${lbl} wajib diisi`
  }
  if (num(f.spo2) > 100) return 'SpO2 maksimal 100'
  if (!f.tb !== !f.bb) return 'Tinggi dan berat badan diisi bersamaan'
  if (visit(props.visitId)?.tipe === 'baru' && !(f.tb && f.bb)) return 'Pasien baru: tinggi dan berat badan wajib diisi'
  if (!String(f.keluhan || '').trim()) return 'Keluhan utama wajib diisi'
  if (isCorrection.value && !alasan.value.trim()) return 'Koreksi wajib menyertakan alasan'
  return ''
}
const menyimpan = ref(false)
const simpan = async (lanjut = false) => {
  err.value = validate()
  if (err.value) { toast.err(err.value); return false }
  const data = { ...f, nadi: num(f.nadi), rr: num(f.rr), suhu: num(f.suhu), spo2: num(f.spo2), tb: num(f.tb) || null, bb: num(f.bb) || null, nyeri: num(f.nyeri), bmi: bmi.value, waktu: new Date(f.waktu).toISOString() }
  const koreksi = isCorrection.value
  menyimpan.value = true
  try {
    // akun dokter ke server (server menghitung BMI & menandai nilai abnormal); role lain tetap lokal
    if (isDokter.value) { await klinis.simpanVital(props.visitId, data, alasan.value); load() }
    else saveVitals(props.visitId, data, alasan.value)
  } catch (e: any) {
    err.value = e.message
    toast.err(e.message)
    return false
  } finally {
    menyimpan.value = false
  }
  toast.ok(koreksi ? 'Koreksi vital sign tersimpan sebagai versi baru' : 'Vital sign tersimpan — status antrean: vital selesai')
  alasan.value = ''
  if (lanjut) emit('next')
  return true
}
// "Lanjut ke SOAP": simpan dulu bila ada isian baru, lalu pindah tab
const berubah = computed(() => {
  const l = latest.value
  if (!l) return !!(f.td || f.nadi || f.rr || f.suhu || f.spo2)
  return ['td', 'nadi', 'rr', 'suhu', 'spo2', 'tb', 'bb', 'kesadaran', 'nyeri', 'risikoJatuh', 'levelJatuh', 'keluhan', 'alergi'].some((k) => String(f[k] ?? '') !== String(l[k] ?? ''))
})
const lanjut = () => (props.editable && berubah.value ? simpan(true) : emit('next'))
</script>

<template>
  <div class="kl-col">
    <div class="kl-cols half">
      <div class="panel">
        <h2>Tanda vital</h2>
        <div class="form-grid">
          <div class="field"><label class="req" for="v-td" :style="abn.td ? 'color:var(--err)' : ''">Tekanan darah · mmHg</label><input id="v-td" v-model="f.td" class="input" :class="{ err: abn.td }" :style="abn.td ? 'color:var(--err)' : ''" :disabled="!editable" placeholder="120/80" inputmode="numeric"><span v-if="abn.td" class="err-text">{{ abn.td }}</span></div>
          <div class="field"><label class="req" for="v-nadi" :style="abn.nadi ? 'color:var(--err)' : ''">Nadi · bpm</label><input id="v-nadi" v-model="f.nadi" class="input" :class="{ err: abn.nadi }" :disabled="!editable" type="number" inputmode="numeric"><span v-if="abn.nadi" class="err-text">{{ abn.nadi }}</span></div>
          <div class="field"><label class="req" for="v-rr" :style="abn.rr ? 'color:var(--err)' : ''">RR · x/menit</label><input id="v-rr" v-model="f.rr" class="input" :class="{ err: abn.rr }" :disabled="!editable" type="number" inputmode="numeric"><span v-if="abn.rr" class="err-text">{{ abn.rr }}</span></div>
          <div class="field"><label class="req" for="v-suhu" :style="abn.suhu ? 'color:var(--err)' : ''">Suhu · °C</label><input id="v-suhu" v-model="f.suhu" class="input" :class="{ err: abn.suhu }" :disabled="!editable" type="number" step="0.1" inputmode="decimal"><span v-if="abn.suhu" class="err-text">{{ abn.suhu }}</span></div>
          <div class="field"><label class="req" for="v-spo2" :style="abn.spo2 ? 'color:var(--err)' : ''">SpO₂ · %</label><input id="v-spo2" v-model="f.spo2" class="input" :class="{ err: abn.spo2 }" :disabled="!editable" type="number" inputmode="numeric"><span v-if="abn.spo2" class="err-text">{{ abn.spo2 }}</span></div>
          <div class="field"><label for="v-tb">Tinggi badan · cm</label><input id="v-tb" v-model="f.tb" class="input" :disabled="!editable" type="number" inputmode="numeric"></div>
          <div class="field"><label for="v-bb">Berat badan · kg</label><input id="v-bb" v-model="f.bb" class="input" :disabled="!editable" type="number" step="0.1" inputmode="decimal"></div>
          <div class="field"><label :style="abn.bmi ? 'color:var(--err)' : ''">BMI · otomatis</label>
            <div class="input" :class="{ err: abn.bmi }" style="display:flex;align-items:center;background:#f5f8fa" :style="abn.bmi ? 'color:var(--err)' : ''">{{ bmi === null ? '-' : String(bmi).replace('.', ',') + ' kg/m²' }}</div>
          </div>
        </div>
        <div><span class="badge b-teal">BMI dihitung dari TB dan BB</span></div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Pengkajian awal</h2>
          <div class="form-grid">
            <div class="field"><label for="v-kes">Kesadaran</label>
              <select id="v-kes" v-model="f.kesadaran" class="select" :disabled="!editable">
                <option>Compos mentis</option><option>Apatis</option><option>Delirium</option><option>Somnolen</option><option>Sopor</option><option>Koma</option>
              </select>
            </div>
            <div class="field"><label for="v-nyeri">Skala nyeri · 0–10</label>
              <select id="v-nyeri" v-model.number="f.nyeri" class="select" :disabled="!editable">
                <option v-for="(l, n) in NYERI" :key="n" :value="n">{{ n }} · {{ l }}</option>
              </select>
            </div>
            <div class="field"><label for="v-jatuh">Risiko jatuh</label>
              <select id="v-jatuh" v-model="f.risikoJatuh" class="select" :disabled="!editable"><option value="tidak">Tidak</option><option value="ya">Ya</option></select>
            </div>
            <div v-if="f.risikoJatuh === 'ya'" class="field"><label class="req" for="v-jatuh-lv">Tingkat risiko jatuh</label>
              <select id="v-jatuh-lv" v-model="f.levelJatuh" class="select" :disabled="!editable"><option value="rendah">Rendah</option><option value="sedang">Sedang</option><option value="tinggi">Tinggi</option></select>
            </div>
            <div class="field"><label for="v-waktu">Waktu pengkajian</label><input id="v-waktu" v-model="f.waktu" class="input" type="datetime-local" :disabled="!editable"></div>
            <div class="field full"><label class="req" for="v-kel">Keluhan utama</label><textarea id="v-kel" v-model="f.keluhan" class="textarea" :disabled="!editable" /></div>
            <div class="field full"><label for="v-al">Riwayat alergi</label><input id="v-al" v-model="f.alergi" class="input" :disabled="!editable" placeholder="mis. Penisilin · ruam kulit"><span class="hint">Perubahan alergi langsung memperbarui banner pasien.</span></div>
          </div>
        </div>

        <div class="panel">
          <h2>Versi pengkajian</h2>
          <p v-if="latest">Versi {{ latest.ver }}<template v-if="latest.by"> · {{ latest.by }}</template> · {{ fmtJam(latest.at) }} · {{ latest.serverVersion !== undefined ? 'Tersimpan di server' : 'Tersimpan lokal' }}</p>
          <p v-else class="muted">Belum ada versi tersimpan.</p>
          <div v-if="versions.length > 1" class="muted" style="font-size: 12px">
            <div v-for="x in [...versions].reverse().slice(1)" :key="x.ver">Versi {{ x.ver }}<template v-if="x.by"> · {{ x.by }}</template> · {{ fmtTgl(x.at) }} {{ fmtJam(x.at) }}<template v-if="x.alasan"> · alasan: {{ x.alasan }}</template></div>
          </div>
          <div class="field"><label :class="{ req: isCorrection && editable }" for="v-alasan">Alasan koreksi · wajib bila mengubah data tersimpan</label><input id="v-alasan" v-model="alasan" class="input" :disabled="!editable || !isCorrection" placeholder="Tuliskan alasan untuk membuat versi baru"></div>
          <div class="guide"><AppIcon name="info" :size="18" /> Nilai abnormal ditandai merah. Koreksi tidak menimpa versi sebelumnya dan selalu tercatat audit.</div>
        </div>
      </div>
    </div>

    <p v-if="err" class="err-text">{{ err }}</p>
    <div class="kl-actions">
      <button class="btn" @click="emit('back')">Kembali</button>
      <button class="btn" :disabled="!editable || menyimpan" @click="simpan(false)">{{ isCorrection ? 'Simpan koreksi' : 'Simpan' }}</button>
      <button class="btn btn-primary" :disabled="menyimpan" @click="lanjut">Lanjut ke SOAP</button>
    </div>
  </div>
</template>
