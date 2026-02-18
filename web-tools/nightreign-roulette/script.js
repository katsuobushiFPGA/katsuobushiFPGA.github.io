// ==========================================
// Night Roulette — Enhanced Slot Machine
// ==========================================

// --- Data ---
const DATA = {
    character: [
        '追跡者', '守護者', 'レディ', '隠者', '鉄の目',
        '無頼漢', '執行者', '復讐者', '学者', '葬儀屋'
    ],
    boss: [
        '三つ首の獣', '喰らいつく顎', '知性の蟲', '兆し',
        '調律の魔物', '闇駆ける狩人', '霧の裂け目', '夜を象るもの',
        '安寧者たち', '瓦礫の王',
        '三つ首の獣(常夜)', '喰らいつく顎(常夜)', '知性の蟲(常夜)', '兆し(常夜)',
        '調律の魔物(常夜)', '闇駆ける狩人(常夜)', '霧の裂け目(常夜)', '安寧者たち(常夜)'
    ],
    restriction: [
        '初期武器+見つけた順で拾った武器のみ',
        '聖杯瓶無強化',
        'レベルX',
        '遺物なし'
    ]
};

const customRestrictions = [];

// --- State ---
let isSpinning = false;
let spinTimers = [];


// --- DOM ---
const spinBtn = document.getElementById('spin-btn');
const settingsToggle = document.getElementById('settings-toggle');
const settingsBody = document.getElementById('settings-body');
const resultDisplay = document.getElementById('result-display');
const customInput = document.getElementById('custom-restriction-input');
const addBtn = document.getElementById('add-restriction-btn');
const flashOverlay = document.getElementById('flash-overlay');



// --- Spark Particles ---
function createSparks(container, count = 12) {
    const sparkContainer = document.createElement('div');
    sparkContainer.className = 'spark-container';
    container.appendChild(sparkContainer);

    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const dist = 40 + Math.random() * 60;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;
        spark.style.left = cx + 'px';
        spark.style.top = cy + 'px';
        spark.style.setProperty('--sx', sx + 'px');
        spark.style.setProperty('--sy', sy + 'px');
        spark.style.animationDelay = (Math.random() * 0.15) + 's';
        spark.style.width = (2 + Math.random() * 4) + 'px';
        spark.style.height = spark.style.width;
        sparkContainer.appendChild(spark);
    }

    setTimeout(() => sparkContainer.remove(), 1000);
}

// --- Flash Overlay ---
function triggerFlashOverlay() {
    flashOverlay.classList.remove('active');
    void flashOverlay.offsetWidth; // force reflow
    flashOverlay.classList.add('active');
    setTimeout(() => flashOverlay.classList.remove('active'), 700);
}

// --- Initialize ---
function init() {
    renderCheckboxes('character', DATA.character);
    renderCheckboxes('boss', DATA.boss);
    renderCheckboxes('restriction', DATA.restriction);

    spinBtn.addEventListener('click', spin);
    settingsToggle.addEventListener('click', toggleSettings);
    addBtn.addEventListener('click', addCustomRestriction);
    customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCustomRestriction();
    });

    document.querySelectorAll('.select-all-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleAll(btn.dataset.category));
    });
}

// --- Render Checkboxes ---
function renderCheckboxes(category, items) {
    const container = document.getElementById(`checkbox-${category}`);
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        const id = `${category}-${index}`;
        div.innerHTML = `
      <input type="checkbox" id="${id}" data-category="${category}" data-value="${item}" checked>
      <label for="${id}">${item}</label>
    `;
        container.appendChild(div);
    });
}

// --- Add Custom Restriction ---
function addCustomRestriction() {
    const value = customInput.value.trim();
    if (!value) return;
    if (getAllRestrictionValues().includes(value)) {
        customInput.value = '';
        return;
    }

    customRestrictions.push(value);
    const container = document.getElementById('checkbox-restriction');
    const index = DATA.restriction.length + customRestrictions.length - 1;
    const id = `restriction-custom-${index}`;

    const div = document.createElement('div');
    div.className = 'checkbox-item custom-item';
    div.innerHTML = `
    <input type="checkbox" id="${id}" data-category="restriction" data-value="${value}" checked>
    <label for="${id}">${value}</label>
    <button class="remove-btn" title="削除">✕</button>
  `;

    div.querySelector('.remove-btn').addEventListener('click', () => {
        div.remove();
        const idx = customRestrictions.indexOf(value);
        if (idx >= 0) customRestrictions.splice(idx, 1);
    });

    container.appendChild(div);
    customInput.value = '';
    customInput.focus();
}

function getAllRestrictionValues() {
    const checkboxes = document.querySelectorAll('#checkbox-restriction input[type="checkbox"]');
    return Array.from(checkboxes).map(cb => cb.dataset.value);
}

// --- Toggle All ---
function toggleAll(category) {
    const checkboxes = document.querySelectorAll(
        `#checkbox-${category} input[type="checkbox"]`
    );
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

// --- Toggle Settings ---
function toggleSettings() {
    settingsToggle.classList.toggle('open');
    settingsBody.classList.toggle('open');
}

// --- Get Enabled Items ---
function getEnabledItems(category) {
    const checkboxes = document.querySelectorAll(
        `#checkbox-${category} input[type="checkbox"]:checked`
    );
    return Array.from(checkboxes).map(cb => cb.dataset.value);
}

// --- Random Pick ---
function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Process Result ---
function processResult(value) {
    if (value === 'レベルX') {
        const level = Math.floor(Math.random() * 15) + 1;
        return `レベル${level}`;
    }
    return value;
}

// --- Spin ---
function spin() {
    if (isSpinning) return;

    const categories = ['character', 'boss', 'restriction'];
    const pools = {};

    for (const cat of categories) {
        pools[cat] = getEnabledItems(cat);
    }

    const hasAnyItems = categories.some(cat => pools[cat].length > 0);
    if (!hasAnyItems) {
        spinBtn.classList.add('shake');
        setTimeout(() => spinBtn.classList.remove('shake'), 400);
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.add('is-spinning');
    resultDisplay.classList.remove('visible');



    // Start spinning all reels
    categories.forEach(cat => {
        const container = document.getElementById(`reel-${cat}`);
        const text = document.getElementById(`reel-text-${cat}`);
        container.classList.remove('stopped', 'flash-border');
        container.classList.add('spinning');
        text.classList.remove('flash');

        if (pools[cat].length === 0) {
            text.textContent = '—';
            container.classList.remove('spinning');
            return;
        }

        text.classList.add('spinning');
    });

    // Rapid text changes with tick sounds
    const spinIntervals = {};
    const tickCounters = {};

    categories.forEach(cat => {
        if (pools[cat].length === 0) return;
        const text = document.getElementById(`reel-text-${cat}`);
        tickCounters[cat] = 0;

        spinIntervals[cat] = setInterval(() => {
            text.textContent = randomPick(pools[cat]);
            tickCounters[cat]++;

        }, 55);
    });

    // Stop reels with increasing delays (Promise-based)
    const results = {};
    const stopDelays = [1400, 2600, 3800];

    const stopPromises = categories.map((cat, i) => {
        if (pools[cat].length === 0) {
            results[cat] = '—';
            return Promise.resolve();
        }

        return new Promise(resolve => {
            // Slow down before stopping
            const slowdownTimer = setTimeout(() => {
                clearInterval(spinIntervals[cat]);
                const text = document.getElementById(`reel-text-${cat}`);

                // Deceleration phase: progressively slower
                let delay = 80;
                let remaining = 8;
                function decelerate() {
                    if (remaining <= 0) {
                        // Final stop
                        const raw = randomPick(pools[cat]);
                        const final = processResult(raw);
                        text.classList.remove('spinning');
                        text.textContent = final;
                        text.classList.add('flash');

                        const container = document.getElementById(`reel-${cat}`);
                        container.classList.remove('spinning');
                        container.classList.add('stopped', 'flash-border');

                        results[cat] = final;

                        // Effects

                        createSparks(container, 16);

                        if (navigator.vibrate) navigator.vibrate([30, 20, 50]);

                        resolve();
                        return;
                    }

                    text.textContent = randomPick(pools[cat]);

                    remaining--;
                    delay += 25 + Math.random() * 15;
                    setTimeout(decelerate, delay);
                }

                decelerate();
            }, stopDelays[i] - 500);

            spinTimers.push(slowdownTimer);
        });
    });

    // Final reveal after all reels have stopped
    Promise.all(stopPromises).then(() => {
        setTimeout(() => {
            document.getElementById('result-character').textContent = results.character || '—';
            document.getElementById('result-boss').textContent = results.boss || '—';
            document.getElementById('result-restriction').textContent = results.restriction || '—';
            resultDisplay.classList.add('visible');

            // Grand finale effects
            triggerFlashOverlay();


            isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.classList.remove('is-spinning');
            spinTimers = [];
        }, 500);
    });
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', init);
