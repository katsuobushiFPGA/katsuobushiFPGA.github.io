import { STARTING_CASH, STOCKS } from './config';

export interface Position {
  ticker: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlRatio: number;
}

export class Portfolio {
  cash: number;
  reservedCash: number;
  holdings: Record<string, number>;
  reservedHoldings: Record<string, number>;
  /** Total cost spent on current holdings (for avg cost calculation) */
  totalCost: Record<string, number>;

  constructor() {
    this.cash = STARTING_CASH;
    this.reservedCash = 0;
    this.holdings = {};
    this.reservedHoldings = {};
    this.totalCost = {};
    for (const stock of STOCKS) {
      this.holdings[stock.ticker] = 0;
      this.reservedHoldings[stock.ticker] = 0;
      this.totalCost[stock.ticker] = 0;
    }
  }

  getAvailableCash(): number {
    return this.cash - this.reservedCash;
  }

  getAvailableHoldings(ticker: string): number {
    return (this.holdings[ticker] ?? 0) - (this.reservedHoldings[ticker] ?? 0);
  }

  executeBuy(ticker: string, quantity: number, price: number): void {
    this.cash -= quantity * price;
    this.holdings[ticker] = (this.holdings[ticker] ?? 0) + quantity;
    this.totalCost[ticker] = (this.totalCost[ticker] ?? 0) + quantity * price;
  }

  executeSell(ticker: string, quantity: number, price: number): void {
    const prevQty = this.holdings[ticker] ?? 0;
    const avgCost = prevQty > 0 ? (this.totalCost[ticker] ?? 0) / prevQty : 0;
    this.cash += quantity * price;
    this.holdings[ticker] = prevQty - quantity;
    // Reduce total cost proportionally using avg cost
    this.totalCost[ticker] = (this.totalCost[ticker] ?? 0) - quantity * avgCost;
    if (this.holdings[ticker] <= 0) {
      this.totalCost[ticker] = 0;
    }
  }

  reserveCash(amount: number): void {
    this.reservedCash += amount;
  }

  freeCash(amount: number): void {
    this.reservedCash -= amount;
  }

  reserveHoldings(ticker: string, quantity: number): void {
    this.reservedHoldings[ticker] = (this.reservedHoldings[ticker] ?? 0) + quantity;
  }

  freeHoldings(ticker: string, quantity: number): void {
    this.reservedHoldings[ticker] = (this.reservedHoldings[ticker] ?? 0) - quantity;
  }

  getTotalValue(currentPrices: Record<string, number>): number {
    let total = this.cash;
    for (const ticker in this.holdings) {
      total += this.holdings[ticker] * (currentPrices[ticker] ?? 0);
    }
    return total;
  }

  getPositions(currentPrices: Record<string, number>): Position[] {
    const positions: Position[] = [];
    for (const stock of STOCKS) {
      const qty = this.holdings[stock.ticker];
      if (qty > 0) {
        const avgCost = qty > 0 ? (this.totalCost[stock.ticker] ?? 0) / qty : 0;
        const value = qty * currentPrices[stock.ticker];
        const costBasis = qty * avgCost;
        const pnl = value - costBasis;
        const pnlRatio = costBasis > 0 ? pnl / costBasis : 0;
        positions.push({
          ticker: stock.ticker,
          name: stock.name,
          quantity: qty,
          avgCost,
          currentPrice: currentPrices[stock.ticker],
          value,
          pnl,
          pnlRatio,
        });
      }
    }
    return positions;
  }
}
