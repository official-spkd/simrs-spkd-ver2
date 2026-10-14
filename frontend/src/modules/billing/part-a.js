// BLG-01 s.d. BLG-06 — menu & route modul Billing
export default {
  nav: [
    { label: 'Worklist tagihan', to: '/billing/worklist-tagihan' },
    { label: 'Rincian', to: '/billing/detail-tagihan' },
    { label: 'Deposit', to: '/billing/deposit-rawat-inap' },
    { label: 'Pembayaran', to: '/billing/pembayaran' },
    { label: 'Kwitansi', to: '/billing/kwitansi' },
    { label: 'Pendapatan', to: '/billing/laporan-pendapatan' },
  ],
  routes: [
    {
      path: 'worklist-tagihan',
      name: 'blg-worklist-tagihan',
      component: () => import('./views/WorklistTagihan.vue'),
      meta: { title: 'Worklist Tagihan', code: 'BLG-01' },
    },
    {
      path: 'detail-tagihan',
      name: 'blg-detail-tagihan',
      component: () => import('./views/DetailTagihan.vue'),
      meta: { title: 'Detail Tagihan', code: 'BLG-02' },
    },
    {
      path: 'deposit-rawat-inap',
      name: 'blg-deposit-rawat-inap',
      component: () => import('./views/DepositRawatInap.vue'),
      meta: { title: 'Deposit Rawat Inap', code: 'BLG-03' },
    },
    {
      path: 'pembayaran',
      name: 'blg-pembayaran',
      component: () => import('./views/Pembayaran.vue'),
      meta: { title: 'Pembayaran', code: 'BLG-04' },
    },
    {
      path: 'kwitansi',
      name: 'blg-kwitansi',
      component: () => import('./views/Kwitansi.vue'),
      meta: { title: 'Kwitansi', code: 'BLG-05' },
    },
    {
      path: 'laporan-pendapatan',
      name: 'blg-laporan-pendapatan',
      component: () => import('./views/LaporanPendapatan.vue'),
      meta: { title: 'Laporan Pendapatan', code: 'BLG-06' },
    },
  ],
}
