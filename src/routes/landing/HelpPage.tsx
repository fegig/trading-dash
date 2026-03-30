import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import * as helpContentService from '@/services/helpContentService'
import {
  FALLBACK_FAQ_CATEGORIES,
  type FaqCategory,
} from '@/data/helpFallback'

export default function HelpPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    helpContentService
      .fetchFaqCategories<{ data?: FaqCategory[] }>()
      .then((res) => {
        const data = res.data?.data
        if (Array.isArray(data) && data.length > 0) {
          setCategories(
            data.map((c) => ({ id: Number(c.id), name: String((c as { name?: string }).name ?? 'Category') }))
          )
        } else {
          setCategories(FALLBACK_FAQ_CATEGORIES)
        }
      })
      .catch(() => setCategories(FALLBACK_FAQ_CATEGORIES))
  }, [])

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchText.trim().toLowerCase())
  )

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Help center</h1>
          <p className="mt-2 text-neutral-400">Find answers and browse topics by category.</p>
        </div>
        <div className="flex justify-center">
          <img src="/images/help_center.png" alt="Help" className="max-h-[220px] w-auto object-contain" />
        </div>
      </section>

      <div className="relative">
        <i className="fi fi-rr-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="search"
          placeholder="Search categories…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-3 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-600"
        />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((cat) => (
          <li key={cat.id}>
            <Link
              to={`/help/${cat.id}`}
              className="block rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition hover:border-green-500/40 hover:bg-neutral-900"
            >
              <span className="font-medium text-neutral-100">{cat.name}</span>
              <span className="mt-1 block text-xs text-neutral-500">View articles</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
