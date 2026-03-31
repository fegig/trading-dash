import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  FALLBACK_FAQ_BY_CAT,
  FALLBACK_FAQ_CATEGORIES,
  type FaqItem,
} from '@/data/helpFallback'
import { paths } from '@/navigation/paths'
import * as helpContentService from '@/services/helpContentService'
import { useAuthStore } from '@/stores/authStore'
import {
  MarketingButtonLink,
  MarketingEyebrow,
  MarketingSurface,
} from '@/components/landing/MarketingSurface'

type ApiFaqResponse = {
  data?: FaqItem[]
  catInfo?: { name?: string }
}

export default function HelpCategoryPage() {
  const { id } = useParams<{ id: string }>()
  const catId = id ? Number.parseInt(id, 10) : Number.NaN
  const fallbackCategory = FALLBACK_FAQ_CATEGORIES.find((category) => category.id === catId)
  const [items, setItems] = useState<FaqItem[]>(
    fallbackCategory ? FALLBACK_FAQ_BY_CAT[catId] ?? [] : []
  )
  const [catName, setCatName] = useState(fallbackCategory?.name ?? '')
  const [openId, setOpenId] = useState<number | null>(null)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)

  useEffect(() => {
    if (Number.isNaN(catId)) return

    helpContentService
      .fetchFaqByCategory<ApiFaqResponse>(catId)
      .then((response) => {
        const rows = response.data?.data
        if (Array.isArray(rows) && rows.length > 0) {
          setItems(rows)
          setCatName(response.data?.catInfo?.name ?? fallbackCategory?.name ?? `Category ${catId}`)
          return
        }

        setItems(FALLBACK_FAQ_BY_CAT[catId] ?? [])
        setCatName(fallbackCategory?.name ?? `Category ${catId}`)
      })
      .catch(() => {
        setItems(FALLBACK_FAQ_BY_CAT[catId] ?? [])
        setCatName(fallbackCategory?.name ?? `Category ${catId}`)
      })
  }, [catId, fallbackCategory?.name])

  const relatedCategories = useMemo(
    () => FALLBACK_FAQ_CATEGORIES.filter((category) => category.id !== catId).slice(0, 3),
    [catId]
  )

  if (Number.isNaN(catId)) {
    return (
      <MarketingSurface className="p-8 text-center">
        <div className="text-xl font-semibold text-neutral-100">This help category is unavailable.</div>
        <p className="mt-2 text-sm text-neutral-500">
          Return to the help center to browse available support topics.
        </p>
        <div className="mt-6">
          <MarketingButtonLink to="/help">Back to help center</MarketingButtonLink>
        </div>
      </MarketingSurface>
    )
  }

  return (
    <div className="space-y-10 md:space-y-12">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="max-w-3xl">
          <Link
            to="/help"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
          >
            <i className="fi fi-rr-arrow-small-left text-sm" />
            Help center
          </Link>

          <div className="mt-5">
            <MarketingEyebrow>{catName || 'Help topic'}</MarketingEyebrow>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
            Focused answers for this workflow
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-400">
            The category pages now use the same product structure as the rest of the public
            experience, so the content reads like guided support instead of an isolated FAQ dump.
          </p>
        </div>

        <MarketingSurface className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Category summary
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-neutral-50">{items.length}</div>
          <p className="mt-2 text-sm text-neutral-500">
            topic{items.length === 1 ? '' : 's'} available in this support track.
          </p>

          <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
            <div className="text-sm font-semibold text-neutral-100">Need account access?</div>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Jump back into the workspace after reviewing the guidance.
            </p>
          </div>
        </MarketingSurface>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {items.length > 0 ? (
            items.map((item) => {
              const isOpen = openId === item.id

              return (
                <MarketingSurface key={item.id} className="p-0">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-neutral-100">{item.question}</div>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        {isOpen
                          ? item.answer
                          : `${item.answer.slice(0, 120)}${item.answer.length > 120 ? '...' : ''}`}
                      </p>
                    </div>
                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/70 text-neutral-300">
                      <i className={`fi ${isOpen ? 'fi-rr-minus-small' : 'fi-rr-plus-small'} text-sm`} />
                    </span>
                  </button>
                </MarketingSurface>
              )
            })
          ) : (
            <MarketingSurface className="p-8 text-center">
              <div className="text-lg font-semibold text-neutral-100">No topics are available here yet.</div>
              <p className="mt-2 text-sm text-neutral-500">
                Return to the help center for other categories or sign in for in-dashboard support.
              </p>
            </MarketingSurface>
          )}
        </div>

        <div className="space-y-4">
          <MarketingSurface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Quick actions
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-50">
              Continue from guidance into action
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              The support flow should help users orient themselves, then move back into the account
              environment without friction.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <MarketingButtonLink to={isLoggedIn ? paths.dashboard : '/register'}>
                {isLoggedIn ? 'Open dashboard' : 'Create account'}
              </MarketingButtonLink>
              <MarketingButtonLink
                to={isLoggedIn ? paths.dashboardHelp : '/login'}
                variant="secondary"
              >
                {isLoggedIn ? 'Open in-dashboard help' : 'Sign in'}
              </MarketingButtonLink>
            </div>
          </MarketingSurface>

          <MarketingSurface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Related categories
            </div>
            <div className="mt-4 space-y-3">
              {relatedCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/help/${category.id}`}
                  className="block rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 text-sm font-medium text-neutral-200 transition hover:border-neutral-700 hover:bg-neutral-950/90"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </MarketingSurface>
        </div>
      </section>
    </div>
  )
}
