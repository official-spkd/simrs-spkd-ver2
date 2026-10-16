// Kasir dari backend (/api/v1/cashier, khusus role cashier): worklist, detail tagihan, pembayaran, dokumen INV/KW, dan shift.
// Respons server (bahasa Inggris) dipetakan ke bentuk tampilan halaman kasir; angka uang dalam Rupiah utuh.

const STATUS_KUNJUNGAN: Record<string, string> = { Registered: 'terdaftar', Served: 'dilayani', Completed: 'selesai', Paid: 'lunas', Cancelled: 'dibatalkan' }
const PENJAMIN: Record<string, string> = { umum: 'Umum', bpjs: 'BPJS', asuransi: 'Asuransi' }
/** Skema bayar internal halaman: 'Tunai' (ditampilkan "Umum"), 'BPJS', 'Asuransi'. */
const SKEMA: Record<string, string> = { umum: 'Tunai', bpjs: 'BPJS', asuransi: 'Asuransi' }
const SKEMA_API: Record<string, string> = { Tunai: 'umum', BPJS: 'bpjs', Asuransi: 'asuransi' }
const STATUS_TAGIHAN: Record<string, string> = { draft: 'draf', final: 'final', paid: 'lunas' }
const KATEGORI: Record<string, string> = { administration: 'Administrasi', consultation: 'Konsultasi', procedure: 'Tindakan', medication: 'Obat/resep', other: 'Lainnya' }
const METODE: Record<string, string> = { cash: 'Tunai', qris: 'QRIS', va: 'VA' }
const METODE_API: Record<string, string> = { Tunai: 'cash', QRIS: 'qris', VA: 'va' }

/** Pesan galat server → bahasa Indonesia (pesan lain ditampilkan apa adanya). */
const PESAN: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/^a manual item needs a reason of at least (\d+) characters$/, (m) => `Item manual wajib alasan minimal ${m[1]} karakter`],
  [/^a discount needs a reason of at least (\d+) characters$/, (m) => `Diskon wajib alasan minimal ${m[1]} karakter`],
  [/^the discount cannot exceed the bill subtotal$/, 'Nominal diskon tidak boleh melebihi subtotal'],
  [/^the bill is finalized and can no longer be changed$/, 'Tagihan sudah final; item, skema, dan diskon tidak dapat diubah'],
  [/^only visits whose service is completed can be finalized$/, 'Hanya kunjungan status selesai yang bisa difinalkan'],
  [/^the visit is cancelled$/, 'Kunjungan sudah dibatalkan'],
  [/^finalize the bill before taking payment$/, 'Finalkan tagihan terlebih dahulu'],
  [/^the bill is already paid$/, 'Tagihan sudah lunas'],
  [/^the bill has not been finalized yet$/, 'Tagihan belum difinalkan'],
  [/^the payment is (\d+) short of the remaining (\d+)$/, (m) => `Pembayaran kurang ${fmtRp(Number(m[1]))}`],
  [/^the cash received is less than the cash amount$/, 'Uang diterima kurang dari porsi tunai'],
  [/^the patient has nothing left to pay$/, 'Tidak ada sisa tagihan pasien'],
  [/^a cash difference needs a note of at least (\d+) characters$/, (m) => `Selisih tunai wajib catatan minimal ${m[1]} karakter`],
  [/^only the cashier of this shift can close it$/, 'Shift hanya dapat ditutup oleh kasir pemiliknya'],
  [/^the shift is already closed$/, 'Shift sudah ditutup'],
  [/^the shift received a payment meanwhile; reload and try again$/, 'Ada pembayaran baru di shift ini. Muat ulang lalu coba lagi.'],
  [/^visit not found$/, 'Kunjungan tidak ditemukan'],
  [/^shift not found$/, 'Shift tidak ditemukan'],
]
export const pesanKasir = (e: any) => {
  const raw = String(e?.message || e || '')
  for (const [re, out] of PESAN) {
    const m = raw.match(re)
    if (m) return typeof out === 'string' ? out : out(m)
  }
  return raw
}

const tglIso = (s?: string) => (s || '').slice(0, 10)

export const toPasien = (p: any, penjamin: string) => ({
  id: p?.id || '',
  rm: p?.medical_record_number || '-',
  nik: p?.nik || '',
  nama: p?.full_name || '(pasien tidak ditemukan)',
  tglLahir: tglIso(p?.birth_date),
  jk: p?.gender === 'Female' ? 'P' : 'L',
  alergi: p?.allergies || '',
  penjamin,
})

export const toKunjungan = (v: any) => {
  const penjamin = PENJAMIN[v.penjamin] || v.penjamin
  const kode = v.poli?.prefix_code || ''
  return {
    id: v.id,
    noKunjungan: `RJ-${v.visit_date.slice(2, 4)}${v.visit_date.slice(5, 7)}-${kode}${v.queue_number}`,
    tanggal: tglIso(v.visit_date),
    poliId: v.poli?.id || v.poli?.name || '',
    poliNama: v.poli?.name || '-',
    poliKode: kode,
    dokterNama: v.doctor?.name || '-',
    penjamin,
    status: STATUS_KUNJUNGAN[v.visit_status] || v.visit_status,
    jamDaftar: v.registered_at,
    jamSelesai: v.completed_at || null,
    asuransi: v.insurance_name || '',
    plafon: v.coverage_limit || 0,
  }
}

const toTotals = (t: any) => ({
  total: t?.subtotal || 0, diskon: t?.discount || 0, net: t?.net || 0, penjamin: t?.payer_covered || 0,
  pasien: t?.patient_portion || 0, selisih: t?.excess || 0, bayar: t?.paid || 0, sisa: t?.remaining || 0,
})

/** Satu baris worklist / dokumen: kunjungan (v), pasien (p), tagihan (b) tanpa rincian item. */
export const toBaris = (r: any) => {
  const v = toKunjungan(r.visit)
  return {
    id: v.id,
    v,
    p: toPasien(r.visit.patient, v.penjamin),
    b: {
      visitId: v.id,
      status: STATUS_TAGIHAN[r.status] || r.status,
      skema: SKEMA[r.scheme] || 'Tunai',
      noInv: r.invoice_number || '',
      noKw: r.receipt_number || '',
      finalAt: r.finalized_at,
      paidAt: r.paid_at,
      totals: toTotals(r.totals),
    },
  }
}

/** Detail tagihan lengkap (KS-02/03/04). */
export const toTagihan = (r: any) => {
  const row = toBaris(r)
  return {
    ...row,
    b: {
      ...row.b,
      plafon: r.coverage_limit || 0,
      selisih: r.excess || 0,
      diskon: { nominal: r.totals?.discount || 0, alasan: r.discount_reason || '' },
      tarifVersi: r.tariff_version || 1,
      tarifBerlaku: r.tariff_effective_date || '',
      items: (r.items || []).map((i: any, n: number) => ({
        id: i.id || `auto-${n}`,
        kategori: KATEGORI[i.category] || 'Lainnya',
        nama: i.name,
        sumber: i.source === 'manual' ? `${i.created_by || 'Kasir'} (manual)` : 'Pendaftaran',
        at: i.served_at,
        tarif: i.price,
        qty: i.quantity,
        subtotal: i.subtotal,
        manual: !!i.is_manual,
        alasan: i.reason || '',
      })),
      payments: (r.payments || []).map((p: any) => ({
        id: p.id,
        metode: METODE[p.method] || p.method,
        jumlah: p.amount,
        at: p.paid_at,
        ref: p.reference || '',
        kasir: p.cashier || '-',
        shiftId: p.shift_id,
        diterima: p.received ?? undefined,
        kembalian: p.change ?? undefined,
      })),
    },
  }
}

export const toShift = (s: any) => ({
  id: s.id,
  kasir: s.cashier?.name || '-',
  kasirId: s.cashier?.id || '',
  mulai: s.opened_at,
  selesai: s.closed_at,
  closed: !s.is_open,
  rekon: s.is_open ? null : { tunaiTerhitung: s.counted_cash, selisih: s.cash_difference, total: s.total, catatan: s.note },
  sum: {
    transaksi: s.summary?.transactions || 0, tunai: s.summary?.cash || 0, qris: s.summary?.qris || 0, va: s.summary?.va || 0,
    total: s.summary?.total || 0, nTunai: s.summary?.cash_count || 0, nQris: s.summary?.qris_count || 0, nVa: s.summary?.va_count || 0,
  },
})

/** Ambil semua halaman endpoint list (maks. 100 per halaman). */
async function semua(path: string, query: Record<string, any> = {}) {
  const out: any[] = []
  for (let page = 1; page <= 50; page++) {
    const r = await apiPage(path, { query: { ...query, page, limit: 100 } })
    out.push(...r.data)
    if (!r.pagination?.has_next_page) break
  }
  return out
}

const bill = (visitId: string) => `/api/v1/cashier/bills/${visitId}`

export const kasirApi = {
  worklist: async (tanggal: string) => (await semua('/api/v1/cashier/bills/worklist', { date: tanggal })).map(toBaris),
  dokumen: async (q = '', status = '') => (await semua('/api/v1/cashier/bills', { search: q.trim(), status })).map(toBaris),
  tagihan: async (visitId: string) => toTagihan(await api(bill(visitId))),
  setSkema: async (visitId: string, skema: string, plafon = 0, selisih = 0) =>
    toTagihan(await api(bill(visitId) + '/scheme', { method: 'PUT', body: { scheme: SKEMA_API[skema] || 'umum', coverage_limit: Number(plafon) || 0, excess: Number(selisih) || 0 } })),
  addManualItem: async (visitId: string, f: { nama: string; tarif: number; qty: number; alasan: string }) =>
    toTagihan(await api(bill(visitId) + '/items', { method: 'POST', body: { name: f.nama.trim(), price: Number(f.tarif), quantity: Number(f.qty), reason: f.alasan.trim() } })),
  setDiskon: async (visitId: string, nominal: number, alasan: string) =>
    toTagihan(await api(bill(visitId) + '/discount', { method: 'PUT', body: { amount: Number(nominal) || 0, reason: alasan.trim() } })),
  finalkan: async (visitId: string) => toTagihan(await api(bill(visitId) + '/finalize', { method: 'POST' })),
  bayar: async (visitId: string, parts: { metode: string; jumlah: number; ref?: string; diterima?: number }[]) =>
    toTagihan(await api(bill(visitId) + '/payments', {
      method: 'POST',
      body: { payments: parts.map((p) => ({ method: METODE_API[p.metode] || p.metode, amount: Number(p.jumlah), received: p.diterima != null ? Number(p.diterima) : undefined, reference: p.ref || '' })) },
    })),
  catatCetak: (visitId: string, jenis: 'print' | 'pdf') => api(bill(visitId) + '/prints', { method: 'POST', body: { kind: jenis } }),
  shifts: async (tanggal: string) => (await semua('/api/v1/cashier/shifts', { date: tanggal })).map(toShift),
  shiftAktif: async () => {
    const s = await api('/api/v1/cashier/shifts/current')
    return s ? toShift(s) : null
  },
  tutupShift: async (id: string, tunaiTerhitung: number, catatan: string) =>
    toShift(await api(`/api/v1/cashier/shifts/${id}/close`, { method: 'POST', body: { counted_cash: Number(tunaiTerhitung) || 0, note: catatan.trim() } })),
}

/** Jalankan aksi API; galat ditampilkan sebagai toast (bahasa Indonesia). Mengembalikan hasil atau undefined. */
export async function aksiKasir<T>(fn: () => Promise<T>, okMsg = ''): Promise<T | undefined> {
  const toast = useToast()
  try {
    const r = await fn()
    if (okMsg) toast.ok(okMsg)
    return r
  } catch (e: any) {
    toast.err(pesanKasir(e))
  }
}

/** Ringkasan kasir bersama (GL-02 Beranda Kasir, KS-01 Worklist): kunjungan & tagihan per status, penerimaan, shift aktif. */
export function useKasir(tanggal?: Ref<string>) {
  const tgl = computed(() => tanggal?.value || todayStr())
  const baris = ref<any[]>([])
  const shift = ref<any>(null)
  const loading = ref(false)
  const galat = ref('')

  const muat = async () => {
    loading.value = true
    try {
      const [rows, sh] = await Promise.all([kasirApi.worklist(tgl.value), kasirApi.shiftAktif()])
      baris.value = rows
      shift.value = sh
      galat.value = ''
    } catch (e: any) {
      galat.value = pesanKasir(e)
    } finally {
      loading.value = false
    }
  }
  onMounted(muat)
  watch(tgl, muat)

  const kunjungan = computed(() => baris.value.filter((r: any) => r.v.status !== 'dibatalkan'))
  const siap = computed(() => kunjungan.value.filter((r: any) => r.v.status === 'selesai'))
  const terdaftar = computed(() => kunjungan.value.filter((r: any) => r.v.status === 'terdaftar'))
  const dilayani = computed(() => kunjungan.value.filter((r: any) => r.v.status === 'dilayani'))
  const menunggu = computed(() => [...terdaftar.value, ...dilayani.value])
  const lunas = computed(() => kunjungan.value.filter((r: any) => r.v.status === 'lunas'))

  // total sementara = total tagihan (bukan porsi pasien; porsi penjamin dihitung di detail)
  const totalSementara = (list: any[]) => list.reduce((s: number, r: any) => s + r.b.totals.net, 0)
  const penerimaan = computed(() => lunas.value.reduce((s: number, r: any) => s + r.b.totals.bayar, 0))

  return { baris, kunjungan, siap, terdaftar, dilayani, menunggu, lunas, totalSementara, penerimaan, shift, loading, galat, muat }
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
