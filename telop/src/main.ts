import { gsap } from "gsap";

class Telop {
  private wrapper: HTMLElement;
  private container: HTMLElement;
  private content: HTMLElement;
  private timeline: gsap.core.Timeline | null = null;
  private isPaused: boolean = false;
  private speedPixelsPerSecond: number = 150; // テロップの速度 (px/秒)

  constructor(wrapperSelector: string, containerSelector: string, contentSelector: string) {
    const wrapper = document.querySelector<HTMLElement>(wrapperSelector);
    const container = document.querySelector<HTMLElement>(containerSelector);
    const content = document.querySelector<HTMLElement>(contentSelector);

    if (!wrapper || !container || !content) {
      throw new Error(`Elements not found.`);
    }

    this.wrapper = wrapper;
    this.container = container;
    this.content = content;

    this.init();
  }

  private init() {
    // 初回アニメーション開始
    this.startAnimation();

    // ウィンドウリサイズ時に再計算してアニメーションをリセット
    // (リサイズ中のチラつきを防ぐためにdebounceを入れるのがベストですが今回はシンプルに)
    window.addEventListener('resize', () => {
        this.startAnimation();
    });
  }

  private startAnimation() {
    // 既存のアニメーションがあれば破棄
    if (this.timeline) {
      this.timeline.kill();
    }

    // コンテナの幅（表示領域の幅）
    const containerWidth = this.container.clientWidth;
    // テキストコンテンツの幅
    const contentWidth = this.content.offsetWidth;
    
    // アニメーションの距離: 
    // コンテナの右端(x: containerWidth) から コンテンツが完全に隠れる左端(x: -contentWidth) まで
    const distance = containerWidth + contentWidth;
    
    // 距離と速度から時間を計算 ( time = distance / speed )
    const duration = distance / this.speedPixelsPerSecond;

    // GSAPタイムラインの作成
    this.timeline = gsap.timeline({ repeat: -1 });

    // fromToで動きを指定
    this.timeline.fromTo(
        this.content, 
        { 
            x: containerWidth // 開始位置: コンテナの右端
        },
        { 
            x: -contentWidth, // 終了位置: 左端へ隠れるところまで
            duration: duration, 
            ease: "none" // 等速運動
        }
    );

    // もし一時停止中だった状態なら停止状態を維持
    if (this.isPaused) {
        this.timeline.pause();
    }
  }

  /**
   * テキストを更新してテロップを再始動する
   */
  public updateText(text: string) {
    this.content.textContent = text;
    // コンテンツ幅が変わるためアニメーションを再計算
    this.startAnimation();
  }

  /**
   * 一時停止/再開の切り替え
   */
  public togglePause() {
    if (!this.timeline) return;
    
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.timeline.pause();
    } else {
      this.timeline.play();
    }
  }

  /**
   * 背景色の変更
   */
  public setBackgroundColor(color: string) {
    this.wrapper.style.backgroundColor = color;
  }

  /**
   * 文字色の変更
   */
  public setTextColor(color: string) {
    this.content.style.color = color;
  }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // テロップクラスのインスタンス化 (wrapperのセレクタを追加)
    const telop = new Telop('.telop-container-wrapper', '.telop-container', '.telop-content');

    // UI要素の取得
    const updateBtn = document.getElementById('updateBtn');
    const input = document.getElementById('telopArgs') as HTMLInputElement;
    const pauseBtn = document.getElementById('pauseBtn');
    const bgColorInput = document.getElementById('bgColorInput') as HTMLInputElement;
    const textColorInput = document.getElementById('textColorInput') as HTMLInputElement;

    // イベントリスナーの設定
    updateBtn?.addEventListener('click', () => {
        if (input && input.value) {
            telop.updateText(input.value);
            input.value = ''; // 入力欄をクリア
        }
    });

    // Enterキーでも更新できるようにする
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value) {
            telop.updateText(input.value);
            input.value = '';
        }
    });

    pauseBtn?.addEventListener('click', () => {
        telop.togglePause();
    });

    // 色変更時のイベントリスナー
    bgColorInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      telop.setBackgroundColor(target.value);
    });

    textColorInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      telop.setTextColor(target.value);
    });
});
