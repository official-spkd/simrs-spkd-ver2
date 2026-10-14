<script setup lang="ts">
defineProps<{ code?: string; role?: string; title: string; subtitle?: string; crumbs?: string[] }>()
</script>
<template>
  <div>
    <div class="page-head">
      <div>
        <div v-if="code" class="code">{{ code }}<template v-if="role"> · {{ role }}</template></div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions"><slot name="actions" /></div>
    </div>
  </div>
</template>
