import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'radiologi',
  label: 'Radiologi',
  group: 'Penunjang',
  order: 50,
  layout: 'desktop',
  basePath: '/radiologi',
  persona: 'dr. Hendra, Sp.Rad',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
