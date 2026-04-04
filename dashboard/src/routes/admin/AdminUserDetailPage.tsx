import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router'
import { toast } from 'react-toastify'
import {
  getAdminUserDetail,
  patchAdminUserBios,
  patchAdminUserVerification,
  patchAdminUserRole,
  adjustUserWalletLedger,
  fundUserAsset,
  type AdminUserDetail,
  type AdminUserAsset,
} from '../../services/adminService'
import { fetchUsdSpotMap } from '../../util/cryptoUsdPrices'

type Tab = 'profile' | 'wallet' | 'trades' | 'bots' | 'copy' | 'investments'

const NOTE_TEMPLATE_OPTIONS: { id: string; label: string; text: string }[] = [
  {
    id: 'deposit_normal',
    label: 'Normal asset deposit',
    text: 'Deposit to your wallet — funds have been credited. You can review this transaction in your wallet history.',
  },
  {
    id: 'withdraw_normal',
    label: 'Normal asset withdrawal',
    text: 'Withdrawal from your wallet — funds have been debited. You can review this transaction in your wallet history.',
  },
  {
    id: 'adjustment',
    label: 'Standard adjustment',
    text: 'Account adjustment applied by our team. If you have questions, please contact support.',
  },
  {
    id: 'bonus',
    label: 'Bonus / promotion',
    text: 'Promotional credit has been added to your wallet. Thank you for trading with us.',
  },
  {
    id: 'correction',
    label: 'Correction',
    text: 'Correction for a prior transaction or processing issue. Details are available in your transaction history.',
  },
  {
    id: 'withdrawal',
    label: 'Administrative debit',
    text: 'A debit was applied to your wallet by an administrator. See your transaction history for the full record.',
  },
]

const DEFAULT_NOTE_TEMPLATE_ID = 'adjustment'

function unitUsdForAsset(asset: AdminUserAsset, spotUsd: Map<string, number>): number {
  const sym = asset.coinShort.trim().toUpperCase()
  const spot = spotUsd.get(sym)
  if (spot && spot > 0) return spot
  const p = Number(asset.price)
  if (Number.isFinite(p) && p > 0) return p
  return sym === 'USD' ? 1 : 0
}

function nativePrecision(assetType: 'fiat' | 'crypto'): number {
  return assetType === 'fiat' ? 2 : 8
}

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

function WalletAdjustModal({
  userId,
  assets,
  presetAssetId,
  spotUsd,
  userEmail,
  onClose,
  onDone,
}: {
  userId: string
  assets: AdminUserAsset[]
  presetAssetId: number | null
  spotUsd: Map<string, number>
  userEmail: string
  onClose: () => void
  onDone: () => void
}) {
  const [assetId, setAssetId] = useState<number>(() => assets[0]?.id ?? 0)
  const [operation, setOperation] = useState<'credit' | 'debit'>('credit')
  const [amountNative, setAmountNative] = useState('')
  const [amountUsd, setAmountUsd] = useState('')
  const [note, setNote] = useState(
    () => NOTE_TEMPLATE_OPTIONS.find((o) => o.id === DEFAULT_NOTE_TEMPLATE_ID)?.text ?? ''
  )
  const [templateId, setTemplateId] = useState<string>(DEFAULT_NOTE_TEMPLATE_ID)
  const [notifyUser, setNotifyUser] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (assets.length === 0) return
    if (presetAssetId != null && assets.some((a) => a.id === presetAssetId)) {
      setAssetId(presetAssetId)
      return
    }
    setAssetId(assets[0].id)
  }, [presetAssetId, assets])

  useEffect(() => {
    setAmountNative('')
    setAmountUsd('')
  }, [assetId])

  const selected = assets.find((a) => a.id === assetId)
  const bal = selected ? Number(selected.userBalance) : 0
  const uUsd = selected ? unitUsdForAsset(selected, spotUsd) : 0
  const prec = selected ? nativePrecision(selected.assetType) : 8

  const onNativeAmountChange = (raw: string) => {
    setAmountNative(raw)
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0 || uUsd <= 0) {
      setAmountUsd('')
      return
    }
    setAmountUsd(String(Number((n * uUsd).toFixed(2))))
  }

  const onUsdAmountChange = (raw: string) => {
    setAmountUsd(raw)
    const usd = Number(raw)
    if (!Number.isFinite(usd) || usd <= 0 || uUsd <= 0) {
      setAmountNative('')
      return
    }
    const native = usd / uUsd
    setAmountNative(String(Number(native.toFixed(prec))))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return toast.error('Select a wallet asset')
    const amt = Number(amountNative)
    if (!Number.isFinite(amt) || amt <= 0) return toast.error('Enter a valid amount in asset or USD')
    const trimmedNote = note.trim() || 'Admin adjustment'
    setLoading(true)
    try {
      const res = await adjustUserWalletLedger(userId, {
        assetId: selected.id,
        operation,
        amount: amt,
        note: trimmedNote,
        notifyUser,
      })
      toast.success(
        `${selected.coinShort} ${operation === 'credit' ? 'credited' : 'debited'} — transaction recorded in history`
      )
      if (notifyUser && !res.emailSent) {
        toast.warning('Notification email may not have been sent (check Resend / FRONTEND_URL).')
      }
      onDone()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update wallet')
    } finally {
      setLoading(false)
    }
  }

  if (assets.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 p-6 text-center space-y-4">
          <p className="text-neutral-300 text-sm">No wallet assets for this user.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm border border-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto scrollBar rounded-t-2xl sm:rounded-2xl bg-neutral-900 border border-neutral-700 border-b-0 sm:border-b">
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Fund / deduct (ledger)</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Logged-in user: <span className="text-neutral-400">{userEmail}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 shrink-0"
            >
              <i className="fi fi-rr-cross text-sm" />
            </button>
          </div>

          <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-200/95 leading-relaxed">
            <i className="fi fi-rr-info mr-1" />
            This action creates a <strong>completed wallet transaction</strong> with your note. It will appear in the
            user&apos;s transaction history (unlike &quot;Edit&quot;, which only sets balance with a generic ledger
            line).
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Wallet asset</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.coinName} ({a.coinShort}) — {a.assetType}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-800/40 px-3 py-2 text-xs space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500">Current balance</span>
                <span className="text-white font-medium">
                  {bal.toLocaleString(undefined, {
                    maximumFractionDigits: selected.assetType === 'fiat' ? 2 : 8,
                  })}{' '}
                  {selected.coinShort}
                </span>
              </div>
              {uUsd > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-500">≈ USD (spot)</span>
                  <span className="text-amber-400/90">≈ ${(bal * uUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOperation('credit')}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
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
              className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                operation === 'debit'
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}
            >
              Debit
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-neutral-500">
              Enter the movement in <strong className="text-neutral-300">{selected?.coinShort ?? 'asset'}</strong> or in{' '}
              <strong className="text-neutral-300">USD</strong>; values stay in sync using the spot shown above.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Amount ({selected?.coinShort ?? '—'})
                </label>
                <input
                  type="number"
                  min="0"
                  step={selected?.assetType === 'fiat' ? '0.01' : 'any'}
                  value={amountNative}
                  onChange={(e) => onNativeAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountUsd}
                  onChange={(e) => onUsdAmountChange(e.target.value)}
                  placeholder={uUsd > 0 ? '0.00' : '—'}
                  disabled={uUsd <= 0}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            {uUsd <= 0 && (
              <p className="text-[11px] text-amber-400/90">
                No USD price for this symbol — enter the amount only in {selected?.coinShort}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Note template</label>
            <select
              value={templateId}
              onChange={(e) => {
                const id = e.target.value
                setTemplateId(id)
                const opt = NOTE_TEMPLATE_OPTIONS.find((o) => o.id === id)
                if (opt) setNote(opt.text)
              }}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">— Custom only (below) —</option>
              {NOTE_TEMPLATE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Note (stored on transaction &amp; email)</label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                setTemplateId('')
              }}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Visible to the user in history and in the email if enabled."
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-800/30 px-3 py-2.5">
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              className="mt-0.5 rounded border-neutral-600"
            />
            <span className="text-sm text-neutral-300 leading-snug">
              Email the user at <span className="text-white">{userEmail}</span> about this change.
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selected}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing…' : 'Confirm & record'}
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
              Current: {Number(asset.userBalance).toFixed(6)} {asset.coinShort}. For a proper history line with your
              note, use <strong className="text-neutral-400">Fund / deduct</strong> instead.
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
  const [ledgerModal, setLedgerModal] = useState<{ presetAssetId: number | null } | null>(null)
  const [editAsset, setEditAsset] = useState<AdminUserAsset | null>(null)
  const [spotUsd, setSpotUsd] = useState<Map<string, number>>(() => new Map())

  const fiatAssets = detail.assets.filter((a) => a.assetType === 'fiat')
  const cryptoAssets = detail.assets.filter((a) => a.assetType === 'crypto')

  const allSymbolsKey = useMemo(() => {
    return [...new Set(detail.assets.map((a) => a.coinShort.trim().toUpperCase()).filter(Boolean))]
      .sort()
      .join(',')
  }, [detail.assets])

  useEffect(() => {
    let cancelled = false
    const syms = allSymbolsKey ? allSymbolsKey.split(',').filter(Boolean) : []
    fetchUsdSpotMap(syms).then((map) => {
      if (!cancelled) setSpotUsd(map)
    })
    return () => {
      cancelled = true
    }
  }, [allSymbolsKey])

  return (
    <div className="space-y-5">
      {/* Fiat */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-neutral-300">Fiat Balance</h3>
        <button
          type="button"
          onClick={() => {
            if (detail.assets.length === 0) {
              toast.error('No wallet assets')
              return
            }
            setLedgerModal({ presetAssetId: null })
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors w-full sm:w-auto"
        >
          <i className="fi fi-rr-dollar" />
          Fund / deduct (ledger)
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
              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <span className="text-sm text-white font-medium">
                  {Number(a.userBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => setLedgerModal({ presetAssetId: a.id })}
                  className="px-2 py-1 rounded text-xs bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/25 transition-colors"
                >
                  Fund / deduct
                </button>
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
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
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
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setLedgerModal({ presetAssetId: a.id })}
                      className="px-2 py-1 rounded text-xs bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/25 transition-colors"
                    >
                      Fund / deduct
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAsset(a)}
                      className="px-2 py-1 rounded text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {ledgerModal && (
        <WalletAdjustModal
          userId={userId}
          assets={detail.assets}
          presetAssetId={ledgerModal.presetAssetId}
          spotUsd={spotUsd}
          userEmail={detail.user.email}
          onClose={() => setLedgerModal(null)}
          onDone={onRefresh}
        />
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

  const reload = useCallback(() => {
    if (!id) return
    setLoading(true)
    getAdminUserDetail(id)
      .then((data) => {
        setDetail(data)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load user')
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
      setDetail(null)
    })
    getAdminUserDetail(id)
      .then((data) => {
        if (cancelled) return
        setDetail(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Failed to load user')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

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
          <ProfileTab detail={detail} userId={id!} onSaved={reload} />
        )}
        {tab === 'wallet' && (
          <WalletTab detail={detail} userId={id!} onRefresh={reload} />
        )}
        {tab === 'trades' && <TradesTab detail={detail} />}
        {tab === 'bots' && <BotsTab detail={detail} />}
        {tab === 'copy' && <CopyTab detail={detail} />}
        {tab === 'investments' && <InvestmentsTab detail={detail} />}
      </div>
    </div>
  )
}
