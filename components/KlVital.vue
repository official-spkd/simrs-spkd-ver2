<script setup lang="ts">
// KL-03 Vital Sign & Pengkajian Awal
const props = defineProps<{ visitId: string; editable: boolean }>()
const emit = defineEmits(['next'])
const { db, visit, patient, saveVitals, latestVitals } = useDb()
const toast = useToast()

const versions = computed(() => db.vitals[props.visitId] || [])
const latest = computed(() => latestVitals(props.visitId))
const blank = () => ({ td: '', nadi: '', rr: '', suhu: '', spo2: '', tb: '', bb: '', kesadaran: 'Compos mentis', nyeri: 0, risikoJatuh: 'tidak', keluhan: visit(props.visitId)?.keluhan || '', alergi: patient(visit(props.visitId).patientId).alergi || '' })
const f = reactive<any>(blank())
const alasan = ref('')
const err = ref('')

const load = () => {
  const l = latest.value
  Object.assign(f, l ? { ...blank(), ...l } : blank())
  alasan.value = ''
}
load()
watch(() => props.visitId, load)

const num = (x: any) => (x === '' || x === null || x === undefined ? NaN : Number(x))
const sistolDiastol = computed(() => {
  const m = String(f.td || '').match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/)
  return m ? [Number(m[1]), Number(m[2])] : null
})
const bmi = computed(() => {
  const tb = num(f.tb), bb = num(f.bb)
  return tb > 0 && bb > 0 ? Math.round((bb / Math.pow(tb / 100, 2)) * 10) / 10 : null
})
const abn = computed(() => {
  const sd = sistolDiastol.value
  const nadi = num(f.nadi), rr = num(f.rr), suhu = num(f.suhu), spo2 = num(f.spo2)
  return {
    td: !!sd && (sd[0] >= 140 || sd[1] >= 90 || sd[0] <= 90 || sd[1] <= 60),
    nadi: !isNaN(nadi) && (nadi > 100 || nadi < 60),
    rr: !isNaN(rr) && (rr > 20 || rr < 12),
    suhu: !isNaN(suhu) && (suhu >= 37.5 || suhu < 36),
    spo2: !isNaN(spo2) && spo2 < 95,
    bmi: bmi.value !== null && (bmi.value < 18.5 || bmi.value > 25),
  }
})
const bmiLabel = computed(() => (bmi.value === null ? '-' : bmi.value < 18.5 ? 'Kurang' : bmi.value > 25 ? 'Lebih' : 'Normal'))

const isCorrection = computed(() => versions.value.length > 0)
const validate = () => {
  if (!sistolDiastol.value) return 'Tekanan darah harus berformat sistol/diastol, mis. 120/80'
  for (const [k, lbl] of [['nadi', 'Nadi'], ['rr', 'RR'], ['suhu', 'Suhu'], ['spo2', 'SpO2']] as const) {
    if (isNaN(num(f[k]))) return `${lbl} wajib diisi`
  }
  if (num(f.spo2) > 100) return 'SpO2 maksimal 100'
  if (num(f.nyeri) < 0 || num(f.nyeri) > 10) return 'Skala nyeri 0–10'
  if (isCorrection.value && !alasan.value.trim()) return 'Koreksi wajib menyertakan alasan'
  return ''
}
const simpan = (lanjut = false) => {
  err.value = validate()
  if (err.value) { toast.err(err.value); return }
  const data = { ...f, nadi: num(f.nadi), rr: num(f.rr), suhu: num(f.suhu), spo2: num(f.spo2), tb: num(f.tb) || null, bb: num(f.bb) || null, nyeri: num(f.nyeri), bmi: bmi.value }
  const ok = toast.attempt(() => saveVitals(props.visitId, data, alasan.value), isCorrection.value ? 'Koreksi vital sign tersimpan sebagai versi baru' : 'Vital sign tersimpan — status antrean: vital selesai')
  if (ok) { alasan.value = ''; if (lanjut) emit('next') }
}
</script>

<template>
  <div class="stack">
    <div v-if="latest" class="alert info"><span>Menampilkan versi {{ latest.ver }} (terakhir). Menyimpan lagi dihitung sebagai koreksi dan wajib beralasan.</span></div>
    <div class="card">
      <h2>Tanda vital</h2>
      <div class="form-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
        <div class="field"><label class="req" for="v-td">Tekanan darah (mmHg)</label><input id="v-td" v-model="f.td" class="input" :class="{ err: abn.td }" :disabled="!editable" placeholder="120/80" inputmode="numeric"><span v-if="abn.td" class="err-text">Di luar batas normal</span></div>
        <div class="field"><label class="req" for="v-nadi">Nadi (x/mnt)</label><input id="v-nadi" v-model="f.nadi" class="input" :class="{ err: abn.nadi }" :disabled="!editable" type="number" inputmode="numeric"><span v-if="abn.nadi" class="err-text">Abnormal (&gt;100 / &lt;60)</span></div>
        <div class="field"><label class="req" for="v-rr">RR (x/mnt)</label><input id="v-rr" v-model="f.rr" class="input" :class="{ err: abn.rr }" :disabled="!editable" type="number" inputmode="numeric"><span v-if="abn.rr" class="err-text">Abnormal (&gt;20 / &lt;12)</span></div>
        <div class="field"><label class="req" for="v-suhu">Suhu (°C)</label><input id="v-suhu" v-model="f.suhu" class="input" :class="{ err: abn.suhu }" :disabled="!editable" type="number" step="0.1" inputmode="decimal"><span v-if="abn.suhu" class="err-text">Abnormal (≥37,5 / &lt;36)</span></div>
        <div class="field"><label class="req" for="v-spo2">SpO2 (%)</label><input id="v-spo2" v-model="f.spo2" class="input" :class="{ err: abn.spo2 }" :disabled="!editable" type="number" inputmode="numeric"><span v-if="abn.spo2" class="err-text">Abnormal (&lt;95)</span></div>
        <div class="field"><label for="v-tb">Tinggi badan (cm)</label><input id="v-tb" v-model="f.tb" class="input" :disabled="!editable" type="number" inputmode="numeric"></div>
        <div class="field"><label for="v-bb">Berat badan (kg)</label><input id="v-bb" v-model="f.bb" class="input" :disabled="!editable" type="number" step="0.1" inputmode="decimal"></div>
        <div class="field"><label>BMI (otomatis)</label>
          <div class="input" :class="{ err: abn.bmi }" style="display:flex;align-items:center;background:#f0f4f6" :style="abn.bmi ? 'color:var(--err);font-weight:700' : ''">{{ bmi ?? '-' }} <span class="muted small" style="margin-left:8px">{{ bmiLabel }}</span></div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Pengkajian awal</h2>
      <div class="form-grid">
        <div class="field"><label for="v-kes">Kesadaran</label>
          <select id="v-kes" v-model="f.kesadaran" class="select" :disabled="!editable">
            <option>Compos mentis</option><option>Apatis</option><option>Somnolen</option><option>Sopor</option><option>Koma</option>
          </select>
        </div>
        <div class="field"><label for="v-nyeri">Skala nyeri: {{ f.nyeri }} / 10</label><input id="v-nyeri" v-model.number="f.nyeri" type="range" min="0" max="10" step="1" :disabled="!editable" style="min-height:38px;accent-color:var(--teal)"></div>
        <div class="field"><span class="lbl">Risiko jatuh</span>
          <div class="seg"><button type="button" :class="{ on: f.risikoJatuh === 'tidak' }" :disabled="!editable" @click="f.risikoJatuh = 'tidak'">Tidak</button><button type="button" :class="{ on: f.risikoJatuh === 'ya' }" :disabled="!editable" @click="f.risikoJatuh = 'ya'">Ya</button></div>
        </div>
        <div class="field"><label for="v-al">Riwayat alergi</label><input id="v-al" v-model="f.alergi" class="input" :disabled="!editable" placeholder="mis. Penisilin, Seafood"><span class="hint">Perubahan memperbarui Patient Banner.</span></div>
        <div class="field full"><label for="v-kel">Keluhan utama</label><textarea id="v-kel" v-model="f.keluhan" class="textarea" :disabled="!editable" /></div>
        <div v-if="isCorrection && editable" class="field full"><label class="req" for="v-alasan">Alasan koreksi</label><input id="v-alasan" v-model="alasan" class="input" placeholder="mis. salah ketik tekanan darah"></div>
      </div>
      <p v-if="err" class="err-text" style="margin-top:8px">{{ err }}</p>
      <div class="row" style="margin-top:16px">
        <button class="btn btn-primary" :disabled="!editable" @click="simpan(false)">{{ isCorrection ? 'Simpan koreksi' : 'Simpan' }}</button>
        <button class="btn" :disabled="!editable" @click="simpan(true)">Simpan & lanjut ke SOAP</button>
        <button class="btn btn-ghost" @click="emit('next')">Lanjut ke SOAP</button>
      </div>
    </div>

    <div v-if="versions.length" class="card">
      <h2>Riwayat versi</h2>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Versi</th><th>Waktu</th><th>TD</th><th>Nadi</th><th>RR</th><th>Suhu</th><th>SpO2</th><th>Oleh</th><th>Alasan</th></tr></thead>
          <tbody>
            <tr v-for="x in [...versions].reverse()" :key="x.ver">
              <td data-label="Versi">v{{ x.ver }}</td><td data-label="Waktu">{{ fmtJam(x.at) }}</td><td data-label="TD">{{ x.td }}</td><td data-label="Nadi">{{ x.nadi }}</td>
              <td data-label="RR">{{ x.rr }}</td><td data-label="Suhu">{{ x.suhu }}</td><td data-label="SpO2">{{ x.spo2 }}</td><td data-label="Oleh">{{ x.by }}</td><td data-label="Alasan">{{ x.alasan || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
