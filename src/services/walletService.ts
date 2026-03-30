import { mockWalletAssets, mockWalletTransactions } from '../data/wallet'
import type { TransactionHistoryProps, UserCoinsProps } from '../types/wallet'
import { get } from '../util/request'
import { endpoints } from './endpoints'

function cloneAssets(): UserCoinsProps[] {
  return mockWalletAssets.map((asset) => ({ ...asset }))
}

function cloneTransactions(): TransactionHistoryProps[] {
  return mockWalletTransactions.map((transaction) => ({
    ...transaction,
    method: { ...transaction.method },
  }))
}

export async function getWalletAssets(): Promise<UserCoinsProps[]> {
  try {
    const res = await get(endpoints.wallet.assets)
    if (Array.isArray(res)) return res as UserCoinsProps[]
  } catch {
    return cloneAssets()
  }
  return cloneAssets()
}

export async function getWalletTransactions(): Promise<TransactionHistoryProps[]> {
  try {
    const res = await get(endpoints.wallet.transactions)
    if (Array.isArray(res)) return res as TransactionHistoryProps[]
  } catch {
    return cloneTransactions()
  }
  return cloneTransactions()
}
