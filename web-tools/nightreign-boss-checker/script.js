// ボスデータの定義
// キー: 1日目のボスID
// 値: ルート情報の配列 { day2: [2日目ボスID...], result: 3日目ボス名 }
const bossRoutes = {
    // 亜人 / 鈴玉狩り
    "ajin": [
        { day2: ["omen", "tree_sentinel"], result: "グラディウス(常夜)" }
    ],
    "bell": [
        { day2: ["omen", "tree_sentinel"], result: "グラディウス(常夜)" }
    ],

    // 王族の幽鬼
    "revenant": [
        { day2: ["crucible_hippo", "death_rite_bird", "godskin_duo"], result: "リブラ(常夜の王)" },
        { day2: ["remote_commander", "dragonkin", "nameless_king"], result: "フルゴール(常夜)" }
    ],

    // 接ぎ木の君主
    "grafted": [
        { day2: ["godskin_duo", "fallingstar", "tree_sentinel"], result: "マリス(常夜)" },
        { day2: ["godskin_duo", "draconic_tree_sentinel", "dancer"], result: "カリゴ(常夜)" }
    ],

    // 英雄のガーゴイル
    "gargoyle": [
        { day2: ["crucible_hippo", "remote_commander", "ancient_dragon"], result: "エデレ(常夜)" },
        { day2: ["tree_sentinel", "godskin_duo", "fallingstar"], result: "マリス(常夜)" }
    ],

    // 夜の騎兵
    "cavalry": [
        { day2: ["remote_commander", "ancient_dragon", "crucible_hippo"], result: "エデレ(常夜)" },
        { day2: ["remote_commander", "dragonkin", "nameless_king"], result: "フルゴール(常夜)" }
    ],

    // 溶鉄デーモン
    "demon": [
        { day2: ["draconic_tree_sentinel", "dragonkin", "magma_wyrm"], result: "グノスター(常夜)" },
        { day2: ["draconic_tree_sentinel", "dancer", "godskin_duo"], result: "カリゴ(常夜)" },
        { day2: ["tree_sentinel", "fallingstar", "godskin_duo"], result: "マリス(常夜)" }
    ],

    // 戦場の宿将
    "commander": [
        { day2: ["godskin_duo", "crucible_hippo", "death_rite_bird"], result: "リブラ(常夜の王)" },
        { day2: ["draconic_tree_sentinel", "dragonkin", "magma_wyrm"], result: "グノスター(常夜)" }
    ],

    // 貧食ドラゴン
    "dragon": [
        { day2: ["remote_commander", "crucible_hippo", "ancient_dragon"], result: "エデレ(常夜)" },
        { day2: ["remote_commander", "dragonkin", "nameless_king"], result: "フルゴール(常夜)" },
        { day2: ["tree_sentinel", "godskin_duo", "fallingstar"], result: "マリス(常夜)" }
    ],

    // ミミズ顔
    "worm": [
        { day2: ["remote_commander", "crucible_hippo", "ancient_dragon"], result: "エデレ(常夜)" },
        { day2: ["remote_commander", "dragonkin", "nameless_king"], result: "フルゴール(常夜)" },
        { day2: ["tree_sentinel", "godskin_duo", "fallingstar"], result: "マリス(常夜)" }
    ],

    // 公のフレイディア
    "freidia": [
        { day2: ["crucible_hippo", "remote_commander", "ancient_dragon"], result: "エデレ(常夜)" },
        { day2: ["crucible_hippo", "death_rite_bird"], result: "リブラ(常夜の王)" },
        { day2: ["draconic_tree_sentinel", "godskin_duo", "dancer"], result: "カリゴ(常夜)" }
    ],

    // ティビアの呼び舟
    "tibia": [
        { day2: ["draconic_tree_sentinel", "magma_wyrm", "dragonkin"], result: "グノスター(常夜)" },
        { day2: ["draconic_tree_sentinel", "dancer", "godskin_duo"], result: "カリゴ(常夜)" },
        { day2: ["crucible_hippo", "death_rite_bird", "godskin_duo"], result: "リブラ(常夜の王)" }
    ],

    // 百足のデーモン
    "centipede": [
        { day2: ["dragonkin", "draconic_tree_sentinel", "magma_wyrm"], result: "グノスター(常夜)" },
        { day2: ["dragonkin", "remote_commander", "nameless_king"], result: "フルゴール(常夜)" },
        { day2: ["crucible_hippo", "death_rite_bird", "godskin_duo"], result: "リブラ(常夜の王)" }
    ],

    // 爛れた樹霊
    "spirit": [
        { day2: ["draconic_tree_sentinel", "magma_wyrm", "dragonkin"], result: "グノスター(常夜)" },
        { day2: ["draconic_tree_sentinel", "dancer", "godskin_duo"], result: "カリゴ(常夜)" }
    ],

    // DLCルート
    "curseblade_beast": [
        { day2: ["mohgu", "demon_prince"], result: "安寧者たち" }
    ],
    "wounded_demon": [
        { day2: ["mohgu", "demon_prince"], result: "安寧者たち" }
    ],
    "death_knight": [
        { day2: ["dancing_lion", "artorias"], result: "瓦礫の王(ストラゲス)" }
    ],
    "red_bear": [
        { day2: ["dancing_lion", "artorias"], result: "瓦礫の王(ストラゲス)" }
    ]
};

// ナメレス予兆 (１日目 -> ナメレス注意が必要な２日目ボス)
// ※印があるパターン
const potentialNameless = {
    "revenant": ["nameless_king"],
    "grafted": ["tree_sentinel", "dancer"],
    "cavalry": ["remote_commander", "dragonkin"],
    "demon": ["magma_wyrm"],
    "commander": ["crucible_hippo", "death_rite_bird", "magma_wyrm"],
    "dragon": ["ancient_dragon", "nameless_king"],
    // wormは画像に※なしのため除外
    "freidia": ["ancient_dragon", "dancer"],
    "centipede": ["nameless_king"],
    "spirit": ["dancer", "godskin_duo"]
};

const raidRoutes = {
    "raid_omen": ["エデレ(常夜)", "グノスター(常夜)", "ナメレス", "瓦礫の王(ストラゲス)"],
    "intelligent_slug": ["マリス(常夜)", "リブラ(常夜の王)", "ナメレス", "瓦礫の王(ストラゲス)"],
    "kizashi": ["グノスター(常夜)", "カリゴ(常夜)", "ナメレス", "瓦礫の王(ストラゲス)"],
    "tamer_monster": ["フルゴール(常夜)", "カリゴ(常夜)", "ナメレス", "瓦礫の王(ストラゲス)"],
    // 以下の襲撃者は絞り込めないが、そのボス自身は候補から除外
    "raid_harmonia": ["グラディウス(常夜)", "ナメレス", "エデレ(常夜)", "リブラ(常夜の王)", "カリゴ(常夜)", "マリス(常夜)", "フルゴール(常夜)", "グノスター(常夜)", "瓦礫の王(ストラゲス)"],  // 安寧者たち(ハルモニア)を除外
    "raid_caligo": ["グラディウス(常夜)", "ナメレス", "エデレ(常夜)", "リブラ(常夜の王)", "マリス(常夜)", "フルゴール(常夜)", "グノスター(常夜)", "安寧者たち", "瓦礫の王(ストラゲス)"],  // カリゴ(常夜)を除外
    "raid_gradius": ["ナメレス", "エデレ(常夜)", "リブラ(常夜の王)", "カリゴ(常夜)", "マリス(常夜)", "フルゴール(常夜)", "グノスター(常夜)", "安寧者たち", "瓦礫の王(ストラゲス)"]  // グラディウス(常夜)を除外
};

const suddenRoutes = {
    "mausoleum": ["マリス(常夜)", "カリゴ(常夜)", "安寧者たち"],
    "meteorite": ["グラディウス(常夜)", "エデレ(常夜)", "カリゴ(常夜)", "安寧者たち"],
    "frenzied_flame": ["グノスター(常夜)", "リブラ(常夜の王)", "安寧者たち", "瓦礫の王(ストラゲス)"],
    "ancient_tower": ["グノスター(常夜)", "リブラ(常夜の王)", "安寧者たち"],
    "night_faction": ["グラディウス(常夜)", "マリス(常夜)", "フルゴール(常夜)", "安寧者たち"],
    "new_threat": ["エデレ(常夜)", "フルゴール(常夜)", "安寧者たち", "瓦礫の王(ストラゲス)"]
};

// ボスの弱点情報
const bossInfo = {
    "グラディウス(常夜)": { weakness: ["聖"], note: "" },
    "ナメレス": { weakness: ["聖"], note: "" },
    "エデレ(常夜)": { weakness: ["毒"], note: "" },
    "リブラ(常夜の王)": { weakness: ["聖", "発狂"], note: "" },
    "カリゴ(常夜)": { weakness: ["炎"], note: "" },
    "マリス(常夜)": { weakness: ["雷"], note: "" },
    "フルゴール(常夜)": { weakness: ["雷"], note: "" },
    "グノスター(常夜)": { weakness: ["炎"], note: "" },
    "安寧者たち": { weakness: ["睡眠"], note: "DLC (ハルモニア)" },
    "瓦礫の王(ストラゲス)": { weakness: ["なし"], note: "DLC" }
};

// DOM要素
const day1Select = document.getElementById('day1-boss');
const day2Select = document.getElementById('day2-boss');

const suddenCheck = document.getElementById('sudden-check');
const suddenSelectorContainer = document.getElementById('sudden-selector-container');
const suddenSelect = document.getElementById('sudden-event-name');

const raidCheck = document.getElementById('raid-check');
const raidSelectorContainer = document.getElementById('raid-selector-container');
const raidSelect = document.getElementById('raid-boss');

const resultArea = document.getElementById('result-area');
const resultList = document.getElementById('result-list');

// イベントリスナーの設定
day1Select.addEventListener('change', updateResult);
day2Select.addEventListener('change', updateResult);

suddenCheck.addEventListener('change', (e) => {
    if(e.target.checked) {
        suddenSelectorContainer.classList.remove('hidden');
    } else {
        suddenSelectorContainer.classList.add('hidden');
        suddenSelect.value = ""; // チェック外したらリセット
    }
    updateResult();
});
suddenSelect.addEventListener('change', updateResult);

raidCheck.addEventListener('change', (e) => {
    if(e.target.checked) {
        raidSelectorContainer.classList.remove('hidden');
    } else {
        raidSelectorContainer.classList.add('hidden');
        raidSelect.value = ""; // チェック外したらリセット
    }
    updateResult();
});
raidSelect.addEventListener('change', updateResult);

// 結果更新関数
function updateResult() {
    let sources = [];
    
    // 1. 通常ルート (1日目情報がある場合)
    const day1Value = day1Select.value;
    const day2Value = day2Select.value;
    
    if (day1Value) {
        let routeSet = new Set();
        const routes = bossRoutes[day1Value] || [];
        let matchedAnyRoute = false;

        routes.forEach(route => {
            // 2日目が未選択、またはルートの2日目リストに含まれる場合
            if (!day2Value || route.day2.includes(day2Value)) {
                routeSet.add(route.result);
                if (day2Value && route.day2.includes(day2Value)) {
                    matchedAnyRoute = true;
                }
            }
        });

        // ナメレス判定
        let shouldAddNameless = false;
        
        // DLCルート以外で判定
        if (!isDLCRoute(day1Value)) {
            // 2日目が未定の場合は、ナメレスになる可能性がある（変なルートやリスクルートに行くかもしれないため）
            if (!day2Value) {
                shouldAddNameless = true;
            }
            // 2日目が指定されている場合
            else {
                // ルートにマッチしなかった場合（組み合わせNGパターン）
                if (!matchedAnyRoute) {
                    shouldAddNameless = true;
                }
                // ※付きパターンの場合（ルートにはあるがナメレスリスクもある）
                else {
                    const risks = potentialNameless[day1Value] || [];
                    if (risks.includes(day2Value)) {
                        shouldAddNameless = true;
                    }
                }
            }
        }

        if (shouldAddNameless) {
            routeSet.add("ナメレス");
        }
        
        // 突発イベント発生時は「ナメレスではない」ため除外
        if (suddenCheck.checked) {
             routeSet.delete("ナメレス");
        }

        if (routeSet.size > 0) {
            sources.push(routeSet);
        }
    }

    // 2. 突発イベント
    if (suddenCheck.checked) {
        const suddenVal = suddenSelect.value;
        if (suddenVal) {
            const list = suddenRoutes[suddenVal] || [];
            sources.push(new Set(list));
        } else {
            // イベント名未選択の場合、どうするか。
            // 全ての突発イベントの和集合とするか、あるいは「ナメレス除外フィルター」としてのみ機能させるか。
            // ユーザー要望的に「絞るようにしてほしい」とのことなので、
            // 名前未選択＝全突発可能性、名前選択＝特定突発可能性、と考えるのが自然。
            // ただ、単純に「ナメレスではない」フィルターは既に↑で適用済み。
            // ここでは特定のイベントが選択された場合のみ、その候補セットを追加する（積集合の対象にする）。
        }
    }

    // 3. 襲撃イベント
    if (raidCheck.checked) {
        const raidVal = raidSelect.value;
        if (raidVal) {
            const list = raidRoutes[raidVal] || [];
            sources.push(new Set(list));
        }
    }

    // 集計処理: 全てのソースの積集合（AND条件）をとる
    // ただし、sourcesが空の場合は候補なし（入力待ち）
    
    if (sources.length === 0) {
        // 何も入力がない場合は非表示
        resultArea.classList.add('hidden');
        return;
    }

    // 最初のセットをベースにする
    let intersection = new Set(sources[0]);

    for (let i = 1; i < sources.length; i++) {
        let currentSet = sources[i];
        // 積集合をとる
        for (let item of intersection) {
            if (!currentSet.has(item)) {
                intersection.delete(item);
            }
        }
    }

    renderResults(Array.from(intersection));
}


function isDLCRoute(bossId) {
    return ["curseblade_beast", "wounded_demon", "death_knight", "red_bear"].includes(bossId);
}

// 結果描画関数
function renderResults(candidates) {
    resultList.innerHTML = '';
    
    if (candidates.length === 0) {
        resultList.innerHTML = '<p>候補が見つかりませんでした。</p>';
    } else {
        candidates.forEach(bossName => {
            const info = bossInfo[bossName] || { weakness: [], note: "" };
            const card = document.createElement('div');
            card.className = 'boss-card';
            
            const nameEl = document.createElement('div');
            nameEl.className = 'boss-name';
            nameEl.textContent = bossName;
            card.appendChild(nameEl);

            const weaknessContainer = document.createElement('div');
            weaknessContainer.className = 'boss-weakness';
            weaknessContainer.innerHTML = '弱点: ';
            
            if (info.weakness && info.weakness.length > 0) {
                info.weakness.forEach(w => {
                    const tag = document.createElement('span');
                    tag.className = `weakness-tag weakness-${getWeaknessClass(w)}`;
                    tag.textContent = w;
                    weaknessContainer.appendChild(tag);
                });
            } else {
                weaknessContainer.appendChild(document.createTextNode('不明'));
            }
            
            card.appendChild(weaknessContainer);
            resultList.appendChild(card);
        });
    }

    resultArea.classList.remove('hidden');
}

function getWeaknessClass(weaknessName) {
    switch (weaknessName) {
        case '聖': return 'holy';
        case '炎': return 'fire';
        case '雷': return 'lightning';
        case '毒': return 'poison';
        case '発狂': return 'madness';
        case '魔力': return 'magic';
        case '睡眠': return 'sleep';
        case '腐敗': return 'rot';
        default: return 'default';
    }
}
