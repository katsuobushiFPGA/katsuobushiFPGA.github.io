'use client';

import type { Portfolio } from '@/lib/portfolio';
import { STARTING_CASH, STOCKS } from '@/lib/config';
import { formatCurrency, formatPercent, formatQuantity } from '@/lib/utils';

interface Props {
  portfolio: Portfolio;
  prices: Record<string, number>;
}

export default function PortfolioPanel({ portfolio, prices }: Props) {
  const totalValue = portfolio.getTotalValue(prices);
  const pnl = totalValue - STARTING_CASH;
  const pnlRatio = pnl / STARTING_CASH;
  const positions = portfolio.getPositions(prices);

  return (
    <div className="h-full overflow-y-auto p-3">
      <h2 className="text-sm text-gray-500 border-b border-gray-700 pb-1 mb-2">
        ポートフォリオ
      </h2>

      <div className="flex justify-between py-1 text-sm border-b border-gray-800">
        <span className="text-gray-500">現金</span>
        <span className="font-mono">
          {formatCurrency(portfolio.cash)}
          {portfolio.reservedCash > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              (予約: {formatCurrency(portfolio.reservedCash)})
            </span>
          )}
        </span>
      </div>

      <h2 className="text-sm text-gray-500 border-b border-gray-700 pb-1 mb-2 mt-3">
        保有株
      </h2>

      {positions.length === 0 ? (
        <p className="text-xs text-gray-600 italic text-center py-2">保有なし</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-1">銘柄</th>
              <th className="text-right py-1">数量</th>
              <th className="text-right py-1">取得単価</th>
              <th className="text-right py-1">現在値</th>
              <th className="text-right py-1">含み損益</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos.ticker} className="border-t border-gray-800 font-mono">
                <td className="py-1">{pos.ticker}</td>
                <td className="text-right">{formatQuantity(pos.quantity)}</td>
                <td className="text-right">{formatCurrency(pos.avgCost)}</td>
                <td className="text-right">{formatCurrency(pos.currentPrice)}</td>
                <td className={`text-right ${pos.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(pos.pnl)}
                  <span className="text-[10px] ml-0.5">({formatPercent(pos.pnlRatio)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-3 border-t border-gray-700 pt-2">
        <div className="flex justify-between py-1 text-sm">
          <span className="text-gray-500">総資産</span>
          <span className="font-mono font-bold">{formatCurrency(totalValue)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-gray-500">損益</span>
          <span className={`font-mono font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(pnl)} ({formatPercent(pnlRatio)})
          </span>
        </div>
      </div>
    </div>
  );
}
