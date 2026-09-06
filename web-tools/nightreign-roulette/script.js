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

// Monotonic, so removing a row never lets a later row reuse its id.
let customRestrictionSeq = 0;

// --- State ---
let isSpinning = false;
let spinTimers = [];
let spinIntervals = {};
let playerCount = 1;


// --- DOM ---
const spinBtn = document.getElementById('spin-btn');
const settingsToggle = document.getElementById('settings-toggle');
const settingsBody = document.getElementById('settings-body');
const resultDisplay = document.getElementById('result-display');
const customInput = document.getElementById('custom-restriction-input');
const addBtn = document.getElementById('add-restriction-btn');
const flashOverlay = document.getElementById('flash-overlay');
const slotCharacters = document.getElementById('slot-characters');
const resultCharacters = document.getElementById('result-characters');
const playerInputs = Array.from(document.querySelectorAll('input[name="player-count"]'));

// The radios in index.html are the single source of truth for how many players are offered.
const MAX_PLAYERS = playerInputs.length;



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

    syncPlayerInputs();
    renderCharacterReels();

    spinBtn.addEventListener('click', spin);
    settingsToggle.addEventListener('click', toggleSettings);
    addBtn.addEventListener('click', addCustomRestriction);
    customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCustomRestriction();
    });

    document.querySelectorAll('.select-all-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleAll(btn.dataset.category));
    });

    playerInputs.forEach(input => {
        input.addEventListener('change', () => setPlayerCount(Number(input.value)));
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

// --- Player Count ---
function syncPlayerInputs() {
    playerInputs.forEach(input => {
        input.checked = Number(input.value) === playerCount;
    });
}

function setPlayerCount(count) {
    const rejected = isSpinning
        || !Number.isInteger(count)
        || count < 1
        || count > MAX_PLAYERS;

    if (rejected || count === playerCount) {
        // Put the radios back in sync in case the browser already moved the check.
        syncPlayerInputs();
        return;
    }

    playerCount = count;
    syncPlayerInputs();

    // Reels are about to be replaced — stop anything still writing into them.
    clearAllSpinTimers();
    resultDisplay.classList.remove('visible');
    renderCharacterReels();
}

function setPlayerInputsDisabled(disabled) {
    playerInputs.forEach(input => {
        input.disabled = disabled;
    });
}

// --- Character Reel Identity ---
function characterReelIds() {
    return Array.from({ length: playerCount }, (_, i) => `character-${i + 1}`);
}

function characterLabel(index, count) {
    return count === 1 ? 'Character' : `Player ${index + 1}`;
}

// --- Render Character Reels ---
function renderCharacterReels() {
    slotCharacters.style.setProperty('--cols', playerCount);
    slotCharacters.innerHTML = characterReelIds().map((id, i) => `
    <div class="reel-container" id="reel-${id}">
      <div class="reel-label">${characterLabel(i, playerCount)}</div>
      <div class="reel-window">
        <div class="reel-content" id="reel-text-${id}">—</div>
      </div>
    </div>
  `).join('');
}

// --- Render Character Results ---
// Driven by the reels this spin actually used, not by the current playerCount, so the
// result card can never disagree with what was spun.
function renderCharacterResults(characterReels, results) {
    resultCharacters.style.setProperty('--cols', characterReels.length);
    resultCharacters.textContent = '';

    characterReels.forEach(reel => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const label = document.createElement('div');
        label.className = 'result-label';
        label.textContent = reel.label;

        const value = document.createElement('div');
        value.className = 'result-value';
        value.textContent = results[reel.id] || '—';

        item.append(label, value);
        resultCharacters.appendChild(item);
    });
}

// --- Add Custom Restriction ---
// Built with DOM calls rather than innerHTML: the text comes from the user, and
// interpolating it into markup lets quotes and tags escape into real attributes
// and elements (and silently truncates the stored value at the first quote).
function addCustomRestriction() {
    const value = customInput.value.trim();
    if (!value) return;
    if (getAllRestrictionValues().includes(value)) {
        customInput.value = '';
        return;
    }

    const container = document.getElementById('checkbox-restriction');
    const id = `restriction-custom-${customRestrictionSeq++}`;

    const div = document.createElement('div');
    div.className = 'checkbox-item custom-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.dataset.category = 'restriction';
    checkbox.dataset.value = value;
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = value;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.title = '削除';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => div.remove());

    div.append(checkbox, label, removeBtn);
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

// --- Shuffle (Fisher-Yates, in place) ---
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// --- Pick Characters ---
// Unique per player, matching the game's rule that no two players share a nightfarer.
// When fewer characters are enabled than there are players, exhaust the pool once per
// round and let the leftovers repeat. The final shuffle keeps those repeats from always
// landing on the last player.
function pickCharacters(pool, count) {
    if (!pool.length) return [];

    const picks = [];
    while (picks.length < count) {
        picks.push(...shuffle(pool.slice()).slice(0, count - picks.length));
    }
    return shuffle(picks);
}

// --- Process Result ---
function processResult(value) {
    if (value === 'レベルX') {
        const level = Math.floor(Math.random() * 15) + 1;
        return `レベル${level}`;
    }
    return value;
}

// --- Build Reels ---
// Every final value is decided up front so the character picks can be unique as a set.
// The reels only *display* random values while spinning.
function buildReels(pools) {
    const charPicks = pickCharacters(pools.character, playerCount);

    const characterReels = characterReelIds().map((id, i) => ({
        id,
        label: characterLabel(i, playerCount),
        pool: pools.character,
        final: charPicks[i] ?? null
    }));

    const reels = [...characterReels];

    reels.push({
        id: 'boss',
        pool: pools.boss,
        final: pools.boss.length ? randomPick(pools.boss) : null
    });
    reels.push({
        id: 'restriction',
        pool: pools.restriction,
        final: pools.restriction.length ? randomPick(pools.restriction) : null
    });

    reels.forEach(reel => {
        if (reel.final !== null) reel.final = processResult(reel.final);
    });

    return { reels, characterReels };
}

// --- Clear Timers ---
function clearAllSpinTimers() {
    spinTimers.forEach(clearTimeout);
    spinTimers = [];
    Object.values(spinIntervals).forEach(clearInterval);
    spinIntervals = {};
}

// --- Spin ---
function spin() {
    if (isSpinning) return;

    const pools = {
        character: getEnabledItems('character'),
        boss: getEnabledItems('boss'),
        restriction: getEnabledItems('restriction')
    };

    const hasAnyItems = Object.values(pools).some(pool => pool.length > 0);
    if (!hasAnyItems) {
        spinBtn.classList.add('shake');
        setTimeout(() => spinBtn.classList.remove('shake'), 400);
        return;
    }

    const { reels, characterReels } = buildReels(pools);

    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.add('is-spinning');
    setPlayerInputsDisabled(true);
    resultDisplay.classList.remove('visible');



    // Start spinning all reels
    reels.forEach(reel => {
        const container = document.getElementById(`reel-${reel.id}`);
        const text = document.getElementById(`reel-text-${reel.id}`);
        container.classList.remove('stopped', 'flash-border');
        container.classList.add('spinning');
        text.classList.remove('flash');

        if (reel.pool.length === 0) {
            text.textContent = '—';
            container.classList.remove('spinning');
            return;
        }

        text.classList.add('spinning');
    });

    // Rapid text changes
    reels.forEach(reel => {
        if (reel.pool.length === 0) return;
        const text = document.getElementById(`reel-text-${reel.id}`);

        spinIntervals[reel.id] = setInterval(() => {
            text.textContent = randomPick(reel.pool);
        }, 55);
    });

    // Stop reels with increasing delays (Promise-based).
    // 3 reels (1 player) keep the original 1400 / 2600 / 3800 schedule exactly; more reels
    // tighten the gap so the last reel's slot never goes past 5000ms. These are the timer
    // values, not what the eye sees: each reel then decelerates for a further ~1.7s, so a
    // spin finishes at roughly 5.1s for 1 player and 6.3s for 2-3 players.
    const results = {};
    const stopGap = Math.min(1200, 3600 / (reels.length - 1));

    const stopPromises = reels.map((reel, i) => {
        if (reel.pool.length === 0) {
            results[reel.id] = '—';
            return Promise.resolve();
        }

        return new Promise(resolve => {
            // Slow down before stopping
            const slowdownTimer = setTimeout(() => {
                clearInterval(spinIntervals[reel.id]);
                delete spinIntervals[reel.id];
                const text = document.getElementById(`reel-text-${reel.id}`);

                // Deceleration phase: progressively slower
                let delay = 80;
                let remaining = 8;
                function decelerate() {
                    if (remaining <= 0) {
                        // Final stop — show the value decided at spin start
                        text.classList.remove('spinning');
                        text.textContent = reel.final;
                        text.classList.add('flash');

                        const container = document.getElementById(`reel-${reel.id}`);
                        container.classList.remove('spinning');
                        container.classList.add('stopped', 'flash-border');

                        results[reel.id] = reel.final;

                        // Effects

                        createSparks(container, 16);

                        if (navigator.vibrate) navigator.vibrate([30, 20, 50]);

                        resolve();
                        return;
                    }

                    text.textContent = randomPick(reel.pool);

                    remaining--;
                    delay += 25 + Math.random() * 15;
                    spinTimers.push(setTimeout(decelerate, delay));
                }

                decelerate();
            }, 1400 + i * stopGap - 500);

            spinTimers.push(slowdownTimer);
        });
    });

    // Final reveal after all reels have stopped
    Promise.all(stopPromises).then(() => {
        spinTimers.push(setTimeout(() => {
            renderCharacterResults(characterReels, results);
            document.getElementById('result-boss').textContent = results.boss || '—';
            document.getElementById('result-restriction').textContent = results.restriction || '—';
            resultDisplay.classList.add('visible');

            // Grand finale effects
            triggerFlashOverlay();


            isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.classList.remove('is-spinning');
            setPlayerInputsDisabled(false);
            spinTimers = [];
        }, 500));
    });
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', init);
