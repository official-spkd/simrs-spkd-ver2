<script setup lang="ts">
// FO-07 Pemanggilan Antrean Loket
const { db, loketAktif, loketMenunggu, callNextLoket, recallLoket, skipLoket, finishLoket, takeLoketTicket } = useDb()
const toast = useToast()

const LOKETS = [1, 2, 3]
const noLoket = ref(2)
const aktif = computed(() => loketAktif(noLoket.value))
const menunggu = computed(() => loketMenunggu().slice().sort((a: any, b: any) => (a.jam > b.jam ? 1 : -1)))
const lain = computed(() => LOKETS.filter((n) => n !== noLoket.value).map((n) => ({ n, tk: loketAktif(n) })))
const log = computed(() => db.queueLog.filter((e: any) => e.type === 'loket').slice(0, 8))
const searchOpen = ref(false)

const panggil = () => {
  const tk = toast.attempt(() => callNextLoket(noLoket.value))
  if (tk && tk !== true) toast.ok(`Memanggil ${tk.nomor} ke Loket ${noLoket.value}`)
}
const ulang = () => toast.attempt(() => recallLoket(noLoket.value), 'Panggilan diulang')
const lewati = () => toast.attempt(() => skipLoket(noLoket.value), 'Nomor dilewati')
const selesai = () => toast.attempt(() => finishLoket(noLoket.value), 'Pelayanan loket selesai')
const ambil = () => {
  const tk = takeLoketTicket('loket')
  toast.ok(`Nomor manual ${tk.nomor} diterbitkan`)
}
</script>

<template>
  <div>
    <PageHead code="FO-07" role="Front Office" title="Pemanggilan Antrean Loket" subtitle="Dua loket tidak dapat memanggil nomor yang sama. Setiap aksi tercatat dan tampil di layar TV.">
      <template #actions><button class="btn" @click="ambil">Ambil nomor manual</button></template>
    </PageHead>

    <div class="row" style="margin-bottom: 16px">
      <span class="lbl">Loket</span>
      <div class="seg" role="group" aria-label="Pilih loket"><button v-for="n in LOKETS" :key="n" type="button" :class="{ on: noLoket === n }" @click="noLoket = n">Loket {{ n }}</button></div>
      <span v-for="l in lain" :key="l.n" class="muted small">Loket {{ l.n }}: <b>{{ l.tk ? l.tk.nomor : 'kosong' }}</b></span>
    </div>

    <div class="split-r">
      <div class="stack">
        <div class="card" style="text-align: center">
          <div class="muted">Sedang dipanggil · Loket {{ noLoket }}</div>
          <div class="bignum" style="font-size: clamp(56px, 12vw, 110px)">{{ aktif ? aktif.nomor : '-' }}</div>
          <div v-if="aktif" class="row" style="justify-content: center"><StatusBadge :value="aktif.kanal" /><span class="muted">diambil {{ fmtJam(aktif.jam) }}</span></div>
          <p v-else class="muted">Belum ada nomor yang dipanggil.</p>
          <div class="row" style="justify-content: center; margin-top: 18px">
            <button class="btn btn-primary btn-lg" @click="panggil">Panggil berikutnya</button>
            <button class="btn btn-lg" :disabled="!aktif" @click="ulang">Panggil ulang</button>
            <button class="btn btn-lg" :disabled="!aktif" @click="lewati">Lewati</button>
            <button class="btn btn-lg" :disabled="!aktif" @click="selesai">Selesai</button>
          </div>
          <div v-if="aktif" style="margin-top: 14px"><button class="btn btn-sm btn-ghost" @click="searchOpen = true">Cari pasien untuk pendaftaran {{ aktif.nomor }}</button></div>
        </div>

        <div class="card">
          <h2>Log antrean terakhir</h2>
          <ul v-if="log.length" style="list-style: none; padding: 0; margin: 0">
            <li v-for="e in log" :key="e.id" class="row between small" style="padding: 6px 0; border-top: 1px solid var(--line)">
              <span><b class="mono">{{ e.nomor }}</b> · {{ e.aksi }}<template v-if="e.loket"> · Loket {{ e.loket }}</template></span><span class="muted">{{ fmtJam(e.at) }}</span>
            </li>
          </ul>
          <p v-else class="muted">Belum ada aksi hari ini.</p>
        </div>
      </div>

      <div class="card">
        <div class="row between"><h2 style="margin: 0">Daftar menunggu</h2><span class="badge b-warn">{{ menunggu.length }} nomor</span></div>
        <div class="table-wrap" style="margin-top: 12px">
          <table class="tbl rtable">
            <thead><tr><th>Nomor</th><th>Kanal</th><th>Jam ambil</th></tr></thead>
            <tbody>
              <tr v-for="t in menunggu" :key="t.id">
                <td data-label="Nomor" class="mono bold">{{ t.nomor }}</td>
                <td data-label="Kanal"><StatusBadge :value="t.kanal" /></td>
                <td data-label="Jam ambil">{{ fmtJam(t.jam) }}</td>
              </tr>
              <tr v-if="!menunggu.length"><td colspan="3" class="empty">Tidak ada antrean menunggu.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <PatientSearchModal v-model="searchOpen" />
  </div>
</template>
