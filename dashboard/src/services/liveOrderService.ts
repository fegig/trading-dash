import { post } from '@/util/request'
import { endpoints } from './endpoints'

export async function placeLiveOrder(payload: {
  pair: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  amount: number
  leverage: number
  price?: number
  marginType: 'isolated' | 'cross'
}) {
  return post(endpoints.live.placeOrder, { ...payload } as Record<string, unknown>)
}
