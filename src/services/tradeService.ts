import type { AxiosResponse } from 'axios'
import { mockTradePositions } from '../data/trades'
import type { ClosedTradeRow, OpenTradeRow, TradePosition } from '../types/trade'
import { post } from '../util/request'
import { endpoints } from './endpoints'

function cloneTrade(trade: TradePosition): TradePosition {
  return {
    ...trade,
    tags: [...trade.tags],
  }
}

function toOpenTradeRow(trade: TradePosition): OpenTradeRow {
  return {
    tradeId: trade.tradeId,
    pair: trade.pair,
    option: trade.option,
    entryPrice: String(trade.entryPrice),
    entryTime: trade.entryTime,
    invested: String(trade.invested),
    currency: trade.currency,
  }
}

function toClosedTradeRow(trade: TradePosition): ClosedTradeRow {
  return {
    tradeId: trade.tradeId,
    pair: trade.pair,
    option: trade.option,
    entryTime: trade.entryTime,
    entryPrice: String(trade.entryPrice),
    invested: String(trade.invested),
    currency: trade.currency,
    closingTime: trade.closingTime,
    closingPrice: trade.closingPrice === 'pending' ? 'Pending' : String(trade.closingPrice),
    status: trade.status,
    roi: trade.roi === 'pending' ? 'pending' : String(trade.roi),
  }
}

export async function getTradePositions(userID: string): Promise<TradePosition[]> {
  void userID
  return mockTradePositions.map(cloneTrade)
}

export async function getOpenTrades(userID: string): Promise<OpenTradeRow[]> {
  const trades = await getTradePositions(userID)
  return trades
    .filter((trade) => trade.status === 'open' || trade.status === 'pending')
    .map(toOpenTradeRow)
}

export async function getClosedTrades(userID: string): Promise<ClosedTradeRow[]> {
  const trades = await getTradePositions(userID)
  return trades
    .filter((trade) => trade.status === 'completed' || trade.status === 'canceled')
    .map(toClosedTradeRow)
}

export async function closeTrade(tradeID: string) {
  try {
    return await post(endpoints.user.closeTrade, { tradeID })
  } catch {
    return { ok: true }
  }
}

export async function createExternalTradeToken(payload: {
  userId: string
  token: string
  time: number
  expires: number
  status: string
}) {
  try {
    return await post(endpoints.auth.createToken, payload)
  } catch {
    const data = {
      token: payload.token,
      expires: payload.expires,
    }
    return { data } as AxiosResponse
  }
}
