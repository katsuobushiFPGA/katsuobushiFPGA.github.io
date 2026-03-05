// ===== 日めくりカレンダー =====

const MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const DAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];

const ROKUYO = ["大安", "赤口", "先勝", "友引", "先負", "仏滅"];

/**
 * 旧暦(簡易計算)から六曜を求める
 * 完全な旧暦変換は複雑なので、簡易的なテーブル方式で近似する
 */
function getRokuyo(date) {
    // 簡易六曜: (月 + 日) % 6 で近似 (旧暦ベースが本来だが、簡易版)
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return ROKUYO[(m + d) % 6];
}

/**
 * 和暦を取得
 */
function getWareki(date) {
    const year = date.getFullYear();
    // 令和: 2019年5月1日〜
    if (year >= 2019) {
        const reiwa = year - 2018;
        return `令和${reiwa === 1 ? "元" : reiwa}年`;
    }
    // 平成: 1989年1月8日〜
    if (year >= 1989) {
        const heisei = year - 1988;
        return `平成${heisei === 1 ? "元" : heisei}年`;
    }
    return `${year}年`;
}

/**
 * 年間の通算日数を取得
 */
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

/**
 * 年間の残り日数を取得
 */
function getRemainingDays(date) {
    const endOfYear = new Date(date.getFullYear(), 11, 31);
    const diff = endOfYear - date;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

// ===== DOM References =====
const elMonthEn = document.getElementById("month-en");
const elMonthJp = document.getElementById("month-jp");
const elYear = document.getElementById("year-text");
const elDay = document.getElementById("day-number");
const elDow = document.getElementById("day-of-week");
const elWareki = document.getElementById("wareki");
const elRokuyo = document.getElementById("rokuyo");
const elDayOfYear = document.getElementById("day-of-year");
const elClock = document.getElementById("clock");
const elCalendar = document.getElementById("calendar");

let lastDate = "";

/**
 * カレンダーを更新
 */
function updateCalendar() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    // 日付が変わった場合のみ、カレンダー部分を更新
    if (todayStr !== lastDate) {
        lastDate = todayStr;

        const month = now.getMonth();
        const day = now.getDate();
        const dow = now.getDay();

        elMonthEn.textContent = MONTHS_EN[month];
        elMonthJp.textContent = `${month + 1}月`;
        elYear.textContent = `${now.getFullYear()}年 (${getWareki(now)})`;
        elDay.textContent = day;
        elDow.textContent = `${DAYS_JP[dow]}曜日`;

        // 六曜 & 通算日
        elWareki.textContent = getRokuyo(now);
        elRokuyo.textContent = `${getDayOfYear(now)}日目`;
        elDayOfYear.textContent = `残り${getRemainingDays(now)}日`;

        // 曜日に応じたカラーテーマ
        elCalendar.classList.remove("sunday", "saturday", "weekday");
        if (dow === 0) elCalendar.classList.add("sunday");
        else if (dow === 6) elCalendar.classList.add("saturday");
        else elCalendar.classList.add("weekday");

        // アニメーション
        elDay.classList.remove("animate");
        void elDay.offsetWidth; // reflow強制
        elDay.classList.add("animate");
    }

    // 時計は毎秒更新
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    elClock.textContent = `${hh}:${mm}:${ss}`;
}

// ===== Fullscreen =====
document.getElementById("fullscreen-btn").addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
});

// ===== Init =====
updateCalendar();
setInterval(updateCalendar, 1000);
