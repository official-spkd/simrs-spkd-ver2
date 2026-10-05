<script setup>
import { computed } from 'vue'
import { Info, CircleAlert, CircleCheck } from 'lucide-vue-next'

const props = defineProps({
  tone: { type: String, default: 'info' }, // info | success | warning | danger
  title: { type: String, default: '' },
  text: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
})

const defaultIcon = { info: Info, success: CircleCheck, warning: Info, danger: CircleAlert }
const iconComp = computed(() => props.icon || defaultIcon[props.tone] || Info)
</script>

<template>
  <div class="alert" :class="`alert--${tone}`" role="status">
    <component :is="iconComp" class="alert__icon" aria-hidden="true" />
    <div class="alert__body">
      <p v-if="title" class="alert__title">{{ title }}</p>
      <p v-if="text" class="alert__text">{{ text }}</p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="alert__actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  border-radius: var(--r-sm);
  width: 100%;
}
.alert__icon { width: 20px; height: 20px; flex-shrink: 0; }
.alert__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
.alert__title { font-size: 14px; font-weight: 600; }
.alert__actions { flex-shrink: 0; display: flex; gap: 8px; align-self: center; }
.alert--info { background: var(--c-primary-soft); color: var(--c-primary); }
.alert--success { background: var(--c-success-soft); color: var(--c-success); }
.alert--warning { background: var(--c-warning-soft); color: var(--c-warning); }
.alert--danger { background: var(--c-danger-soft); color: var(--c-danger); }
</style>
