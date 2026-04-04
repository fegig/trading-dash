/** MySQL JSON / API payloads sometimes return stringified arrays instead of `string[]`. */
export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x))
  if (typeof value === 'string') {
    const t = value.trim()
    if (!t) return []
    try {
      const p = JSON.parse(t) as unknown
      if (Array.isArray(p)) return p.map((x) => String(x))
    } catch {
      /* single token */
    }
    return [t]
  }
  return []
}
