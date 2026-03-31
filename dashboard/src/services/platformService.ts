import {
  mockBotSubscriptions,
  mockCopyAllocations,
  mockCopyTraders,
  mockFollowingTraderIds,
  mockInvestmentPositions,
  mockInvestmentProducts,
  mockTradingBots,
} from '../data/platform'
import type {
  BotSubscription,
  CopyAllocation,
  CopyTraderProfile,
  InvestmentPosition,
  InvestmentProduct,
  TradingBotPlan,
} from '../types/platform'
import { get } from '../util/request'
import { endpoints } from './endpoints'

function cloneBots(): TradingBotPlan[] {
  return mockTradingBots.map((bot) => ({
    ...bot,
    markets: [...bot.markets],
    guardrails: [...bot.guardrails],
  }))
}

function cloneTraders(): CopyTraderProfile[] {
  return mockCopyTraders.map((trader) => ({
    ...trader,
    focusPairs: [...trader.focusPairs],
  }))
}

function cloneCopyAllocations(): CopyAllocation[] {
  return mockCopyAllocations.map((allocation) => ({ ...allocation }))
}

function cloneBotSubscriptions(): BotSubscription[] {
  return mockBotSubscriptions.map((sub) => ({ ...sub }))
}

function cloneInvestments(): InvestmentProduct[] {
  return mockInvestmentProducts.map((product) => ({
    ...product,
    focus: [...product.focus],
  }))
}

function clonePositions(): InvestmentPosition[] {
  return mockInvestmentPositions.map((position) => ({ ...position }))
}

export async function getTradingBots(): Promise<TradingBotPlan[]> {
  try {
    const data = await get(endpoints.platform.tradingBots)
    if (Array.isArray(data) && data.length > 0) return data as TradingBotPlan[]
  } catch {
    /* mock */
  }
  return cloneBots()
}

export async function getCopyTraders(): Promise<CopyTraderProfile[]> {
  try {
    const data = await get(endpoints.platform.copyTraders)
    if (Array.isArray(data) && data.length > 0) return data as CopyTraderProfile[]
  } catch {
    /* mock */
  }
  return cloneTraders()
}

export async function getInvestmentProducts(): Promise<InvestmentProduct[]> {
  try {
    const data = await get(endpoints.platform.investmentProducts)
    if (Array.isArray(data) && data.length > 0) return data as InvestmentProduct[]
  } catch {
    /* mock */
  }
  return cloneInvestments()
}

export async function getCopyAllocations(): Promise<CopyAllocation[]> {
  try {
    const data = await get(endpoints.platform.copyAllocations)
    if (Array.isArray(data)) return data as CopyAllocation[]
  } catch {
    /* mock */
  }
  return cloneCopyAllocations()
}

export async function getBotSubscriptions(): Promise<BotSubscription[]> {
  try {
    const data = await get(endpoints.platform.botSubscriptions)
    if (Array.isArray(data)) return data as BotSubscription[]
  } catch {
    /* mock */
  }
  return cloneBotSubscriptions()
}

export async function getFollowingTraderIds(): Promise<string[]> {
  try {
    const data = await get(endpoints.platform.followingTraders)
    if (Array.isArray(data)) return data as string[]
  } catch {
    /* mock */
  }
  return [...mockFollowingTraderIds]
}

export async function getInvestmentPositions(): Promise<InvestmentPosition[]> {
  try {
    const data = await get(endpoints.platform.investmentPositions)
    if (Array.isArray(data)) return data as InvestmentPosition[]
  } catch {
    /* mock */
  }
  return clonePositions()
}
