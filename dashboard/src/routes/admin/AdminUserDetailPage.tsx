import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router'
import { toast } from 'react-toastify'
import {
  getAdminUserDetail,
  patchAdminUserBios,
  patchAdminUserVerification,
  patchAdminUserRole,
  fundUserFiat,
  fundUserAsset,
  type AdminUserDetail,
  type AdminUserAsset,
} from '../../services/adminService'
import { fetchUsdSpotMap } from '../../util/cryptoUsdPrices'

type Tab = 'profile' | 'wallet' | 'trades' | 'bots' | 'copy' | 'investments'

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileTab({ detail, userId, onSaved }: { detail: AdminUserDetail; userId: string; onSaved: () => void }) {
  const u = detail.user
  const [form, setForm] = useState({
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    country: u.country,
    verificationStatus: Number(u.verificationStatus),
    role: u.role,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await patchAdminUserBios(userId, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        country: form.country,
      })
      await patchAdminUserVerification(userId, form.verificationStatus)
      if (form.role !== u.role) {
        await patchAdminUserRole(userId, form.role as 'user' | 'admin')
      }
      toast.success('Profile updated')
      onSaved()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          ['First Name', 'firstName'],
          ['Last Name', 'lastName'],
          ['Phone', 'phone'],
          ['Country', 'country'],
        ] as [string, keyof typeof form][]).map(([label, key]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-neutral-400 mb-1">{label}</label>
            <input
              type="text"
              value={String(form[key])}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">
            Verification Status
          </label>
          <select
            value={form.verificationStatus}
            onChange={(e) => setForm((f) => ({ ...f, verificationStatus: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value={0}>0 — Unverified</option>
            <option value={1}>1 — Email verified</option>
            <option value={2}>2 — KYC Level 2</option>
            <option value={3}>3 — Fully verified</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="pt-1 border-t border-neutral-800">
        <p className="text-xs text-neutral-500 mb-1">Account info</p>
        <div className="text-sm text-neutral-300 space-y-0.5">
          <div>
            <span className="text-neutral-500">Email: </span>
            {u.email}
          </div>
          <div>
            <span className="text-neutral-500">Currency: </span>
            {u.currency_code || '—'}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-lg bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

function FundFiatModal({
  userId,
  onClose,
  onDone,
}: {
  userId: string
  onClose: () => void
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [operation, setOperation] = useState<'credit' | 'debit'>('credit')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) return toast.error('Enter a valid amount')
    setLoading(true)
    try {
      await fundUserFiat(userId, { amountUsd: amt, operation, note })
      toast.success(`Fiat ${operation === 'credit' ? 'credited' : 'debited'} successfully`)
      onDone()
      onClose()
    } catch {
      toast.error('Failed to update balance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Fund Fiat Account</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <i className="fi fi-rr-cross text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOperation('credit')}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                operation === 'credit'
                  ? 'bg-green-500/15 text-green-400 border-green-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              Credit
            </button>
            <button
              type="button"
              onClick={() => setOperation('debit')}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                operation === 'debit'
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              Debit
            </button>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Admin adjustment"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditAssetModal({
  asset,
  userId,
  onClose,
  onDone,
}: {
  asset: AdminUserAsset
  userId: string
  onClose: () => void
  onDone: () => void
}) {
  const [balance, setBalance] = useState(asset.userBalance)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nb = Number(balance)
    if (!Number.isFinite(nb) || nb < 0) return toast.error('Enter a valid balance')
    setLoading(true)
    try {
      await fundUserAsset(userId, { assetId: asset.id, newBalance: nb })
      toast.success(`${asset.coinShort} balance updated`)
      onDone()
      onClose()
    } catch {
      toast.error('Failed to update asset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Edit {asset.coinName} Balance</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <i className="fi fi-rr-cross text-sm" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              New Balance ({asset.coinShort})
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              Current: {Number(asset.userBalance).toFixed(6)} {asset.coinShort}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WalletTab({
  detail,
  userId,
  onRefresh,
}: {
  detail: AdminUserDetail
  userId: string
  onRefresh: () => void
}) {
  const [fundModal, setFundModal] = useState(false)
  const [editAsset, setEditAsset] = useState<AdminUserAsset | null>(null)
  const [spotUsd, setSpotUsd] = useState<Map<string, number>>(() => new Map())

  const fiatAssets = detail.assets.filter((a) => a.assetType === 'fiat')
  const cryptoAssets = detail.assets.filter((a) => a.assetType === 'crypto')

  const cryptoSymbolsKey = useMemo(() => {
    return detail.assets
      .filter((a) => a.assetType === 'crypto')
      .map((a) => a.coinShort.trim().toUpperCase())
      .filter(Boolean)
      .sort()
      .join(',')
  }, [detail.assets])

  useEffect(() => {
    if (!cryptoSymbolsKey) {
      setSpotUsd(new Map())
      return
    }
    const syms = cryptoSymbolsKey.split(',').filter(Boolean)
    fetchUsdSpotMap(syms).then(setSpotUsd)
  }, [cryptoSymbolsKey])

  return (
    <div className="space-y-5">
      {/* Fiat */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-neutral-300">Fiat Balance</h3>
        <button
          type="button"
          onClick={() => setFundModal(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors w-full sm:w-auto"
        >
          <i className="fi fi-rr-dollar" />
          Fund / Deduct
        </button>
      </div>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        {fiatAssets.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">No fiat wallet found.</p>
        ) : (
          fiatAssets.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-neutral-800/50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                  {a.coinShort.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{a.coinName}</p>
                  <p className="text-xs text-neutral-500">{a.coinShort}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                <span className="text-sm text-white font-medium">
                  {Number(a.userBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => setEditAsset(a)}
                  className="px-2 py-1 rounded text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Crypto Assets */}
      <h3 className="text-sm font-semibold text-neutral-300">Crypto Assets</h3>
      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        {cryptoAssets.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-500">No crypto assets found.</p>
        ) : (
          cryptoAssets.map((a) => {
            const sym = a.coinShort.trim().toUpperCase()
            const unitUsd =
              spotUsd.get(sym) ??
              (Number.isFinite(Number(a.price)) && Number(a.price) > 0 ? Number(a.price) : 0)
            const bal = Number(a.userBalance)
            const approxUsd = unitUsd > 0 && Number.isFinite(bal) ? bal * unitUsd : null
            return (
              <div
                key={a.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-neutral-800/50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {a.iconUrl ? (
                    <img src={a.iconUrl} alt={a.coinShort} className="w-7 h-7 rounded-full shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-400 shrink-0">
                      {a.coinShort.slice(0, 3)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-white">{a.coinName}</p>
                    <p className="text-xs text-neutral-500">
                      {unitUsd > 0 ? `~$${unitUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })} / ${a.coinShort}` : 'Price unavailable'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right sm:text-right">
                    <p className="text-sm text-neutral-200">
                      {bal.toFixed(6)} {a.coinShort}
                    </p>
                    {approxUsd != null && (
                      <p className="text-xs text-amber-400/90 font-medium">
                        ≈ ${approxUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditAsset(a)}
                    className="px-2 py-1 rounded text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {fundModal && (
        <FundFiatModal userId={userId} onClose={() => setFundModal(false)} onDone={onRefresh} />
      )}
      {editAsset && (
        <EditAssetModal
          asset={editAsset}
          userId={userId}
          onClose={() => setEditAsset(null)}
          onDone={onRefresh}
        />
      )}
    </div>
  )
}

function TradesTab({ detail }: { detail: AdminUserDetail }) {
  const trades = detail.trades
  if (!trades.length)
    return <p className="text-sm text-neutral-500 py-6 text-center">No trades found.</p>
  return (
    <div className="rounded-xl border border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/50">
              <th className="text-left px-4 py-3 text-xs text-neutral-400 font-medium">Pair</th>
              <th className="text-left px-4 py-3 text-xs text-neutral-400 font-medium">Type</th>
              <th className="text-left px-4 py-3 text-xs text-neutral-400 font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-xs text-neutral-400 font-medium">P&L</th>
              <th className="text-left px-4 py-3 text-xs text-neutral-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-xs text-neutral-400 font-medium hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const pnl = Number(t.pnl)
              return (
                <tr key={t.tradeId} className="border-b border-neutral-800/50">
                  <td className="px-4 py-2.5 font-medium text-white">{t.pair}</td>
                  <td className="px-4 py-2.5 capitalize text-neutral-400">{t.option}</td>
                  <td className="px-4 py-2.5 text-neutral-300">${Number(t.invested).toFixed(2)}</td>
                  <td
                    className={`px-4 py-2.5 font-medium ${
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
                  <td className="px-4 py-2.5 text-neutral-500 text-xs hidden md:table-cell">
                    {t.entryTime ? new Date(t.entryTime * 1000).toLocaleDateString() : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BotsTab({ detail }: { detail: AdminUserDetail }) {
  const bots = detail.botSubscriptions
  if (!bots.length)
    return <p className="text-sm text-neutral-500 py-6 text-center">No active bot subscriptions.</p>
  return (
    <div className="space-y-3">
      {bots.map((b) => (
        <div key={b.id} className="rounded-xl border border-neutral-800 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-white">{b.botName}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Expires {new Date(b.expiresAt * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-neutral-500">Lifetime PnL</p>
            <p
              className={`font-semibold text-sm ${
                Number(b.lifetimePnlUsd) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              ${Number(b.lifetimePnlUsd).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CopyTab({ detail }: { detail: AdminUserDetail }) {
  const allocs = detail.copyAllocations
  if (!allocs.length)
    return <p className="text-sm text-neutral-500 py-6 text-center">No copy trading allocations.</p>
  return (
    <div className="space-y-3">
      {allocs.map((a) => (
        <div key={a.id} className="rounded-xl border border-neutral-800 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-white">{a.traderName}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              ${Number(a.amount).toFixed(2)} allocated · Expires{' '}
              {new Date(a.expiresAt * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-neutral-500">Lifetime PnL</p>
            <p
              className={`font-semibold text-sm ${
                Number(a.lifetimePnlUsd) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              ${Number(a.lifetimePnlUsd).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function InvestmentsTab({ detail }: { detail: AdminUserDetail }) {
  const positions = detail.investments
  if (!positions.length)
    return <p className="text-sm text-neutral-500 py-6 text-center">No investment positions.</p>
  return (
    <div className="space-y-3">
      {positions.map((p) => (
        <div key={p.id} className="rounded-xl border border-neutral-800 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-white">{p.productName}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {p.termDays} days · {p.apy ? `${Number(p.apy).toFixed(2)}% APY` : ''} · Started{' '}
              {new Date(p.startedAt * 1000).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-neutral-500">Amount</p>
            <p className="font-semibold text-sm text-white">${Number(p.amount).toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('profile')

  const load = () => {
    if (!id) return
    setLoading(true)
    getAdminUserDetail(id)
      .then(setDetail)
      .catch(() => toast.error('Failed to load user'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  if (loading || !detail) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-neutral-800 rounded animate-pulse" />
        <div className="h-32 bg-neutral-900 rounded-xl animate-pulse" />
      </div>
    )
  }

  const u = detail.user
  const displayName =
    u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : u.email

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'wallet', label: 'Wallet', count: detail.assets.length },
    { id: 'trades', label: 'Trades', count: detail.trades.length },
    { id: 'bots', label: 'Bots', count: detail.botSubscriptions.length },
    { id: 'copy', label: 'Copy Traders', count: detail.copyAllocations.length },
    { id: 'investments', label: 'Investments', count: detail.investments.length },
  ]

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link
          to="/admin/users"
          className="mt-0.5 flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <i className="fi fi-rr-arrow-left text-xs" />
          Users
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
          <p className="text-sm text-neutral-400">{u.email}</p>
        </div>
        {u.role === 'admin' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider self-start mt-1">
            Admin
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-neutral-800 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm rounded-t-lg transition-colors ${
              tab === t.id
                ? 'text-amber-400 border-b-2 border-amber-500 -mb-px'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-neutral-800 text-neutral-500">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'profile' && (
          <ProfileTab detail={detail} userId={id!} onSaved={load} />
        )}
        {tab === 'wallet' && (
          <WalletTab detail={detail} userId={id!} onRefresh={load} />
        )}
        {tab === 'trades' && <TradesTab detail={detail} />}
        {tab === 'bots' && <BotsTab detail={detail} />}
        {tab === 'copy' && <CopyTab detail={detail} />}
        {tab === 'investments' && <InvestmentsTab detail={detail} />}
      </div>
    </div>
  )
}
