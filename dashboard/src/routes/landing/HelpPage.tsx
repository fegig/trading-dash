import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { FALLBACK_FAQ_BY_CAT, FALLBACK_FAQ_CATEGORIES, type FaqCategory } from '@/data/helpFallback'
import { paths } from '@/navigation/paths'
import * as helpContentService from '@/services/helpContentService'
import { useAuthStore } from '@/stores/authStore'
import {
  MarketingBulletList,
  MarketingButtonLink,
  MarketingEyebrow,
  MarketingSectionHeading,
  MarketingStatCard,
  MarketingSurface,
} from '@/components/landing/MarketingSurface'

function getCategoryMeta(name: string) {
  const lower = name.toLowerCase()

  if (lower.includes('wallet') || lower.includes('fund')) {
    return {
      iconClass: 'fi fi-rr-wallet',
      description: 'Deposits, conversions, fiat flows, and wallet readiness.',
    }
  }

  if (lower.includes('trad')) {
    return {
      iconClass: 'fi fi-rr-chart-candlestick',
      description: 'Live execution, order flow, and trade visibility.',
    }
  }

  if (lower.includes('security') || lower.includes('protect')) {
    return {
      iconClass: 'fi fi-rr-shield-check',
      description: 'Verification, access control, and account protection.',
    }
  }

  return {
    iconClass: 'fi fi-rr-life-ring',
    description: 'Account setup, onboarding, and product navigation support.',
  }
}

export default function HelpPage() {
  const [categories, setCategories] = useState<FaqCategory[]>(FALLBACK_FAQ_CATEGORIES)
  const [searchText, setSearchText] = useState('')
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)

  useEffect(() => {
    helpContentService
      .fetchFaqCategories<{ data?: FaqCategory[] }>()
      .then((response) => {
        const data = response.data?.data
        if (!Array.isArray(data) || data.length === 0) return

        setCategories(
          data.map((category) => ({
            id: Number(category.id),
            name: String((category as { name?: string }).name ?? 'Category'),
          }))
        )
      })
      .catch(() => {})
  }, [])

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category.name.toLowerCase().includes(searchText.trim().toLowerCase())
      ),
    [categories, searchText]
  )

  const featuredQuestions = useMemo(
    () =>
      Object.entries(FALLBACK_FAQ_BY_CAT)
        .flatMap(([categoryId, items]) =>
          items.map((item) => ({
            ...item,
            categoryId: Number(categoryId),
          }))
        )
        .slice(0, 4),
    []
  )

  const helpMetrics = [
    {
      label: 'Coverage',
      value: `${categories.length} support tracks`,
      description: 'Guided paths for onboarding, wallet activity, trading, and account protection.',
    },
    {
      label: 'Quick answers',
      value: `${featuredQuestions.length}+ featured topics`,
      description: 'High-frequency questions surfaced without forcing users through generic support copy.',
    },
    {
      label: 'Workspace tie-in',
      value: 'Desk-aware support',
      description: 'The help experience now reads like part of the product, not a detached article archive.',
    },
  ]

  return (
    <div className="space-y-14 md:space-y-18">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-center">
        <div className="max-w-3xl">
          <MarketingEyebrow>Help center</MarketingEyebrow>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-neutral-50 md:text-6xl">
            Guidance that respects the product and the user.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg">
            The help surface should be useful before support is needed. It now follows the same
            structure as the rest of the public experience, with clearer paths into onboarding,
            funding, trading, and account security topics.
          </p>
        </div>

        <MarketingSurface className="p-5">
          <div className="overflow-hidden rounded-[24px] border border-neutral-800 bg-neutral-950/80">
            <img
              src="/images/help_center.png"
              alt="BlockTrade help center"
              className="h-60 w-full object-cover"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="help-search"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500"
            >
              Search categories
            </label>
            <div className="relative mt-2">
              <i className="fi fi-rr-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                id="help-search"
                type="search"
                placeholder="Find onboarding, wallet, trading, or security help"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/80 py-3 pl-11 pr-4 text-sm text-neutral-100 placeholder:text-neutral-600"
              />
            </div>
          </div>
        </MarketingSurface>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {helpMetrics.map((metric) => (
          <MarketingStatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
          />
        ))}
      </section>

      <section className="space-y-6">
        <MarketingSectionHeading
          eyebrow="Browse by topic"
          title="Choose the workflow you need help with"
          description="Support categories are laid out like product entry points so users can orient themselves quickly instead of digging through a generic article list."
        />

        {filteredCategories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredCategories.map((category) => {
              const meta = getCategoryMeta(category.name)
              const articleCount = FALLBACK_FAQ_BY_CAT[category.id]?.length ?? 0

              return (
                <Link key={category.id} to={`/help/${category.id}`}>
                  <MarketingSurface className="h-full p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-300 ring-1 ring-green-500/15">
                      <i className={`${meta.iconClass} text-base`} />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-neutral-100">{category.name}</h2>
                    <p className="mt-3 text-sm leading-6 text-neutral-500">{meta.description}</p>
                    <div className="mt-5 text-sm font-medium text-green-300">
                      {articleCount > 0 ? `${articleCount} guide entries` : 'Open topic'}
                    </div>
                  </MarketingSurface>
                </Link>
              )
            })}
          </div>
        ) : (
          <MarketingSurface className="p-8 text-center">
            <div className="text-lg font-semibold text-neutral-100">No categories match that search.</div>
            <p className="mt-2 text-sm text-neutral-500">
              Try broader product language like wallet, trading, security, or onboarding.
            </p>
          </MarketingSurface>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <MarketingSurface className="p-6 md:p-7">
          <MarketingSectionHeading
            eyebrow="Featured answers"
            title="The most requested topics are surfaced first"
            description="These quick-answer cards provide immediate context and route users into the relevant help category when they need more detail."
          />

          <div className="mt-8 space-y-4">
            {featuredQuestions.map((question) => (
              <Link key={question.id} to={`/help/${question.categoryId}`}>
                <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-5 transition hover:border-neutral-700 hover:bg-neutral-950/85">
                  <div className="text-sm font-semibold text-neutral-100">{question.question}</div>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">{question.answer}</p>
                </div>
              </Link>
            ))}
          </div>
        </MarketingSurface>

        <MarketingSurface className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Need account help?
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-50">
            Move from guidance into the workspace when you are ready.
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Users often need help because they are about to fund, verify, or trade. The help page
            now supports that transition instead of feeling detached from the rest of the product.
          </p>

          <div className="mt-5">
            <MarketingBulletList
              items={[
                'Review setup and security topics before moving capital.',
                'Open the workspace to continue with funding or verification.',
                'Use support content as context, not as a dead-end page.',
              ]}
            />
          </div>

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
      </section>
    </div>
  )
}
