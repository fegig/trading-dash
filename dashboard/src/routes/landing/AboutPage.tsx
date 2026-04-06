import { paths } from '@/navigation/paths'
import { useAuthStore } from '@/stores/authStore'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '@/stores'
import {
  MarketingBulletList,
  MarketingButtonLink,
  MarketingEyebrow,
  MarketingSectionHeading,
  MarketingStatCard,
  MarketingSurface,
} from '@/components/landing/MarketingSurface'

const operatingPrinciples = [
  {
    title: 'Capital clarity first',
    body: 'Funding, readiness, and managed product access should always be obvious before a user commits capital.',
    iconClass: 'fi fi-rr-wallet',
  },
  {
    title: 'Execution without noise',
    body: 'We bias toward dense, readable product surfaces that help users act instead of overselling the interface.',
    iconClass: 'fi fi-rr-chart-candlestick',
  },
  {
    title: 'Trust through structure',
    body: 'Verification, account posture, and product controls are surfaced as operational information, not hidden edge cases.',
    iconClass: 'fi fi-rr-shield-check',
  },
]

const buildFlow = [
  {
    label: '01',
    title: 'Open the account',
    body: 'Create credentials, confirm email, and establish the operating identity for the workspace.',
  },
  {
    label: '02',
    title: 'Set the funding base',
    body: 'Choose region and fiat so the wallet, balances, and product allocations stay aligned.',
  },
  {
    label: '03',
    title: 'Operate from one desk',
    body: 'Move into live trading, copy allocations, bots, investments, and account settings from one environment.',
  },
  {
    label: '04',
    title: 'Scale with readiness',
    body: 'Verification and account controls remain visible as activity and funding intensity increase.',
  },
]

export default function AboutPage() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const siteName = useSiteConfigStore((s) => s.siteName)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK
  const primaryCta = isLoggedIn ? paths.dashboard : '/register'
  const secondaryCta = isLoggedIn ? paths.dashboardLiveTrading : '/login'

  return (
    <div className="space-y-14 md:space-y-18">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-center">
        <div className="max-w-3xl">
          <MarketingEyebrow>About {displayName}</MarketingEyebrow>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-neutral-50 md:text-6xl">
            We are building a calmer, more disciplined way to operate digital capital.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg">
            {displayName} is designed around the idea that users should understand funding,
            execution, verification, and managed-product access from the first screen. The
            interface should feel like a real operating surface, not a marketing layer that hides
            the important details.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <MarketingButtonLink to={primaryCta}>
              {isLoggedIn ? 'Open dashboard' : 'Open account'}
            </MarketingButtonLink>
            <MarketingButtonLink to={secondaryCta} variant="secondary">
              {isLoggedIn ? 'Open live desk' : 'Sign in'}
            </MarketingButtonLink>
          </div>

          <div className="mt-8 max-w-2xl">
            <MarketingBulletList
              items={[
                'One funding path across trading, bots, copy trading, and investment mandates.',
                'Tier-aware verification and settings that stay visible as part of the product workflow.',
                'A dashboard language that carries through into the public and auth experience.',
              ]}
            />
          </div>
        </div>

        <MarketingSurface className="p-4 md:p-5">
          <div className="overflow-hidden rounded-[26px] border border-neutral-800 bg-neutral-950/80">
            <img
              src="/images/our_people.png"
              alt={`${displayName} team`}
              className="h-84 w-full object-cover object-top"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/75 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Product stance
              </div>
              <div className="mt-2 text-lg font-semibold text-neutral-50">Execution-first</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Dense workflows, tighter surfaces, and fewer decorative distractions.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/75 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Account model
              </div>
              <div className="mt-2 text-lg font-semibold text-neutral-50">Fiat-led capital flow</div>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Wallet funding stays connected to every major product entry point.
              </p>
            </div>
          </div>
        </MarketingSurface>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MarketingStatCard
          label="Funding model"
          value="One wallet path"
          description="The same capital source should support trading, managed products, and account actions."
        />
        <MarketingStatCard
          label="Product direction"
          value="Mature by design"
          description="The visual system favors trust, spacing, hierarchy, and operating clarity over excess effects."
        />
        <MarketingStatCard
          label="Readiness posture"
          value="Verification-aware"
          description="Compliance and account state remain first-class signals inside the workflow."
        />
      </section>

      <section className="space-y-6">
        <MarketingSectionHeading
          eyebrow="Operating principles"
          title="How we think about the product"
          description="The public pages should communicate the same product philosophy as the dashboard: structured information, restrained styling, and an emphasis on readiness, funding, and execution."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {operatingPrinciples.map((principle) => (
            <MarketingSurface key={principle.title} className="h-full p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-300 ring-1 ring-green-500/15">
                <i className={`${principle.iconClass} text-base`} />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-neutral-100">{principle.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-500">{principle.body}</p>
            </MarketingSurface>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <MarketingSurface className="p-5 md:p-6">
          <div className="overflow-hidden rounded-[24px] border border-neutral-800 bg-neutral-950/80">
            <img
              src="/images/our_mission.png"
              alt={`${displayName} mission`}
              className="h-64 w-full object-cover"
            />
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Mission
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-50">
              Build dependable capital infrastructure that stays readable as users scale.
            </h2>
            <p className="mt-3 text-sm leading-7 text-neutral-500">
              Our mission is not just to expose more products. It is to make capital movement,
              execution, and account controls understandable enough that users can operate with
              confidence from the first deposit to more advanced activity.
            </p>
          </div>
        </MarketingSurface>

        <MarketingSurface className="p-5 md:p-6">
          <div className="overflow-hidden rounded-[24px] border border-neutral-800 bg-neutral-950/80">
            <img
              src="/images/our_vision.png"
              alt={`${displayName} vision`}
              className="h-64 w-full object-cover"
            />
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Vision
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-50">
              A single workspace where funding, trading, automation, and compliance move together.
            </h2>
            <div className="mt-4">
              <MarketingBulletList
                items={[
                  'Live trading and trade review that feel part of one command center.',
                  'Wallet-led funding that carries through bots, copy trading, and investments.',
                  'Account controls and verification surfaces that stay visible instead of getting buried.',
                ]}
              />
            </div>
          </div>
        </MarketingSurface>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <MarketingSurface className="p-6 md:p-7">
          <MarketingSectionHeading
            eyebrow="How the workspace unfolds"
            title="The platform story is a sequence, not a set of isolated pages."
            description="Users arrive through account creation, move into funding and profile setup, then continue into live execution and managed products with clearer account posture."
          />

          <div className="mt-8 space-y-4">
            {buildFlow.map((step) => (
              <div
                key={step.label}
                className="grid gap-4 rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-5 md:grid-cols-[4rem_minmax(0,1fr)]"
              >
                <div className="text-3xl font-semibold tracking-tight text-green-300">{step.label}</div>
                <div>
                  <div className="text-lg font-semibold text-neutral-100">{step.title}</div>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </MarketingSurface>

        <MarketingSurface className="p-5">
          <div className="overflow-hidden rounded-[24px] border border-neutral-800 bg-neutral-950/80">
            <img
              src="/images/our_people_2.png"
              alt={`${displayName} team collaboration`}
              className="h-64 w-full object-cover"
            />
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Why this matters
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-50">
              Public pages should already feel like the product is under control.
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              That is why the landing, auth, and information pages are being brought into the same
              structure. Trust is communicated through consistency as much as through copy.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <MarketingButtonLink to={primaryCta}>
              {isLoggedIn ? 'Return to dashboard' : 'Create your account'}
            </MarketingButtonLink>
            <MarketingButtonLink to={secondaryCta} variant="secondary">
              {isLoggedIn ? 'Open live desk' : 'Sign in'}
            </MarketingButtonLink>
          </div>
        </MarketingSurface>
      </section>
    </div>
  )
}
