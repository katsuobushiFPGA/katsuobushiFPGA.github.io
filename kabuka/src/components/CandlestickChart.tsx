'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
} from 'lightweight-charts';
import type { OHLC } from '@/lib/market';
import type { StockConfig } from '@/lib/config';

const RANGE_OPTIONS = [
  { label: '7日', days: 7 },
  { label: '30日', days: 30 },
  { label: '60日', days: 60 },
  { label: '全期間', days: 0 },
];

interface Props {
  stock: StockConfig;
  data: OHLC[];
  isActive: boolean;
}

function toChartCandle(d: OHLC) {
  return {
    time: d.time as unknown as import('lightweight-charts').Time,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  };
}

export default function CandlestickChart({ stock, data, isActive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const prevLenRef = useRef(0);
  const prevTickerRef = useRef(stock.ticker);
  const [rangeDays, setRangeDays] = useState(30);

  function applyVisibleRange(dataLen: number, days: number) {
    const chart = chartRef.current;
    if (!chart) return;

    if (days === 0) {
      // All: fit to content, but use full 100-day range if data is sparse
      const totalTicks = 100;
      chart.timeScale().setVisibleRange({
        from: 0 as unknown as import('lightweight-charts').Time,
        to: (totalTicks + 2) as unknown as import('lightweight-charts').Time,
      });
    } else {
      // Fixed window: always show `days` worth of space
      // Anchor the window so the latest data is near the right edge
      const latestTime = Math.max(dataLen - 1, 0);
      const from = Math.max(latestTime - days + 1, 0);
      const to = from + days + 1;
      chart.timeScale().setVisibleRange({
        from: from as unknown as import('lightweight-charts').Time,
        to: to as unknown as import('lightweight-charts').Time,
      });
    }
  }

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#1a1a2e' },
        textColor: '#888',
      },
      grid: {
        vertLines: { color: '#2a2a4a' },
        horzLines: { color: '#2a2a4a' },
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#333',
      },
      crosshair: {
        mode: 0,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#4caf50',
      downColor: '#f44336',
      borderUpColor: '#4caf50',
      borderDownColor: '#f44336',
      wickUpColor: '#4caf50',
      wickDownColor: '#f44336',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Update data
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;

    const tickerChanged = prevTickerRef.current !== stock.ticker;

    if (tickerChanged || prevLenRef.current === 0) {
      seriesRef.current.setData(data.map(toChartCandle));
      applyVisibleRange(data.length, rangeDays);
      prevTickerRef.current = stock.ticker;
    } else if (data.length > prevLenRef.current) {
      const latest = data[data.length - 1];
      seriesRef.current.update(toChartCandle(latest));
      applyVisibleRange(data.length, rangeDays);
    }

    prevLenRef.current = data.length;
  }, [stock.ticker, data, data.length, rangeDays]);

  const handleRangeChange = (days: number) => {
    setRangeDays(days);
    applyVisibleRange(data.length, days);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-2 py-1">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: stock.color }}
        />
        <span className="text-sm font-bold" style={{ color: stock.color }}>
          {stock.ticker}
        </span>
        <span className="text-xs text-gray-400">{stock.name}</span>
        {data.length > 0 && (
          <span className="text-xs font-mono text-gray-300 ml-auto mr-3">
            ¥{data[data.length - 1].close.toLocaleString()}
          </span>
        )}
        <div className="flex gap-1 ml-auto">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => handleRangeChange(opt.days)}
              className={`px-2 py-0.5 text-xs rounded border ${
                rangeDays === opt.days
                  ? 'bg-[#4fc3f7]/20 border-[#4fc3f7] text-[#4fc3f7]'
                  : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
