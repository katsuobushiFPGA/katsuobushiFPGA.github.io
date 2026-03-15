import { Market, type OHLC } from './market';
import { Portfolio } from './portfolio';
import { OrderEngine, type Order, type OrderSide, type OrderType } from './orderEngine';
import { STOCKS, TOTAL_TICKS } from './config';
import { generateOrderBook, type OrderBookData } from './orderBook';

export type GamePhase = 'idle' | 'running' | 'paused' | 'ended';

export interface GameSnapshot {
  phase: GamePhase;
  tick: number;
  prices: Record<string, number>;
  candles: Record<string, OHLC[]>;
  orderBooks: Record<string, OrderBookData>;
  portfolio: Portfolio;
  openOrders: Order[];
  orderHistory: Order[];
  notifications: Notification[];
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export class GameState {
  market: Market;
  portfolio: Portfolio;
  orderEngine: OrderEngine;
  phase: GamePhase = 'idle';
  tick = 0;
  private notifId = 0;
  notifications: Notification[] = [];

  constructor() {
    this.market = new Market();
    this.portfolio = new Portfolio();
    this.orderEngine = new OrderEngine();
  }

  doTick(): { executedOrders: Order[] } {
    this.tick++;
    this.market.tick(this.tick);
    const prices = this.market.getCurrentPrices();
    const executedOrders = this.orderEngine.checkLimitOrders(prices, this.portfolio);

    if (this.tick >= TOTAL_TICKS) {
      this.phase = 'ended';
      this.orderEngine.expireAllOrders(this.portfolio);
    }

    return { executedOrders };
  }

  placeOrder(
    ticker: string,
    type: OrderType,
    side: OrderSide,
    quantity: number,
    price?: number,
  ): { success: boolean; message?: string } {
    const currentPrices = this.market.getCurrentPrices();

    if (type === 'market') {
      return this.orderEngine.placeMarketOrder(
        ticker, side, quantity, currentPrices[ticker], this.portfolio,
      );
    } else {
      return this.orderEngine.placeLimitOrder(
        ticker, side, quantity, price!, this.portfolio,
      );
    }
  }

  cancelOrder(orderId: number): boolean {
    return this.orderEngine.cancelOrder(orderId, this.portfolio);
  }

  addNotification(message: string, type: Notification['type'] = 'info'): void {
    this.notifications.push({ id: this.notifId++, message, type });
    if (this.notifications.length > 5) {
      this.notifications = this.notifications.slice(-5);
    }
  }

  getSnapshot(): GameSnapshot {
    const prices = this.market.getCurrentPrices();
    const openOrders = this.orderEngine.openOrders;

    const orderBooks: Record<string, OrderBookData> = {};
    for (const stock of STOCKS) {
      orderBooks[stock.ticker] = generateOrderBook(
        prices[stock.ticker],
        stock.tickSize,
        openOrders,
        stock.ticker,
      );
    }

    return {
      phase: this.phase,
      tick: this.tick,
      prices,
      candles: Object.fromEntries(
        STOCKS.map((s) => [s.ticker, this.market.getPriceHistory(s.ticker)]),
      ),
      orderBooks,
      portfolio: this.portfolio,
      openOrders: [...openOrders],
      orderHistory: [...this.orderEngine.orderHistory],
      notifications: [...this.notifications],
    };
  }
}
