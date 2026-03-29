import type { ClosedTradeRow, OpenTradeRow } from '../types/trade'

export const mockOpenTrades: OpenTradeRow[] = [
  {
    tradeId: 't1',
    pair: 'BTC/USDT',
    option: 'buy',
    entryPrice: '84250.5',
    entryTime: Math.floor(Date.now() / 1000) - 3600,
    invested: '500',
    currency: 'USDT',
  },
  {
    tradeId: 't2',
    pair: 'ETH/USDT',
    option: 'sell',
    entryPrice: '2455.2',
    entryTime: Math.floor(Date.now() / 1000) - 7200,
    invested: '200',
    currency: 'USDT',
  },
]

export const mockClosedTrades: ClosedTradeRow[] = [
  {
    tradeId: 'c1',
    pair: 'BTC/USDT',
    option: 'buy',
    entryTime: Math.floor(Date.now() / 1000) - 86400 * 3,
    entryPrice: '81000',
    invested: '300',
    currency: 'USDT',
    closingTime: Math.floor(Date.now() / 1000) - 86400 * 2,
    closingPrice: '83500',
    status: 'closed',
    roi: '92.5',
  },
  {
    tradeId: 'c2',
    pair: 'SOL/USDT',
    option: 'sell',
    entryTime: Math.floor(Date.now() / 1000) - 86400 * 5,
    entryPrice: '142.3',
    invested: '150',
    currency: 'USDT',
    closingTime: Math.floor(Date.now() / 1000) - 86400 * 4,
    closingPrice: '138.1',
    status: 'closed',
    roi: '-18.2',
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    tradeId: `c${i + 3}`,
    pair: 'XRP/USDT',
    option: 'buy' as const,
    entryTime: Math.floor(Date.now() / 1000) - 86400 * (10 + i),
    entryPrice: '0.52',
    invested: '100',
    currency: 'USDT',
    closingTime: Math.floor(Date.now() / 1000) - 86400 * (9 + i),
    closingPrice: '0.55',
    status: 'closed',
    roi: '12',
  })),
]
