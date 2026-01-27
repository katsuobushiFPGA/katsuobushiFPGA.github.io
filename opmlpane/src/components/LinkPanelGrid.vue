<script setup lang="ts">
import type { LinkCategory } from '../types/opml'
import CategoryPanel from './CategoryPanel.vue'

defineProps<{
  categories: LinkCategory[]
}>()
</script>

<template>
  <div class="panel-grid">
    <CategoryPanel
      v-for="(category, index) in categories"
      :key="index"
      :category="category"
    />
  </div>
</template>

<style scoped>
.panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

@media (max-width: 640px) {
  .panel-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }
}
</style>
