import { get } from '../util/request'
import { endpoints } from './endpoints'

export interface CoinData {
  time: number
  open: number
  close: number
  price: number
  high: number
  low: number
  volumefrom: number
  volumeto: number
  change24hrs: number
}

export interface CoinBio {
  coinId: string
  coinName: string
  coinShort: string
  coinChain: string
  confirmLevel: number
  price: string
  change24hrs: string
  volume24hrs: string
  supply: string
  marketCapital: string
  circulatingSupply: string
  openDay: string
  highDay: string
  lowDay: string
}

export interface CoinReturn {
  info: CoinBio
  hChanges: CoinData[]
  dChanges: CoinData[]
  wChanges: CoinData[]
  mChanges: CoinData[]
  yChanges: CoinData[]
}

async function getCoinById(base: string, quote: string): Promise<CoinReturn> {
  const data = await get(endpoints.crypto.coinDetail, { base, quote })
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid coin detail response')
  }
  if ('error' in data && typeof (data as { error: unknown }).error === 'string') {
    throw new Error((data as { error: string }).error)
  }
  return data as CoinReturn
}

export { getCoinById }
