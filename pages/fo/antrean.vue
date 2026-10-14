<script setup lang="ts">
// FO-07 Pemanggilan Antrean Loket — langsung dari server (/api/v1/counters, /api/v1/queues)
const { lokets, loketId, loket, aktif, menunggu, log, poll, next, serve, recall, skip, complete } = useCounters()
const toast = useToast()
const loadErr = poll()

const lain = computed(() => lokets.value.filter((l) => l.id !== loketId.value))
const busy = ref(false)
const run = async (fn: () => Promise<any>, okMsg: (t: any) => string) => {
  busy.value = true
  try { toast.ok(okMsg(await fn())) } catch (e: any) { toast.err(e.message) } finally { busy.value = false }
}

const panggil = () => run(next, (t) => `Memanggil ${t.nomor} ke ${loket.value?.nama}`)
const hadir = () => run(serve, (t) => `${t.nomor} sedang dilayani`)
const ulang = () => run(recall, () => 'Panggilan diulang')
const lewati = () => run(skip, () => 'Nomor dilewati')
const selesai = () => run(complete, () => 'Pelayanan loket selesai')
</script>

<template>
  <div>
    <PageHead code="FO-07" role="Front Office" title="Pemanggilan Antrean Loket" subtitle="Dua loket tidak dapat memanggil nomor yang sama. Setiap aksi tercatat dan tampil di layar TV.">
      <template #actions><NuxtLink to="/kunjungan/baru" class="btn">Daftarkan kunjungan</NuxtLink></template>
    </PageHead>

    <p v-if="loadErr" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat antrean dari server: {{ loadErr }}</p>

    <div class="row" style="margin-bottom: 16px">
      <span class="lbl">Loket</span>
      <div class="seg" role="group" aria-label="Pilih loket">
        <button v-for="l in lokets" :key="l.id" type="button" :class="{ on: loketId === l.id }" :disabled="!l.aktif" :title="l.aktif ? '' : 'Loket nonaktif'" @click="loketId = l.id">{{ l.nama }}</button>
      </div>
      <span v-for="l in lain" :key="l.id" class="muted small">{{ l.nama }}: <b>{{ !l.aktif ? 'nonaktif' : l.current ? l.current.nomor : 'kosong' }}</b></span>
    </div>

    <div class="split-r">
      <div class="stack">
        <div class="card" style="text-align: center">
          <div class="muted">{{ aktif?.raw === 'SERVING' ? 'Sedang dilayani' : 'Sedang dipanggil' }} · {{ loket?.nama || '-' }}</div>
          <div class="bignum" style="font-size: clamp(56px, 12vw, 110px)">{{ aktif ? aktif.nomor : '-' }}</div>
          <template v-if="aktif">
            <div class="row" style="justify-content: center"><StatusBadge :value="aktif.status" /><span class="muted">diambil {{ fmtJam(aktif.jam) }}<template v-if="aktif.dipanggil > 1"> · dipanggil {{ aktif.dipanggil }}×</template></span></div>
            <div v-if="aktif.nama" style="margin-top: 8px"><b>{{ aktif.nama }}</b> <span class="muted mono">{{ aktif.rm }}</span><div class="muted small">{{ aktif.poli }} · {{ aktif.dokter }}<template v-if="aktif.nomorPoli"> · antrean poli {{ aktif.nomorPoli }}</template></div></div>
          </template>
          <p v-else class="muted">Belum ada nomor yang dipanggil.</p>
          <div class="row" style="justify-content: center; margin-top: 18px">
            <button class="btn btn-primary btn-lg" :disabled="busy || !loket?.aktif || !!aktif" :title="aktif ? 'Selesaikan atau lewati nomor saat ini dulu' : ''" @click="panggil">Panggil berikutnya</button>
            <button v-if="aktif?.raw === 'CALLING'" class="btn btn-lg" :disabled="busy" @click="hadir">Pasien hadir</button>
            <button class="btn btn-lg" :disabled="busy || aktif?.raw !== 'CALLING'" @click="ulang">Panggil ulang</button>
            <button class="btn btn-lg" :disabled="busy || aktif?.raw !== 'CALLING'" @click="lewati">Lewati</button>
            <button class="btn btn-lg" :disabled="busy || !aktif" @click="selesai">Selesai</button>
          </div>
          <div v-if="aktif?.visitId" style="margin-top: 14px"><NuxtLink to="/fo" class="btn btn-sm btn-ghost">Lihat kunjungan {{ aktif.nomor }} di worklist</NuxtLink></div>
        </div>

        <div class="card">
          <h2>Log antrean terakhir</h2>
          <ul v-if="log.length" style="list-style: none; padding: 0; margin: 0">
            <li v-for="e in log.slice(0, 8)" :key="e.id" class="row between small" style="padding: 6px 0; border-top: 1px solid var(--line)">
              <span><b class="mono">{{ e.nomor }}</b> · <StatusBadge :value="e.status" /><template v-if="e.loketNama"> · {{ e.loketNama }}</template><template v-if="e.nama"> · {{ e.nama }}</template></span><span class="muted">{{ fmtJam(e.aksiAt) }}</span>
            </li>
          </ul>
          <p v-else class="muted">Belum ada aksi hari ini.</p>
        </div>
      </div>

      <div class="card">
        <div class="row between"><h2 style="margin: 0">Daftar menunggu</h2><span class="badge b-warn">{{ menunggu.length }} nomor</span></div>
        <div class="table-wrap" style="margin-top: 12px">
          <table class="tbl rtable">
            <thead><tr><th>Nomor</th><th>Pasien / Poli</th><th>Jam ambil</th></tr></thead>
            <tbody>
              <tr v-for="t in menunggu" :key="t.id">
                <td data-label="Nomor" class="mono bold">{{ t.nomor }}</td>
                <td data-label="Pasien">{{ t.nama || '-' }}<div class="muted small">{{ t.poli }}</div></td>
                <td data-label="Jam ambil">{{ fmtJam(t.jam) }}</td>
              </tr>
              <tr v-if="!menunggu.length"><td colspan="3" class="empty">Tidak ada antrean menunggu.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
