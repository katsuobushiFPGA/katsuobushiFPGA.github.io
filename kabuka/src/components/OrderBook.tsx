'use client';

import type { OrderBookData } from '@/lib/orderBook';
import { formatCurrency, formatQuantity } from '@/lib/utils';

interface Props {
  ticker: string;
  orderBook: OrderBookData;
}

export default function OrderBook({ ticker, orderBook }: Props) {
  const { asks, bids, currentPrice } = orderBook;

  // Find max quantity for bar width scaling
  const allQuantities = [...asks, ...bids].map((l) => l.quantity);
  const maxQty = Math.max(...allQuantities, 1);

  // Asks: display highest at top, lowest at bottom (near center)
  const displayAsks = [...asks].reverse();

  return (
    <div className="h-full flex flex-col p-2 overflow-hidden">
      <h2 className="text-sm text-gray-500 border-b border-gray-700 pb-1 mb-1 shrink-0">
        板: {ticker}
      </h2>

      {/* Header */}
      <div className="grid grid-cols-[1fr_70px_1fr] text-[10px] text-gray-500 px-1 shrink-0">
        <span>売数量</span>
        <span className="text-center">価格</span>
        <span className="text-right">買数量</span>
      </div>

      {/* Ask side (売り) */}
      <div className="flex flex-col justify-end flex-1 min-h-0 overflow-hidden">
        {displayAsks.map((level) => (
          <div
            key={level.price}
            className={`grid grid-cols-[1fr_70px_1fr] items-center px-1 py-[1px] text-xs font-mono
              ${level.isPlayerOrder ? 'border-l-2 border-yellow-400' : ''}`}
          >
            <div className="relative h-4 flex items-center justify-end">
              <div
                className="absolute right-0 top-0 h-full bg-red-500/20"
                style={{ width: `${(level.quantity / maxQty) * 100}%` }}
              />
              <span className="relative text-red-400 text-[11px]">
                {formatQuantity(level.quantity)}
              </span>
            </div>
            <span className="text-center text-red-300 text-[11px]">
              {formatCurrency(level.price)}
            </span>
            <span></span>
          </div>
        ))}
      </div>

      {/* Current price */}
      <div className="grid grid-cols-[1fr_70px_1fr] items-center px-1 py-1 bg-[#4fc3f7]/10 border-y border-[#4fc3f7]/30 shrink-0">
        <span></span>
        <span className="text-center text-[#4fc3f7] text-xs font-mono font-bold">
          {formatCurrency(currentPrice)}
        </span>
        <span></span>
      </div>

      {/* Bid side (買い) */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {bids.map((level) => (
          <div
            key={level.price}
            className={`grid grid-cols-[1fr_70px_1fr] items-center px-1 py-[1px] text-xs font-mono
              ${level.isPlayerOrder ? 'border-l-2 border-yellow-400' : ''}`}
          >
            <span></span>
            <span className="text-center text-green-300 text-[11px]">
              {formatCurrency(level.price)}
            </span>
            <div className="relative h-4 flex items-center">
              <div
                className="absolute left-0 top-0 h-full bg-green-500/20"
                style={{ width: `${(level.quantity / maxQty) * 100}%` }}
              />
              <span className="relative text-green-400 text-[11px]">
                {formatQuantity(level.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
