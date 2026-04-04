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
import { asStringArray } from '../util/asStringArray'

function normalizeTradingBot(b: Record<string, unknown>): TradingBotPlan {
  const row = b as unknown as TradingBotPlan
  return {
    ...row,
    markets: asStringArray(b.markets),
    guardrails: asStringArray(b.guardrails),
  }
}

function normalizeCopyTrader(t: Record<string, unknown>): CopyTraderProfile {
  const row = t as unknown as CopyTraderProfile
  return {
    ...row,
    focusPairs: asStringArray(t.focusPairs),
  }
}

function normalizeInvestmentProduct(p: Record<string, unknown>): InvestmentProduct {
  const row = p as unknown as InvestmentProduct
  return {
    ...row,
    focus: asStringArray(p.focus),
  }
}

export async function getTradingBots(): Promise<TradingBotPlan[]> {
  const data = await get(endpoints.platform.tradingBots)
  if (!Array.isArray(data)) return []
  return (data as Record<string, unknown>[]).map(normalizeTradingBot)
}

export async function getCopyTraders(): Promise<CopyTraderProfile[]> {
  const data = await get(endpoints.platform.copyTraders)
  if (!Array.isArray(data)) return []
  return (data as Record<string, unknown>[]).map(normalizeCopyTrader)
}

export async function getInvestmentProducts(): Promise<InvestmentProduct[]> {
  const data = await get(endpoints.platform.investmentProducts)
  if (!Array.isArray(data)) return []
  return (data as Record<string, unknown>[]).map(normalizeInvestmentProduct)
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
