<script setup lang="ts">
import { ref, computed } from 'vue'
import LinkPanelGrid from './components/LinkPanelGrid.vue'
import { parseOpml, convertToCategories } from './utils/opmlParser'
import type { LinkCategory } from './types/opml'

const categories = ref<LinkCategory[]>([])
const pageTitle = ref('OPML Link Panel')
const isLoading = ref(false)
const error = ref<string | null>(null)
const isDragOver = ref(false)

// サンプルOPMLデータを外部ファイルから読み込み
async function loadSampleData() {
  isLoading.value = true
  error.value = null

  try {
    // base path を考慮してパスを構築
    const basePath = import.meta.env.BASE_URL
    const xmlUrl = basePath.endsWith('/') ? `${basePath}sample.xml` : `${basePath}/sample.xml`
    const response = await fetch(xmlUrl)
    if (!response.ok) {
      throw new Error('サンプルファイルの読み込みに失敗しました')
    }
    const xmlText = await response.text()
    const opmlData = parseOpml(xmlText)
    pageTitle.value = opmlData.title
    categories.value = convertToCategories(opmlData)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '読み込みエラー'
  } finally {
    isLoading.value = false
  }
}

// ファイル読み込み処理
async function handleFile(file: File) {
  if (!file.name.endsWith('.opml') && !file.name.endsWith('.xml')) {
    error.value = 'OPMLまたはXMLファイルを選択してください'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const text = await file.text()
    const opmlData = parseOpml(text)
    pageTitle.value = opmlData.title
    categories.value = convertToCategories(opmlData)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'ファイル読み込みエラー'
  } finally {
    isLoading.value = false
  }
}

// ファイル選択
function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    handleFile(file)
  }
}

// ドラッグ&ドロップ
function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    handleFile(file)
  }
}

const hasCategories = computed(() => categories.value.length > 0)

// 初回読み込み
loadSampleData()
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="title">{{ pageTitle }}</h1>
      <div class="file-controls">
        <label class="file-label">
          <input
            type="file"
            accept=".opml,.xml"
            @change="onFileSelect"
            class="file-input"
          />
          <span class="file-button">📁 OPMLファイルを選択</span>
        </label>
        <button @click="loadSampleData" class="sample-button">
          🔄 サンプルデータを読み込み
        </button>
      </div>
    </header>

    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragOver }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div v-if="isLoading" class="loading">
        <span class="spinner"></span>
        読み込み中...
      </div>

      <div v-else-if="error" class="error">
        <p>⚠️ {{ error }}</p>
      </div>

      <main v-else-if="hasCategories" class="main-content">
        <LinkPanelGrid :categories="categories" />
      </main>

      <div v-else class="empty-state">
        <p>📄 OPMLファイルをドラッグ&ドロップするか、ファイルを選択してください</p>
      </div>
    </div>

    <footer class="footer">
      <p>OPMLファイルを読み込んでリンクをパネル表示します</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header {
  background: #fff;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (min-width: 768px) {
  .header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.title {
  color: #111;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.file-controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.file-input {
  display: none;
}

.file-label {
  cursor: pointer;
}

.file-button,
.sample-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: #222;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.file-button:hover,
.sample-button:hover {
  transform: translateY(-2px);
  background: #000;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.drop-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: background 0.2s ease;
}

.drop-zone.drag-over {
  background: rgba(0, 0, 0, 0.05);
}

.main-content {
  flex: 1;
}

.loading,
.error,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 1.1rem;
  gap: 1rem;
  padding: 2rem;
}

.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #222;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  color: #c00;
}

.empty-state {
  color: #666;
  text-align: center;
}

.footer {
  background: #fff;
  padding: 1rem 2rem;
  text-align: center;
  border-top: 1px solid #ddd;
}

.footer p {
  color: #888;
  font-size: 0.85rem;
  margin: 0;
}
</style>
