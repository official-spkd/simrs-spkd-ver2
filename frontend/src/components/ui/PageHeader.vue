<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNow, formatTanggalPanjang, formatJam } from '@/utils/format'

const props = defineProps({
  title: { type: String, default: '' },
  code: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})

const route = useRoute()
const now = useNow()
const heading = computed(() => props.title || route.meta.title)
const kode = computed(() => props.code || route.meta.code)
const sub = computed(
  () => props.subtitle || [kode.value, formatTanggalPanjang(now.value), `${formatJam(now.value)} WIB`].filter(Boolean).join(' · '),
)
</script>

<template>
  <div class="page-header">
    <div class="page-header__text">
      <h1 class="t-page-title">{{ heading }}</h1>
      <p class="t-sm t-muted">{{ sub }}</p>
    </div>
    <div v-if="$slots.default" class="page-header__actions"><slot /></div>
  </div>
</template>

<style scoped>
.page-header { display: flex; gap: 16px; align-items: flex-start; width: 100%; }
.page-header__text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.page-header__actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
</style>
