<script setup lang="ts">
const { toasts } = useToast()
</script>
<template>
  <div class="toasts" aria-live="polite">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind">{{ t.msg }}</div>
  </div>
</template>
