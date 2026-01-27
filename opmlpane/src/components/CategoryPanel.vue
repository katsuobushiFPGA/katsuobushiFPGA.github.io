<script setup lang="ts">
import type { LinkCategory } from '../types/opml'

defineProps<{
  category: LinkCategory
}>()
</script>

<template>
  <div class="category-panel">
    <h2 class="category-title">{{ category.name }}</h2>
    <ul class="link-list">
      <li v-for="(link, index) in category.links" :key="index" class="link-item">
        <a
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
        >
          <span class="link-title">{{ link.title }}</span>
          <span v-if="link.description" class="link-description">{{ link.description }}</span>
        </a>
        <a
          v-if="link.feedUrl"
          :href="link.feedUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="feed-icon"
          title="RSSフィード"
        >
          📡
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.category-panel {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-panel:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.category-title {
  color: #111;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #222;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.link {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.75rem;
  background: #f8f8f8;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s ease;
}

.link:hover {
  background: #eee;
}

.link-title {
  color: #222;
  font-size: 0.9rem;
  font-weight: 500;
}

.link-description {
  color: #666;
  font-size: 0.75rem;
  margin-top: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-icon {
  text-decoration: none;
  font-size: 1rem;
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.feed-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>
