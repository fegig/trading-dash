import type { ReactNode } from 'react'
import type { GradientBadgeTone } from './gradientBadgeTones'

type GradientBadgeSize = 'xs' | 'sm' | 'md' | 'xxs'

const toneClasses: Record<GradientBadgeTone, string> = {
  neutral:
    'bg-gradient-to-r from-neutral-700/40 via-neutral-800/20 to-transparent text-neutral-300 ',
  red:
    'bg-gradient-to-r from-red-500/18 via-red-500/10 to-transparent text-red-300',
  emerald:
    'bg-gradient-to-r from-emerald-500/18 via-emerald-500/10 to-transparent text-emerald-300',
  green:
    'bg-gradient-to-r from-green-500/18 via-green-500/10 to-transparent text-green-300',
  sky: 'bg-gradient-to-r from-sky-500/18 via-sky-500/10 to-transparent text-sky-300',
  amber:
    'bg-gradient-to-r from-amber-500/18 via-amber-500/10 to-transparent text-amber-300',
  rose: 'bg-gradient-to-r from-rose-500/18 via-rose-500/10 to-transparent text-rose-300',
  violet:
    'bg-gradient-to-r from-violet-500/18 via-violet-500/10 to-transparent text-violet-300',
}

const sizeClasses: Record<GradientBadgeSize, string> = {
  xs: 'px-2 py-1 text-[10px] leading-none',
  sm: 'px-2.5 py-1 text-[11px] leading-none',
  md: 'px-3 py-1.5 text-xs leading-none',
  xxs: 'px-2 py-1 text-[8px] leading-none',
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function GradientBadge({
  children,
  tone = 'neutral',
  size = 'sm',
  className,
  uppercase = false,
  iconClass,
}: {
  children: ReactNode
  tone?: GradientBadgeTone
  size?: GradientBadgeSize
  className?: string
  uppercase?: boolean
  iconClass?: string
}) {
  return (
    <span
      className={joinClasses(
        'inline-flex items-center gap-1 rounded-full font-medium backdrop-blur-sm',
        toneClasses[tone],
        sizeClasses[size],
        uppercase && 'uppercase tracking-[0.16em]',
        className
      )}
    >
      {iconClass ? <i className={`${iconClass} text-[0.9em]`} /> : null}
      <span>{children}</span>
    </span>
  )
}
