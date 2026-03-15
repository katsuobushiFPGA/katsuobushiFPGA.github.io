import { STOCKS, type StockConfig } from './config';

export interface OHLC {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export class Market {
  private stocks: StockConfig[];
  private priceHistory: Record<string, OHLC[]>;
  private lastClose: Record<string, number>;

  constructor() {
    this.stocks = STOCKS;
    this.priceHistory = {};
    this.lastClose = {};

    for (const stock of this.stocks) {
      this.lastClose[stock.ticker] = stock.initialPrice;
      this.priceHistory[stock.ticker] = [
        {
          time: 0,
          open: stock.initialPrice,
          high: stock.initialPrice,
          low: stock.initialPrice,
          close: stock.initialPrice,
        },
      ];
    }
  }

  tick(tickNumber: number): Record<string, OHLC> {
    const newCandles: Record<string, OHLC> = {};

    for (const stock of this.stocks) {
      const open = this.lastClose[stock.ticker];
      const steps = 10;
      let current = open;
      let high = open;
      let low = open;

      for (let i = 0; i < steps; i++) {
        const z = this.boxMullerRandom();
        const exponent =
          (stock.drift / steps - (stock.volatility * stock.volatility) / (2 * steps)) +
          (stock.volatility / Math.sqrt(steps)) * z;
        current = Math.round(current * Math.exp(exponent));
        if (current < 1) current = 1;
        if (current > high) high = current;
        if (current < low) low = current;
      }

      const candle: OHLC = { time: tickNumber, open, high, low, close: current };
      this.priceHistory[stock.ticker].push(candle);
      this.lastClose[stock.ticker] = current;
      newCandles[stock.ticker] = candle;
    }

    return newCandles;
  }

  getCurrentPrices(): Record<string, number> {
    const prices: Record<string, number> = {};
    for (const stock of this.stocks) {
      prices[stock.ticker] = this.lastClose[stock.ticker];
    }
    return prices;
  }

  getPriceHistory(ticker: string): OHLC[] {
    return this.priceHistory[ticker] ?? [];
  }

  private boxMullerRandom(): number {
    let u1: number;
    do {
      u1 = Math.random();
    } while (u1 === 0);
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
