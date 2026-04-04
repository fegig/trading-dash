import { useEffect, useMemo, useState } from 'react'
import { paths } from '@/navigation/paths'
import { get } from '@/util/request'
import { endpoints } from '@/services/endpoints'
import { useAuthStore } from '@/stores/authStore'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '@/stores'
import {
  MarketingButtonLink,
  MarketingEyebrow,
  MarketingSectionHeading,
  MarketingStatCard,
  MarketingSurface,
} from '@/components/landing/MarketingSurface'

type NewsRow = {
  id: string
  title: string
  body: string
  imageurl: string
  published_on: number
  url?: string
  source?: string
}

const NOW = Math.floor(Date.now() / 1000)

const FALLBACK: NewsRow[] = [
  {
    id: '1',
    title: 'Capital discipline matters more when product breadth increases',
    body: 'As users move from simple trading views into wallets, automation, and managed products, the interface has to preserve clarity around funding and readiness.',
    imageurl: '/images/92.png',
    published_on: NOW,
    source: 'BlockTrade Research',
  },
  {
    id: '2',
    title: 'Why trading platforms need stronger public-to-product continuity',
    body: 'Landing pages and account flows shape trust before execution begins. Mature products keep that language consistent from marketing through dashboard activity.',
    imageurl: '/images/92.png',
    published_on: NOW - 86400,
    source: 'BlockTrade Research',
  },
  {
    id: '3',
    title: 'Funding architecture is becoming part of the product story',
    body: 'Users increasingly expect to understand how fiat, wallets, trading, and managed allocations connect before they commit capital.',
    imageurl: '/images/92.png',
    published_on: NOW - 172800,
    source: 'BlockTrade Research',
  },
  {
    id: '4',
    title: 'Execution surfaces are getting denser and less promotional',
    body: 'Interfaces are moving toward calmer layouts, tighter hierarchy, and more obvious account posture signals.',
    imageurl: '/images/92.png',
    published_on: NOW - 259200,
    source: 'BlockTrade Research',
  },
  {
    id: '5',
    title: 'Verification and settings should feel operational, not administrative',
    body: 'A stronger product treats readiness and controls as part of the trading environment instead of separate utilities.',
    imageurl: '/images/92.png',
    published_on: NOW - 345600,
    source: 'BlockTrade Research',
  },
  {
    id: '6',
    title: 'Managed products demand clearer capital pathways',
    body: 'The more ways a platform lets users deploy capital, the more important it becomes to explain where funds originate and how they move.',
    imageurl: '/images/92.png',
    published_on: NOW - 432000,
    source: 'BlockTrade Research',
  },
]

function formatPublished(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp * 1000))
}

export default function InsightsPage() {
  const [list, setList] = useState<NewsRow[]>(FALLBACK)
  const [loading, setLoading] = useState(true)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const siteName = useSiteConfigStore((s) => s.siteName)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK
  const sourceLabel = (s?: string) => {
    if (s == null || s === '') return 'Market source'
    return s.replace(/^BlockTrade\b/, displayName)
  }

  useEffect(() => {
    void (async () => {
      try {
        const response = (await get(endpoints.crypto.news, { lang: 'EN' })) as {
          Data?: Array<{
            id?: string
            title?: string
            body?: string
            imageurl?: string
            published_on?: number
            url?: string
            source_info?: { name?: string }
          }>
        }
        const rows = response?.Data
        if (!Array.isArray(rows) || rows.length === 0) return

        setList(
          rows.slice(0, 16).map((item, index) => ({
            id: item.id ?? String(index),
            title: item.title ?? 'Market insight',
            body: (item.body ?? '').replace(/<[^>]+>/g, '').slice(0, 280),
            imageurl: item.imageurl || '/images/92.png',
            published_on: item.published_on ?? NOW,
            url: item.url,
            source: item.source_info?.name ?? 'Market source',
          }))
        )
      } catch {
        /* keep FALLBACK */
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const featured = list[0] ?? FALLBACK[0]
  const secondary = useMemo(() => list.slice(1, 5), [list])
  const feed = useMemo(() => list.slice(5, 11), [list])

  return (
    <div className="space-y-14 md:space-y-18">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
        <div className="max-w-3xl">
          <MarketingEyebrow>Insights</MarketingEyebrow>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-neutral-50 md:text-6xl">
            Research, commentary, and market context without the generic finance-magazine treatment.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg">
            The insights page is now structured like a real market briefing surface: featured coverage,
            supporting stories, and an obvious path back into the trading and account workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <MarketingButtonLink to={isLoggedIn ? paths.dashboard : '/register'}>
              {isLoggedIn ? 'Open dashboard' : 'Create account'}
            </MarketingButtonLink>
            <MarketingButtonLink
              to={isLoggedIn ? paths.dashboardLiveTrading : '/login'}
              variant="secondary"
            >
              {isLoggedIn ? 'Open live desk' : 'Sign in'}
            </MarketingButtonLink>
          </div>
        </div>

        <MarketingSurface className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Coverage posture
          </div>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
              <div className="text-sm font-semibold text-neutral-100">Market context first</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Commentary should support the trading and capital story, not distract from it.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
              <div className="text-sm font-semibold text-neutral-100">Desk-aligned language</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                The page keeps the same tone as the dashboard and the new public surfaces.
              </p>
            </div>
          </div>
        </MarketingSurface>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MarketingStatCard
          label="Feed mode"
          value={loading ? 'Refreshing' : 'Live + fallback'}
          description="External coverage is used when available, with local fallback content to keep the page reliable."
        />
        <MarketingStatCard
          label="Coverage count"
          value={`${list.length} items`}
          description="Featured stories, secondary coverage, and a tighter feed for continued reading."
        />
        <MarketingStatCard
          label="Editorial tone"
          value="Operational"
          description="The page reads like a market briefing tied to the product instead of a generic blog roll."
        />
      </section>

      <section className="space-y-6">
        <MarketingSectionHeading
          eyebrow="Featured coverage"
          title="Lead with the most important market story"
          description="A stronger insights page should establish hierarchy quickly: one lead item, a compact secondary grid, then a denser reading feed."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <MarketingSurface className="overflow-hidden p-0">
            <img
              src={featured.imageurl}
              alt={featured.title}
              className="h-72 w-full object-cover md:h-96"
            />
            <div className="p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span>{sourceLabel(featured.source)}</span>
                <span className="h-1 w-1 rounded-full bg-neutral-700" />
                <span>{formatPublished(featured.published_on)}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-50 md:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-500 md:text-base">
                {featured.body}
              </p>

              {featured.url ? (
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
                >
                  Read source story
                  <i className="fi fi-rr-arrow-up-right text-sm" />
                </a>
              ) : null}
            </div>
          </MarketingSurface>

          <div className="space-y-4">
            {secondary.map((item) => (
              <MarketingSurface key={item.id} className="overflow-hidden p-0">
                <img src={item.imageurl} alt={item.title} className="h-36 w-full object-cover" />
                <div className="p-5">
                  <div className="text-xs text-neutral-500">
                    {sourceLabel(item.source)} - {formatPublished(item.published_on)}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-neutral-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">{item.body}</p>
                </div>
              </MarketingSurface>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <MarketingSectionHeading
          eyebrow="Research feed"
          title="Continue reading without losing the page structure"
          description="Supporting coverage is presented in a denser but still readable feed, keeping a stronger editorial rhythm than the previous generic list."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {feed.map((item) => (
            <MarketingSurface key={item.id} className="h-full p-5">
              <div className="text-xs text-neutral-500">
                {sourceLabel(item.source)} - {formatPublished(item.published_on)}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-neutral-100">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">{item.body}</p>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-green-300 transition hover:text-green-200"
                >
                  Read more
                  <i className="fi fi-rr-arrow-up-right text-sm" />
                </a>
              ) : null}
            </MarketingSurface>
          ))}
        </div>
      </section>
    </div>
  )
}
