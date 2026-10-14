<script setup lang="ts">
defineProps<{ modelValue: string; tabs: { key: string; label: string }[] }>()
const emit = defineEmits(['update:modelValue'])
</script>
<template>
  <div class="tabs" role="tablist">
    <button v-for="t in tabs" :key="t.key" role="tab" :class="{ on: modelValue === t.key }" :aria-selected="modelValue === t.key" @click="emit('update:modelValue', t.key)">{{ t.label }}</button>
  </div>
</template>
