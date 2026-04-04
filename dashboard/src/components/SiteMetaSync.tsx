import { useEffect } from 'react'
import { SITE_NAME_FALLBACK, useSiteConfigStore } from '../stores/siteConfigStore'

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLinkIcon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[data-site-favicon]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.setAttribute('data-site-favicon', 'true')
    document.head.appendChild(link)
  }
  link.href = href
}

/** document.title, Open Graph / Twitter cards, and favicon from public site-config. */
export function SiteMetaSync() {
  const siteName = useSiteConfigStore((s) => s.siteName)
  const ogTitle = useSiteConfigStore((s) => s.ogTitle)
  const ogDescription = useSiteConfigStore((s) => s.ogDescription)
  const ogImageUrl = useSiteConfigStore((s) => s.ogImageUrl)
  const faviconUrl = useSiteConfigStore((s) => s.faviconUrl)
  const settingsUpdatedAt = useSiteConfigStore((s) => s.settingsUpdatedAt)
  const loaded = useSiteConfigStore((s) => s.loaded)

  useEffect(() => {
    if (!loaded) return
    const name = siteName?.trim() || SITE_NAME_FALLBACK
    const title = ogTitle?.trim() || name
    const desc =
      ogDescription?.trim() ||
      `${name} — trading, wallet, and account workspace.`
    document.title = title

    const v = settingsUpdatedAt ?? 0
    const bust = (u: string) => `${u}${u.includes('?') ? '&' : '?'}v=${v}`

    setMetaProperty('og:title', title)
    setMetaProperty('og:description', desc)
    setMetaProperty('og:type', 'website')
    if (ogImageUrl) {
      setMetaProperty('og:image', bust(ogImageUrl))
    }
    setMetaName('twitter:card', 'summary_large_image')
    setMetaName('twitter:title', title)
    setMetaName('twitter:description', desc)
    if (ogImageUrl) {
      setMetaName('twitter:image', bust(ogImageUrl))
    }

    if (faviconUrl) {
      setLinkIcon(bust(faviconUrl))
    }
  }, [
    siteName,
    ogTitle,
    ogDescription,
    ogImageUrl,
    faviconUrl,
    settingsUpdatedAt,
    loaded,
  ])

  return null
}
