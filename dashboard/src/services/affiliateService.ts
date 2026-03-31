import { get, post } from '../util/request'
import { endpoints } from './endpoints'

export async function getAffiliateSummary(userId: string) {
  try {
    const res = await post(endpoints.affiliate.summary, { userId })
    return res
  } catch {
    return null
  }
}

export async function getReferrals(userId: string) {
  try {
    const res = await get(
      `${endpoints.affiliate.referrals}?userId=${encodeURIComponent(userId)}`
    )
    return res
  } catch {
    return null
  }
}
