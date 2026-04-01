/** WebSocket base. Set VITE_WS_URL or VITE_API_URL at `vite build` time for production. */
export function liveWsBaseUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const http = import.meta.env.VITE_API_URL || ''
  if (http.startsWith('https://')) return `wss://${http.slice(8)}`.replace(/\/$/, '')
  if (http.startsWith('http://')) return `ws://${http.slice(7)}`.replace(/\/$/, '')
  if (import.meta.env.DEV) return 'ws://localhost:8787'
  return ''
}

export function liveOrderBookWsUrl(pair: string): string {
  const base = liveWsBaseUrl()
  return `${base}/live/ws/${encodeURIComponent(pair)}`
}
