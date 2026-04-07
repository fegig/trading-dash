import { create } from 'zustand'
import { get } from '../util/request'
import { endpoints } from '../services/endpoints'

export type SiteConfigSnapshot = {
  siteName?: string
  supportEmail?: string
  supportPhone?: string
  ogTitle?: string
  ogDescription?: string
  siteLogoUrl?: string | null
  emailLogoUrl?: string | null
  faviconUrl?: string | null
  ogImageUrl?: string | null
  /** Bump cache-busters for `<img>` / favicon after uploads */
  settingsUpdatedAt?: number
}

const DEFAULT_SITE_NAME = 'BlockTrade'

function siteNameFallbackFromEnv(): string {
  const raw = import.meta.env.VITE_SITE_NAME_FALLBACK
  const s = typeof raw === 'string' ? raw.trim() : ''
  return s.length > 0 ? s : DEFAULT_SITE_NAME
}

/** Default label when site-config has no `siteName` (from `VITE_SITE_NAME_FALLBACK` in `.env`, else BlockTrade). */
export const SITE_NAME_FALLBACK = siteNameFallbackFromEnv()

type State = SiteConfigSnapshot & {
  loaded: boolean
  hydrate: () => Promise<void>
}

export const useSiteConfigStore = create<State>((set) => ({
  loaded: false,
  hydrate: async () => {
    try {
      const data = await get<SiteConfigSnapshot>(endpoints.public.siteConfig)
      set(data ? { ...data, loaded: true } : { loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
}))
