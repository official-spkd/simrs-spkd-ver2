<script setup lang="ts">
// FO-07 Pemanggilan Antrean Loket — langsung dari server (/api/v1/counters, /api/v1/queues)
const { lokets, loketId, loket, aktif, tertinggal, menunggu, log, hariIni, poll, next, serve, recall, skip, complete } = useCounters()
const toast = useToast()
const loadErr = poll()

const lain = computed(() => lokets.value.filter((l) => l.id !== loketId.value))
const jmlStatus = (k: string) => log.value.filter((e: any) => String(e.status || '').toLowerCase().includes(k)).length
const jmlSelesai = computed(() => jmlStatus('selesai'))
const jmlLewat = computed(() => jmlStatus('lewat'))
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
const bebaskan = () => run(tertinggal.value?.raw === 'CALLING' ? skip : complete, (t) => `${t.nomor} (${fmtTgl(t.tanggal)}) ditutup, loket siap memanggil`)
</script>

<template>
  <div>
    <PageHead code="FO-07" role="Front Office / Admin" title="Pemanggilan Antrean Loket" :subtitle="`Antrean pendaftaran · ${fmtTglPanjang(hariIni)}`">
      <template #actions>
        <NuxtLink to="/kunjungan/baru" class="btn btn-primary">Daftarkan kunjungan</NuxtLink>
        <NuxtLink to="/fo/reservasi" class="btn">Check-in Mobile JKN</NuxtLink>
      </template>
    </PageHead>

    <p v-if="loadErr" class="alert err" role="alert" style="margin-bottom: 12px">Gagal memuat antrean dari server: {{ loadErr }}</p>

    <div class="grid g3" style="margin-bottom: 16px">
      <div class="kl-kpi"><small>Tiket menunggu</small><b>{{ menunggu.length }}</b><span>Semua kanal</span></div>
      <div class="kl-kpi"><small>Sudah selesai</small><b>{{ jmlSelesai }}</b><span>Dari log antrean hari ini</span></div>
      <div class="kl-kpi"><small>Dilewati</small><b>{{ jmlLewat }}</b><span>Dari log antrean hari ini</span></div>
    </div>

    <div class="row" style="margin-bottom: 16px">
      <span class="lbl">Loket</span>
      <div class="seg" role="group" aria-label="Pilih loket">
        <button v-for="l in lokets" :key="l.id" type="button" :class="{ on: loketId === l.id }" :disabled="!l.aktif" :title="l.aktif ? '' : 'Loket nonaktif'" @click="loketId = l.id">{{ l.nama }}</button>
      </div>
      <span v-for="l in lain" :key="l.id" class="muted small">{{ l.nama }}: <b>{{ !l.aktif ? 'nonaktif' : l.current ? l.current.nomor : l.tertinggal ? 'tertahan nomor ' + fmtTgl(l.tertinggal.tanggal) : 'kosong' }}</b></span>
    </div>

    <div v-if="tertinggal" class="alert warn row between" role="alert" style="margin-bottom: 16px">
      <span>{{ loket?.nama }} masih memegang nomor <b class="mono">{{ tertinggal.nomor }}</b> dari {{ fmtTgl(tertinggal.tanggal) }} ({{ tertinggal.status }}<template v-if="tertinggal.nama"> · {{ tertinggal.nama }}</template>). Tutup nomor ini dulu agar loket bisa memanggil antrean hari ini.</span>
      <button class="btn btn-sm" :disabled="busy" @click="bebaskan">{{ tertinggal.raw === 'CALLING' ? 'Lewati nomor lama' : 'Selesaikan nomor lama' }}</button>
    </div>

    <div class="kl-cols l330">
      <div class="kl-col">
        <div class="panel">
          <h2>{{ aktif?.raw === 'SERVING' ? 'Sedang dilayani' : 'Sedang dipanggil' }} · {{ loket?.nama || '-' }}</h2>
          <div v-if="aktif"><StatusBadge :value="aktif.status" /></div>
          <div class="bignum" style="font-size: clamp(48px, 8vw, 76px); text-align: left; margin: 0">{{ aktif ? aktif.nomor : '-' }}</div>
          <template v-if="aktif">
            <div style="font-size: 14px">Diambil {{ fmtJam(aktif.jam) }}<template v-if="aktif.dipanggil > 1"> · dipanggil {{ aktif.dipanggil }}×</template></div>
            <div v-if="aktif.nama" style="font-size: 14px"><b>{{ aktif.nama }}</b> <span class="muted mono">{{ aktif.rm }}</span><div class="muted small">{{ aktif.poli }} · {{ aktif.dokter }}<template v-if="aktif.nomorPoli"> · antrean poli {{ aktif.nomorPoli }}</template></div></div>
          </template>
          <p v-else class="muted">Belum ada nomor yang dipanggil.</p>
          <div class="kl-actions">
            <button class="btn btn-primary" :disabled="busy || !loket?.aktif || !!aktif || !!tertinggal" :title="aktif || tertinggal ? 'Selesaikan atau lewati nomor saat ini dulu' : ''" @click="panggil">Panggil berikutnya</button>
            <button v-if="aktif?.raw === 'CALLING'" class="btn" :disabled="busy" @click="hadir">Pasien hadir</button>
          </div>
          <div class="kl-actions">
            <button class="btn" :disabled="busy || aktif?.raw !== 'CALLING'" @click="ulang">Panggil Ulang</button>
            <button class="btn" :disabled="busy || aktif?.raw !== 'CALLING'" @click="lewati">Lewati</button>
            <button class="btn" :disabled="busy || !aktif" @click="selesai">Selesai Admisi</button>
          </div>
          <div v-if="aktif?.visitId"><NuxtLink to="/fo" class="btn btn-sm btn-ghost">Lihat kunjungan {{ aktif.nomor }} di worklist</NuxtLink></div>
          <div class="guide">Dua loket tidak dapat memanggil nomor yang sama. Setiap aksi tercatat dan tampil di layar TV.</div>
        </div>

        <div class="panel">
          <h2>Log antrean terakhir</h2>
          <ul v-if="log.length" style="list-style: none; padding: 0; margin: 0">
            <li v-for="e in log.slice(0, 8)" :key="e.id" class="row between small" style="padding: 6px 0; border-top: 1px solid var(--line)">
              <span><b class="mono">{{ e.nomor }}</b> · <StatusBadge :value="e.status" /><template v-if="e.loketNama"> · {{ e.loketNama }}</template><template v-if="e.nama"> · {{ e.nama }}</template></span><span class="muted">{{ fmtJam(e.aksiAt) }}</span>
            </li>
          </ul>
          <p v-else class="muted">Belum ada aksi hari ini.</p>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <div class="row between"><h2>Daftar tunggu</h2><span class="badge b-warn">{{ menunggu.length }} nomor</span></div>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Nomor</th><th>Pasien / Poli</th><th>Jam ambil</th></tr></thead>
              <tbody>
                <tr v-for="(t, i) in menunggu" :key="t.id" :class="{ sel: i === 0 }">
                  <td data-label="Nomor" class="mono bold">{{ t.nomor }}</td>
                  <td data-label="Pasien">{{ t.nama || '-' }}<div class="muted small">{{ t.poli }}</div></td>
                  <td data-label="Jam ambil">{{ fmtJam(t.jam) }}</td>
                </tr>
                <tr v-if="!menunggu.length"><td colspan="3" class="empty">Tidak ada antrean menunggu.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="guide">Setiap panggil, panggil ulang, lewati, dan selesai mencatat loket, pengguna, serta waktu dalam audit trail.</div>
      </div>
    </div>
  </div>
</template>
