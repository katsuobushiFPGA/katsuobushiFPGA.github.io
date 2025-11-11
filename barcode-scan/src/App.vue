<script setup>
import { ref } from 'vue'
import BarcodeScanner from './components/BarcodeScanner.vue'
import ScanHistory from './components/ScanHistory.vue'
import { useScanHistory } from './composables/useScanHistory'

const scannedBarcode = ref('')
const scannerRef = ref(null)
// const { loading, error, productData, searchProduct } = useProductApi()
const { history, addToHistory, clearHistory, removeFromHistory } = useScanHistory()

// バーコードがスキャンされたときの処理
const handleScan = async (barcode) => {
  if (!barcode) return
  
  scannedBarcode.value = barcode
  
  // 商品検索は一旦無効化
  // const product = await searchProduct(barcode)
  
  // バーコードのみを履歴に保存
  addToHistory(barcode, {
    name: 'バーコード: ' + barcode,
    brands: '未検索',
    barcode: barcode
  })
  
  // スキャン成功後、自動的に停止
  console.log('✅ スキャン完了 - 自動停止します')
}

// 履歴から選択されたときの処理
const handleHistorySelect = async (barcode) => {
  scannedBarcode.value = barcode
  // 商品検索は無効化
  // await searchProduct(barcode)
}

// 履歴から削除
const handleHistoryRemove = (barcode) => {
  removeFromHistory(barcode)
}

// 履歴をクリア
const handleHistoryClear = () => {
  if (confirm('履歴をすべて削除しますか?')) {
    clearHistory()
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>📱 バーコードリーダー</h1>
      <p>カメラでバーコードをスキャンして商品情報を取得</p>
    </header>

    <main class="app-main">
      <div class="container">
        <BarcodeScanner 
          ref="scannerRef"
          v-model="scannedBarcode"
          @scan="handleScan"
        />

        <!-- 商品情報検索は一旦無効化
        <ProductInfo 
          :product="productData"
          :loading="loading"
          :error="error"
        />
        -->

        <ScanHistory 
          :history="history"
          @select="handleHistorySelect"
          @remove="handleHistoryRemove"
          @clear="handleHistoryClear"
        />
      </div>
    </main>

    <footer class="app-footer">
      <p>Powered by ZXing Library</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.app-header p {
  color: #666;
  font-size: 16px;
}

.app-main {
  flex: 1;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.app-footer {
  background: rgba(0, 0, 0, 0.2);
  color: white;
  text-align: center;
  padding: 15px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 24px;
  }
  
  .app-header p {
    font-size: 14px;
  }
  
  .app-main {
    padding: 10px;
  }
}
</style>
