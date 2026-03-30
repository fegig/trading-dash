type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

/** Consistent shell for sign-in flows (matches dashboard dark / green accent). */
export function AuthPanel({ title, subtitle, children }: Props) {
  return (
    <div className="w-full">
      <div className="rounded-2xl border border-neutral-800/90 bg-linear-to-b from-neutral-800/20 to-neutral-950/80 p-[1px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]">
        <div className="rounded-2xl bg-neutral-950/95 px-6 py-8 backdrop-blur-sm md:px-8 md:py-10">
          <header className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-50 md:text-2xl">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthFieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
    >
      {children}
    </label>
  )
}

export const authInputClass =
  'w-full rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 transition-colors focus:border-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/30'

export const authPrimaryButtonClass =
  'w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50'

export const authSecondaryButtonClass =
  'w-full rounded-xl border border-neutral-700 bg-transparent py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-900/50 disabled:cursor-not-allowed disabled:opacity-50'
