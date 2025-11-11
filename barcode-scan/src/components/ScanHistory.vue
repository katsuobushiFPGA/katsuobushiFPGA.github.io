<template>
  <div class="scan-history">
    <div class="history-header">
      <h3>スキャン履歴</h3>
      <button 
        v-if="history.length > 0" 
        @click="$emit('clear')" 
        class="btn-clear"
      >
        履歴をクリア
      </button>
    </div>

    <div v-if="history.length === 0" class="empty-history">
      <p>まだ履歴がありません</p>
    </div>

    <div v-else class="history-list">
      <div 
        v-for="item in history" 
        :key="item.barcode"
        class="history-item"
        @click="$emit('select', item.barcode)"
      >
        <div class="item-content">
          <div class="item-info">
            <strong class="product-name">{{ item.productName }}</strong>
            <span class="barcode-text">{{ item.barcode }}</span>
            <span class="timestamp">{{ formatDate(item.timestamp) }}</span>
          </div>
          <button 
            @click.stop="$emit('remove', item.barcode)"
            class="btn-remove"
            title="削除"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select', 'remove', 'clear'])

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 1分未満
  if (diff < 60000) {
    return 'たった今'
  }
  
  // 1時間未満
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分前`
  }
  
  // 24時間未満
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}時間前`
  }
  
  // それ以上
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.scan-history {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4CAF50;
}

.history-header h3 {
  margin: 0;
  color: #333;
}

.btn-clear {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;
}

.btn-clear:hover {
  background: #da190b;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: #f0f0f0;
  border-color: #4CAF50;
  transform: translateX(5px);
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.product-name {
  font-size: 16px;
  color: #333;
}

.barcode-text {
  font-size: 14px;
  color: #666;
  font-family: monospace;
}

.timestamp {
  font-size: 12px;
  color: #999;
}

.btn-remove {
  width: 30px;
  height: 30px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #f44336;
  color: white;
  border-color: #f44336;
}

/* スクロールバーのスタイリング */
.history-list::-webkit-scrollbar {
  width: 8px;
}

.history-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
