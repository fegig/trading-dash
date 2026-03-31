/** Fired when live desk closes a trade (TP/SL) or after a successful order; MiniTradeHistory listens. */
export const TRADE_REFRESH_EVENT = 'td-trades-refresh'

export function dispatchTradesRefresh(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(TRADE_REFRESH_EVENT))
}
