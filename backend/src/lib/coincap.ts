const COINCAP_ICON_BASE = 'https://assets.coincap.io/assets/icons'

/** CoinCap asset icons: `{slug}@2x.png` (slug is usually the ticker lowercased). */
export function coincapIconUrl(symbol: string): string {
  const slug = symbol.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${COINCAP_ICON_BASE}/${slug}@2x.png`
}
