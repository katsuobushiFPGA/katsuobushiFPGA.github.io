<template>
  <div class="barcode-scanner">
    <h2>バーコードスキャナー</h2>
    
    <div class="scanner-container">
      <video ref="videoElement" class="scanner-video" autoplay playsinline></video>
      <div class="scan-guide" v-if="isScanning">
        <div class="guide-box"></div>
      </div>
      <div v-if="isLoading" class="loading">カメラを起動中...</div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
    
    <div class="tips" v-if="isScanning">
      <h4>💡 読み取りのコツ</h4>
      <p>✅ バーコードを緑の枠に<strong>水平に</strong>配置</p>
      <p>✅ バーコードとカメラの距離: <strong>15〜25cm</strong></p>
      <p>✅ バーコード全体が映るように</p>
      <p>✅ 明るい場所で、反射がない位置で</p>
      <p>✅ カメラを動かさず<strong>3秒静止</strong>する</p>
      <p>🔍 スキャン状態はコンソール(F12)で確認できます</p>
    </div>
    
    <div class="focus-control" v-if="isScanning && supportsFocusDistance">
      <label>🎯 フォーカス調整</label>
      <input 
        type="range" 
        v-model.number="focusDistance" 
        :min="minFocusDistance" 
        :max="maxFocusDistance" 
        :step="focusStep"
        @input="adjustFocus"
        class="focus-slider"
      />
      <div class="focus-labels">
        <span>近距離</span>
        <span>遠距離</span>
      </div>
    </div>
    
    <div class="controls">
      <button @click="startScanning" :disabled="isScanning" class="btn btn-primary">
        スキャン開始
      </button>
      <button @click="stopScanning" :disabled="!isScanning" class="btn btn-secondary">
        スキャン停止
      </button>
    </div>
    
    <div class="scan-result" v-if="scannedCode">
      <label>スキャン結果:</label>
      <input 
        type="text" 
        :value="scannedCode" 
        @input="$emit('update:modelValue', $event.target.value)"
        class="barcode-input"
        readonly
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'scan'])

const videoElement = ref(null)
const scannedCode = ref('')
const isScanning = ref(false)
const isLoading = ref(false)
const error = ref('')
const focusDistance = ref(0.2)
const minFocusDistance = ref(0.1)
const maxFocusDistance = ref(0.5)
const focusStep = ref(0.01)
const supportsFocusDistance = ref(false)
let codeReader = null
let controls = null
let videoStream = null

const adjustFocus = async () => {
  if (!videoStream || !supportsFocusDistance.value) return
  
  try {
    const videoTrack = videoStream.getVideoTracks()[0]
    await videoTrack.applyConstraints({
      advanced: [{
        focusMode: 'manual',
        focusDistance: focusDistance.value
      }]
    })
    console.log(`✅ フォーカスを調整しました`)
  } catch (e) {
    console.warn('フォーカス調整に失敗:', e)
  }
}

const startScanning = async () => {
  try {
    error.value = ''
    isLoading.value = true
    isScanning.value = true
    
    // BrowserMultiFormatReaderのインスタンスを作成
    codeReader = new BrowserMultiFormatReader()
    
    // ヒントを設定（デコード精度向上）
    const hints = new Map()
    const { BarcodeFormat, DecodeHintType } = await import('@zxing/library')
    
    // より徹底的にスキャン
    hints.set(DecodeHintType.TRY_HARDER, true)
    // 可能なフォーマットを指定（一般的なバーコード全て）
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      BarcodeFormat.RSS_14
    ])
    codeReader.hints = hints
    
    console.log('🔧 デコード設定:', {
      TRY_HARDER: true,
      formats: hints.get(DecodeHintType.POSSIBLE_FORMATS)?.map(f => f.toString())
    })
    
    // カメラデバイスを取得
    const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices()
    
    console.log('検出されたカメラデバイス:', videoInputDevices)
    console.log('カメラ数:', videoInputDevices.length)
    
    if (videoInputDevices.length === 0) {
      throw new Error('カメラが見つかりませんでした。カメラのアクセス許可を確認してください。')
    }
    
    // 最初のカメラデバイスを使用（高解像度を指定）
    const selectedDeviceId = videoInputDevices[0].deviceId
    console.log('選択されたカメラID:', selectedDeviceId)
    console.log('カメラ名:', videoInputDevices[0].label)
    
    // 高解像度・高フレームレートでカメラを起動
    const constraints = {
      video: {
        deviceId: selectedDeviceId,
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 },
        facingMode: 'environment',
        focusMode: 'continuous',
        advanced: [
          { focusMode: 'continuous' },
          { focusDistance: { ideal: 0.25 } }  // 25cm に最適化
        ]
      }
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    videoStream = stream
    videoElement.value.srcObject = stream
    
    // ビデオトラックの設定を取得
    const videoTrack = stream.getVideoTracks()[0]
    const capabilities = videoTrack.getCapabilities()
    console.log('カメラの機能:', capabilities)
    
    // フォーカス距離調整のサポート状況を確認
    if (capabilities.focusDistance) {
      supportsFocusDistance.value = true
      minFocusDistance.value = capabilities.focusDistance.min || 0.1
      maxFocusDistance.value = capabilities.focusDistance.max || 0.5
      focusDistance.value = 0.2  // デフォルト20cm
      console.log('✅ フォーカス距離調整に対応しています:', {
        min: minFocusDistance.value,
        max: maxFocusDistance.value
      })
    }
    
    // オートフォーカスをサポートしている場合は有効化
    if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        })
        console.log('✅ オートフォーカスを有効化しました')
      } catch (e) {
        console.warn('オートフォーカスの設定に失敗:', e)
      }
    }

    
    // バーコードのデコードを開始
    let scanCount = 0
    let lastLogTime = Date.now()
    let detectionComplete = false
    
    controls = await codeReader.decodeFromVideoElement(
      videoElement.value,
      (result, error) => {
        // 既に検出済みの場合は処理しない
        if (detectionComplete) return
        
        scanCount++
        
        if (result) {
          detectionComplete = true
          scannedCode.value = result.getText()
          emit('update:modelValue', result.getText())
          emit('scan', result.getText())
          console.log('✅ バーコード検出成功!', {
            text: result.getText(),
            format: result.getBarcodeFormat(),
            scanAttempts: scanCount
          })
          
          // 1秒後に自動停止
          setTimeout(() => {
            stopScanning()
          }, 1000)
          
          return  // 以降の処理をスキップ
        }
        
        // デバッグ: 3秒ごとにスキャン状態を表示
        const now = Date.now()
        if (now - lastLogTime > 3000) {
          console.log(`🔍 スキャン中... (${scanCount}回試行)`)
          lastLogTime = now
        }
        
        // エラーは完全に無視（NotFoundExceptionは正常動作）
        // 他のエラーもログを出さない（ノイズを減らす）
      }
    )
    
    isLoading.value = false
  } catch (err) {
    console.error('カメラエラー:', err)
    error.value = err.message || 'カメラの起動に失敗しました'
    isLoading.value = false
    isScanning.value = false
  }
}

const stopScanning = () => {
  if (controls) {
    controls.stop()
  }
  if (codeReader) {
    codeReader.reset()
  }
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop())
    videoStream = null
  }
  isScanning.value = false
  scannedCode.value = ''
}

onUnmounted(() => {
  stopScanning()
})
</script>

<style scoped>
.barcode-scanner {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.scanner-container {
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto 20px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.scanner-video {
  width: 100%;
  height: auto;
  display: block;
}

.scan-guide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.guide-box {
  width: 80%;
  height: 40%;
  border: 3px solid #4CAF50;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  position: relative;
}

.guide-box::before,
.guide-box::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #4CAF50;
}

.guide-box::before {
  top: -3px;
  left: -3px;
  border-right: none;
  border-bottom: none;
}

.guide-box::after {
  bottom: -3px;
  right: -3px;
  border-left: none;
  border-top: none;
}

.tips {
  background: #e8f5e9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: left;
  border: 2px solid #4CAF50;
}

.tips h4 {
  margin: 0 0 8px 0;
  color: #1b5e20;
  text-align: center;
  font-size: 14px;
}

.tips p {
  margin: 6px 0;
  color: #2e7d32;
  font-size: 12px;
  line-height: 1.5;
}

.tips p strong {
  color: #1b5e20;
  font-weight: bold;
}

.focus-control {
  background: #fff3e0;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.focus-control label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #e65100;
  text-align: center;
  font-size: 16px;
}

.focus-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #81c784, #4CAF50, #2e7d32);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.focus-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}

.focus-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: #388e3c;
}

.focus-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}

.focus-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  background: #388e3c;
}

.focus-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.loading,
.error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  border-radius: 8px;
  font-weight: bold;
}

.loading {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.error {
  background: rgba(255, 0, 0, 0.9);
  color: white;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-secondary {
  background: #f44336;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #da190b;
}

.btn-info {
  background: #2196F3;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #0b7dda;
}

.scan-result {
  margin-top: 20px;
}

.scan-result label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.barcode-input {
  width: 100%;
  padding: 12px;
  font-size: 18px;
  border: 2px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  background: #f9f9f9;
}
</style>
