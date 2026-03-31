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
import { isSubscriptionActive } from '../util/subscription'

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
  purchaseBot: (botId: string) => Promise<{ ok: boolean; message: string }>
  followTrader: (traderId: string, amount: number) => Promise<{ ok: boolean; message: string }>
  investProduct: (investmentId: string, amount: number) => Promise<{ ok: boolean; message: string }>
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
  purchaseBot: async (botId) => {
    const { bots, botSubscriptions } = get()
    const bot = bots.find((item) => item.id === botId)
    if (!bot) return { ok: false, message: 'Bot not found.' }
    const now = Math.floor(Date.now() / 1000)
    const activeSub = botSubscriptions.find((sub) => isSubscriptionActive(sub.expiresAt, now))
    if (activeSub) {
      const activeBot = bots.find((b) => b.id === activeSub.botId)
      if (activeSub.botId === botId)
        return { ok: false, message: `${bot.name} already has an active subscription.` }
      return {
        ok: false,
        message: `${activeBot?.name ?? 'Another bot'} is already running. Cancel it before activating a new plan.`,
      }
    }

    const api = await platformService.subscribeBot(botId)
    if (!api.ok) return { ok: false, message: api.message }

    await useWalletStore.getState().loadWallet(true)
    await get().loadCatalog(true)
    return { ok: true, message: `${bot.name} is now active on your account.` }
  },
  followTrader: async (traderId, amount) => {
    const { copyTraders } = get()
    const trader = copyTraders.find((item) => item.id === traderId)
    if (!trader) return { ok: false, message: 'Trader not found.' }
    if (!Number.isFinite(amount) || amount < trader.minAllocation) {
      return {
        ok: false,
        message: `Minimum allocation for ${trader.name} is $${trader.minAllocation}.`,
      }
    }

    const api = await platformService.followTraderAllocate(traderId, amount)
    if (!api.ok) return { ok: false, message: api.message }

    await useWalletStore.getState().loadWallet(true)
    await get().loadCatalog(true)
    return { ok: true, message: `${trader.name} allocation updated.` }
  },
  investProduct: async (investmentId, amount) => {
    const { investments } = get()
    const product = investments.find((item) => item.id === investmentId)
    if (!product) return { ok: false, message: 'Investment product not found.' }
    if (!Number.isFinite(amount) || amount < product.minAmount) {
      return { ok: false, message: `Minimum ticket for ${product.name} is $${product.minAmount}.` }
    }

    const api = await platformService.investPosition(investmentId, amount)
    if (!api.ok) return { ok: false, message: api.message }

    await useWalletStore.getState().loadWallet(true)
    await get().loadCatalog(true)
    return { ok: true, message: `${product.name} funded with $${amount}.` }
  },
}))
