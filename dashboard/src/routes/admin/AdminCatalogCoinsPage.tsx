import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminCatalogCoins,
  createAdminCatalogCoin,
  updateAdminCatalogCoin,
  removeAdminCatalogCoin,
  type AdminCatalogCoin,
} from '../../services/adminService'

function CoinForm({
  initial,
  onSave,
  onCancel,
  saving,
  mode,
}: {
  initial: Partial<AdminCatalogCoin>
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  saving: boolean
  mode: 'create' | 'edit'
}) {
  const [id, setId] = useState(initial.id ?? '')
  const [name, setName] = useState(initial.name ?? '')
  const [symbol, setSymbol] = useState(initial.symbol ?? '')
  const [chain, setChain] = useState(initial.chain ?? '')
  const [confirmLevel, setConfirmLevel] = useState(String(initial.confirmLevel ?? 0))
  const [depositAddress, setDepositAddress] = useState(initial.depositAddress ?? '')
  const [iconUrl, setIconUrl] = useState(initial.iconUrl ?? '')
  const [isActive, setIsActive] = useState(initial.isActive !== false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'create') {
      if (!id.trim() || !name.trim() || !symbol.trim() || !chain.trim()) {
        toast.error('ID, name, symbol and chain are required')
        return
      }
      onSave({
        id: id.trim().toUpperCase(),
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        chain: chain.trim(),
        confirmLevel: Number(confirmLevel) || 0,
        ...(depositAddress.trim() ? { depositAddress: depositAddress.trim() } : {}),
        ...(iconUrl.trim() ? { iconUrl: iconUrl.trim() } : {}),
      })
      return
    }
    onSave({
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      chain: chain.trim(),
      confirmLevel: Number(confirmLevel) || 0,
      depositAddress: depositAddress.trim(),
      iconUrl: iconUrl.trim() || null,
      isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mode === 'create' && (
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Coin ID *</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. BTC"
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Symbol *</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Chain *</label>
          <input
            type="text"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            placeholder="e.g. Bitcoin, ERC20"
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Confirm level</label>
          <input
            type="number"
            min={0}
            value={confirmLevel}
            onChange={(e) => setConfirmLevel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Deposit address (optional)</label>
          <input
            type="text"
            value={depositAddress}
            onChange={(e) => setDepositAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-neutral-400 mb-1">Icon URL (optional)</label>
          <input
            type="text"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        {mode === 'edit' && (
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="coin-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-neutral-600"
            />
            <label htmlFor="coin-active" className="text-sm text-neutral-300">
              Active in catalog (shown to users when enabled)
            </label>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : mode === 'create' ? 'Add coin' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export default function AdminCatalogCoinsPage() {
  const [rows, setRows] = useState<AdminCatalogCoin[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminCatalogCoin | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminCatalogCoins()
      .then(setRows)
      .catch(() => toast.error('Failed to load coins'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      const r = await createAdminCatalogCoin(data)
      toast.success(
        r.usersProvisioned > 0
          ? `Coin added; ${r.usersProvisioned} user wallet line(s) created`
          : 'Coin saved (no new wallet lines needed)'
      )
      setCreating(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add coin')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editing) return
    setSaving(true)
    try {
      const r = await updateAdminCatalogCoin(editing.id, data)
      if (r.usersProvisioned > 0) {
        toast.success(`Updated; ${r.usersProvisioned} new wallet line(s)`)
      } else {
        toast.success('Coin updated')
      }
      setEditing(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (coin: AdminCatalogCoin) => {
    const msg = `Remove ${coin.symbol} from the catalog?\n\nBalances will be converted to each user’s fiat wallet where possible, then crypto wallet rows deleted. Users will see a dashboard notice.`
    if (!confirm(msg)) return
    setSaving(true)
    try {
      const r = await removeAdminCatalogCoin(coin.id)
      if (r.liquidationErrors.length > 0) {
        toast.warning(
          `Removed with ${r.liquidationErrors.length} conversion issue(s). Check server logs.`
        )
      } else {
        toast.success(
          r.creditedUsd > 0
            ? `Removed; ~$${r.creditedUsd.toFixed(2)} USD credited across users`
            : 'Asset removed from catalog'
        )
      }
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Coin catalog</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Manage tradable assets. New coins provision wallet lines for all non-admin users.
          </p>
        </div>
        {!creating && !editing && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <i className="fi fi-rr-add" />
            Add coin
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h3 className="font-medium text-amber-400 mb-4">New coin</h3>
          <CoinForm
            mode="create"
            initial={{}}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={saving}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-900/80 text-neutral-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Chain</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {rows.map((c) =>
                  editing?.id === c.id ? (
                    <tr key={c.id}>
                      <td colSpan={6} className="p-5 bg-neutral-900/40">
                        <h3 className="font-medium text-amber-400 mb-4">Edit {c.id}</h3>
                        <CoinForm
                          mode="edit"
                          initial={c}
                          onSave={handleUpdate}
                          onCancel={() => setEditing(null)}
                          saving={saving}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={c.id} className="bg-neutral-950/30 hover:bg-neutral-900/50">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-300">{c.id}</td>
                      <td className="px-4 py-3 text-white font-medium">{c.symbol}</td>
                      <td className="px-4 py-3 text-neutral-300">{c.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{c.chain}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            c.isActive
                              ? 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : 'text-[10px] px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-400'
                          }
                        >
                          {c.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditing(c)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleRemove(c)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && !creating && (
            <p className="text-center text-neutral-500 text-sm py-10">No coins in catalog.</p>
          )}
        </div>
      )}
    </div>
  )
}
