import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'rme',
  label: 'Rekam medis (RME)',
  group: 'Operasional & klinis',
  order: 35,
  layout: 'desktop',
  basePath: '/rme',
  persona: 'dr. Andi',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
