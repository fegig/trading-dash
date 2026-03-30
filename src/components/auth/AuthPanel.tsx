import type { ReactNode } from 'react'

type AuthPanelProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  contextRail?: ReactNode
  progress?: ReactNode
  footer?: ReactNode
}

type AuthAlertTone = 'neutral' | 'success' | 'warning' | 'danger'

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const alertToneClasses: Record<AuthAlertTone, string> = {
  neutral: 'border-neutral-800 bg-neutral-900/60 text-neutral-300',
  success: 'border-green-500/20 bg-green-500/10 text-green-100/90',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-100/90',
  danger: 'border-red-500/20 bg-red-500/10 text-red-100/90',
}

export function AuthPanel({
  eyebrow,
  title,
  subtitle,
  children,
  contextRail,
  progress,
  footer,
}: AuthPanelProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-[30px] border border-neutral-800/90 bg-neutral-950/80 shadow-[0_32px_90px_-44px_rgba(0,0,0,0.92)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_26%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] background-size:[20px_20px]"
        aria-hidden
      />

      <div
        className={joinClasses(
          'relative grid',
          contextRail ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : undefined
        )}
      >
        <div className="p-6 md:p-8 lg:p-10">
          {(eyebrow || progress || title || subtitle) && (
            <header className="mb-8 space-y-4">
              {eyebrow ? (
                <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-green-300">
                  {eyebrow}
                </span>
              ) : null}

              {progress}

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-50 md:text-[2rem]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500 md:text-[15px]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </header>
          )}

          <div>{children}</div>

          {footer ? <div className="mt-8 border-t border-neutral-800/80 pt-6">{footer}</div> : null}
        </div>

        {contextRail ? (
          <aside className="border-t border-neutral-800/80 bg-neutral-950/55 p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="space-y-4">{contextRail}</div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}

export function AuthFieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500"
    >
      {children}
    </label>
  )
}

export function AuthAlert({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: AuthAlertTone
  children: ReactNode
  className?: string
}) {
  return (
    <div className={joinClasses('rounded-2xl border px-4 py-3 text-sm', alertToneClasses[tone], className)}>
      {children}
    </div>
  )
}

export function AuthContextBlock({
  eyebrow,
  title,
  body,
  iconClass,
  children,
}: {
  eyebrow?: string
  title: string
  body?: string
  iconClass?: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-[24px] border border-neutral-800 bg-neutral-950/70 p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-start gap-3">
        {iconClass ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-500/10 text-green-300 ring-1 ring-green-500/15">
            <i className={`${iconClass} text-base`} />
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              {eyebrow}
            </div>
          ) : null}
          <div className="text-sm font-semibold text-neutral-100">{title}</div>
          {body ? <p className="mt-2 text-sm leading-6 text-neutral-500">{body}</p> : null}
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function AuthMetric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className={joinClasses('mt-2 text-base font-semibold text-neutral-100', accent)}>{value}</div>
    </div>
  )
}

export function AuthRailList({ items }: { items: string[] }) {
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

export const authInputClass =
  'w-full rounded-2xl border border-neutral-800 bg-neutral-900/75 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors focus:border-green-500/30 focus:outline-none focus:ring-1 focus:ring-green-500/20'

export const authPrimaryButtonClass =
  'w-full rounded-2xl bg-green-500 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50'

export const authSecondaryButtonClass =
  'w-full rounded-2xl border border-neutral-700 bg-neutral-900/30 py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-900/60 disabled:cursor-not-allowed disabled:opacity-50'
