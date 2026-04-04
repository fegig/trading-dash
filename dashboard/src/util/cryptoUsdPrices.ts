import { get } from './request'
import { endpoints } from '../services/endpoints'

type PriceMultiRaw = Record<string, Record<string, { PRICE?: number }>>

function spotFromRaw(raw: PriceMultiRaw | undefined, sym: string): number {
  if (!raw || !sym) return 0
  const u = raw[sym]?.USD?.PRICE ?? raw[sym]?.USDT?.PRICE
  return typeof u === 'number' && Number.isFinite(u) && u > 0 ? u : 0
}

/** Batch USD (or USDT) spot from CryptoCompare via backend `/crypto/price`. */
export async function fetchUsdSpotMap(symbols: string[]): Promise<Map<string, number>> {
  const uniq = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 45)
  const out = new Map<string, number>()
  if (uniq.length === 0) return out
  try {
    const data = (await get(endpoints.crypto.price, {
      fsyms: uniq.join(','),
      tsyms: 'USD',
    })) as { RAW?: PriceMultiRaw; error?: string } | undefined
    if (!data || data.error || !data.RAW) return out
    for (const sym of uniq) {
      const p = spotFromRaw(data.RAW, sym)
      if (p > 0) out.set(sym, p)
    }
  } catch {
    /* ignore */
  }
  return out
}
