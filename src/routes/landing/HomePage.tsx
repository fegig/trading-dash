import { Link } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { paths } from '@/navigation/paths'
import { LandingPairStrip } from '@/components/landing/LandingPairStrip'
import {
  MarketingBulletList,
  MarketingButtonLink,
  MarketingEyebrow,
  MarketingFeatureCard,
  MarketingSectionHeading,
  MarketingStatCard,
  MarketingSurface,
} from '@/components/landing/MarketingSurface'

const platformCapabilities = [
  {
    iconClass: 'fi fi-rr-chart-candlestick',
    title: 'Live trading desk',
    body: 'Execute, monitor active setups, and review recent performance inside a focused command surface.',
  },
  {
    iconClass: 'fi fi-rr-wallet',
    title: 'Fiat-first funding',
    body: 'Use your cash wallet to fund trades, bots, copy allocations, and managed investment products.',
  },
  {
    iconClass: 'fi fi-rr-clone',
    title: 'Copy trading',
    body: 'Allocate capital to lead traders with controlled funding and persistent exposure tracking.',
  },
  {
    iconClass: 'fi fi-rr-robot',
    title: 'Automation',
    body: 'Deploy structured trading bots with guardrails, pricing clarity, and shared platform state.',
  },
  {
    iconClass: 'fi fi-rr-chart-pie',
    title: 'Managed investments',
    body: 'Move beyond crypto-only placeholders with short-term, long-term, and retirement product flows.',
  },
  {
    iconClass: 'fi fi-rr-shield-check',
    title: 'Verification controls',
    body: 'Track readiness, tiering, and compliance progress from the same capital operations workspace.',
  },
]

const heroMetrics = [
  {
    label: 'Funding readiness',
    value: 'Fiat wallet connected',
    description: 'Capital moves cleanly into trading, copy, bots, and investment desks.',
  },
  {
    label: 'Execution view',
    value: 'One command surface',
    description: 'Portfolio, setups, readiness, and managed product exposure in one place.',
  },
  {
    label: 'Operational posture',
    value: 'Verification-aware',
    description: 'Controls and funding permissions stay visible while the account scales.',
  },
]

const trustPillars = [
  'Clear funding path from wallet to every major product flow',
  'Operational visibility across trades, managed products, and account readiness',
  'Designed for disciplined execution rather than promotional noise',
]

export default function HomePage() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const primaryCta = isLoggedIn ? paths.dashboard : '/register'
  const secondaryCta = isLoggedIn ? paths.dashboardLiveTrading : '/login'

  return (
    <div className="space-y-14 md:space-y-18">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.95fr)] xl:items-center">
        <div className="max-w-3xl">
          <MarketingEyebrow>Trust-led trading infrastructure</MarketingEyebrow>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-neutral-50 md:text-6xl">
            Trade, fund, and manage capital from one disciplined workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg">
            BlockTrade brings live execution, fiat funding, copy allocations, automation, investment
            products, and verification controls into a single operating layer built for serious users.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <MarketingButtonLink to={primaryCta}>
              {isLoggedIn ? 'Open dashboard' : 'Open account'}
            </MarketingButtonLink>
            <MarketingButtonLink to={secondaryCta} variant="secondary">
              {isLoggedIn ? 'Open live desk' : 'Sign in'}
            </MarketingButtonLink>
          </div>

          <div className="mt-8">
            <MarketingBulletList items={trustPillars} />
          </div>
        </div>

        <MarketingSurface className="p-4 md:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_11rem]">
            <div className="rounded-[28px] border border-neutral-800 bg-neutral-950/80 p-3">
              <div className="flex items-center justify-between border-b border-neutral-800/80 px-2 pb-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Platform preview
                  </div>
                  <div className="mt-1 text-sm font-medium text-neutral-100">Unified capital command center</div>
                </div>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-green-300">
                  Live-ready
                </span>
              </div>

              <div className="relative mt-4 overflow-hidden rounded-[24px] border border-neutral-800 bg-neutral-950">
                <img
                  src="/images/desktop_page.png"
                  alt="BlockTrade dashboard preview"
                  className="h-[19rem] w-full object-cover object-top md:h-[23rem]"
                />

                <div className="pointer-events-none absolute inset-x-4 bottom-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/85 px-4 py-3 backdrop-blur">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Wallet
                    </div>
                    <div className="mt-2 text-sm font-semibold text-neutral-100">$6,840.42 fiat ready</div>
                  </div>
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/85 px-4 py-3 backdrop-blur">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                      Operations
                    </div>
                    <div className="mt-2 text-sm font-semibold text-green-300">Trades, bots, copy, investments</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="overflow-hidden rounded-[24px] border border-neutral-800 bg-neutral-950/75 p-3">
                <img
                  src="/images/mobile_pages.png"
                  alt="BlockTrade mobile preview"
                  className="h-full max-h-[16rem] w-full rounded-[18px] object-cover object-top"
                />
              </div>

              <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/75 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                  Readiness
                </div>
                <div className="mt-2 text-lg font-semibold text-neutral-50">Tier-aware account flow</div>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Verification, funding, and managed product access stay visible as the account matures.
                </p>
              </div>
            </div>
          </div>
        </MarketingSurface>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {heroMetrics.map((metric) => (
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
          eyebrow="Market snapshot"
          title="A cleaner view of what matters before you trade."
          description="Borrowing the density of mature market products without turning the page into noise. This section should feel like a preview of the trading environment, not generic marketing filler."
          action={
            <Link to="/market" className="text-sm font-medium text-green-300 transition hover:text-green-200">
              Full market overview
            </Link>
          }
        />
        <LandingPairStrip />
      </section>

      <section className="space-y-6">
        <MarketingSectionHeading
          eyebrow="Platform capabilities"
          title="Built for live execution and capital operations."
          description="The landing page should make the platform’s breadth obvious without feeling crowded: execution, funding, automation, managed products, and readiness controls all belong to one system."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {platformCapabilities.map((item) => (
            <MarketingFeatureCard
              key={item.title}
              iconClass={item.iconClass}
              title={item.title}
              body={item.body}
              cta="Inside the account workspace"
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <MarketingSurface className="p-6 md:p-7">
          <MarketingSectionHeading
            eyebrow="Operational proof"
            title="What the workspace is optimizing for"
            description="The public product story should mirror the dashboard: readiness, funding clarity, dense metrics, and sober execution-first surfaces instead of oversized effects."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Capital control
              </div>
              <div className="mt-3 text-xl font-semibold text-neutral-50">One wallet path</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Fiat funding stays consistent across the major flows users care about most.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Product depth
              </div>
              <div className="mt-3 text-xl font-semibold text-neutral-50">Execution to mandates</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                The system connects trading, copy, automation, investments, and verification.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Account posture
              </div>
              <div className="mt-3 text-xl font-semibold text-neutral-50">Readiness visible</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Users should always understand account tier, risk, and funding readiness at a glance.
              </p>
            </div>
          </div>
        </MarketingSurface>

        <MarketingSurface className="p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Why the interface feels different
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-neutral-50">
            Mature screens, not generic crypto gradients.
          </h3>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            The visual direction is intentionally restrained: dark surfaces, firm spacing, subtle blur,
            clear action hierarchy, and enough density to feel operational.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/75 p-4">
              <div className="text-sm font-semibold text-neutral-100">Minimal effects</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Blur and glass are used to frame important surfaces, not to decorate every block.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/75 p-4">
              <div className="text-sm font-semibold text-neutral-100">Dense information hierarchy</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Metrics, labels, and support text are structured like a product workspace from the first screen.
              </p>
            </div>
          </div>
        </MarketingSurface>
      </section>

      <MarketingSurface className="p-8 md:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <MarketingEyebrow>Open your workspace</MarketingEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
              Start with account access. Grow into execution, automation, and managed products.
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-500 md:text-base">
              The redesign keeps the entry point professional and trust-first, while preserving the
              same auth logic, funding logic, and dashboard architecture already in the product.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <MarketingButtonLink to={primaryCta}>
              {isLoggedIn ? 'Go to dashboard' : 'Create account'}
            </MarketingButtonLink>
            <MarketingButtonLink to={secondaryCta} variant="secondary">
              {isLoggedIn ? 'Open live desk' : 'Sign in'}
            </MarketingButtonLink>
          </div>
        </div>
      </MarketingSurface>
    </div>
  )
}
