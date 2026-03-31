import type { AxiosResponse } from 'axios'
import { post } from '../util/request'
import { endpoints } from './endpoints'
import type { BalancePayload, WonLossPayload } from '../types/trade'

export async function getOtherBalance(userId: string): Promise<BalancePayload | null> {
  try {
    const res = (await post(endpoints.user.getOtherBalance, { userId })) as AxiosResponse | undefined
    const inner = res?.data?.data as { fiat?: number; bonus?: number } | undefined
    if (inner && typeof inner.fiat === 'number')
      return { fiat: inner.fiat, bonus: typeof inner.bonus === 'number' ? inner.bonus : 0 }
  } catch {
    return null
  }
  return null
}

export async function getWonLoss(userId: string): Promise<WonLossPayload | null> {
  try {
    const res = (await post(endpoints.user.wonLoss, { userId })) as AxiosResponse | undefined
    const body = res?.data as WonLossPayload | undefined
    if (
      body &&
      Array.isArray(body.won) &&
      Array.isArray(body.loss) &&
      Array.isArray(body.pending)
    )
      return body
  } catch {
    return null
  }
  return null
}

export async function getActivityLog(userId: string) {
  try {
    const res = (await post(endpoints.user.getActivityLog, { userId })) as AxiosResponse | undefined
    const rows = res?.data?.data
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}
