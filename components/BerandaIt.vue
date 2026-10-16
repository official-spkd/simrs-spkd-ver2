<script setup lang="ts">
// GL-02 Beranda IT / Superadmin (Figma 87:122)
const { db } = useDb()
const { user } = useAuth()
const { ringkasSs } = useIt()

const now = new Date().toISOString()
const h = new Date().getHours()
const salam = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'
const sapaan = computed(() => (user.value?.nama || '').split(' ')[0])
const ss = computed(() => ringkasSs())
const dlq = computed(() => db.outbox.filter((o: any) => o.modul === 'Satu Sehat' && o.status === 'gagal'))
const ssOk = computed(() => db.integrasi.satuSehat.status === 'online')
const mock = computed(() => db.integrasi.satuSehat.mode !== 'produksi')
const akses = computed(() => [
  { to: '/it/integrasi', label: 'Status integrasi' },
  { to: '/it/audit', label: 'Audit trail' },
  ...(user.value?.role === 'superadmin' ? [{ to: '/it/user', label: 'User & role' }] : []),
  { to: '/it/perangkat', label: 'Perangkat' },
])
</script>

<template>
  <div>
    <PageHead code="GL-02" role="IT / SUPERADMIN" title="Beranda IT / Superadmin" :subtitle="`${salam}, ${sapaan}. Ringkasan ${fmtTglPanjang()} · per ${fmtJam(now)}.`" />

    <div class="grid g4">
      <div class="kl-kpi"><small>Paket Satu Sehat</small><b>{{ ss.total }}</b><span>Paket kunjungan hari ini</span></div>
      <div class="kl-kpi"><small>Terkirim</small><b>{{ ss.terkirim }}</b><span>Sinkron terakhir {{ ss.terakhir ? fmtJamDetik(ss.terakhir) : '-' }}</span></div>
      <div class="kl-kpi"><small>Antrian kirim</small><b>{{ ss.antrian }}</b><span>Tersimpan di outbox lokal</span></div>
      <div class="kl-kpi"><small>Gagal / DLQ</small><b>{{ ss.gagal }}</b><span>Perlu tindak lanjut IT</span></div>
    </div>

    <div class="kl-cols" style="margin-top: 16px">
      <div class="kl-col">
        <div class="panel">
          <h2>Akses cepat</h2>
          <div class="kl-actions">
            <NuxtLink v-for="(a, i) in akses" :key="a.to" :to="a.to" class="btn" :class="{ 'btn-primary': i === 0 }">{{ a.label }}</NuxtLink>
          </div>
          <div class="guide">Kelola master poli/dokter, jadwal/kuota, tarif/penjamin, serta mapping HFIS BPJS &amp; Antrol V2 melalui menu administrasi.</div>
        </div>

        <div class="panel">
          <h2>Kiriman perlu tindak lanjut</h2>
          <div><span class="badge" :class="dlq.length ? 'b-err' : 'b-ok'">Satu Sehat · {{ dlq.length }} paket DLQ</span></div>
          <div v-for="o in dlq.slice(0, 3)" :key="o.id" class="it-fail">
            <b>{{ o.resource }} · {{ objekOutbox(o) }}</b>
            <span>{{ o.galat || 'Gagal dikirim' }}</span>
          </div>
          <p v-if="!dlq.length" class="muted">Tidak ada kiriman gagal. Semua paket terkirim atau masih dalam antrian.</p>
          <div><NuxtLink to="/it/integrasi" class="btn btn-primary">Tinjau di Status Integrasi →</NuxtLink></div>
          <p class="muted" style="font-size: 12px">Rincian dan retry tersedia di IT-05. Data lokal tetap aman; retry tidak membuat kunjungan ganda.</p>
        </div>
      </div>

      <div class="kl-col">
        <div class="panel">
          <h2>Role &amp; unit aktif</h2>
          <div><span class="badge b-teal">{{ ROLE_LABEL[user?.role as Role] }} · aktif</span></div>
          <p style="font-size: 14px; font-weight: 600">{{ user?.nama }}</p>
          <p style="font-size: 14px">Administrasi Sistem</p>
          <p class="muted">Administrasi akses, master data, integrasi, dan perangkat sesuai izin akun.</p>
          <div class="guide">Menu mengikuti hak akses akun. Tidak ada role lain yang diberikan.</div>
        </div>
        <div class="panel">
          <h2>Endpoint &amp; mode koneksi</h2>
          <div><span class="badge" :class="ssOk ? 'b-ok' : 'b-err'">● Satu Sehat {{ ssOk ? 'terhubung' : 'terputus' }}</span></div>
          <p>Token berakhir {{ db.integrasi.satuSehat.tokenExpiry ? fmtTglJam(db.integrasi.satuSehat.tokenExpiry) : '-' }}</p>
          <div><span class="badge b-navy">{{ mock ? 'MOCK aktif' : 'PRODUKSI aktif' }}</span></div>
          <p>BPJS VClaim / Antrol dan gateway QRIS / VA: stub / simulasi.</p>
          <div class="guide">Produksi terkunci. Kredensial harus divalidasi dan diverifikasi IT sebelum digunakan.</div>
        </div>
      </div>
    </div>

    <StatusSistem style="margin-top: 16px" />
  </div>
</template>

<style scoped>
.it-fail { background: #fafcfd; border: 1px solid var(--line); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; line-height: 1.45; color: var(--text); }
</style>
