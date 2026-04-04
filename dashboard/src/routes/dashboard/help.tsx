import { useEffect, useState } from 'react'
import { get } from '@/util/request'
import { endpoints } from '@/services/endpoints'
import { useSiteConfigStore } from '@/stores'

type FaqRow = { q: string; a: string }

export default function HelpPage() {
  const [faq, setFaq] = useState<FaqRow[]>([])
  const supportEmail = useSiteConfigStore((s) => s.supportEmail)?.trim()
  const supportPhone = useSiteConfigStore((s) => s.supportPhone)?.trim()
  const loaded = useSiteConfigStore((s) => s.loaded)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const catRes = await get<{ data: { id: number; name: string }[] }>(endpoints.public.faqCategories)
        const cats = catRes?.data ?? []
        const out: FaqRow[] = []
        for (const c of cats.slice(0, 12)) {
          const itemRes = await get<{ data: { question: string; answer: string }[] }>(
            endpoints.public.faqItems(c.id)
          )
          const rows = itemRes?.data ?? []
          for (const r of rows) {
            out.push({ q: r.question, a: r.answer })
            if (out.length >= 16) break
          }
          if (out.length >= 16) break
        }
        if (!cancelled) setFaq(out)
      } catch {
        if (!cancelled) setFaq([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Help &amp; support</h1>
        <p className="text-sm text-neutral-500 mt-2">Answers from your FAQ catalog and direct support contacts.</p>
      </div>
      {faq.length === 0 ? (
        <p className="text-sm text-neutral-500">No FAQ entries yet, or they could not be loaded.</p>
      ) : (
        <div className="space-y-4">
          {faq.map((item, i) => (
            <div key={`${i}-${item.q.slice(0, 24)}`} className="gradient-background p-4 rounded-xl">
              <h2 className="text-sm font-semibold text-neutral-200">{item.q}</h2>
              <p className="text-sm text-neutral-500 mt-2 whitespace-pre-wrap">{item.a}</p>
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-neutral-600 space-y-1">
        <p className="font-medium text-neutral-500">Contact</p>
        {loaded && (supportEmail || supportPhone) ? (
          <p className="text-neutral-400">
            {supportEmail ? (
              <a href={`mailto:${supportEmail}`} className="underline hover:text-neutral-200">
                {supportEmail}
              </a>
            ) : null}
            {supportEmail && supportPhone ? <span className="mx-2">·</span> : null}
            {supportPhone ? <span>{supportPhone}</span> : null}
          </p>
        ) : loaded ? (
          <p className="text-neutral-500">Support email and phone can be configured by an administrator.</p>
        ) : null}
      </div>
    </div>
  )
}
