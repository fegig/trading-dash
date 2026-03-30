import {
  mockCopyAllocations,
  mockCopyTraders,
  mockFollowingTraderIds,
  mockInvestmentPositions,
  mockInvestmentProducts,
  mockOwnedBotIds,
  mockTradingBots,
} from '../data/platform'
import type {
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

export async function getOwnedBotIds(): Promise<string[]> {
  return [...mockOwnedBotIds]
}

export async function getFollowingTraderIds(): Promise<string[]> {
  return [...mockFollowingTraderIds]
}

export async function getInvestmentPositions(): Promise<InvestmentPosition[]> {
  return clonePositions()
}
