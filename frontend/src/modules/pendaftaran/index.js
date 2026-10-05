import partA from './part-a.js'
import partB from './part-b.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'pendaftaran',
  label: 'Pendaftaran',
  group: 'Operasional & klinis',
  order: 10,
  layout: 'desktop',
  basePath: '/pendaftaran',
  persona: 'Ns. Maya',
  nav: [...partA.nav, ...partB.nav],
  routes: [...partA.routes, ...partB.routes],
}
