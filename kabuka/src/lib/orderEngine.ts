import type { Portfolio } from './portfolio';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'open' | 'executed' | 'cancelled' | 'expired';

export interface Order {
  id: number;
  type: OrderType;
  ticker: string;
  side: OrderSide;
  quantity: number;
  price?: number;
  targetPrice?: number;
  executedPrice?: number;
  status: OrderStatus;
}

export interface OrderResult {
  success: boolean;
  message?: string;
  order?: Order;
}

export class OrderEngine {
  private nextId = 1;
  openOrders: Order[] = [];
  orderHistory: Order[] = [];

  placeMarketOrder(
    ticker: string,
    side: OrderSide,
    quantity: number,
    price: number,
    portfolio: Portfolio,
  ): OrderResult {
    if (side === 'buy') {
      const cost = quantity * price;
      if (cost > portfolio.getAvailableCash()) {
        return { success: false, message: '資金が不足しています' };
      }
      portfolio.executeBuy(ticker, quantity, price);
    } else {
      if (quantity > portfolio.getAvailableHoldings(ticker)) {
        return { success: false, message: '保有株数が不足しています' };
      }
      portfolio.executeSell(ticker, quantity, price);
    }

    const order: Order = {
      id: this.nextId++,
      type: 'market',
      ticker,
      side,
      quantity,
      price,
      status: 'executed',
    };
    this.orderHistory.push(order);
    return { success: true, order };
  }

  placeLimitOrder(
    ticker: string,
    side: OrderSide,
    quantity: number,
    targetPrice: number,
    portfolio: Portfolio,
  ): OrderResult {
    if (side === 'buy') {
      const cost = quantity * targetPrice;
      if (cost > portfolio.getAvailableCash()) {
        return { success: false, message: '資金が不足しています' };
      }
      portfolio.reserveCash(cost);
    } else {
      if (quantity > portfolio.getAvailableHoldings(ticker)) {
        return { success: false, message: '保有株数が不足しています' };
      }
      portfolio.reserveHoldings(ticker, quantity);
    }

    const order: Order = {
      id: this.nextId++,
      type: 'limit',
      ticker,
      side,
      quantity,
      targetPrice,
      status: 'open',
    };
    this.openOrders.push(order);
    return { success: true, order };
  }

  cancelOrder(orderId: number, portfolio: Portfolio): boolean {
    const idx = this.openOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) return false;

    const order = this.openOrders[idx];
    if (order.side === 'buy') {
      portfolio.freeCash(order.quantity * order.targetPrice!);
    } else {
      portfolio.freeHoldings(order.ticker, order.quantity);
    }

    order.status = 'cancelled';
    this.orderHistory.push(order);
    this.openOrders.splice(idx, 1);
    return true;
  }

  checkLimitOrders(
    currentPrices: Record<string, number>,
    portfolio: Portfolio,
  ): Order[] {
    const executed: Order[] = [];
    const remaining: Order[] = [];

    for (const order of this.openOrders) {
      const price = currentPrices[order.ticker];
      let shouldExecute = false;

      if (order.side === 'buy' && price <= order.targetPrice!) {
        shouldExecute = true;
      } else if (order.side === 'sell' && price >= order.targetPrice!) {
        shouldExecute = true;
      }

      if (shouldExecute) {
        if (order.side === 'buy') {
          portfolio.freeCash(order.quantity * order.targetPrice!);
          portfolio.executeBuy(order.ticker, order.quantity, order.targetPrice!);
        } else {
          portfolio.freeHoldings(order.ticker, order.quantity);
          portfolio.executeSell(order.ticker, order.quantity, order.targetPrice!);
        }
        order.status = 'executed';
        order.executedPrice = order.targetPrice;
        this.orderHistory.push(order);
        executed.push(order);
      } else {
        remaining.push(order);
      }
    }

    this.openOrders = remaining;
    return executed;
  }

  expireAllOrders(portfolio: Portfolio): void {
    for (const order of this.openOrders) {
      if (order.side === 'buy') {
        portfolio.freeCash(order.quantity * order.targetPrice!);
      } else {
        portfolio.freeHoldings(order.ticker, order.quantity);
      }
      order.status = 'expired';
      this.orderHistory.push(order);
    }
    this.openOrders = [];
  }
}
