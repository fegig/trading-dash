export type TradeSide = 'buy' | 'sell'

export type TradeDirection = 'long' | 'short'

export type TradeStatus = 'open' | 'completed' | 'pending' | 'canceled' | 'failed'

export type MarginType = 'isolated' | 'cross'

export type TradePosition = {
  tradeId: string
  pair: string
  base: string
  quote: string
  option: TradeSide
  direction: TradeDirection
  entryTime: number
  entryPrice: number
  invested: number
  currency: string
  closingTime: number | 'pending'
  closingPrice: number | 'pending'
  status: TradeStatus
  roi: number | 'pending'
  leverage: number
  size: number
  margin: number
  marginPercentage: number
  marginType: MarginType
  pnl: number
  sl: number
  tp: number
  fees: number
  liquidationPrice: number
  marketPrice: number
  strategy: string
  confidence: number
  riskReward: string
  note: string
  setup: string
  fundedWith: string
  executionVenue: string
  tags: string[]
}

export type OpenTradeRow = {
  tradeId: string
  pair: string
  option: TradeSide
  entryPrice: string
  entryTime: number
  invested: string
  currency: string
}

export type ClosedTradeRow = {
  tradeId: string
  pair: string
  option: TradeSide
  entryTime: number
  entryPrice: string
  invested: string
  currency: string
  closingTime: number | 'pending'
  closingPrice: string
  status: TradeStatus
  roi: string | 'pending'
}

export type WonLossPayload = {
  won: unknown[]
  loss: unknown[]
  pending: unknown[]
}

export type BalancePayload = {
  fiat: number
  bonus: number
}
