import type { ReactNode } from 'react'
import { Link } from 'react-router'

type PublicButtonVariant = 'primary' | 'secondary' | 'ghost'

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const buttonClassByVariant: Record<PublicButtonVariant, string> = {
  primary:
    'bg-green-500 text-neutral-950 hover:bg-green-400 shadow-[0_16px_40px_-22px_rgba(34,197,94,0.85)]',
  secondary:
    'border border-neutral-700 bg-neutral-900/70 text-neutral-100 hover:border-neutral-600 hover:bg-neutral-900',
  ghost: 'text-neutral-300 hover:text-green-300',
}

export function MarketingSurface({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={joinClasses(
        'relative overflow-hidden rounded-[28px] border border-neutral-800/80 bg-neutral-950/70 shadow-[0_28px_70px_-40px_rgba(0,0,0,0.82)] backdrop-blur-xl',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_26%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_32%)]"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function MarketingEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-green-300">
      {children}
    </span>
  )
}

export function MarketingSectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <MarketingEyebrow>{eyebrow}</MarketingEyebrow> : null}
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-50 md:text-3xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-sm leading-6 text-neutral-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function MarketingStatCard({
  label,
  value,
  description,
  accent,
}: {
  label: string
  value: string
  description: string
  accent?: string
}) {
  return (
    <MarketingSurface className="p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</div>
      <div className={joinClasses('mt-3 text-2xl font-semibold tracking-tight text-neutral-50', accent)}>
        {value}
      </div>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
    </MarketingSurface>
  )
}

export function MarketingFeatureCard({
  title,
  body,
  iconClass,
  to,
  cta,
}: {
  title: string
  body: string
  iconClass: string
  to?: string
  cta?: string
}) {
  const content = (
    <MarketingSurface className="h-full p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-300 ring-1 ring-green-500/15">
        <i className={`${iconClass} text-base`} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-neutral-100">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-neutral-500">{body}</p>
      {cta ? <div className="mt-6 text-sm font-medium text-green-300">{cta}</div> : null}
    </MarketingSurface>
  )

  return to ? <Link to={to}>{content}</Link> : content
}

export function MarketingButtonLink({
  to,
  children,
  variant = 'primary',
  className,
}: {
  to: string
  children: ReactNode
  variant?: PublicButtonVariant
  className?: string
}) {
  return (
    <Link
      to={to}
      className={joinClasses(
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition',
        buttonClassByVariant[variant],
        className
      )}
    >
      {children}
    </Link>
  )
}

export function MarketingBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm text-neutral-400">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-[10px] text-green-300">
            <i className="fi fi-rr-check text-[10px]" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
