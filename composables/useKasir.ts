/** Ringkasan kasir bersama (GL-02 Beranda Kasir, KS-01 Worklist, KS-05 Rekap): tagihan per status, penerimaan, shift aktif. */
export function useKasir(tanggal?: Ref<string>) {
  const { db, billTotals, currentShift } = useDb()
  const tgl = computed(() => tanggal?.value || todayStr())

  const kunjungan = computed(() => db.visits.filter((v: any) => v.tanggal === tgl.value && v.status !== 'dibatalkan'))
  const siap = computed(() => kunjungan.value.filter((v: any) => v.status === 'selesai'))
  const terdaftar = computed(() => kunjungan.value.filter((v: any) => v.status === 'terdaftar'))
  const dilayani = computed(() => kunjungan.value.filter((v: any) => v.status === 'dilayani'))
  const menunggu = computed(() => [...terdaftar.value, ...dilayani.value])
  const lunas = computed(() => kunjungan.value.filter((v: any) => v.status === 'lunas'))

  // total sementara = total tagihan (bukan porsi pasien; porsi penjamin dihitung di detail)
  const totalSementara = (list: any[]) => list.reduce((s: number, v: any) => s + billTotals(v.id).net, 0)
  const bayarHari = computed(() => Object.values(db.bills).flatMap((b: any) => b.payments || []).filter((p: any) => p.at && p.at.slice(0, 10) === tgl.value))
  const penerimaan = computed(() => bayarHari.value.reduce((s: number, p: any) => s + p.jumlah, 0))
  const shift = computed(() => currentShift())

  return { kunjungan, siap, terdaftar, dilayani, menunggu, lunas, totalSementara, penerimaan, shift }
}

/** Label kolom "Tagihan": Draf / Final · INV / Lunas · KW. */
export const statusTagihan = (b: any) => {
  if (!b || b.status === 'draf') return { label: 'Draf', cls: 'b-warn' }
  if (b.status === 'final') return { label: 'Final · INV', cls: 'b-navy' }
  return { label: 'Lunas · KW', cls: 'b-ok' }
}

/** Skema bayar internal 'Tunai' ditampilkan sebagai 'Umum' (Figma KS-02). */
export const labelSkema = (s?: string) => (s === 'Tunai' || !s ? 'Umum' : s)

/** localStorage: tagihan terakhir yang dibuka kasir (menu "Pembayaran" / "Invoice & kwitansi"). */
export const KS_AKTIF_KEY = 'spkd-kasir-aktif'
