import partA from './part-a.js'

// Modul digabung dari bagian (part-*.js) agar tiap bagian dapat dikerjakan terpisah.
export default {
  key: 'integration-hub',
  label: 'Integration hub',
  group: 'Sistem & master',
  order: 95,
  layout: 'desktop',
  basePath: '/integration-hub',
  persona: 'IT Bayu',
  nav: [...partA.nav],
  routes: [...partA.routes],
}
