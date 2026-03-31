/** WebSocket base for live order book (e.g. ws://localhost:8787). */
export function liveWsBaseUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const http = import.meta.env.VITE_API_URL || import.meta.env.VITE_AUTH_API_BASE_URL || ''
  if (http.startsWith('https://')) return `wss://${http.slice(8)}`.replace(/\/$/, '')
  if (http.startsWith('http://')) return `ws://${http.slice(7)}`.replace(/\/$/, '')
  return 'ws://localhost:8787'
}

export function liveOrderBookWsUrl(pair: string): string {
  const base = liveWsBaseUrl()
  return `${base}/live/ws/${encodeURIComponent(pair)}`
}
