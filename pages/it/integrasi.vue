<script setup lang="ts">
// IT-05 Status Integrasi & Antrian Kirim — wujud "dual storage": data selalu tersimpan lokal dulu, pengiriman lewat outbox.
// Satu Sehat / VClaim / Antrol V2 adalah simulasi (mock); produksi terkunci tanpa kredensial valid.
const { db, patient, poli } = useDb()
const { payloadOf } = useAdmin()
const { ringkasSs, retry, ujiKoneksi, segarkan, antrolTasks, retryTask, antrolJson } = useIt()
const toast = useToast()
const MAKS = 5

const ss = computed(() => ringkasSs())
const ssOk = computed(() => db.integrasi.satuSehat.status === 'online')

// ---- outbox ----
const fAsal = ref('')
const fStatus = ref('')
const fTgl = ref(todayStr())
const tglOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const rows = computed(() => db.outbox
  .filter((o: any) => (!fAsal.value || asalOutbox(o) === fAsal.value) && (!fStatus.value || o.status === fStatus.value) && (!fTgl.value || tglOf(o.at) === fTgl.value))
  .slice().sort((a: any, b: any) => (a.at < b.at ? 1 : -1)))
const pilih = ref<string[]>([])
const bisaRetry = (o: any) => o.status !== 'terkirim'
const semua = computed({
  get: () => rows.value.filter(bisaRetry).length > 0 && rows.value.filter(bisaRetry).every((o: any) => pilih.value.includes(o.id)),
  set: (v: boolean) => (pilih.value = v ? rows.value.filter(bisaRetry).map((o: any) => o.id) : []),
})
const kirim = (ids: string[]) => {
  const n = retry(ids)
  pilih.value = pilih.value.filter((x) => !ids.includes(x))
  n ? toast.ok(`${n} paket dikirim ulang · terkirim (mock)`) : toast.warn('Tidak ada paket yang perlu dikirim ulang')
}
const dlq = computed(() => db.outbox.filter((o: any) => o.status === 'gagal'))
const selDlq = ref('')
const dlqAktif = computed(() => dlq.value.find((o: any) => o.id === selDlq.value) || dlq.value[0])
const statusLabel = (o: any) => (o.status === 'gagal' ? 'gagal · DLQ' : o.status)
const statusCls = (o: any) => (o.status === 'gagal' ? 'b-err' : o.status === 'antrian' ? 'b-warn' : 'b-ok')

// ---- payload ----
const payload = ref<any>(null)
const lihat = (o: any) => {
  const ep = o.modul === 'VClaim' ? '/SEP/2.0/insert' : o.modul === 'BPJS Antrol' ? '/antrean/updatewaktu' : o.modul === 'BPJS HFIS' ? '/jadwaldokter/updatejadwaldokter' : '/fhir-r4/v1/' + o.resource
  payload.value = { o, json: JSON.stringify({ endpoint: ep, mode: 'MOCK', percobaan: `${o.percobaan} / ${MAKS}`, galat: o.galat || undefined, body: payloadOf(o) }, null, 2) }
}

// ---- mode koneksi ----
const uji = ref<any>(null)
const jalankanUji = () => { uji.value = ujiKoneksi(); toast.ok(`Uji koneksi mock berhasil · ${uji.value.ms} ms`) }

// ---- tab integrasi per kunjungan ----
const tab = ref('antrol')
const kunjungan = computed(() => db.visits.filter((v: any) => v.tanggal === todayStr() && v.status !== 'dibatalkan'))
const kunjBpjs = computed(() => kunjungan.value.filter((v: any) => v.penjamin === 'BPJS'))
const opsiKunj = computed(() => (tab.value === 'satusehat' ? kunjungan.value : kunjBpjs.value))
const selV = ref('')
const vAktif = computed(() => opsiKunj.value.find((v: any) => v.id === selV.value) || opsiKunj.value.find((v: any) => v.taskBpjs?.[6]) || opsiKunj.value[0])
watch(tab, () => (selV.value = ''))
const pAktif = computed(() => (vAktif.value ? patient(vAktif.value.patientId) : null))
const tasks = computed(() => (vAktif.value ? antrolTasks(vAktif.value) : []))
const selTask = ref(0)
const taskTarget = computed(() => tasks.value.find((x) => x.n === selTask.value) || tasks.value.find((x) => x.status === 'gagal'))
const rTask = (n: number) => { if (toast.attempt(() => retryTask(vAktif.value, n))) toast.ok(`Task ID ${n} dikirim ulang · terkirim (mock)`) }
const showJson = ref(true)
const ssKunj = computed(() => (vAktif.value ? db.outbox.filter((o: any) => o.modul === 'Satu Sehat' && (o.ref === vAktif.value.noKunjungan || o.ref === pAktif.value?.rm)) : []))
</script>

<template>
  <div>
    <PageHead code="IT-05" role="IT" title="Status Integrasi & Antrian Kirim" subtitle="Pemantauan endpoint, outbox, dan dead-letter queue · Data lokal adalah sumber utama" />

    <div class="grid g3">
      <div class="kl-kpi"><small>Satu Sehat</small><b>{{ ssOk ? 'Terhubung' : 'Terputus' }}</b><span>Token berakhir {{ fmtTglJam(db.integrasi.satuSehat.tokenExpiry) }}</span></div>
      <div class="kl-kpi"><small>BPJS VClaim</small><b>Stub / simulasi</b><span>SEP simulasi · Token mock</span></div>
      <div class="kl-kpi"><small>BPJS Antrol</small><b>Stub / simulasi</b><span>Antrean simulasi · Token mock</span></div>
    </div>

    <div class="kl-cols half" style="margin-top: 16px">
      <div class="panel">
        <h2>Mode koneksi</h2>
        <div><span class="badge b-navy">Lingkungan demo · MOCK aktif</span></div>
        <div class="kl-actions">
          <button class="btn" aria-pressed="true">Mock ✓</button>
          <button class="btn" disabled title="Membutuhkan kredensial valid dan verifikasi IT">🔒 Produksi · Terkunci</button>
          <button class="btn" @click="jalankanUji">Uji koneksi</button>
        </div>
        <p>Produksi memerlukan kredensial valid dan verifikasi IT. Peralihan tidak otomatis mengirim payload demo.</p>
        <p v-if="db.integrasi.satuSehat.lastTest" class="ok-text">✓ Uji koneksi mock berhasil · {{ fmtJamDetik(db.integrasi.satuSehat.lastTest) }}{{ uji ? ` · ${uji.ms} ms` : '' }}</p>
      </div>
      <div class="panel">
        <h2>Ringkasan kiriman</h2>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Terkirim</th><th>Antrian</th><th>Gagal / DLQ</th></tr></thead>
            <tbody><tr class="sel"><td>{{ ss.terkirim }}</td><td>{{ ss.antrian }}</td><td style="color: var(--teal-d)">{{ ss.gagal }}</td></tr></tbody>
          </table>
        </div>
        <p>{{ ss.total }} paket kunjungan hari ini · Last sync {{ ss.terakhir ? fmtJamDetik(ss.terakhir) : '-' }}</p>
        <p>Gateway QRIS / VA: stub / simulasi · bukan produksi.</p>
      </div>
    </div>

    <div class="kl-cols" style="margin-top: 16px; grid-template-columns: minmax(0, 1fr) 330px">
      <div class="panel">
        <h2>Outbox · Kiriman tersimpan lokal</h2>
        <div class="kl-filters" style="margin: 0">
          <label class="sr-only" for="o-asal">Modul</label>
          <select id="o-asal" v-model="fAsal" class="select"><option value="">Semua modul</option><option value="FO">FO · Front Office</option><option value="KL">KL · Klinis</option></select>
          <label class="sr-only" for="o-st">Status</label>
          <select id="o-st" v-model="fStatus" class="select"><option value="">Semua status</option><option value="antrian">Antrian</option><option value="terkirim">Terkirim</option><option value="gagal">Gagal · DLQ</option></select>
          <label class="sr-only" for="o-tgl">Tanggal</label>
          <input id="o-tgl" v-model="fTgl" type="date" class="input" />
        </div>
        <div class="kl-actions">
          <button class="btn btn-primary" :disabled="!pilih.length" @click="kirim(pilih)">Retry terpilih ({{ pilih.length }})</button>
          <button class="btn" @click="segarkan(); toast.ok('Outbox disegarkan')">Segarkan</button>
        </div>
        <div class="table-wrap">
          <table class="tbl rtable">
            <thead><tr><th style="width: 32px"><input v-model="semua" type="checkbox" aria-label="Pilih semua yang bisa dikirim ulang" /></th><th>Waktu</th><th>Modul / resource</th><th>Objek</th><th>Status</th><th>Percobaan</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="o in rows" :key="o.id" :class="{ sel: pilih.includes(o.id) }">
                <td data-label="Pilih"><input v-model="pilih" type="checkbox" :value="o.id" :disabled="!bisaRetry(o)" :aria-label="`Pilih ${o.resource} ${o.ref}`" /></td>
                <td data-label="Waktu">{{ fmtJamDetik(o.at) }}</td>
                <td data-label="Modul / resource">{{ asalOutbox(o) }} / {{ o.resource }}<div v-if="o.modul !== 'Satu Sehat'" class="muted small">{{ o.modul }}</div></td>
                <td data-label="Objek">{{ objekOutbox(o) }}</td>
                <td data-label="Status"><span class="badge" :class="statusCls(o)">{{ statusLabel(o) }}</span></td>
                <td data-label="Percobaan">{{ o.percobaan }} / {{ MAKS }}</td>
                <td data-label="Aksi"><template v-if="bisaRetry(o)"><button class="link" @click="kirim([o.id])">Retry</button> / </template><button class="link" @click="lihat(o)">Payload</button></td>
              </tr>
              <tr v-if="!rows.length"><td colspan="7" class="empty">Tidak ada kiriman untuk filter ini</td></tr>
            </tbody>
          </table>
        </div>
        <p class="muted">{{ rows.length }} dari {{ db.outbox.length }} paket · Payload ditampilkan terbatas sesuai izin IT.</p>
      </div>

      <div class="panel">
        <h2>DLQ · {{ dlq.length }} paket gagal</h2>
        <div><span class="badge" :class="dlq.length ? 'b-err' : 'b-ok'">{{ dlq.length ? 'Perlu tindak lanjut IT' : 'DLQ kosong' }}</span></div>
        <button v-for="o in dlq" :key="o.id" class="dlq" :class="{ on: dlqAktif?.id === o.id }" @click="selDlq = o.id">
          <b>{{ o.resource }} · {{ objekOutbox(o) }}</b>
          <span>{{ o.galat || 'Gagal dikirim' }}</span>
        </button>
        <div v-if="dlq.length" class="kl-actions">
          <button class="btn" @click="lihat(dlqAktif)">Lihat payload</button>
          <button class="btn btn-primary" @click="kirim([dlqAktif.id])">Retry satu</button>
          <button class="btn" @click="kirim(dlq.map((o: any) => o.id))">Retry semua DLQ</button>
        </div>
        <div class="guide">5 percobaan otomatis dengan backoff 1 / 2 / 4 / 8 / 16 menit. Setelah batas, kiriman masuk DLQ.</div>
      </div>
    </div>

    <div class="guide" style="margin-top: 16px">Seluruh data sudah disimpan lokal. Gangguan Satu Sehat / BPJS tidak menghalangi pendaftaran, SOAP, atau kasir. Retry tidak membuat kunjungan ganda.</div>

    <div class="panel" style="margin-top: 16px">
      <div class="kl-actions" role="tablist">
        <button v-for="t in [['satusehat', 'Satu Sehat'], ['vclaim', 'BPJS VClaim'], ['antrol', 'BPJS Antrean Online V2']]" :key="t[0]" role="tab" class="btn" :class="{ 'btn-primary': tab === t[0] }" :aria-selected="tab === t[0]" @click="tab = t[0]">{{ t[1] }}</button>
        <label class="sr-only" for="i-kunj">Kunjungan</label>
        <select id="i-kunj" v-model="selV" class="select" style="margin-left: auto; width: auto">
          <option value="">{{ vAktif ? 'Kunjungan contoh' : 'Tidak ada kunjungan' }}</option>
          <option v-for="v in opsiKunj" :key="v.id" :value="v.id">{{ v.noKunjungan }} · {{ patient(v.patientId)?.nama }}</option>
        </select>
      </div>

      <template v-if="tab === 'antrol'">
        <p class="h20">BPJS Antrean Online V2 · Task ID 1–7</p>
        <p class="muted">Mock aktif · Produksi terkunci tanpa kredensial. Seluruh status dan payload di bawah adalah simulasi, bukan API nyata.</p>
        <template v-if="vAktif">
          <p class="pl">{{ pAktif?.nama }} · RM {{ pAktif?.rm }} · {{ vAktif.noKunjungan }} · BPJS<br />Kode booking {{ vAktif.kodeBooking || '—' }} · {{ fmtTglPanjang(vAktif.tanggal).split(', ')[1] }}</p>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Task ID / Event</th><th>Waktu lokal WIB</th><th>Status kirim</th><th>Latency</th><th>Aksi demo</th></tr></thead>
              <tbody>
                <tr v-for="x in tasks" :key="x.n" :class="{ sel: taskTarget?.n === x.n }" class="click" @click="selTask = x.n">
                  <td data-label="Task ID">{{ x.n }} · {{ x.nama }}</td>
                  <td data-label="Waktu">{{ x.at ? fmtJamDetik(x.at).replace(/\./g, ':') : '—' }}</td>
                  <td data-label="Status" :class="{ 'err-cell': x.status === 'gagal' }">{{ x.label }}</td>
                  <td data-label="Latency">{{ x.latency }}</td>
                  <td data-label="Aksi"><button v-if="x.at" class="link" @click.stop="rTask(x.n)">Retry Task ID {{ x.n }}</button><span v-else class="muted">Tidak tersedia</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <template v-if="showJson">
            <p style="font-size: 16px; font-weight: 600">Log JSON BPJS · payload mock tersamar</p>
            <pre class="json-box">{{ antrolJson(vAktif) }}</pre>
          </template>
          <div class="kl-actions">
            <button class="btn btn-primary" :disabled="!taskTarget" @click="taskTarget && rTask(taskTarget.n)">Retry Task ID{{ taskTarget ? ' ' + taskTarget.n : '' }}</button>
            <button class="btn" @click="showJson = !showJson">{{ showJson ? 'Sembunyikan Log JSON BPJS' : 'Lihat Log JSON BPJS' }}</button>
          </div>
        </template>
        <p v-else class="muted">Belum ada kunjungan BPJS hari ini.</p>
        <div class="guide" style="display: block">Task yang gagal masuk DLQ setelah timeout mock; Task yang belum terjadi tidak punya timestamp atau latency. Retry idempoten per booking + Task ID, bukan kunjungan baru.<br />Dual storage asynchronous: SIMRS menyimpan event lokal dan outbox secara atomik, lalu mengirim background. Gangguan BPJS tidak memblokir pendaftaran atau pelayanan klinis.</div>
      </template>

      <template v-else-if="tab === 'vclaim'">
        <p class="h20">BPJS VClaim · SEP</p>
        <p class="muted">Stub / simulasi · SEP diterbitkan oleh simulasi lokal, bukan API VClaim nyata.</p>
        <template v-if="vAktif">
          <p class="pl">{{ pAktif?.nama }} · RM {{ pAktif?.rm }} · {{ vAktif.noKunjungan }} · Poli {{ poli(vAktif.poliId)?.nama }}</p>
          <dl class="kv">
            <dt>No. kartu</dt><dd class="mono">{{ pAktif?.noKartu || '-' }}</dd>
            <dt>Status SEP</dt><dd><span class="badge" :class="vAktif.sep?.status === 'terbit' ? 'b-ok' : 'b-warn'">{{ vAktif.sep?.status || '-' }}</span></dd>
            <dt>No. SEP</dt><dd class="mono">{{ vAktif.sep?.noSep || '—' }}</dd>
            <dt>No. rujukan</dt><dd class="mono">{{ vAktif.sep?.noRujukan || '—' }}</dd>
          </dl>
        </template>
        <p v-else class="muted">Belum ada kunjungan BPJS hari ini.</p>
      </template>

      <template v-else>
        <p class="h20">Satu Sehat · paket per kunjungan</p>
        <p class="muted">Resource FHIR dikirim asynchronous dari outbox lokal.</p>
        <template v-if="vAktif">
          <p class="pl">{{ pAktif?.nama }} · RM {{ pAktif?.rm }} · {{ vAktif.noKunjungan }} · {{ vAktif.penjamin }}</p>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Resource</th><th>Waktu</th><th>Status</th><th>Percobaan</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="o in ssKunj" :key="o.id">
                  <td data-label="Resource">{{ o.resource }}</td>
                  <td data-label="Waktu">{{ fmtJamDetik(o.at) }}</td>
                  <td data-label="Status"><span class="badge" :class="statusCls(o)">{{ statusLabel(o) }}</span></td>
                  <td data-label="Percobaan">{{ o.percobaan }} / {{ MAKS }}</td>
                  <td data-label="Aksi"><button class="link" @click="lihat(o)">Payload</button></td>
                </tr>
                <tr v-if="!ssKunj.length"><td colspan="5" class="empty">Belum ada paket untuk kunjungan ini</td></tr>
              </tbody>
            </table>
          </div>
        </template>
      </template>
    </div>

    <AppModal :model-value="!!payload" title="Payload pengiriman (simulasi)" size="lg" @update:model-value="payload = null">
      <p class="muted small" style="margin-bottom: 8px">{{ payload?.o.modul }} · {{ payload?.o.resource }} · {{ payload?.o.ref }} · dibangun dari data lokal.</p>
      <pre class="json-box">{{ payload?.json }}</pre>
      <template #footer>
        <button v-if="payload && bisaRetry(payload.o)" class="btn" @click="kirim([payload.o.id]); payload = null">Retry</button>
        <button class="btn btn-primary" @click="payload = null">Tutup</button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.h20 { font-size: 20px !important; font-weight: 600; color: var(--navy); }
.pl { font-size: 14px !important; font-weight: 600; }
.ok-text { color: var(--ok); font-weight: 600; }
.err-cell { color: var(--err); font-weight: 600; }
.dlq { display: flex; flex-direction: column; gap: 4px; text-align: left; border: 1px solid var(--line); background: #fafcfd; border-radius: 8px; padding: 12px; font: inherit; font-size: 13px; line-height: 1.45; cursor: pointer; color: var(--text); }
.dlq.on { border-color: var(--teal); background: var(--teal-l); }
</style>
