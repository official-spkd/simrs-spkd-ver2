import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'koding-klaim',
  label: 'Koding & klaim',
  group: 'Keuangan & klaim',
  order: 60,
  layout: 'desktop',
  basePath: '/koding-klaim',
  persona: 'Koder Fajar',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
