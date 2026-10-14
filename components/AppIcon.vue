<script setup lang="ts">
const props = defineProps<{ name: string; size?: number }>()
const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h6',
  users: 'M16 11a4 4 0 100-8 4 4 0 000 8zM3 21v-1a6 6 0 0112 0v1M17 14a5 5 0 015 5v2',
  megaphone: 'M3 11v2a1 1 0 001 1h3l8 4V6L7 10H4a1 1 0 00-1 1zM19 9a4 4 0 010 6',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  stethoscope: 'M6 3v6a4 4 0 008 0V3M10 13v2a5 5 0 0010 0v-1M20 12a2 2 0 100-4 2 2 0 000 4z',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6',
  wallet: 'M3 7h16a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l2-3h12v3M16 14h2',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  file: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6',
  ban: 'M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  building: 'M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M3 21h18',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  bell: 'M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 004 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5 9-10',
  print: 'M6 9V3h12v6M6 18H4v-8h16v8h-2M8 14h8v7H8z',
  x: 'M6 6l12 12M18 6L6 18',
}
</script>
<template>
  <svg :width="size || 18" :height="size || 18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="P[props.name] || P.file" />
  </svg>
</template>
