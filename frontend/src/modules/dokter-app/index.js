import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'dokter-app',
  label: 'eDokter (mobile)',
  group: 'Aplikasi',
  order: 220,
  layout: 'mobile',
  basePath: '/m/dokter',
  nav: [...partA.nav],
  tabs: partA.tabs ?? [],
  routes: [...partA.routes],
}
