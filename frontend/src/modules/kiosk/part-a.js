// Bagian A anjungan mandiri. KSK-02..04 belum diimplementasi.
export default {
  nav: [],
  routes: [
    {
      path: 'selamat-datang',
      name: 'ksk-selamat-datang',
      component: () => import('./views/SelamatDatang.vue'),
      meta: { title: 'Selamat datang', code: 'KSK-01' },
    },
  ],
}
