'use client';

import { useState } from 'react';
import { STOCKS } from '@/lib/config';
import type { OrderSide, OrderType } from '@/lib/orderEngine';

interface Props {
  disabled: boolean;
  holdings: Record<string, number>;
  onOrder: (params: {
    ticker: string;
    type: OrderType;
    side: OrderSide;
    quantity: number;
    price?: number;
  }) => void;
}

export default function OrderForm({ disabled, holdings, onOrder }: Props) {
  const [ticker, setTicker] = useState(STOCKS[0].ticker);
  const [type, setType] = useState<OrderType>('market');
  const [side, setSide] = useState<OrderSide>('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const held = holdings[ticker] ?? 0;

  const handleSubmit = () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;
    if (type === 'limit') {
      const p = parseInt(price);
      if (!p || p <= 0) return;
      onOrder({ ticker, type, side, quantity: qty, price: p });
    } else {
      onOrder({ ticker, type, side, quantity: qty });
    }
    setQuantity('');
    setPrice('');
  };

  const setQtyPreset = (fraction: number) => {
    const qty = Math.floor(held * fraction);
    if (qty > 0) setQuantity(String(qty));
  };

  return (
    <div className="p-3">
      <h2 className="text-sm text-gray-500 border-b border-gray-700 pb-1 mb-3">注文</h2>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 w-12">銘柄</label>
          <select
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="flex-1 bg-[#0f3460] border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
          >
            {STOCKS.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} ({s.name})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 w-12">種別</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as OrderType)}
            className="flex-1 bg-[#0f3460] border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
          >
            <option value="market">成行</option>
            <option value="limit">指値</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 w-12">売買</label>
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-1 rounded text-sm font-bold border ${
                side === 'buy'
                  ? 'bg-green-900/50 border-green-500 text-green-400'
                  : 'bg-transparent border-gray-600 text-gray-400'
              }`}
            >
              買い
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-1 rounded text-sm font-bold border ${
                side === 'sell'
                  ? 'bg-red-900/50 border-red-500 text-red-400'
                  : 'bg-transparent border-gray-600 text-gray-400'
              }`}
            >
              売り
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 w-12">数量</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="株数"
            className="flex-1 bg-[#0f3460] border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
          />
        </div>

        {held > 0 && (
          <div className="flex items-center gap-1 pl-14">
            <span className="text-[10px] text-gray-500 mr-1">保有{held}株:</span>
            {[
              { label: '全量', fraction: 1 },
              { label: '1/2', fraction: 0.5 },
              { label: '1/4', fraction: 0.25 },
            ].map(({ label, fraction }) => {
              const qty = Math.floor(held * fraction);
              if (qty <= 0) return null;
              return (
                <button
                  key={label}
                  onClick={() => setQtyPreset(fraction)}
                  className="px-1.5 py-0.5 text-[10px] rounded border border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {type === 'limit' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-12">価格</label>
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="指値価格"
              className="flex-1 bg-[#0f3460] border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="w-full py-2 bg-[#0f3460] border border-[#4fc3f7] rounded text-[#4fc3f7] text-sm font-bold hover:bg-[#1a5276] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          注文する
        </button>
      </div>
    </div>
  );
}
