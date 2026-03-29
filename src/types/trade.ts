export type TradeSide = 'buy' | 'sell'

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
  status: string
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
