'use client';

import type { Portfolio } from '@/lib/portfolio';
import { STARTING_CASH, STOCKS } from '@/lib/config';
import { formatCurrency, formatPercent, formatQuantity } from '@/lib/utils';

interface Props {
  show: boolean;
  portfolio: Portfolio;
  prices: Record<string, number>;
  onReplay: () => void;
}

export default function GameOverModal({ show, portfolio, prices, onReplay }: Props) {
  if (!show) return null;

  const totalValue = portfolio.getTotalValue(prices);
  const pnl = totalValue - STARTING_CASH;
  const pnlRatio = pnl / STARTING_CASH;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#16213e] border border-[#4fc3f7] rounded-xl p-8 text-center max-w-md w-[90%]">
        <h2 className="text-2xl font-bold text-[#4fc3f7] mb-6">ゲーム終了</h2>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">最終資産</span>
            <span className="font-mono text-lg font-bold">{formatCurrency(totalValue)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">損益</span>
            <span
              className={`font-mono text-lg font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {formatCurrency(pnl)} ({formatPercent(pnlRatio)})
            </span>
          </div>
        </div>

        <div className="text-left text-sm font-mono text-gray-400 space-y-1 mb-6">
          {STOCKS.map((stock) => {
            const qty = portfolio.holdings[stock.ticker];
            if (qty <= 0) return null;
            const val = qty * prices[stock.ticker];
            return (
              <div key={stock.ticker}>
                {stock.ticker}: {formatQuantity(qty)}株 × {formatCurrency(prices[stock.ticker])} ={' '}
                {formatCurrency(val)}
              </div>
            );
          })}
          <div>現金: {formatCurrency(portfolio.cash)}</div>
        </div>

        <button
          onClick={onReplay}
          className="px-8 py-3 bg-[#4fc3f7] text-[#1a1a2e] rounded-lg font-bold text-lg hover:bg-[#81d4fa]"
        >
          もう一度プレイ
        </button>
      </div>
    </div>
  );
}
