import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { LandingPairStrip } from '@/components/landing/LandingPairStrip'

export default function HomePage() {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-neutral-50 md:text-4xl lg:text-5xl">
            Easy, proficient and reliable way to trade
          </h1>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="mt-6 rounded-xl bg-green-500/90 px-6 py-3 text-sm font-semibold text-neutral-950 hover:bg-green-400"
          >
            Get started for free
          </button>
        </div>
        <div className="flex justify-center">
          <img
            src={isMobile ? '/images/mobile_pages.png' : '/images/desktop_page.png'}
            alt="Platform preview"
            className="max-h-[320px] w-auto object-contain md:max-h-[400px]"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { t: 'Real-time', b: 'Experience 24/7 market data' },
          { t: 'Fast transactions', b: 'Move funds quickly when it matters' },
          { t: 'Low fees', b: 'Competitive rates across products' },
        ].map((x) => (
          <div key={x.t} className="gradient-background rounded-xl border border-neutral-800/80 p-4">
            <h3 className="font-semibold text-green-400">{x.t}</h3>
            <p className="mt-2 text-sm text-neutral-400">{x.b}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-100 md:text-2xl">Latest market information</h2>
        <p className="text-sm text-neutral-500">Highlights across major pairs</p>
        <LandingPairStrip />
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="rounded-xl bg-green-500/90 px-6 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-green-400"
          >
            Get started
          </button>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-neutral-100 md:text-2xl">Easy steps on any device</h2>
          <p className="text-sm text-neutral-400">Desktop or mobile — same professional workflow.</p>
          <ul className="space-y-4">
            {[
              { icon: 'fi-sr-portrait', t: 'Fund your account', d: 'Add funds with multiple payment methods.' },
              { icon: 'fi-sr-id-badge', t: 'Verify your identity', d: 'Complete verification to unlock limits.' },
              { icon: 'fi-sr-coins', t: 'Grow your portfolio', d: 'Trade, allocate, and track performance.' },
            ].map((s) => (
              <li key={s.t} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-green-400">
                  <i className={`fi ${s.icon}`} />
                </span>
                <div>
                  <h3 className="font-medium text-neutral-200">{s.t}</h3>
                  <p className="text-sm text-neutral-500">{s.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="rounded-xl bg-green-500/90 px-6 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-green-400"
          >
            Get started
          </button>
        </div>
        <div className="flex justify-center">
          <img
            src="/images/mobile_pages.png"
            alt="Mobile app"
            className="max-h-[360px] w-auto object-contain"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: 'fi-sr-kite', t: 'Risk-aware tools', d: 'Practice and test strategies safely.' },
          { icon: 'fi-sr-asterik', t: 'Demo environment', d: 'Virtual funds to learn the platform.' },
          { icon: 'fi-sr-signal-alt-2', t: 'Market desk', d: 'Charts and execution in one place.' },
          { icon: 'fi-sr-business-time', t: 'Dedicated support', d: 'Guidance when you need it.' },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <i className={`fi ${c.icon} text-xl text-green-400`} />
            <h3 className="mt-3 font-medium text-neutral-200">{c.t}</h3>
            <p className="mt-1 text-sm text-neutral-500">{c.d}</p>
          </div>
        ))}
      </section>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link to="/login" className="text-green-400 hover:text-green-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}
