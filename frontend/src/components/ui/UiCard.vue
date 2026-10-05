<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  flush: Boolean,
})
</script>

<template>
  <section class="card" :class="{ 'card--flush': flush }">
    <header v-if="title || $slots.actions" class="ui-card__head" :class="{ 'ui-card__head--flush': flush }">
      <div class="ui-card__titles">
        <h3 v-if="title" class="t-title">{{ title }}</h3>
        <p v-if="subtitle" class="t-sm t-muted">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="ui-card__actions"><slot name="actions" /></div>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.ui-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ui-card__head--flush { padding: 18px; }
.ui-card__titles { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ui-card__actions { display: flex; gap: 8px; flex-shrink: 0; }
</style>
