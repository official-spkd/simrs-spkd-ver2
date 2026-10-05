import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'billing',
  label: 'Billing & kasir',
  group: 'Keuangan & klaim',
  order: 55,
  layout: 'desktop',
  basePath: '/billing',
  persona: 'Kasir Dewi',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
