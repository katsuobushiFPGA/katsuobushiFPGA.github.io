import { ref } from 'vue'

const STORAGE_KEY = 'barcode_scan_history'

export function useScanHistory() {
  const history = ref([])

  // LocalStorageから履歴を読み込む
  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        history.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('履歴の読み込みに失敗しました:', error)
      history.value = []
    }
  }

  // LocalStorageに履歴を保存
  const saveHistory = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch (error) {
      console.error('履歴の保存に失敗しました:', error)
    }
  }

  // 新しいスキャン結果を履歴に追加
  const addToHistory = (barcode, productData) => {
    // 既存の同じバーコードを削除
    history.value = history.value.filter(item => item.barcode !== barcode)
    
    // 新しい履歴を先頭に追加
    history.value.unshift({
      barcode,
      productName: productData?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      productData
    })
    
    // 最大50件まで保存
    if (history.value.length > 50) {
      history.value = history.value.slice(0, 50)
    }
    
    saveHistory()
  }

  // 履歴をクリア
  const clearHistory = () => {
    history.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  // 特定の履歴を削除
  const removeFromHistory = (barcode) => {
    history.value = history.value.filter(item => item.barcode !== barcode)
    saveHistory()
  }

  // 初期化時に履歴を読み込む
  loadHistory()

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
    loadHistory
  }
}
