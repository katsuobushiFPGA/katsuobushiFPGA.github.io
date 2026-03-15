export function formatCurrency(amount: number): string {
  return '¥' + Math.round(amount).toLocaleString('ja-JP');
}

export function formatPercent(ratio: number): string {
  const pct = (ratio * 100).toFixed(1);
  return (ratio >= 0 ? '+' : '') + pct + '%';
}

export function formatQuantity(n: number): string {
  return n.toLocaleString('ja-JP');
}
