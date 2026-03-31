export type WalletAssetType = 'crypto' | 'fiat'

/** User's primary fiat (account currency). All `asset.price` values are USD per one unit of that asset. */
export type WalletDisplayCurrency = {
  code: string
  name: string
  /** USD value of 1 unit of account currency (e.g. 1 EUR ≈ 1.08). Always 1 for USD. */
  usdPerUnit: number
}

export type WalletAssetsApiResponse = {
  displayCurrency: WalletDisplayCurrency
  assets: UserCoinsProps[]
}

export interface UserCoinsProps {
  walletAddress: string
  userBalance: number
  coinName: string
  coinShort: string
  coinChain: string
  coinId: string
  walletId: string
  /** USD per 1 unit of this asset (crypto spot; for fiat = FX rate vs USD). */
  price: string
  change24hrs: string
  coinColor: string
  assetType: WalletAssetType
  fundingEligible: boolean
  iconUrl?: string
  iconClass?: string
  description?: string
}

export type TransactionType =
  | 'buy'
  | 'sell'
  | 'transfer'
  | 'withdrawal'
  | 'deposit'
  | 'fee'
  | 'interest'
  | 'dividend'
  | 'tax'
  | 'other'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export type TransactionTimeFilter = '1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'

export type TransactionMethod = {
  type: 'bank' | 'card' | 'crypto' | 'fiat' | 'other'
  name: string
  icon?: string
  iconClass?: string
  symbol: string
}

export type TransactionHistoryProps = {
  id: string
  type: TransactionType
  amount: number
  eqAmount: number
  status: TransactionStatus
  createdAt: number
  method: TransactionMethod
  note?: string
}

export type WalletConversionQuote = {
  fromAssetId: string
  toAssetId: string
  fromAmount: number
  toAmount: number
  rate: number
  fee: number
  usdValue: number
}
