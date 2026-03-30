export type RiskLevel = 'Low' | 'Moderate' | 'High'
export type InvestmentCategory = 'Short Term' | 'Long Term' | 'Retirement'

export type TradingBotPlan = {
  id: string
  name: string
  strapline: string
  description: string
  strategy: string
  priceUsd: number
  monthlyTarget: string
  winRate: number
  maxDrawdown: number
  markets: string[]
  cadence: string
  guardrails: string[]
}

export type CopyTraderProfile = {
  id: string
  name: string
  handle: string
  specialty: string
  followers: number
  winRate: number
  maxDrawdown: number
  minAllocation: number
  feePct: number
  monthlyReturn: string
  bio: string
  focusPairs: string[]
  capacity: 'Open' | 'Limited'
}

export type CopyAllocation = {
  traderId: string
  amount: number
  startedAt: number
}

export type InvestmentProduct = {
  id: string
  name: string
  subtitle: string
  category: InvestmentCategory
  vehicle: string
  apy: number
  termDays: number
  minAmount: number
  liquidity: string
  distribution: string
  fundedPct: number
  risk: RiskLevel
  focus: string[]
  objective: string
  suitableFor: string
  description: string
}

export type InvestmentPosition = {
  productId: string
  amount: number
  startedAt: number
}
