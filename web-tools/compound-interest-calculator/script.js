// DOM要素の取得
const inputs = {
    initial: document.getElementById('initial-amount'),
    monthly: document.getElementById('monthly-amount'),
    years: document.getElementById('years'),
    yearsRange: document.getElementById('years-range'),
    rate: document.getElementById('rate'),
    rateRange: document.getElementById('rate-range')
};

const results = {
    total: document.getElementById('result-total'),
    principal: document.getElementById('result-principal'),
    interest: document.getElementById('result-interest'),
    tableBody: document.querySelector('#result-table tbody')
};

let chart = null;

// 初期化
function init() {
    setupEventListeners();
    calculateAndRender();
}

// イベントリスナーの設定
function setupEventListeners() {
    // 数値入力とレンジスライダーの同期
    inputs.years.addEventListener('input', (e) => {
        inputs.yearsRange.value = e.target.value;
        calculateAndRender();
    });
    inputs.yearsRange.addEventListener('input', (e) => {
        inputs.years.value = e.target.value;
        calculateAndRender();
    });

    inputs.rate.addEventListener('input', (e) => {
        inputs.rateRange.value = e.target.value;
        calculateAndRender();
    });
    inputs.rateRange.addEventListener('input', (e) => {
        inputs.rate.value = e.target.value;
        calculateAndRender();
    });

    // その他の入力変更時
    inputs.initial.addEventListener('input', calculateAndRender);
    inputs.monthly.addEventListener('input', calculateAndRender);
}

// 計算と描画の実行
function calculateAndRender() {
    const data = calculateCompoundInterest();
    updateSummary(data);
    updateChart(data);
    updateTable(data);
}

// 複利計算ロジック
function calculateCompoundInterest() {
    const initial = Number(inputs.initial.value);
    const monthly = Number(inputs.monthly.value);
    const years = Number(inputs.years.value);
    const rate = Number(inputs.rate.value) / 100;
    
    const monthlyRate = rate / 12;
    const totalMonths = years * 12;

    let currentAmount = initial;
    let totalPrincipal = initial;
    
    const yearlyData = [];

    // 0年目（初期状態）
    yearlyData.push({
        year: 0,
        principal: initial,
        interest: 0,
        total: initial
    });

    for (let i = 1; i <= totalMonths; i++) {
        // 月利を加算
        currentAmount = currentAmount * (1 + monthlyRate);
        // 積立額を加算
        currentAmount += monthly;
        totalPrincipal += monthly;

        // 年末のデータを記録
        if (i % 12 === 0) {
            const year = i / 12;
            yearlyData.push({
                year: year,
                principal: totalPrincipal,
                interest: currentAmount - totalPrincipal,
                total: currentAmount
            });
        }
    }

    return {
        final: yearlyData[yearlyData.length - 1],
        history: yearlyData
    };
}

// 金額のフォーマット
function formatCurrency(amount) {
    return Math.round(amount).toLocaleString() + '円';
}

// サマリー表示の更新
function updateSummary(data) {
    const final = data.final;
    results.total.textContent = formatCurrency(final.total);
    results.principal.textContent = formatCurrency(final.principal);
    results.interest.textContent = formatCurrency(final.interest);
}

// グラフの更新
function updateChart(data) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    const labels = data.history.map(d => d.year + '年目');
    const principalData = data.history.map(d => d.principal);
    const interestData = data.history.map(d => d.interest);

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '元本',
                    data: principalData,
                    backgroundColor: '#1565c0',
                    stack: 'Stack 0'
                },
                {
                    label: '運用益',
                    data: interestData,
                    backgroundColor: '#f57c00',
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        callback: function(value) {
                            return value / 10000 + '万円';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// テーブルの更新
function updateTable(data) {
    results.tableBody.innerHTML = '';
    
    // 逆順で表示（最新が上）
    [...data.history].reverse().forEach(row => {
        if (row.year === 0) return; // 0年目は表示しない

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.year}年目</td>
            <td>${formatCurrency(row.principal)}</td>
            <td style="color: #f57c00; font-weight: bold;">+${formatCurrency(row.interest)}</td>
            <td style="font-weight: bold;">${formatCurrency(row.total)}</td>
        `;
        results.tableBody.appendChild(tr);
    });
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', init);
