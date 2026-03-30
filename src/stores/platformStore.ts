import { create } from 'zustand'
import * as platformService from '../services/platformService'
import { useWalletStore } from './walletStore'
import type {
  BotSubscription,
  CopyAllocation,
  CopyTraderProfile,
  InvestmentPosition,
  InvestmentProduct,
  TradingBotPlan,
} from '../types/platform'
import { DEFAULT_SUBSCRIPTION_DAYS, isSubscriptionActive, subscriptionPeriodSeconds } from '../util/subscription'

type PlatformState = {
  bots: TradingBotPlan[]
  copyTraders: CopyTraderProfile[]
  copyAllocations: CopyAllocation[]
  investments: InvestmentProduct[]
  botSubscriptions: BotSubscription[]
  followingTraderIds: string[]
  investmentPositions: InvestmentPosition[]
  loading: boolean
  loaded: boolean
  selectedBotId: string | null
  selectedTraderId: string | null
  selectedInvestmentId: string | null
  loadCatalog: (force?: boolean) => Promise<void>
  selectBot: (botId: string | null) => void
  selectTrader: (traderId: string | null) => void
  selectInvestment: (investmentId: string | null) => void
  purchaseBot: (botId: string) => { ok: boolean; message: string }
  followTrader: (traderId: string, amount: number) => { ok: boolean; message: string }
  investProduct: (investmentId: string, amount: number) => { ok: boolean; message: string }
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  bots: [],
  copyTraders: [],
  copyAllocations: [],
  investments: [],
  botSubscriptions: [],
  followingTraderIds: [],
  investmentPositions: [],
  loading: false,
  loaded: false,
  selectedBotId: null,
  selectedTraderId: null,
  selectedInvestmentId: null,
  loadCatalog: async (force = false) => {
    if (!force && (get().loading || get().loaded)) return
    set({ loading: true })
    const [
      bots,
      copyTraders,
      copyAllocations,
      investments,
      botSubscriptions,
      followingTraderIds,
      investmentPositions,
    ] = await Promise.all([
      platformService.getTradingBots(),
      platformService.getCopyTraders(),
      platformService.getCopyAllocations(),
      platformService.getInvestmentProducts(),
      platformService.getBotSubscriptions(),
      platformService.getFollowingTraderIds(),
      platformService.getInvestmentPositions(),
    ])

    set({
      bots,
      copyTraders,
      copyAllocations,
      investments,
      botSubscriptions,
      followingTraderIds,
      investmentPositions,
      loading: false,
      loaded: true,
      selectedBotId: bots[0]?.id ?? null,
      selectedTraderId: copyTraders[0]?.id ?? null,
      selectedInvestmentId: investments[0]?.id ?? null,
    })
  },
  selectBot: (botId) => set({ selectedBotId: botId }),
  selectTrader: (traderId) => set({ selectedTraderId: traderId }),
  selectInvestment: (investmentId) => set({ selectedInvestmentId: investmentId }),
  purchaseBot: (botId) => {
    const { bots, botSubscriptions } = get()
    const bot = bots.find((item) => item.id === botId)
    if (!bot) return { ok: false, message: 'Bot not found.' }
    const now = Math.floor(Date.now() / 1000)
    const hasActive = botSubscriptions.some(
      (sub) => sub.botId === botId && isSubscriptionActive(sub.expiresAt, now)
    )
    if (hasActive) return { ok: false, message: 'This bot already has an active subscription.' }

    const walletResult = useWalletStore
      .getState()
      .spendFiat(bot.priceUsd, `${bot.name} activation purchased from bot desk.`, 'Bot Purchase')

    if (!walletResult.ok) return walletResult

    const days = bot.subscriptionDays ?? DEFAULT_SUBSCRIPTION_DAYS
    const subscribedAt = now
    const newSub: BotSubscription = {
      botId,
      subscribedAt,
      expiresAt: subscribedAt + subscriptionPeriodSeconds(days),
      lifetimePnlUsd: 0,
    }
    set((state) => ({ botSubscriptions: [...state.botSubscriptions, newSub] }))
    return { ok: true, message: `${bot.name} is now active on your account.` }
  },
  followTrader: (traderId, amount) => {
    const { copyTraders } = get()
    const trader = copyTraders.find((item) => item.id === traderId)
    if (!trader) return { ok: false, message: 'Trader not found.' }
    if (!Number.isFinite(amount) || amount < trader.minAllocation) {
      return {
        ok: false,
        message: `Minimum allocation for ${trader.name} is $${trader.minAllocation}.`,
      }
    }

    const walletResult = useWalletStore
      .getState()
      .spendFiat(amount, `${amount} USD allocated to ${trader.name}.`, 'Copy Trading Allocation')

    if (!walletResult.ok) return walletResult

    const now = Math.floor(Date.now() / 1000)
    const period = subscriptionPeriodSeconds(DEFAULT_SUBSCRIPTION_DAYS)
    let totalAllocation = amount
    set((state) => {
      const existing = state.copyAllocations.find((allocation) => allocation.traderId === traderId)
      if (existing) {
        const nextAmount = Number((existing.amount + amount).toFixed(2))
        totalAllocation = nextAmount
        // Renewal: extend subscription from current expiry or now, whichever is later.
        const nextExpiresAt = Math.max(now, existing.expiresAt) + period
        return {
          followingTraderIds: state.followingTraderIds.includes(traderId)
            ? state.followingTraderIds
            : [...state.followingTraderIds, traderId],
          copyAllocations: state.copyAllocations.map((allocation) =>
            allocation.traderId === traderId
              ? { ...allocation, amount: nextAmount, expiresAt: nextExpiresAt }
              : allocation
          ),
        }
      }

      return {
        followingTraderIds: state.followingTraderIds.includes(traderId)
          ? state.followingTraderIds
          : [...state.followingTraderIds, traderId],
        copyAllocations: [
          ...state.copyAllocations,
          {
            traderId,
            amount,
            startedAt: now,
            expiresAt: now + period,
            lifetimePnlUsd: 0,
          },
        ],
      }
    })

    return { ok: true, message: `${trader.name} allocation is now $${totalAllocation}.` }
  },
  investProduct: (investmentId, amount) => {
    const { investments } = get()
    const product = investments.find((item) => item.id === investmentId)
    if (!product) return { ok: false, message: 'Investment product not found.' }
    if (!Number.isFinite(amount) || amount < product.minAmount) {
      return { ok: false, message: `Minimum ticket for ${product.name} is $${product.minAmount}.` }
    }

    const walletResult = useWalletStore
      .getState()
      .spendFiat(amount, `${amount} USD subscribed to ${product.name}.`, 'Investment Subscription')

    if (!walletResult.ok) return walletResult

    const startedAt = Math.floor(Date.now() / 1000)
    set((state) => {
      const existing = state.investmentPositions.find((position) => position.productId === investmentId)
      if (existing) {
        return {
          investmentPositions: state.investmentPositions.map((position) =>
            position.productId === investmentId
              ? { ...position, amount: Number((position.amount + amount).toFixed(2)) }
              : position
          ),
        }
      }
      return {
        investmentPositions: [...state.investmentPositions, { productId: investmentId, amount, startedAt }],
      }
    })

    return { ok: true, message: `${product.name} funded with $${amount}.` }
  },
}))
