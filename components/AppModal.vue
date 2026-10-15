<script setup lang="ts">
// Dialog kontekstual. `code` + `subtitle` opsional untuk dialog besar bergaya layar (mis. KL-05, KL-06).
const props = defineProps<{ modelValue: boolean; title: string; size?: 'md' | 'lg' | 'xl'; code?: string; subtitle?: string }>()
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
onMounted(() => {
  const f = (e: KeyboardEvent) => e.key === 'Escape' && props.modelValue && close()
  window.addEventListener('keydown', f)
  onBeforeUnmount(() => window.removeEventListener('keydown', f))
})
</script>
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-back" @mousedown.self="close">
      <div class="modal" :class="size" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal-h" :class="{ big: code }">
          <div>
            <div v-if="code" class="mh-code">{{ code }}</div>
            <h2>{{ title }}</h2>
            <div v-if="subtitle" class="mh-sub">{{ subtitle }}</div>
          </div>
          <button class="modal-x" aria-label="Tutup" @click="close">×</button>
        </div>
        <div class="modal-b"><slot /></div>
        <div v-if="$slots.footer" class="modal-f"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>
