import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminTrades,
  getAdminUsers,
  getAdminUsersFiatUsdBalances,
  createAdminTrades,
  type AdminTradeRow,
  type AdminUserRow,
  type CreateTradePayload,
} from '../../services/adminService'
import { get } from '../../util/request'
import { endpoints } from '../../services/endpoints'
import { fetchUsdSpotMap } from '../../util/cryptoUsdPrices'
import { formatDateWithTime, formatDuration } from '../../util/time'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Same labels as user-facing short holds; `formatDuration` renders like the dashboard. */
const HOLDING_PRESETS: { label: string; sec: number }[] = [
  { label: '1 min', sec: 60 },
  { label: '5 min', sec: 300 },
  { label: '15 min', sec: 900 },
  { label: '30 min', sec: 1800 },
  { label: '1 hr', sec: 3600 },
  { label: '4 hr', sec: 14400 },
  { label: '1 day', sec: 86400 },
]

function unixSecondsToDatetimeLocal(t: number): string {
  const d = new Date(t * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToUnixSeconds(s: string): number {
  const ms = new Date(s).getTime()
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : NaN
}

const ASSET_TYPES = [
  { id: 'crypto', label: 'Crypto', icon: 'fi-rr-bitcoin' },
  { id: 'stock', label: 'Stocks', icon: 'fi-rr-chart-line-up' },
  { id: 'forex', label: 'Forex', icon: 'fi-rr-exchange' },
  { id: 'commodity', label: 'Commodities', icon: 'fi-rr-wheat' },
]

const STATIC_PAIRS: Record<string, { pair: string; price: number }[]> = {
  stock: [
    { pair: 'AAPL/USD', price: 189.5 },
    { pair: 'TSLA/USD', price: 245.2 },
    { pair: 'MSFT/USD', price: 378.0 },
    { pair: 'AMZN/USD', price: 182.0 },
    { pair: 'GOOGL/USD', price: 155.3 },
    { pair: 'META/USD', price: 487.2 },
    { pair: 'NVDA/USD', price: 875.4 },
    { pair: 'NFLX/USD', price: 623.1 },
  ],
  forex: [
    { pair: 'EUR/USD', price: 1.085 },
    { pair: 'GBP/USD', price: 1.267 },
    { pair: 'USD/JPY', price: 149.5 },
    { pair: 'AUD/USD', price: 0.652 },
    { pair: 'USD/CAD', price: 1.358 },
    { pair: 'USD/CHF', price: 0.894 },
    { pair: 'NZD/USD', price: 0.601 },
  ],
  commodity: [
    { pair: 'XAU/USD', price: 2045.0 },
    { pair: 'XAG/USD', price: 24.5 },
    { pair: 'OIL/USD', price: 78.3 },
    { pair: 'NG/USD', price: 2.85 },
    { pair: 'WHEAT/USD', price: 595.0 },
    { pair: 'CORN/USD', price: 448.0 },
  ],
}

// ─── Create Trade Modal ───────────────────────────────────────────────────────

function CreateTradeModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1)
  const [allUsers, setAllUsers] = useState<AdminUserRow[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<AdminUserRow[]>([])
  const [outcome, setOutcome] = useState<'win' | 'loss'>('win')
  const [assetType, setAssetType] = useState<'crypto' | 'stock' | 'forex' | 'commodity'>('crypto')
  const [pairs, setPairs] = useState<{ pair: string; price: number }[]>([])
  const [selectedPair, setSelectedPair] = useState<{ pair: string; price: number } | null>(null)
  const [amount, setAmount] = useState('')
  const [estimatedProfit, setEstimatedProfit] = useState('')
  const [leverage, setLeverage] = useState('1')
  const [entryPrice, setEntryPrice] = useState('')
  const [fiatBalances, setFiatBalances] = useState<Record<string, number>>({})
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openedAtLocal, setOpenedAtLocal] = useState(() =>
    unixSecondsToDatetimeLocal(Math.floor(Date.now() / 1000) - 3600)
  )
  const [durationSec, setDurationSec] = useState(3600)
  const [customMinutes, setCustomMinutes] = useState('60')

  const today = new Date()
  const isWeekend = today.getUTCDay() === 0 || today.getUTCDay() === 6

  useEffect(() => {
    getAdminUsers({ limit: 200 }).then((r) => setAllUsers(r.data))
  }, [])

  useEffect(() => {
    if (selectedUsers.length === 0) {
      setFiatBalances({})
      return
    }
    getAdminUsersFiatUsdBalances(selectedUsers.map((u) => u.id))
      .then(setFiatBalances)
      .catch(() => setFiatBalances({}))
  }, [selectedUsers])

  useEffect(() => {
    if (selectedPair) {
      setEntryPrice(selectedPair.price > 0 ? String(selectedPair.price) : '')
    }
  }, [selectedPair])

  const fetchCryptoPairs = useCallback(async () => {
    const fallback: { pair: string; price: number }[] = [
      { pair: 'BTC/USD', price: 67000 },
      { pair: 'ETH/USD', price: 3500 },
      { pair: 'SOL/USD', price: 145 },
      { pair: 'BNB/USD', price: 590 },
      { pair: 'XRP/USD', price: 0.52 },
      { pair: 'ADA/USD', price: 0.45 },
      { pair: 'DOGE/USD', price: 0.095 },
    ]
    setLoadingPairs(true)
    try {
      const data = await get(endpoints.platform.coins)
      const coins = Array.isArray(data) ? data : []
      const active = coins
        .filter(
          (c: { isActive?: boolean; chain?: string }) =>
            c.isActive !== false && String(c.chain ?? '').toLowerCase() !== 'fiat'
        )
        .slice(0, 24) as { symbol?: string }[]
      const symbols = active.map((c) => String(c.symbol ?? '').toUpperCase()).filter(Boolean)
      const spots = symbols.length > 0 ? await fetchUsdSpotMap(symbols) : new Map<string, number>()
      const result: { pair: string; price: number }[] = active.map((c) => {
        const sym = String(c.symbol ?? 'BTC').toUpperCase()
        const price = spots.get(sym) ?? 0
        return { pair: `${sym}/USD`, price }
      })
      const withPrices = result.filter((p) => p.price > 0)
      setPairs(withPrices.length > 0 ? result : fallback)
    } catch {
      setPairs(fallback)
    } finally {
      setLoadingPairs(false)
    }
  }, [])

  const handleAssetTypeChange = (type: 'crypto' | 'stock' | 'forex' | 'commodity') => {
    setAssetType(type)
    setSelectedPair(null)
    if (type === 'crypto') {
      fetchCryptoPairs()
    } else {
      setPairs(STATIC_PAIRS[type] ?? [])
    }
  }

  const toggleUser = (u: AdminUserRow) => {
    setSelectedUsers((prev) =>
      prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]
    )
  }

  const filteredUsers = allUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
  )

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return toast.error('Select at least one user')
    if (!selectedPair) return toast.error('Select a pair')
    const amt = Number(amount)
    const profit = Number(estimatedProfit)
    if (!(amt > 0)) return toast.error('Enter a valid amount')
    if (!Number.isFinite(profit)) return toast.error('Enter estimated profit/loss')
    if (outcome === 'win' && !(profit > 0)) {
      return toast.error('Win trades require estimated profit greater than zero')
    }
    const ep = Number(entryPrice)
    const entry =
      Number.isFinite(ep) && ep > 0 ? ep : selectedPair.price > 0 ? selectedPair.price : 0
    if (!(entry > 0)) return toast.error('Enter a valid entry price (or pick a pair with a live quote)')

    for (const u of selectedUsers) {
      const bal = fiatBalances[u.id] ?? 0
      if (bal + 1e-9 < amt) {
        toast.error(
          `Insufficient fiat (≈$${bal.toFixed(2)} USD) for ${u.email || u.firstName || u.id} — trade amount $${amt.toFixed(2)}`
        )
        return
      }
    }

    if (!validateTiming()) return

    const payload: CreateTradePayload = {
      userIds: selectedUsers.map((u) => u.id),
      outcome,
      assetType,
      pair: selectedPair.pair,
      entryPrice: entry,
      amount: amt,
      estimatedProfit: profit,
      leverage: Number(leverage) || 1,
      entryTime: entryUnix,
      durationSeconds: durationSec,
    }

    setSubmitting(true)
    try {
      const res = await createAdminTrades(payload)
      if (res.created > 0) {
        toast.success(`${res.created} trade(s) created successfully`)
        onDone()
        onClose()
      }
      if (res.errors?.length > 0) {
        res.errors.forEach((e) => toast.error(`${e.userId}: ${e.error}`))
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Failed to create trades')
    } finally {
      setSubmitting(false)
    }
  }

  const steps = ['Select Users', 'Trade Setup', 'Pick Pair', 'Amount & Profit', 'Review']

  const minFiatAmongSelected =
    selectedUsers.length === 0
      ? 0
      : Math.min(...selectedUsers.map((u) => fiatBalances[u.id] ?? 0))

  const entryUnix = datetimeLocalToUnixSeconds(openedAtLocal)
  const closingUnix = Number.isFinite(entryUnix) ? entryUnix + durationSec : NaN
  const nowSec = Math.floor(Date.now() / 1000)

  function validateTiming(): boolean {
    if (!Number.isFinite(entryUnix)) {
      toast.error('Invalid opened date/time')
      return false
    }
    if (entryUnix > nowSec + 120) {
      toast.error('Opened time cannot be in the future')
      return false
    }
    if (durationSec < 60) {
      toast.error('Holding period must be at least 1 minute')
      return false
    }
    if (!Number.isFinite(closingUnix) || closingUnix > nowSec + 120) {
      toast.error('Closed time cannot be in the future — shorten the hold or open earlier')
      return false
    }
    return true
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-neutral-900 border border-neutral-700 border-b-0 sm:border-b flex flex-col max-h-[92dvh] sm:max-h-[90vh] min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="font-semibold text-white">Create Trade</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Step {step} of {steps.length}</p>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800">
            <i className="fi fi-rr-cross" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-5 pt-4 gap-1.5 shrink-0">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-amber-500' : 'bg-neutral-800'
                }`}
              />
              <span className={`text-[9px] hidden sm:block ${i + 1 === step ? 'text-amber-400' : 'text-neutral-600'}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollBar p-5 space-y-4">

          {/* Step 1: Select Users */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-300 font-medium">Select user(s) to trade for</p>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by email or name…"
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs"
                      >
                        {u.firstName || u.email}
                        <button type="button" onClick={() => toggleUser(u)} className="hover:text-amber-300">
                          <i className="fi fi-rr-cross text-[8px]" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 px-3 py-2 text-xs text-neutral-300 space-y-1">
                    <p className="font-medium text-neutral-400">Fiat available (USD equivalent)</p>
                    <ul className="space-y-0.5 max-h-28 overflow-y-auto scrollBar">
                      {selectedUsers.map((u) => {
                        const b = fiatBalances[u.id]
                        return (
                          <li key={u.id} className="flex justify-between gap-2">
                            <span className="truncate text-neutral-400">{u.email}</span>
                            <span className="shrink-0 font-medium text-white">
                              {b === undefined ? '…' : `≈ $${b.toFixed(2)}`}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    {selectedUsers.length > 1 && (
                      <p className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-800">
                        Lowest balance: ≈ ${minFiatAmongSelected.toFixed(2)} — trade amount cannot exceed this for all users.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-neutral-800 max-h-64 overflow-y-auto scrollBar">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-sm text-neutral-500 py-6">No users found</p>
                ) : (
                  filteredUsers.map((u) => {
                    const selected = selectedUsers.some((x) => x.id === u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-neutral-800/50 last:border-0 transition-colors ${
                          selected ? 'bg-amber-500/8' : 'hover:bg-neutral-800/50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            selected
                              ? 'bg-amber-500 border-amber-500'
                              : 'border-neutral-600'
                          }`}
                        >
                          {selected && <i className="fi fi-rr-check text-[8px] text-black" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">
                            {u.firstName || u.lastName
                              ? `${u.firstName} ${u.lastName}`.trim()
                              : u.email}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Step 2: Outcome + Asset Type */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-neutral-300 mb-2">Trade outcome</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['win', 'loss'] as const).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOutcome(o)}
                      className={`py-4 rounded-xl border text-sm font-semibold transition-colors ${
                        outcome === o
                          ? o === 'win'
                            ? 'bg-green-500/15 text-green-400 border-green-500/40'
                            : 'bg-red-500/15 text-red-400 border-red-500/40'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      <i className={`fi ${o === 'win' ? 'fi-rr-trending-up' : 'fi-rr-trending-down'} text-lg block mb-1`} />
                      {o === 'win' ? 'Win Trade' : 'Loss Trade'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-300 mb-2">Asset type</p>
                {isWeekend && (
                  <p className="text-xs text-amber-400 mb-2 flex items-center gap-1.5">
                    <i className="fi fi-rr-info" />
                    Weekend: only Crypto available
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {ASSET_TYPES.map((at) => {
                    const disabled = isWeekend && at.id !== 'crypto'
                    return (
                      <button
                        key={at.id}
                        onClick={() => !disabled && handleAssetTypeChange(at.id as typeof assetType)}
                        disabled={disabled}
                        className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                          assetType === at.id
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : disabled
                              ? 'opacity-30 cursor-not-allowed bg-neutral-800/50 text-neutral-500 border-neutral-800'
                              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-500 hover:text-white'
                        }`}
                      >
                        <i className={`fi ${at.icon} block text-lg mb-1`} />
                        {at.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pick Pair */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-300">
                Select {assetType} pair
              </p>
              {assetType === 'crypto' && (
                <p className="text-[11px] text-neutral-500">
                  Prices are live USD spots (used as default entry price). If a row shows “—”, wait for quotes or pick another asset.
                </p>
              )}
              {loadingPairs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pairs.map((p) => (
                    <button
                      key={p.pair}
                      type="button"
                      onClick={() => setSelectedPair(p)}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-3 sm:px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                        selectedPair?.pair === p.pair
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-neutral-800/60 text-neutral-300 border-neutral-700 hover:border-neutral-500 hover:text-white'
                      }`}
                    >
                      <span className="font-medium truncate">{p.pair}</span>
                      <span className="text-xs text-neutral-500 shrink-0">
                        {p.price > 0 ? `$${p.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : '—'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Amount & Profit */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-neutral-300">Trade details</p>
              {selectedUsers.length > 0 && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 px-3 py-2 text-xs">
                  <p className="text-neutral-500 mb-1">Fiat available (min across selected)</p>
                  <p className="text-white font-semibold">≈ ${minFiatAmongSelected.toFixed(2)} USD</p>
                  {amount && Number(amount) > minFiatAmongSelected + 1e-9 && (
                    <p className="text-red-400 mt-1">Amount exceeds balance for at least one user.</p>
                  )}
                </div>
              )}
              {selectedPair && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <i className="fi fi-rr-chart-candlestick text-amber-400 text-xs" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{selectedPair.pair}</p>
                    <p className="text-xs text-neutral-500">
                      {outcome.toUpperCase()} · {assetType}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Entry price (quote per unit)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder={selectedPair && selectedPair.price > 0 ? String(selectedPair.price) : '0.00'}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Defaults from the selected pair&apos;s current price; adjust if needed.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000.00"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Estimated {outcome === 'win' ? 'Profit' : 'Loss'} (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedProfit}
                    onChange={(e) => setEstimatedProfit(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Always enter positive — outcome determines direction
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-neutral-400 mb-1">Leverage (×)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className="w-full sm:max-w-[200px] px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Session timing
                </p>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  <span className="text-neutral-400">Opened</span> and <span className="text-neutral-400">Closed</span>{' '}
                  use the same date &amp; time style as the user trade dashboard (open and closed orders).
                </p>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Opened</label>
                  <input
                    type="datetime-local"
                    value={openedAtLocal}
                    onChange={(e) => setOpenedAtLocal(e.target.value)}
                    className="w-full sm:max-w-md px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50 scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Holding period</label>
                  <div className="flex flex-wrap gap-2">
                    {HOLDING_PRESETS.map((p) => (
                      <button
                        key={p.sec}
                        type="button"
                        onClick={() => {
                          setDurationSec(p.sec)
                          setCustomMinutes(String(Math.round(p.sec / 60)))
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          durationSec === p.sec
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <label htmlFor="admin-trade-custom-mins" className="text-xs text-neutral-500 whitespace-nowrap">
                      Custom (minutes)
                    </label>
                    <input
                      id="admin-trade-custom-mins"
                      type="number"
                      min={1}
                      step={1}
                      value={customMinutes}
                      onChange={(e) => {
                        const v = e.target.value
                        setCustomMinutes(v)
                        const m = Number(v)
                        if (Number.isFinite(m) && m >= 1) {
                          setDurationSec(Math.min(Math.round(m * 60), 366 * 86400))
                        }
                      }}
                      className="w-24 px-2 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
                {Number.isFinite(entryUnix) && (
                  <div className="rounded-lg bg-neutral-800/60 border border-neutral-700 px-3 py-2 text-xs space-y-1.5">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                      <span className="text-neutral-500 shrink-0">Closed</span>
                      <span className="text-neutral-200 tabular-nums sm:text-right">
                        {Number.isFinite(closingUnix) ? formatDateWithTime(closingUnix) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-neutral-500">Duration</span>
                      <span className="text-neutral-400">{formatDuration(durationSec * 1000)}</span>
                    </div>
                    {Number.isFinite(closingUnix) && closingUnix > nowSec + 120 && (
                      <p className="text-red-400/95 pt-1 border-t border-neutral-700/80">
                        Closed time is still in the future — choose a shorter hold or an earlier open time.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {amount && estimatedProfit && (
                <div className="p-3 rounded-lg bg-neutral-800/40 border border-neutral-700 text-sm space-y-1.5">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Preview</p>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Trade amount</span>
                    <span className="text-white">${Number(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">P&L</span>
                    <span className={outcome === 'win' ? 'text-green-400' : 'text-red-400'}>
                      {outcome === 'win' ? '+' : '-'}${Number(estimatedProfit).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">ROI</span>
                    <span className={outcome === 'win' ? 'text-green-400' : 'text-red-400'}>
                      {outcome === 'win' ? '+' : '-'}
                      {amount ? ((Number(estimatedProfit) / Number(amount)) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-neutral-300">Review & Confirm</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Users</span>
                  <span className="text-white font-medium">{selectedUsers.length} selected</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Outcome</span>
                  <span className={outcome === 'win' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {outcome.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Asset Type</span>
                  <span className="text-white capitalize">{assetType}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Pair</span>
                  <span className="text-white">{selectedPair?.pair}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800 gap-2">
                  <span className="text-neutral-400 shrink-0">Entry Price</span>
                  <span className="text-white text-right break-all">
                    $
                    {(() => {
                      const ep = Number(entryPrice)
                      const v =
                        Number.isFinite(ep) && ep > 0
                          ? ep
                          : selectedPair && selectedPair.price > 0
                            ? selectedPair.price
                            : 0
                      return v.toLocaleString(undefined, { maximumFractionDigits: 8 })
                    })()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Amount</span>
                  <span className="text-white">${Number(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Est. P&L</span>
                  <span className={outcome === 'win' ? 'text-green-400' : 'text-red-400'}>
                    {outcome === 'win' ? '+' : '-'}${Number(estimatedProfit).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Leverage</span>
                  <span className="text-white">{leverage}×</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-start py-2 border-b border-neutral-800">
                  <span className="text-neutral-400 shrink-0">Opened</span>
                  <span className="text-white text-sm tabular-nums sm:text-right wrap-break-word">
                    {Number.isFinite(entryUnix) ? formatDateWithTime(entryUnix) : '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-start py-2 border-b border-neutral-800">
                  <span className="text-neutral-400 shrink-0">Closed</span>
                  <span className="text-white text-sm tabular-nums sm:text-right wrap-break-word">
                    {Number.isFinite(closingUnix) ? formatDateWithTime(closingUnix) : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-400">Hold</span>
                  <span className="text-white">{formatDuration(durationSec * 1000)}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-xs text-amber-400">
                <i className="fi fi-rr-info mr-1" />
                This will create {selectedUsers.length} closed trade(s) and settle P&L to user wallet(s) immediately.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 sm:gap-3 p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 border-t border-neutral-800 shrink-0">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-lg text-sm bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
            >
              Back
            </button>
          )}
          <div className="flex-1 min-w-4" />
          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && selectedUsers.length === 0) return toast.error('Select at least one user')
                if (step === 3 && !selectedPair) return toast.error('Select a pair')
                if (step === 3 && assetType === 'crypto' && pairs.length === 0) {
                  fetchCryptoPairs()
                }
                if (step === 2 && assetType === 'crypto' && pairs.length === 0) {
                  fetchCryptoPairs()
                }
                if (step === 4) {
                  const amt = Number(amount)
                  if (!(amt > 0)) return toast.error('Enter a valid amount')
                  const profit = Number(estimatedProfit)
                  if (!Number.isFinite(profit)) return toast.error('Enter estimated profit/loss')
                  if (outcome === 'win' && !(profit > 0)) {
                    return toast.error('Win trades require estimated profit greater than zero')
                  }
                  for (const u of selectedUsers) {
                    if ((fiatBalances[u.id] ?? 0) + 1e-9 < amt) {
                      return toast.error('Amount exceeds fiat balance for one or more users')
                    }
                  }
                  if (!validateTiming()) return
                }
                setStep((s) => s + 1)
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors w-full sm:w-auto"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              {submitting ? 'Creating…' : 'Create Trade'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<AdminTradeRow[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminTrades({ page, limit: 50, status: statusFilter || undefined })
      setTrades(res.data)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Trades</h1>
          <p className="text-sm text-neutral-400 mt-0.5">All platform trades</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors w-full sm:w-auto"
        >
          <i className="fi fi-rr-add" />
          Create Trade
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'open', 'completed', 'pending', 'canceled'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400">Pair</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 hidden sm:table-cell">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 hidden md:table-cell">P&L</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500 text-sm">
                    No trades found.
                  </td>
                </tr>
              ) : (
                trades.map((t) => {
                  const pnl = Number(t.pnl)
                  return (
                    <tr key={t.tradeId} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="text-xs text-neutral-300 font-medium truncate max-w-[120px]">
                          {t.userEmail}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-white">{t.pair}</td>
                      <td className="px-4 py-2.5 text-neutral-300 hidden sm:table-cell">
                        ${Number(t.invested).toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-medium hidden md:table-cell ${
                          pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-neutral-400'
                        }`}
                      >
                        {pnl > 0 ? '+' : ''}
                        {pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                            t.status === 'completed'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : t.status === 'open'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-neutral-700/40 text-neutral-400 border-neutral-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-neutral-500 text-xs hidden lg:table-cell">
                        {t.entryTime ? new Date(t.entryTime * 1000).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800 bg-neutral-900/30">
          <span className="text-xs text-neutral-500">Page {page}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={trades.length < 50}
              className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateTradeModal onClose={() => setShowCreate(false)} onDone={load} />
      )}
    </div>
  )
}
