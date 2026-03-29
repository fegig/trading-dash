import { get } from '../util/request'
import { endpoints } from './endpoints'

/** Placeholder — extend when wallet API is live */
export async function getWalletAssets() {
  try {
    return await get(endpoints.wallet.assets)
  } catch {
    return null
  }
}

export async function getWalletTransactions() {
  try {
    return await get(endpoints.wallet.transactions)
  } catch {
    return null
  }
}
