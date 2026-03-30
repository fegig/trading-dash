import { useEffect, useState } from 'react'
import axios from 'axios'

type NewsRow = {
  id: string
  title: string
  body: string
  imageurl: string
  published_on: number
}

const FALLBACK: NewsRow[] = [
  {
    id: '1',
    title: 'Cryptocurrency markets continue to evolve',
    body: 'Stay updated with the latest trends and developments in the crypto space.',
    imageurl: '/images/92.png',
    published_on: Math.floor(Date.now() / 1000),
  },
  {
    id: '2',
    title: 'Trading insights and market analysis',
    body: 'Professional analysis to help you make informed decisions.',
    imageurl: '/images/92.png',
    published_on: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: '3',
    title: 'Blockchain technology updates',
    body: 'Exploring the latest in blockchain innovation and adoption.',
    imageurl: '/images/92.png',
    published_on: Math.floor(Date.now() / 1000) - 172800,
  },
]

export default function InsightsPage() {
  const [list, setList] = useState<NewsRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get<{ Data?: { id: string; title: string; body: string; imageurl?: string; published_on?: number }[] }>(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN'
      )
      .then((res) => {
        const data = res.data?.Data
        if (Array.isArray(data) && data.length > 0) {
          setList(
            data.slice(0, 20).map((n, i) => ({
              id: n.id ?? String(i),
              title: n.title ?? '',
              body: (n.body ?? '').replace(/<[^>]+>/g, '').slice(0, 280),
              imageurl: n.imageurl || '/images/92.png',
              published_on: n.published_on ?? Math.floor(Date.now() / 1000),
            }))
          )
        } else {
          setList(FALLBACK)
        }
      })
      .catch(() => setList(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-50">Latest insights</h1>
      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {(list ?? FALLBACK).map((n) => (
            <li
              key={n.id}
              className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40"
            >
              <img src={n.imageurl} alt="" className="h-36 w-full object-cover" />
              <div className="p-4">
                <h2 className="font-semibold text-neutral-100">{n.title}</h2>
                <p className="mt-2 text-sm text-neutral-400">{n.body}</p>
                <p className="mt-3 text-xs text-neutral-600">
                  {new Date(n.published_on * 1000).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
