export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  // Override dengan env NUXT_PUBLIC_API_BASE (mis. http://localhost:8080).
  runtimeConfig: { public: { apiBase: 'http://100.113.18.8:8080' } },
  app: {
    head: {
      title: 'SIMRS SPKD',
      htmlAttrs: { lang: 'id' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SIMRS SPKD — MVP Rawat Jalan: Pendaftaran, Poliklinik + EMR SOAP, Kasir' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
      ],
    },
  },
})
