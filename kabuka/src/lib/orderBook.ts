import type { Order } from './orderEngine';

export interface OrderBookLevel {
  price: number;
  quantity: number;
  isPlayerOrder: boolean;
  playerQuantity: number;
}

export interface OrderBookData {
  asks: OrderBookLevel[]; // sorted price ascending (lowest ask first, closest to center)
  bids: OrderBookLevel[]; // sorted price descending (highest bid first, closest to center)
  currentPrice: number;
}

const LEVELS = 10;

/** Simple seeded pseudo-random number generator */
function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateOrderBook(
  currentPrice: number,
  tickSize: number,
  playerOrders: Order[],
  ticker: string,
): OrderBookData {
  const snapped = Math.round(currentPrice / tickSize) * tickSize;
  const rng = seededRng(snapped * 1000 + ticker.charCodeAt(0));

  // Build player order map: price -> total quantity (for this ticker)
  const playerBids = new Map<number, number>();
  const playerAsks = new Map<number, number>();
  for (const order of playerOrders) {
    if (order.ticker !== ticker || order.status !== 'open' || !order.targetPrice) continue;
    const map = order.side === 'buy' ? playerBids : playerAsks;
    map.set(order.targetPrice, (map.get(order.targetPrice) ?? 0) + order.quantity);
  }

  const asks: OrderBookLevel[] = [];
  for (let i = 1; i <= LEVELS; i++) {
    const price = snapped + i * tickSize;
    const baseQty = Math.floor(300 * Math.exp(-0.25 * (i - 1)) + rng() * 150 + 20);
    const playerQty = playerAsks.get(price) ?? 0;
    asks.push({
      price,
      quantity: baseQty + playerQty,
      isPlayerOrder: playerQty > 0,
      playerQuantity: playerQty,
    });
  }

  const bids: OrderBookLevel[] = [];
  for (let i = 1; i <= LEVELS; i++) {
    const price = snapped - i * tickSize;
    if (price <= 0) break;
    const baseQty = Math.floor(300 * Math.exp(-0.25 * (i - 1)) + rng() * 150 + 20);
    const playerQty = playerBids.get(price) ?? 0;
    bids.push({
      price,
      quantity: baseQty + playerQty,
      isPlayerOrder: playerQty > 0,
      playerQuantity: playerQty,
    });
  }

  return { asks, bids, currentPrice: snapped };
}
