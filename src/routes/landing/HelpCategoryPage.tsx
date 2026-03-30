import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import * as helpContentService from '@/services/helpContentService'
import {
  FALLBACK_FAQ_BY_CAT,
  type FaqItem,
} from '@/data/helpFallback'

type ApiFaqResponse = {
  data?: FaqItem[]
  catInfo?: { name?: string }
}

export default function HelpCategoryPage() {
  const { id } = useParams<{ id: string }>()
  const catId = id ? parseInt(id, 10) : NaN
  const [items, setItems] = useState<FaqItem[]>([])
  const [catName, setCatName] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    if (Number.isNaN(catId)) return
    helpContentService
      .fetchFaqByCategory<ApiFaqResponse>(catId)
      .then((res) => {
        const rows = res.data?.data
        if (Array.isArray(rows) && rows.length > 0) {
          setItems(rows)
          setCatName(res.data?.catInfo?.name ?? `Category ${catId}`)
        } else {
          setItems(FALLBACK_FAQ_BY_CAT[catId] ?? [])
          setCatName(`Category ${catId}`)
        }
      })
      .catch(() => {
        setItems(FALLBACK_FAQ_BY_CAT[catId] ?? [])
        setCatName(`Category ${catId}`)
      })
  }, [catId])

  if (Number.isNaN(catId)) {
    return (
      <p className="text-neutral-500">
        Invalid category. <Link to="/help" className="text-green-400">Back to help</Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/help"
        className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300"
      >
        <i className="fi fi-rr-arrow-small-left" />
        Help center
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">{catName || 'Topics'}</h1>
        <p className="mt-1 text-sm text-neutral-500">{items.length} topics</p>
      </div>
      <ul className="space-y-3">
        {items.map((info) => (
          <li key={info.id}>
            <button
              type="button"
              onClick={() => setOpenId(openId === info.id ? null : info.id)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left transition hover:border-neutral-700"
            >
              <span className="font-medium text-neutral-100">{info.question}</span>
              {openId === info.id ? (
                <p className="mt-3 text-sm text-neutral-400 whitespace-pre-wrap">{info.answer}</p>
              ) : (
                <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{info.answer}</p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
