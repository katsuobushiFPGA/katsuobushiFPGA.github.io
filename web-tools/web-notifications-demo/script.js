// ===================================
// Web Notifications API デモ
// ===================================

// DOM要素の取得
const permissionStatus = document.getElementById('permission-status');
const requestPermissionBtn = document.getElementById('request-permission');
const sendBasicBtn = document.getElementById('send-basic');
const sendCustomBtn = document.getElementById('send-custom');
const sendDelayedBtn = document.getElementById('send-delayed');
const clearLogBtn = document.getElementById('clear-log');
const eventLog = document.getElementById('event-log');
const timerStatus = document.getElementById('timer-status');

// タイマーID保持用
let delayTimerId = null;

// ===================================
// 初期化
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // 通知APIのサポートチェック
    if (!('Notification' in window)) {
        logEvent('このブラウザはWeb通知をサポートしていません', 'error');
        disableAllButtons();
        return;
    }
    
    // 現在の許可状態を表示
    updatePermissionStatus();
});

// ===================================
// 許可状態の更新
// ===================================
function updatePermissionStatus() {
    const permission = Notification.permission;
    permissionStatus.textContent = getPermissionText(permission);
    permissionStatus.className = 'status ' + permission;
    
    // 許可状態に応じてボタンを有効/無効化
    const isGranted = permission === 'granted';
    sendBasicBtn.disabled = !isGranted;
    sendCustomBtn.disabled = !isGranted;
    sendDelayedBtn.disabled = !isGranted;
    
    // 既に許可/拒否されている場合はリクエストボタンを無効化
    if (permission !== 'default') {
        requestPermissionBtn.disabled = true;
        requestPermissionBtn.textContent = permission === 'granted' 
            ? '✓ 許可済み' 
            : '✗ 拒否されています';
    }
}

function getPermissionText(permission) {
    switch (permission) {
        case 'granted':
            return '許可済み ✓';
        case 'denied':
            return '拒否 ✗';
        case 'default':
            return '未設定';
        default:
            return permission;
    }
}

function disableAllButtons() {
    requestPermissionBtn.disabled = true;
    sendBasicBtn.disabled = true;
    sendCustomBtn.disabled = true;
    sendDelayedBtn.disabled = true;
}

// ===================================
// 通知の許可リクエスト
// ===================================
requestPermissionBtn.addEventListener('click', async () => {
    try {
        // 通知の許可をリクエスト
        const permission = await Notification.requestPermission();
        
        logEvent(`許可リクエスト結果: ${getPermissionText(permission)}`, 
            permission === 'granted' ? 'show' : 'error');
        
        // 状態を更新
        updatePermissionStatus();
        
    } catch (error) {
        logEvent(`エラー: ${error.message}`, 'error');
    }
});

// ===================================
// 基本的な通知
// ===================================
sendBasicBtn.addEventListener('click', () => {
    const title = document.getElementById('basic-title').value || '通知';
    const body = document.getElementById('basic-body').value || '';
    
    // 基本的な通知の作成
    const notification = new Notification(title, {
        body: body
    });
    
    // イベントリスナーの設定
    setupNotificationEvents(notification, '基本通知');
    
    logEvent('基本通知を送信しました', 'show');
});

// ===================================
// カスタム通知
// ===================================
sendCustomBtn.addEventListener('click', () => {
    const title = document.getElementById('custom-title').value || '通知';
    const body = document.getElementById('custom-body').value || '';
    const icon = document.getElementById('custom-icon').value;
    const tag = document.getElementById('custom-tag').value;
    const requireInteraction = document.getElementById('require-interaction').checked;
    const silent = document.getElementById('silent-mode').checked;
    
    // カスタムオプション付きの通知
    const options = {
        body: body,
        icon: icon || undefined,
        tag: tag || undefined,
        requireInteraction: requireInteraction,
        silent: silent,
        // タイムスタンプを設定
        timestamp: Date.now(),
        // バッジ（一部ブラウザでサポート）
        badge: 'https://via.placeholder.com/96/667eea/FFFFFF?text=N',
    };
    
    const notification = new Notification(title, options);
    
    // イベントリスナーの設定
    setupNotificationEvents(notification, 'カスタム通知');
    
    logEvent(`カスタム通知を送信しました (タグ: ${tag || 'なし'})`, 'show');
});

// ===================================
// 遅延通知
// ===================================
sendDelayedBtn.addEventListener('click', () => {
    const seconds = parseInt(document.getElementById('delay-seconds').value) || 5;
    
    // 既存のタイマーをクリア
    if (delayTimerId) {
        clearTimeout(delayTimerId);
    }
    
    // カウントダウン表示
    let remaining = seconds;
    timerStatus.textContent = `${remaining}秒後に通知を送信します...`;
    
    const countdownId = setInterval(() => {
        remaining--;
        if (remaining > 0) {
            timerStatus.textContent = `${remaining}秒後に通知を送信します...`;
        } else {
            clearInterval(countdownId);
            timerStatus.textContent = '';
        }
    }, 1000);
    
    // 遅延後に通知を送信
    delayTimerId = setTimeout(() => {
        const notification = new Notification('タイマー通知 ⏰', {
            body: `${seconds}秒が経過しました！`,
            icon: 'https://via.placeholder.com/128/FF9800/FFFFFF?text=⏰',
            tag: 'timer-notification',
            requireInteraction: true
        });
        
        setupNotificationEvents(notification, 'タイマー通知');
        logEvent(`タイマー通知を送信しました (${seconds}秒後)`, 'show');
        
        delayTimerId = null;
    }, seconds * 1000);
    
    logEvent(`${seconds}秒後に通知を送信するよう設定しました`, 'show');
});

// ===================================
// 通知イベントの設定
// ===================================
function setupNotificationEvents(notification, name) {
    // 通知が表示されたとき
    notification.onshow = () => {
        logEvent(`[${name}] 表示されました`, 'show');
    };
    
    // 通知がクリックされたとき
    notification.onclick = (event) => {
        logEvent(`[${name}] クリックされました`, 'click');
        // クリック時にウィンドウにフォーカス
        window.focus();
        notification.close();
    };
    
    // 通知が閉じられたとき
    notification.onclose = () => {
        logEvent(`[${name}] 閉じられました`, 'close');
    };
    
    // エラーが発生したとき
    notification.onerror = (error) => {
        logEvent(`[${name}] エラー: ${error}`, 'error');
    };
}

// ===================================
// イベントログ
// ===================================
function logEvent(message, type = '') {
    // プレースホルダーを削除
    const placeholder = eventLog.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    // タイムスタンプを追加
    const now = new Date();
    const timestamp = now.toLocaleTimeString('ja-JP');
    
    // ログエントリを作成
    const entry = document.createElement('p');
    entry.className = 'log-entry ' + type;
    entry.textContent = `[${timestamp}] ${message}`;
    
    // 最新のログを上に追加
    eventLog.insertBefore(entry, eventLog.firstChild);
    
    // ログが多すぎる場合は古いものを削除
    while (eventLog.children.length > 50) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

// ログをクリア
clearLogBtn.addEventListener('click', () => {
    eventLog.innerHTML = '<p class="placeholder">イベントがここに表示されます...</p>';
});

// ===================================
// 追加のデモ機能
// ===================================

// ページが非表示になったときの通知テスト
document.addEventListener('visibilitychange', () => {
    if (document.hidden && Notification.permission === 'granted') {
        // ページを離れた時のみログに記録（通知は送らない）
        console.log('ページが非表示になりました - ここで通知を送ることができます');
    }
});
