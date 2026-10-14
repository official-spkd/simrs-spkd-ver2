<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; title: string; size?: 'md' | 'lg' }>()
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
        <div class="modal-h"><h2>{{ title }}</h2><button class="modal-x" aria-label="Tutup" @click="close">×</button></div>
        <div class="modal-b"><slot /></div>
        <div v-if="$slots.footer" class="modal-f"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>
