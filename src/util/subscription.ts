export const DEFAULT_SUBSCRIPTION_DAYS = 30

export function subscriptionPeriodSeconds(days: number) {
  return days * 86400
}

export function isSubscriptionActive(expiresAt: number, nowSec: number) {
  return expiresAt > nowSec
}
