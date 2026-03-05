# Web Notifications API 完全ガイド

## 📖 目次

1. [Web通知とは？](#web通知とは)
2. [基本的な使い方](#基本的な使い方)
3. [通知の許可](#通知の許可)
4. [通知オプション](#通知オプション)
5. [通知イベント](#通知イベント)
6. [実践的なユースケース](#実践的なユースケース)
7. [Service Workerとの連携](#service-workerとの連携)
8. [ベストプラクティス](#ベストプラクティス)
9. [ブラウザサポート](#ブラウザサポート)

---

## Web通知とは？

Web Notifications APIは、Webページがユーザーのデスクトップやモバイルデバイスにネイティブ通知を表示できるようにするブラウザAPIです。

### 特徴

- **ネイティブ体験**: OSのネイティブ通知システムを使用
- **バックグラウンド通知**: ブラウザがバックグラウンドでも通知可能
- **ユーザー許可制**: プライバシー保護のため、明示的な許可が必要
- **カスタマイズ可能**: アイコン、画像、アクションボタンなどを設定可能

---

## 基本的な使い方

### 1. サポートチェック

```javascript
if ('Notification' in window) {
    console.log('このブラウザはWeb通知をサポートしています');
} else {
    console.log('このブラウザはWeb通知をサポートしていません');
}
```

### 2. 最もシンプルな通知

```javascript
// 許可が得られている場合
new Notification('こんにちは！');
```

### 3. 本文付きの通知

```javascript
new Notification('新着メッセージ', {
    body: '田中さんからメッセージが届きました'
});
```

---

## 通知の許可

Web通知を使用するには、ユーザーの明示的な許可が必要です。

### 許可状態の確認

```javascript
// 現在の許可状態を確認
console.log(Notification.permission);
// 'granted' - 許可済み
// 'denied'  - 拒否済み
// 'default' - 未決定（まだ聞いていない）
```

### 許可のリクエスト

```javascript
// 許可をリクエスト（Promiseを返す）
Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
        console.log('通知が許可されました！');
        new Notification('ありがとうございます！');
    } else if (permission === 'denied') {
        console.log('通知が拒否されました');
    }
});

// async/await を使用する場合
async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}
```

### 重要なポイント

- **ユーザーアクション必須**: 多くのブラウザでは、ボタンクリックなどのユーザーアクションがないと許可リクエストがブロックされます
- **一度だけ**: 許可ダイアログは通常一度しか表示されません
- **拒否の解除**: ユーザーが拒否した場合、ブラウザの設定から手動で解除する必要があります

---

## 通知オプション

Notificationコンストラクタの第2引数でさまざまなオプションを指定できます。

### 基本オプション

```javascript
const notification = new Notification('タイトル', {
    // 通知の本文
    body: 'これは通知の本文です',
    
    // アイコン（小さな画像）
    icon: '/path/to/icon.png',
    
    // バッジ（モバイルで使用される小さなアイコン）
    badge: '/path/to/badge.png',
    
    // 大きな画像（Chromeなど一部ブラウザでサポート）
    image: '/path/to/large-image.png',
    
    // タグ（同じタグの通知は置換される）
    tag: 'message-group-1',
    
    // 通知のタイムスタンプ
    timestamp: Date.now(),
    
    // 通知の方向（ltr, rtl, auto）
    dir: 'auto',
    
    // 通知の言語
    lang: 'ja'
});
```

### 動作制御オプション

```javascript
const notification = new Notification('タイトル', {
    // ユーザーが操作するまで自動で閉じない
    requireInteraction: true,
    
    // サイレントモード（音を鳴らさない）
    silent: true,
    
    // 通知と一緒に送るデータ（イベントハンドラで使用可能）
    data: {
        messageId: 123,
        url: '/messages/123'
    },
    
    // 再通知（同じタグで再度通知が来たときに再度通知するか）
    renotify: true
});
```

### アクションボタン（Service Worker必須）

```javascript
// Service Worker内でのみ動作
const notification = new Notification('新着メッセージ', {
    body: '田中さんからメッセージが届きました',
    actions: [
        {
            action: 'reply',
            title: '返信',
            icon: '/icons/reply.png'
        },
        {
            action: 'archive',
            title: 'アーカイブ',
            icon: '/icons/archive.png'
        }
    ]
});
```

---

## 通知イベント

通知には4つのイベントがあります。

```javascript
const notification = new Notification('テスト通知', {
    body: 'これはテストです'
});

// 通知が表示されたとき
notification.onshow = (event) => {
    console.log('通知が表示されました');
};

// 通知がクリックされたとき
notification.onclick = (event) => {
    console.log('通知がクリックされました');
    // よくある使い方：ウィンドウにフォーカスして特定のページを開く
    window.focus();
    window.location.href = '/messages';
    notification.close(); // 通知を閉じる
};

// 通知が閉じられたとき（手動またはタイムアウト）
notification.onclose = (event) => {
    console.log('通知が閉じられました');
};

// エラーが発生したとき（アイコンの読み込み失敗など）
notification.onerror = (event) => {
    console.error('通知エラー:', event);
};
```

### 通知を手動で閉じる

```javascript
const notification = new Notification('テスト');

// 5秒後に閉じる
setTimeout(() => {
    notification.close();
}, 5000);
```

---

## 実践的なユースケース

### 1. 新着メッセージ通知

```javascript
function notifyNewMessage(sender, message, avatar) {
    if (Notification.permission !== 'granted') return;
    
    const notification = new Notification(`${sender}からのメッセージ`, {
        body: message,
        icon: avatar,
        tag: `message-${sender}`, // 同じ送信者からの通知をグループ化
        data: { sender }
    });
    
    notification.onclick = () => {
        window.focus();
        openChat(sender);
        notification.close();
    };
}
```

### 2. タイマー/リマインダー

```javascript
function setReminder(message, minutes) {
    const ms = minutes * 60 * 1000;
    
    setTimeout(() => {
        new Notification('リマインダー ⏰', {
            body: message,
            icon: '/icons/reminder.png',
            requireInteraction: true, // 手動で閉じるまで表示
            tag: 'reminder'
        });
    }, ms);
    
    console.log(`${minutes}分後にリマインダーを設定しました`);
}

// 使用例
setReminder('会議が始まります', 5);
```

### 3. ダウンロード完了通知

```javascript
async function downloadFile(url) {
    try {
        // ダウンロード処理
        const response = await fetch(url);
        const blob = await response.blob();
        
        // ダウンロード完了通知
        new Notification('ダウンロード完了 ✅', {
            body: `ファイルのダウンロードが完了しました`,
            icon: '/icons/download.png'
        });
        
        return blob;
    } catch (error) {
        new Notification('ダウンロードエラー ❌', {
            body: 'ファイルのダウンロードに失敗しました',
            icon: '/icons/error.png'
        });
        throw error;
    }
}
```

### 4. バックグラウンド通知（ページを離れても）

```javascript
// ページの可視性が変わったときにのみ通知
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // ページが非表示になった
        // この後にイベントが発生したら通知を送る
        startBackgroundNotifications();
    } else {
        // ページが再表示された
        stopBackgroundNotifications();
    }
});
```

---

## Service Workerとの連携

Service Workerを使うと、より高度な通知機能が使えます。

### Service Workerの登録

```javascript
// main.js
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('Service Worker登録成功');
        })
        .catch(error => {
            console.error('Service Worker登録失敗:', error);
        });
}
```

### Service Workerからの通知

```javascript
// sw.js
self.addEventListener('push', event => {
    const data = event.data.json();
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: '/badge.png',
            actions: [
                { action: 'open', title: '開く' },
                { action: 'dismiss', title: '閉じる' }
            ],
            data: data
        })
    );
});

// 通知のアクションをハンドル
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});
```

---

## ベストプラクティス

### 1. 適切なタイミングで許可を求める

```javascript
// ❌ ページ読み込み直後にいきなり許可を求める
window.onload = () => {
    Notification.requestPermission(); // 悪い例
};

// ✅ ユーザーが関連機能を使おうとしたときに求める
document.getElementById('enable-notifications').onclick = () => {
    Notification.requestPermission(); // 良い例
};
```

### 2. 通知を乱用しない

```javascript
// ❌ 些細なことで頻繁に通知
function badExample() {
    new Notification('ボタンをクリックしました'); // うるさい
}

// ✅ 重要で、ユーザーにとって価値のある通知のみ
function goodExample() {
    new Notification('注文が発送されました', {
        body: '到着予定: 明日'
    });
}
```

### 3. タグを活用して通知をグループ化

```javascript
// 同じ会話の通知は1つにまとめる
function notifyMessage(chatId, message) {
    new Notification('新着メッセージ', {
        body: message,
        tag: `chat-${chatId}`, // 同じタグの通知は上書きされる
        renotify: true // 再通知音を鳴らす
    });
}
```

### 4. フォールバックを用意する

```javascript
function sendNotification(title, options) {
    // Web通知がサポートされている場合
    if ('Notification' in window && Notification.permission === 'granted') {
        return new Notification(title, options);
    }
    
    // フォールバック: ページ内通知
    showInPageNotification(title, options.body);
}
```

---

## ブラウザサポート

### デスクトップ

| ブラウザ | サポート状況 |
|---------|-------------|
| Chrome | ✅ 完全サポート |
| Firefox | ✅ 完全サポート |
| Safari | ✅ サポート（一部制限あり） |
| Edge | ✅ 完全サポート |

### モバイル

| ブラウザ | サポート状況 |
|---------|-------------|
| Chrome for Android | ✅ Service Worker経由でサポート |
| Safari for iOS | ⚠️ iOS 16.4以降、PWAでのみサポート |
| Firefox for Android | ✅ サポート |

### 注意点

1. **HTTPS必須**: ほとんどのブラウザでHTTPS接続が必要（localhostは例外）
2. **ユーザーアクション**: 許可リクエストにはユーザーのクリック等が必要
3. **モバイルの制限**: モバイルブラウザでは制限が多い

---

## デモの実行方法

このデモをローカルで実行するには：

```bash
# 方法1: Python（Python 3）
cd web-tools/web-notifications-demo
python -m http.server 8000

# 方法2: Node.js（npx）
npx serve .

# 方法3: VS Code Live Server拡張機能
# 右クリック → "Open with Live Server"
```

ブラウザで `http://localhost:8000` を開いてデモを体験できます。

---

## 参考リンク

- [MDN Web Docs - Notifications API](https://developer.mozilla.org/ja/docs/Web/API/Notifications_API)
- [MDN Web Docs - Using the Notifications API](https://developer.mozilla.org/ja/docs/Web/API/Notifications_API/Using_the_Notifications_API)
- [Web.dev - Notification](https://web.dev/articles/notifications)

---

## ライセンス

MIT License
