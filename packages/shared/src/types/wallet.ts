export type WalletAssetType = 'crypto' | 'fiat'

export interface UserCoinsProps {
  walletAddress: string
  userBalance: number
  coinName: string
  coinShort: string
  coinChain: string
  coinId: string
  walletId: string
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
