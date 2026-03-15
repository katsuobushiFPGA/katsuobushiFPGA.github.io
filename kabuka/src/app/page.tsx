'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, type GameSnapshot } from '@/lib/gameState';
import { STOCKS, TOTAL_TICKS, DEFAULT_TICK_INTERVAL_MS, SPEED_OPTIONS } from '@/lib/config';
import { formatCurrency } from '@/lib/utils';
import CandlestickChart from '@/components/CandlestickChart';
import OrderBookPanel from '@/components/OrderBook';
import PortfolioPanel from '@/components/PortfolioPanel';
import OrderForm from '@/components/OrderForm';
import OrderList from '@/components/OrderList';
import GameOverModal from '@/components/GameOverModal';
import Notifications from '@/components/Notification';

export default function Home() {
  const gameRef = useRef<GameState>(new GameState());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef(DEFAULT_TICK_INTERVAL_MS);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => gameRef.current.getSnapshot());
  const [selectedStock, setSelectedStock] = useState(0);

  const updateSnapshot = useCallback(() => {
    setSnapshot(gameRef.current.getSnapshot());
  }, []);

  const gameTick = useCallback(() => {
    const game = gameRef.current;
    const { executedOrders } = game.doTick();

    for (const order of executedOrders) {
      const sideLabel = order.side === 'buy' ? '買' : '売';
      game.addNotification(
        `指値約定: ${order.ticker} ${sideLabel} ${order.quantity}株 @¥${order.targetPrice!.toLocaleString()}`,
        'success',
      );
    }

    updateSnapshot();

    if (game.phase !== 'ended') {
      timerRef.current = setTimeout(gameTick, intervalRef.current);
    }
  }, [updateSnapshot]);

  const handleStart = useCallback(() => {
    gameRef.current.phase = 'running';
    updateSnapshot();
    timerRef.current = setTimeout(gameTick, intervalRef.current);
  }, [gameTick, updateSnapshot]);

  const handlePause = useCallback(() => {
    const game = gameRef.current;
    if (game.phase === 'running') {
      game.phase = 'paused';
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    } else if (game.phase === 'paused') {
      game.phase = 'running';
      timerRef.current = setTimeout(gameTick, intervalRef.current);
    }
    updateSnapshot();
  }, [gameTick, updateSnapshot]);

  const handleSpeedChange = useCallback((ms: number) => {
    intervalRef.current = ms;
  }, []);

  const handleOrder = useCallback(
    (params: { ticker: string; type: 'market' | 'limit'; side: 'buy' | 'sell'; quantity: number; price?: number }) => {
      const game = gameRef.current;
      const result = game.placeOrder(params.ticker, params.type, params.side, params.quantity, params.price);

      if (result.success) {
        const sideLabel = params.side === 'buy' ? '買' : '売';
        const typeLabel = params.type === 'market' ? '成行' : '指値';
        game.addNotification(`${typeLabel}注文: ${params.ticker} ${sideLabel} ${params.quantity}株`, 'success');
      } else {
        game.addNotification(result.message ?? 'エラー', 'error');
      }

      updateSnapshot();
    },
    [updateSnapshot],
  );

  const handleCancel = useCallback(
    (orderId: number) => {
      const game = gameRef.current;
      if (game.cancelOrder(orderId)) {
        game.addNotification('注文を取り消しました', 'info');
      }
      updateSnapshot();
    },
    [updateSnapshot],
  );

  const handleReplay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    gameRef.current = new GameState();
    updateSnapshot();
  }, [updateSnapshot]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isActive = snapshot.phase === 'running' || snapshot.phase === 'paused';
  const stock = STOCKS[selectedStock];

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] text-gray-200">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#16213e] border-b border-gray-700 shrink-0">
        <h1 className="text-lg font-bold text-[#4fc3f7]">株取引ゲーム</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            disabled={snapshot.phase !== 'idle'}
            className="px-4 py-1.5 bg-[#0f3460] border border-gray-600 rounded text-sm hover:bg-[#1a5276] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ▶ ゲーム開始
          </button>
          <button
            onClick={handlePause}
            disabled={!isActive}
            className="px-4 py-1.5 bg-[#0f3460] border border-gray-600 rounded text-sm hover:bg-[#1a5276] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {snapshot.phase === 'paused' ? '▶ 再開' : '⏸ 一時停止'}
          </button>
          <select
            onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
            defaultValue={DEFAULT_TICK_INTERVAL_MS}
            className="bg-[#0f3460] border border-gray-600 rounded px-2 py-1.5 text-sm"
          >
            {SPEED_OPTIONS.map((opt) => (
              <option key={opt.ms} value={opt.ms}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 min-w-[100px]">
            Day {snapshot.tick} / {TOTAL_TICKS}
          </span>
          <div className="w-28 h-1.5 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-[#4fc3f7] transition-all"
              style={{ width: `${(snapshot.tick / TOTAL_TICKS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Current Prices Bar */}
      <div className="flex gap-3 px-5 py-2 bg-[#16213e] border-b border-gray-800 shrink-0">
        {STOCKS.map((s, i) => (
          <button
            key={s.ticker}
            onClick={() => setSelectedStock(i)}
            className={`px-3 py-1 border-l-2 font-mono text-sm cursor-pointer hover:bg-white/5 ${
              selectedStock === i ? 'bg-white/10' : ''
            }`}
            style={{ borderColor: s.color }}
          >
            {s.ticker}: {formatCurrency(snapshot.prices[s.ticker])}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-[1fr_220px_300px] grid-rows-[1fr_auto] min-h-0 gap-px bg-gray-700">
        {/* Chart */}
        <div className="bg-[#1a1a2e] min-h-0">
          <CandlestickChart
            stock={stock}
            data={snapshot.candles[stock.ticker] ?? []}
            isActive={isActive}
          />
        </div>

        {/* Order Book */}
        <div className="bg-[#1a1a2e] min-h-0 overflow-hidden">
          <OrderBookPanel
            ticker={stock.ticker}
            orderBook={snapshot.orderBooks[stock.ticker]}
          />
        </div>

        {/* Portfolio */}
        <div className="bg-[#1a1a2e] min-h-0 overflow-y-auto">
          <PortfolioPanel portfolio={snapshot.portfolio} prices={snapshot.prices} />
        </div>

        {/* Bottom Area */}
        <div className="col-span-3 grid grid-cols-[280px_1fr] gap-px bg-gray-700 max-h-[260px]">
          {/* Order Form */}
          <div className="bg-[#1a1a2e]">
            <OrderForm disabled={!isActive} holdings={snapshot.portfolio.holdings} onOrder={handleOrder} />
          </div>

          {/* Order Lists */}
          <div className="bg-[#1a1a2e] overflow-hidden">
            <OrderList
              openOrders={snapshot.openOrders}
              orderHistory={snapshot.orderHistory}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <Notifications notifications={snapshot.notifications} />

      {/* Game Over */}
      <GameOverModal
        show={snapshot.phase === 'ended'}
        portfolio={snapshot.portfolio}
        prices={snapshot.prices}
        onReplay={handleReplay}
      />
    </div>
  );
}
