import type { AxiosResponse } from 'axios'
import { post } from '../util/request'
import { endpoints } from './endpoints'
import type { ClosedTradeRow, OpenTradeRow } from '../types/trade'
import { mockClosedTrades, mockOpenTrades } from './tradeMocks'

export async function getOpenTrades(userID: string): Promise<OpenTradeRow[]> {
  try {
    const res = (await post(endpoints.user.getOpenTrades, { userID })) as AxiosResponse | undefined
    const d = res?.data?.data as OpenTradeRow[] | undefined
    if (Array.isArray(d)) return d
  } catch {
    return mockOpenTrades
  }
  return []
}

export async function getClosedTrades(userID: string): Promise<ClosedTradeRow[]> {
  try {
    const res = (await post(endpoints.user.getClosedTrades, { userID })) as AxiosResponse | undefined
    const d = res?.data?.data as ClosedTradeRow[] | undefined
    if (Array.isArray(d)) return d
  } catch {
    return mockClosedTrades
  }
  return []
}

export async function closeTrade(tradeID: string) {
  return post(endpoints.user.closeTrade, { tradeID })
}

export async function createExternalTradeToken(payload: {
  userId: string
  token: string
  time: number
  expires: number
  status: string
}) {
  return post(endpoints.auth.createToken, payload)
}
