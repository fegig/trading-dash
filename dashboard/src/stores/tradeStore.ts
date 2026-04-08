import { create } from 'zustand'
import * as tradeService from '../services/tradeService'
import type { TradePosition } from '../types/trade'
import { useWalletStore } from './walletStore'

type TradeState = {
  trades: TradePosition[]
  loading: boolean
  loadedUserId: string | null
  selectedTradeId: string | null
  loadTrades: (userId: string, force?: boolean) => Promise<void>
  selectTrade: (tradeId: string | null) => void
  closeTrade: (tradeId: string) => Promise<void>
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  loading: false,
  loadedUserId: null,
  selectedTradeId: null,
  loadTrades: async (userId, force = false) => {
    const { loadedUserId, loading, trades: existing } = get()
    if (!force && loading) return
    if (!force && loadedUserId === userId && existing.length > 0) return

    // Only block the UI with a loading skeleton on the very first fetch.
    // Background refreshes (12-s poll, TRADE_REFRESH_EVENT) update silently.
    if (existing.length === 0) set({ loading: true })

    const trades = await tradeService.getTradePositions(userId)
    set((state) => {
      const stillSelected =
        state.selectedTradeId && trades.some((trade) => trade.tradeId === state.selectedTradeId)
      return {
        trades,
        loading: false,
        loadedUserId: userId,
        selectedTradeId: stillSelected ? state.selectedTradeId : trades[0]?.tradeId ?? null,
      }
    })
  },
  selectTrade: (tradeId) => set({ selectedTradeId: tradeId }),
  closeTrade: async (tradeId) => {
    const trade = get().trades.find((t) => t.tradeId === tradeId)
    const mpx =
      trade && typeof trade.marketPrice === 'number' && Number.isFinite(trade.marketPrice)
        ? trade.marketPrice
        : undefined
    await tradeService.closeTrade(tradeId, mpx)
    await useWalletStore.getState().loadWallet(true)
    const { loadedUserId } = get()
    if (loadedUserId) {
      await get().loadTrades(loadedUserId, true)
      return
    }
    const now = Math.floor(Date.now() / 1000)
    set((state) => ({
      trades: state.trades.map((trade) => {
        if (trade.tradeId !== tradeId || trade.status === 'completed') return trade
        const realized = Number((trade.pnl - trade.fees).toFixed(2))
        return {
          ...trade,
          status: 'completed',
          closingTime: now,
          closingPrice: trade.marketPrice,
          roi: realized,
          pnl: realized,
          note: `${trade.note} Closed manually from the open positions panel.`,
        }
      }),
    }))
  },
}))
