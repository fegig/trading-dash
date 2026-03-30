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
  return cloneBots()
}

export async function getCopyTraders(): Promise<CopyTraderProfile[]> {
  return cloneTraders()
}

export async function getInvestmentProducts(): Promise<InvestmentProduct[]> {
  return cloneInvestments()
}

export async function getCopyAllocations(): Promise<CopyAllocation[]> {
  return cloneCopyAllocations()
}

export async function getBotSubscriptions(): Promise<BotSubscription[]> {
  return cloneBotSubscriptions()
}

export async function getFollowingTraderIds(): Promise<string[]> {
  return [...mockFollowingTraderIds]
}

export async function getInvestmentPositions(): Promise<InvestmentPosition[]> {
  return clonePositions()
}
