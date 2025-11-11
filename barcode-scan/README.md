# バーコードリーダーアプリ

Vue.js 3 と ZXing を使用したバーコード読み取りアプリケーションです。カメラでバーコードをスキャンし、Open Food Facts API を使用して商品情報を取得・表示します。

## 機能

- 📱 カメラを使用したリアルタイムバーコードスキャン
- 🔍 全種類のバーコード対応（EAN、UPC、QRコードなど）
- 📦 商品情報の自動取得・表示（Open Food Facts API）
- 📝 スキャン履歴の保存（LocalStorage）
- 🔄 履歴から商品情報の再検索

## セットアップ

### 必要要件

- Node.js 18.x 以上（推奨: 20.x 以上）
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install
```

### 開発サーバーの起動

```bash
# 開発モードで起動
npm run dev
```

ブラウザで `http://localhost:5173` を開いてアクセスします。

### ビルド

```bash
# 本番用ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## 使い方

1. **スキャン開始**: 「スキャン開始」ボタンをクリックしてカメラを起動
2. **バーコード読み取り**: カメラにバーコードをかざすと自動的に読み取り
3. **商品情報表示**: 読み取ったバーコードから商品情報を取得して表示
4. **履歴確認**: スキャン履歴から過去の検索結果を確認・再検索

## プロジェクト構成

```
src/
├── components/
│   ├── BarcodeScanner.vue    # バーコードスキャナーコンポーネント
│   ├── ProductInfo.vue        # 商品情報表示コンポーネント
│   └── ScanHistory.vue        # スキャン履歴コンポーネント
├── composables/
│   ├── useProductApi.js       # Open Food Facts API 連携
│   └── useScanHistory.js      # スキャン履歴管理
├── App.vue                    # メインアプリケーション
└── main.js                    # エントリーポイント
```

## 技術スタック

- **フレームワーク**: Vue.js 3 (Composition API)
- **ビルドツール**: Vite
- **バーコード読み取り**: @zxing/library, @zxing/browser
- **API**: Open Food Facts API
- **ストレージ**: LocalStorage

## 注意事項

- カメラへのアクセス許可が必要です
- HTTPS環境またはlocalhostでのみカメラが動作します
- Open Food Facts APIに登録されていない商品は情報が取得できません

## ライセンス

MIT

