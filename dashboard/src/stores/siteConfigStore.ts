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

/** Matches previous hardcoded marketing name when API is unavailable. */
export const SITE_NAME_FALLBACK = 'BlockTrade'

type State = SiteConfigSnapshot & {
  loaded: boolean
  hydrate: () => Promise<void>
}

export const useSiteConfigStore = create<State>((set) => ({
  loaded: false,
  hydrate: async () => {
    try {
      const data = await get<SiteConfigSnapshot>(endpoints.public.siteConfig)
      set({ ...data, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
}))
