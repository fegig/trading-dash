import { create } from 'zustand'

export type Currency = {
  name: string
  symbol: string
}

type CurrencyState = {
  currency: Currency
  setCurrency: (c: Currency) => void
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: { name: 'USD', symbol: '$' },
  setCurrency: (c) => set({ currency: c }),
}))
