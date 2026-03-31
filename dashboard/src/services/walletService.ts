import type { TransactionHistoryProps, UserCoinsProps } from '../types/wallet'
import { get } from '../util/request'
import { endpoints } from './endpoints'

export async function getWalletAssets(): Promise<UserCoinsProps[]> {
  const res = await get(endpoints.wallet.assets)
  return Array.isArray(res) ? (res as UserCoinsProps[]) : []
}

export async function getWalletTransactions(): Promise<TransactionHistoryProps[]> {
  const res = await get(endpoints.wallet.transactions)
  return Array.isArray(res) ? (res as TransactionHistoryProps[]) : []
}
