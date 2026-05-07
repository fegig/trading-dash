import { useEffect, useRef, useState } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'zh-TW', label: '中文 (繁體)' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ru', label: 'Русский' },
  { code: 'it', label: 'Italiano' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'hi', label: 'हिन्दी' },
]

function getCurrentLang(): string {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[a-z-]+\/([a-z-]+)/i)
  return match?.[1] ?? 'en'
}

/**
 * Programmatically switch language using Google Translate Element's hidden combo select.
 * Falls back to setting the googtrans cookie + reload when the element isn't ready yet.
 */
function switchLanguage(code: string) {
  const select = document.querySelector<HTMLSelectElement>('.goog-te-combo')
  if (select) {
    select.value = code
    select.dispatchEvent(new Event('change'))
    return
  }
  // Element not ready yet — use cookie + reload fallback
  const host = window.location.hostname
  const exp = 'expires=Thu, 01 Jan 1970 00:00:00 UTC'
  ;[`googtrans=; ${exp}; path=/`, `googtrans=; ${exp}; domain=${host}; path=/`].forEach(
    (c) => { document.cookie = c }
  )
  if (code !== 'en') {
    ;[`googtrans=/en/${code}; path=/`, `googtrans=/en/${code}; domain=${host}; path=/`].forEach(
      (c) => { document.cookie = c }
    )
  }
  window.location.reload()
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<string>(() => getCurrentLang())
  const containerRef = useRef<HTMLDivElement>(null)

  const applyLanguage = (code: string) => {
    setOpen(false)
    setCurrent(code)
    switchLanguage(code)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLabel = LANGUAGES.find((l) => l.code === current)?.label ?? 'EN'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-sm font-medium text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
        aria-label="Change language"
        aria-expanded={open}
      >
        <i className="fi fi-rr-globe text-base leading-none" />
        <span className="hidden sm:inline text-xs">{currentLabel}</span>
        <i className={`fi fi-rr-angle-small-down text-xs text-neutral-500 transition-transform duration-150 ${open ? '-rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden z-999">
          <div className="max-h-72 overflow-y-auto py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => applyLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  current === lang.code
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
