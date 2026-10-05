import partA from './part-a.js'
import partB from './part-b.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'rawat-jalan',
  label: 'Rawat jalan',
  group: 'Operasional & klinis',
  order: 20,
  layout: 'desktop',
  basePath: '/rawat-jalan',
  persona: 'dr. Andi',
  nav: [...partA.nav, ...partB.nav],
  routes: [...partA.routes, ...partB.routes],
}
