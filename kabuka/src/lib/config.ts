export interface StockConfig {
  ticker: string;
  name: string;
  initialPrice: number;
  volatility: number;
  drift: number;
  color: string;
  tickSize: number;
}

export const STOCKS: StockConfig[] = [
  {
    ticker: 'ALPHA',
    name: 'アルファ商事',
    initialPrice: 1000,
    volatility: 0.02,
    drift: 0.0003,
    color: '#4fc3f7',
    tickSize: 1,
  },
  {
    ticker: 'BETA',
    name: 'ベータテック',
    initialPrice: 3000,
    volatility: 0.05,
    drift: 0.0003,
    color: '#ff8a65',
    tickSize: 5,
  },
  {
    ticker: 'GAMMA',
    name: 'ガンマバイオ',
    initialPrice: 500,
    volatility: 0.08,
    drift: 0.0003,
    color: '#ce93d8',
    tickSize: 1,
  },
];

export const STARTING_CASH = 1_000_000;
export const TOTAL_TICKS = 100;
export const DEFAULT_TICK_INTERVAL_MS = 1000;

export const SPEED_OPTIONS = [
  { label: '2x', ms: 500 },
  { label: '1x', ms: 1000 },
  { label: '0.5x', ms: 2000 },
];
