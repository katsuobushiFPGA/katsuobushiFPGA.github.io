'use client';

import type { Order } from '@/lib/orderEngine';
import { formatCurrency, formatQuantity } from '@/lib/utils';

interface Props {
  openOrders: Order[];
  orderHistory: Order[];
  onCancel: (orderId: number) => void;
}

export default function OrderList({ openOrders, orderHistory, onCancel }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Open Orders */}
      <div className="p-3 flex-shrink-0">
        <h2 className="text-sm text-gray-500 border-b border-gray-700 pb-1 mb-2">
          未約定注文
        </h2>
        {openOrders.length === 0 ? (
          <p className="text-xs text-gray-600 italic text-center py-1">なし</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-1">ID</th>
                <th className="text-left py-1">銘柄</th>
                <th className="text-left py-1">売買</th>
                <th className="text-right py-1">数量</th>
                <th className="text-right py-1">指値</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody>
              {openOrders.map((order) => (
                <tr key={order.id} className="border-t border-gray-800 font-mono">
                  <td className="py-1">#{order.id}</td>
                  <td>{order.ticker}</td>
                  <td className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                    {order.side === 'buy' ? '買' : '売'}
                  </td>
                  <td className="text-right">{formatQuantity(order.quantity)}</td>
                  <td className="text-right">{formatCurrency(order.targetPrice!)}</td>
                  <td className="text-right">
                    <button
                      onClick={() => onCancel(order.id)}
                      className="px-2 py-0.5 border border-red-500 rounded text-red-500 text-xs hover:bg-red-500/20"
                    >
                      取消
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order History */}
      <div className="p-3 flex-1 overflow-y-auto border-t border-gray-700">
        <h2 className="text-sm text-gray-500 border-b border-gray-700 pb-1 mb-2">
          約定履歴
        </h2>
        {orderHistory.length === 0 ? (
          <p className="text-xs text-gray-600 italic text-center py-1">なし</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left py-1">ID</th>
                <th className="text-left py-1">種別</th>
                <th className="text-left py-1">銘柄</th>
                <th className="text-left py-1">売買</th>
                <th className="text-right py-1">数量</th>
                <th className="text-right py-1">価格</th>
                <th className="text-right py-1">状態</th>
              </tr>
            </thead>
            <tbody>
              {[...orderHistory].reverse().slice(0, 20).map((order) => {
                const price = order.executedPrice ?? order.price ?? order.targetPrice ?? 0;
                const statusMap: Record<string, string> = {
                  executed: '✓ 約定',
                  cancelled: '✗ 取消',
                  expired: '期限切れ',
                };
                return (
                  <tr key={order.id} className="border-t border-gray-800 font-mono">
                    <td className="py-1">#{order.id}</td>
                    <td>{order.type === 'market' ? '成行' : '指値'}</td>
                    <td>{order.ticker}</td>
                    <td className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                      {order.side === 'buy' ? '買' : '売'}
                    </td>
                    <td className="text-right">{formatQuantity(order.quantity)}</td>
                    <td className="text-right">{formatCurrency(price)}</td>
                    <td className="text-right">{statusMap[order.status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
