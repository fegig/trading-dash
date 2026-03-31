import type {
  BotSubscription,
  CopyAllocation,
  CopyTraderProfile,
  InvestmentPosition,
  InvestmentProduct,
  TradingBotPlan,
} from '../types/platform'
import { get, post } from '../util/request'
import { endpoints } from './endpoints'

export async function getTradingBots(): Promise<TradingBotPlan[]> {
  const data = await get(endpoints.platform.tradingBots)
  return Array.isArray(data) ? (data as TradingBotPlan[]) : []
}

export async function getCopyTraders(): Promise<CopyTraderProfile[]> {
  const data = await get(endpoints.platform.copyTraders)
  return Array.isArray(data) ? (data as CopyTraderProfile[]) : []
}

export async function getInvestmentProducts(): Promise<InvestmentProduct[]> {
  const data = await get(endpoints.platform.investmentProducts)
  return Array.isArray(data) ? (data as InvestmentProduct[]) : []
}

export async function getCopyAllocations(): Promise<CopyAllocation[]> {
  const data = await get(endpoints.platform.copyAllocations)
  return Array.isArray(data) ? (data as CopyAllocation[]) : []
}

export async function getBotSubscriptions(): Promise<BotSubscription[]> {
  const data = await get(endpoints.platform.botSubscriptions)
  return Array.isArray(data) ? (data as BotSubscription[]) : []
}

export async function getFollowingTraderIds(): Promise<string[]> {
  const data = await get(endpoints.platform.followingTraders)
  return Array.isArray(data) ? (data as string[]) : []
}

export async function getInvestmentPositions(): Promise<InvestmentPosition[]> {
  const data = await get(endpoints.platform.investmentPositions)
  return Array.isArray(data) ? (data as InvestmentPosition[]) : []
}

export async function subscribeBot(
  botId: string
): Promise<{ ok: true; subscription: BotSubscription } | { ok: false; message: string }> {
  const res = await post(endpoints.platform.botSubscribe, { botId })
  if (!res || typeof res !== 'object' || !('status' in res)) {
    return { ok: false, message: 'Network error' }
  }
  if (res.status !== 200) {
    const err = (res.data as { error?: string } | undefined)?.error
    return { ok: false, message: err ?? 'Request failed' }
  }
  const d = res.data as { ok?: boolean; subscription?: BotSubscription; error?: string }
  if (d.ok && d.subscription) return { ok: true, subscription: d.subscription }
  return { ok: false, message: d.error ?? 'Purchase failed' }
}

export async function followTraderAllocate(
  traderId: string,
  amount: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await post(endpoints.platform.followTraderAllocate, { traderId, amount })
  if (!res || typeof res !== 'object' || !('status' in res)) {
    return { ok: false, message: 'Network error' }
  }
  if (res.status !== 200) {
    const err = (res.data as { error?: string } | undefined)?.error
    return { ok: false, message: err ?? 'Request failed' }
  }
  const d = res.data as { ok?: boolean; error?: string }
  if (d.ok) return { ok: true }
  return { ok: false, message: d.error ?? 'Allocation failed' }
}

export async function investPosition(
  productId: string,
  amount: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await post(endpoints.platform.investPosition, { productId, amount })
  if (!res || typeof res !== 'object' || !('status' in res)) {
    return { ok: false, message: 'Network error' }
  }
  if (res.status !== 200) {
    const err = (res.data as { error?: string } | undefined)?.error
    return { ok: false, message: err ?? 'Request failed' }
  }
  const d = res.data as { ok?: boolean; error?: string }
  if (d.ok) return { ok: true }
  return { ok: false, message: d.error ?? 'Investment failed' }
}
