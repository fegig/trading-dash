import type { ReactNode } from 'react'
import { Link } from 'react-router'

type HeroStat = {
  label: string
  value: string
}

type PageHeroProps = {
  backTo: string
  backLabel: string
  title: string
  description: string
  stats?: HeroStat[]
  actions?: ReactNode
}

export default function PageHero({
  backTo,
  backLabel,
  title,
  description,
  stats = [],
  actions,
}: PageHeroProps) {
  const statsGridClass =
    stats.length > 3 ? 'grid grid-cols-1 gap-3 w-full sm:grid-cols-2 xl:max-w-2xl' : 'grid grid-cols-1 gap-3 w-full sm:grid-cols-3 xl:max-w-xl'

  return (
    <section className="gradient-background rounded-2xl border border-neutral-800/80 overflow-hidden relative p-6 md:p-7">
      <div className="absolute -top-20 right-0 w-72 h-72 bg-green-500/8 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 left-8 w-48 h-48 bg-emerald-500/6 blur-3xl rounded-full pointer-events-none" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2  gradient-background rounded-full!  text-xs px-2! py-1!  text-neutral-300 hover:text-green-400 transition-colors"
          >
            <span className="grid place-items-center w-6 h-6 rounded-full bg-green-500/10 text-green-400">
              <i className="fi fi-rr-arrow-small-left text-sm" />
            </span>
            <span>{backLabel}</span>
          </Link>



          <h1 className="text-xl md:text-2xl font-bold text-neutral-100 tracking-tight mt-4">
            {title}
          </h1>
          <p className="text-[8px] md:text-xs text-neutral-400 mt-3 max-w-2xl">{description}</p>

          {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {stats.length > 0 ? (
          <div className={statsGridClass}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-4"
              >
                <div className="text-[8px]  tracking-[0.16em] text-neutral-500">
                  {stat.label}
                </div>
                <div className="text-xs font-semibold text-neutral-100 mt-2">{stat.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
