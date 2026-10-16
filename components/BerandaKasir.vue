<script setup lang="ts">
// GL-02 Beranda Kasir
const { user } = useAuth()
const { siap, terdaftar, dilayani, menunggu, lunas, totalSementara, penerimaan, shift, galat } = useKasir()

const now = new Date().toISOString()
const h = new Date().getHours()
const salam = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
const sapaan = computed(() => (user.value?.nama || '').split(' ')[0])
const top3 = computed(() => siap.value.filter((r: any) => r.b.status !== 'lunas').slice().sort((a: any, b: any) => ((a.v.jamSelesai || '') > (b.v.jamSelesai || '') ? 1 : -1)).slice(0, 3))
const jamShift = computed(() => (shift.value ? `${fmtJam(shift.value.mulai)}–${shift.value.selesai ? fmtJam(shift.value.selesai) : 'sekarang'}` : '-'))
const lunasShift = computed(() => shift.value?.sum.transaksi || 0)
</script>

<template>
  <div>
    <PageHead code="GL-02" role="Kasir" title="Beranda Kasir" :subtitle="`${salam}, ${sapaan}. Ringkasan ${fmtTglPanjang()} · per ${fmtJam(now)}.`" />

    <div v-if="galat" class="guide warn" style="margin-bottom: 16px">{{ galat }}</div>
    <div class="grid g4">
      <div class="kl-kpi"><small>Siap bayar</small><b>{{ siap.length }}</b><span>Kunjungan selesai · siap finalisasi</span></div>
      <div class="kl-kpi"><small>Menunggu klinis</small><b>{{ menunggu.length }}</b><span>{{ terdaftar.length }} terdaftar · {{ dilayani.length }} dilayani</span></div>
      <div class="kl-kpi"><small>Lunas hari ini</small><b>{{ lunas.length }}</b><span>Transaksi pembayaran selesai</span></div>
      <div class="kl-kpi"><small>Penerimaan hari ini</small><b style="font-size: 28px">{{ fmtRp(penerimaan) }}</b><span>Dari {{ lunas.length }} transaksi lunas</span></div>
    </div>

    <div class="kl-cols" style="margin-top: 16px">
      <div class="kl-col">
        <div class="panel">
          <h2>Akses cepat</h2>
          <div class="kl-actions">
            <NuxtLink to="/kasir" class="btn btn-primary">Buka Worklist Tagihan</NuxtLink>
            <NuxtLink to="/kasir/invoice" class="btn">Invoice &amp; kwitansi</NuxtLink>
            <NuxtLink to="/kasir/shift" class="btn">Rekap penerimaan shift</NuxtLink>
          </div>
          <div class="guide">Pembayaran dibuka melalui tagihan. Hanya kunjungan selesai yang dapat difinalisasi; total draf masih sementara.</div>
        </div>

        <div class="panel">
          <h2>Tagihan belum dibayar</h2>
          <div class="kl-actions" style="align-items: center">
            <span class="badge b-warn">{{ siap.length }} kunjungan siap bayar</span>
            <span class="muted" style="font-size: 13px">Total sementara {{ fmtRp(totalSementara(siap)) }}</span>
          </div>
          <div class="table-wrap">
            <table class="tbl rtable">
              <thead><tr><th>Pasien / RM</th><th>Penjamin</th><th>Tagihan</th><th>Total sementara</th></tr></thead>
              <tbody>
                <tr v-if="!top3.length"><td class="empty" colspan="4">Belum ada kunjungan selesai yang menunggu pembayaran.</td></tr>
                <tr v-for="r in top3" :key="r.id" class="click" @click="navigateTo('/kasir/' + r.id)">
                  <td data-label="Pasien / RM">{{ r.p.nama }} · {{ r.p.rm }}</td>
                  <td data-label="Penjamin">{{ r.v.penjamin }}</td>
                  <td data-label="Tagihan">{{ statusTagihan(r.b).label }}</td>
                  <td data-label="Total sementara" style="color: var(--teal-d)">{{ fmtRp(r.b.totals.net) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="hint" style="margin: 0">Ringkasan {{ top3.length }} dari {{ siap.length }} tagihan. Porsi penjamin dihitung di detail; total tagihan BPJS bukan kewajiban bayar pasien.</p>
          <div><NuxtLink to="/kasir" class="btn">Lihat semua tagihan →</NuxtLink></div>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Role &amp; unit aktif</h2>
          <div><span class="badge b-teal">Kasir · aktif</span></div>
          <p style="font-size: 14px; font-weight: 600">{{ user?.nama }}</p>
          <p style="font-size: 14px">Kasir Rawat Jalan</p>
          <p class="muted">Shift {{ jamShift }}. Menu kasir mengikuti hak akses akun aktif.</p>
          <div class="guide">Menu mengikuti hak akses akun. Tidak ada role lain yang diberikan.</div>
        </div>
        <div class="panel">
          <h2>Ringkasan shift</h2>
          <div><span class="badge" :class="shift ? 'b-teal' : 'b-mute'">● {{ shift ? 'Shift aktif' : 'Tidak ada shift terbuka' }}</span></div>
          <p style="font-weight: 600">{{ jamShift }} · {{ shift?.kasir || user?.nama }}</p>
          <p>{{ lunasShift }} transaksi lunas di shift ini · {{ lunas.length }} hari ini</p>
          <div class="guide">QRIS / VA menggunakan gateway stub / simulasi, bukan koneksi produksi.</div>
          <div><NuxtLink to="/kasir/shift" class="btn">Buka rekap penerimaan shift</NuxtLink></div>
        </div>
      </div>
    </div>

    <StatusSistem style="margin-top: 16px" />
  </div>
</template>
