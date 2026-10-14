<script setup lang="ts">
const { db } = useDb()
const { setIntegrasiMode, refreshToken, resendOutbox, payloadOf } = useAdmin()
const toast = useToast()
const BACKOFF = [1, 2, 4, 8, 16]
const fStatus = ref('')
const rows = computed(() => db.outbox.filter((o: any) => !fStatus.value || o.status === fStatus.value))
const gagal = computed(() => db.outbox.filter((o: any) => o.status === 'gagal'))
const hitung = (s: string) => db.outbox.filter((o: any) => o.status === s).length

const kartu = computed(() => Object.entries(db.integrasi).map(([key, v]: any) => ({ key, ...v })))
const sisaToken = (iso: string | null) => {
  if (!iso) return 0
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}
const ubahMode = (k: any, mode: string) => {
  if (k.mode === mode) return
  if (mode === 'produksi' && !confirm(`Beralih ke mode PRODUKSI untuk ${k.nama}? Data nyata akan dikirim ke endpoint eksternal.`)) return
  setIntegrasiMode(k.key, mode)
  toast.ok(`${k.nama}: mode ${mode}`)
}
const token = (k: any) => {
  if (k.status === 'ditunda') return toast.warn(`${k.nama} ditunda; belum ada token`)
  refreshToken(k.key)
  toast.ok(`Token ${k.nama} diperbarui`)
}
const kirim = (o: any) => { resendOutbox([o.id]); toast.ok(`${o.resource} ${o.ref} dikirim ulang: terkirim`) }
const kirimMassal = () => {
  const ids = gagal.value.map((o: any) => o.id)
  if (!ids.length) return toast.warn('Tidak ada pengiriman gagal')
  resendOutbox(ids)
  toast.ok(`${ids.length} pengiriman gagal dikirim ulang`)
}
const kirimAntrian = () => {
  const ids = db.outbox.filter((o: any) => o.status === 'antrian').map((o: any) => o.id)
  if (!ids.length) return toast.warn('Tidak ada antrian')
  resendOutbox(ids)
  toast.ok(`${ids.length} antrian dikirim`)
}
const payload = ref<any>(null)
const lihat = (o: any) => { payload.value = { o, json: JSON.stringify({ endpoint: o.modul === 'VClaim' ? '/SEP/2.0/insert' : '/fhir-r4/v1/' + o.resource, mode: db.integrasi[o.modul === 'VClaim' ? 'vclaim' : 'satuSehat'].mode, body: payloadOf(o) }, null, 2) } }
const statusInt = (s: string) => (s === 'online' ? 'online' : s)
</script>

<template>
  <div>
    <PageHead code="IT-05" role="IT / Superadmin" title="Status Integrasi & Antrian Kirim" subtitle="Kesehatan endpoint, outbox pengiriman, dan daftar gagal (DLQ).">
      <template #actions>
        <button class="btn" @click="kirimAntrian">Kirim antrian ({{ hitung('antrian') }})</button>
        <button class="btn btn-primary" @click="kirimMassal">Kirim ulang semua gagal ({{ gagal.length }})</button>
      </template>
    </PageHead>

    <div class="grid g3" style="margin-bottom: 16px">
      <div v-for="k in kartu" :key="k.key" class="card">
        <div class="row between"><h3>{{ k.nama }}</h3><StatusBadge :value="statusInt(k.status)" /></div>
        <dl class="kv" style="margin-top: 12px">
          <dt>Mode</dt>
          <dd>
            <div class="seg" role="group" :aria-label="'Mode ' + k.nama">
              <button :class="{ on: k.mode === 'mock' }" @click="ubahMode(k, 'mock')">Mock</button>
              <button :class="{ on: k.mode === 'produksi' }" @click="ubahMode(k, 'produksi')">Produksi</button>
            </div>
          </dd>
          <dt>Token</dt>
          <dd>
            <template v-if="k.tokenExpiry">berakhir {{ fmtJam(k.tokenExpiry) }} <span class="muted small">({{ sisaToken(k.tokenExpiry) > 0 ? sisaToken(k.tokenExpiry) + ' menit lagi' : 'kedaluwarsa' }})</span></template>
            <span v-else class="muted">-</span>
          </dd>
          <dt>Catatan</dt>
          <dd class="small">{{ k.status === 'stub' ? 'Stub: respons disimulasikan' : k.status === 'ditunda' ? 'Ditunda pada MVP' : 'Endpoint merespons normal' }}</dd>
        </dl>
        <div class="row" style="margin-top: 12px"><button class="btn btn-sm" @click="token(k)">Perbarui token</button></div>
      </div>
    </div>

    <div class="alert info" style="margin-bottom: 16px">
      <div>
        <b>Dual storage:</b> setiap simpan ditulis ke database lokal terlebih dahulu, lalu diantrekan ke outbox untuk dikirim ke Satu Sehat / BPJS. Gangguan integrasi tidak menghentikan loket, poli, atau kasir.<br />
        <b>Backoff:</b> percobaan ulang otomatis setelah 1 / 2 / 4 / 8 / 16 menit (5 kali). Bila tetap gagal, masuk DLQ dan IT mendapat notifikasi.
      </div>
    </div>

    <div class="card" style="margin-bottom: 16px">
      <div class="row between" style="margin-bottom: 12px">
        <h2 style="margin: 0">Antrian kirim (outbox)</h2>
        <div class="field"><label class="hidden" for="ob-st">Filter status</label>
          <select id="ob-st" v-model="fStatus" class="select">
            <option value="">Semua status ({{ db.outbox.length }})</option>
            <option value="antrian">Antrian ({{ hitung('antrian') }})</option>
            <option value="terkirim">Terkirim ({{ hitung('terkirim') }})</option>
            <option value="gagal">Gagal ({{ hitung('gagal') }})</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table class="tbl rtable">
          <thead><tr><th>Waktu</th><th>Modul</th><th>Resource</th><th>Referensi</th><th>Status</th><th class="right">Percobaan</th><th>Galat</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="o in rows" :key="o.id">
              <td data-label="Waktu">{{ fmtJam(o.at) }}</td>
              <td data-label="Modul">{{ o.modul }}</td>
              <td data-label="Resource"><b>{{ o.resource }}</b></td>
              <td data-label="Referensi" class="mono">{{ o.ref }}</td>
              <td data-label="Status"><StatusBadge :value="o.status" /></td>
              <td data-label="Percobaan" class="right">ke-{{ o.percobaan }}<span v-if="o.status === 'antrian' && o.percobaan < 5" class="muted small"> · coba lagi {{ BACKOFF[Math.min(o.percobaan, 4)] }} mnt</span></td>
              <td data-label="Galat" class="small">{{ o.galat || '-' }}</td>
              <td data-label="Aksi">
                <div class="row" style="gap: 6px">
                  <button class="btn btn-sm" :disabled="o.status === 'terkirim'" @click="kirim(o)">Kirim ulang</button>
                  <button class="btn btn-sm" @click="lihat(o)">Payload</button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length"><td colspan="8" class="empty">Tidak ada data</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="row between"><h2 style="margin: 0">Daftar gagal (DLQ)</h2><span class="badge b-err">{{ gagal.length }} item</span></div>
      <div v-if="gagal.length" class="stack" style="margin-top: 12px; gap: 8px">
        <div v-for="o in gagal" :key="o.id" class="row between" style="border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px">
          <div><b>{{ o.modul }} · {{ o.resource }}</b> <span class="mono muted">{{ o.ref }}</span><div class="small err-text">{{ o.galat }} · {{ o.percobaan }} percobaan</div></div>
          <div class="row" style="gap: 6px"><button class="btn btn-sm" @click="lihat(o)">Payload</button><button class="btn btn-sm btn-primary" @click="kirim(o)">Kirim ulang</button></div>
        </div>
      </div>
      <p v-else class="muted" style="margin-top: 10px">DLQ kosong.</p>
    </div>

    <AppModal :model-value="!!payload" title="Payload pengiriman (simulasi)" size="lg" @update:model-value="payload = null">
      <p class="muted small" style="margin-bottom: 8px">{{ payload?.o.resource }} · {{ payload?.o.ref }} · hanya simulasi FHIR dari data lokal.</p>
      <pre class="mono small" style="background: #f4f8fa; border: 1px solid var(--line); border-radius: 8px; padding: 12px; overflow: auto; max-height: 55vh; margin: 0">{{ payload?.json }}</pre>
      <template #footer><button class="btn btn-primary" @click="payload = null">Tutup</button></template>
    </AppModal>
  </div>
</template>
