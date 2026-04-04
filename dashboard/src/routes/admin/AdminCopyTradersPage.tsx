import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminCopyTraders,
  createAdminCopyTrader,
  updateAdminCopyTrader,
  deleteAdminCopyTrader,
  type AdminCopyTrader,
} from '../../services/adminService'

const empty = (): Omit<AdminCopyTrader, 'id'> => ({
  name: '',
  handle: '',
  specialty: '',
  followers: 0,
  winRate: 0,
  maxDrawdown: 0,
  minAllocation: 100,
  feePct: 10,
  monthlyReturn: '',
  bio: '',
  focusPairs: [],
  capacity: 'Open',
})

function TraderForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Partial<AdminCopyTrader>
  onSave: (d: Omit<AdminCopyTrader, 'id'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Omit<AdminCopyTrader, 'id'>>({ ...empty(), ...initial })
  const [pairsStr, setPairsStr] = useState((initial.focusPairs ?? []).join(', '))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.handle) return toast.error('Name and handle are required')
    onSave({ ...form, focusPairs: pairsStr.split(',').map((s) => s.trim()).filter(Boolean) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          ['Name *', 'name'],
          ['Handle *', 'handle'],
          ['Specialty', 'specialty'],
          ['Monthly Return', 'monthlyReturn'],
        ] as [string, keyof typeof form][]).map(([label, key]) => (
          <div key={key}>
            <label className="block text-xs text-neutral-400 mb-1">{label}</label>
            <input
              type="text"
              value={String(form[key] ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        ))}
        {([
          ['Followers', 'followers'],
          ['Win Rate (%)', 'winRate'],
          ['Max Drawdown (%)', 'maxDrawdown'],
          ['Min Allocation ($)', 'minAllocation'],
          ['Fee (%)', 'feePct'],
        ] as [string, keyof typeof form][]).map(([label, key]) => (
          <div key={key}>
            <label className="block text-xs text-neutral-400 mb-1">{label}</label>
            <input
              type="number"
              min="0"
              value={String(form[key] ?? 0)}
              onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Capacity</label>
          <select
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value as 'Open' | 'Limited' }))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="Open">Open</option>
            <option value="Limited">Limited</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Focus Pairs (comma-separated)</label>
          <input
            type="text"
            value={pairsStr}
            onChange={(e) => setPairsStr(e.target.value)}
            placeholder="BTC/USD, ETH/USD"
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
        />
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
          {saving ? 'Saving…' : 'Save Trader'}
        </button>
      </div>
    </form>
  )
}

export default function AdminCopyTradersPage() {
  const [traders, setTraders] = useState<AdminCopyTrader[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminCopyTrader | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminCopyTraders()
      .then(setTraders)
      .catch(() => toast.error('Failed to load traders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data: Omit<AdminCopyTrader, 'id'>) => {
    setSaving(true)
    try {
      await createAdminCopyTrader(data)
      toast.success('Trader added')
      setCreating(false)
      load()
    } catch {
      toast.error('Failed to add trader')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data: Omit<AdminCopyTrader, 'id'>) => {
    if (!editing) return
    setSaving(true)
    try {
      await updateAdminCopyTrader(editing.id, data)
      toast.success('Trader updated')
      setEditing(null)
      load()
    } catch {
      toast.error('Failed to update trader')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (t: AdminCopyTrader) => {
    if (!confirm(`Delete "${t.name}"?`)) return
    try {
      await deleteAdminCopyTrader(t.id)
      toast.success('Trader deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Copy Traders</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{traders.length} traders in catalog</p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <i className="fi fi-rr-add" />
            Add Trader
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h3 className="font-medium text-amber-400 mb-4">New Copy Trader</h3>
          <TraderForm initial={{}} onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : traders.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 p-10 text-center">
          <i className="fi fi-rr-copy-alt text-3xl text-neutral-600 block mb-2" />
          <p className="text-neutral-500 text-sm">No copy traders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {traders.map((t) => (
            <div key={t.id} className="rounded-xl border border-neutral-800 bg-neutral-900/30">
              {editing?.id === t.id ? (
                <div className="p-5">
                  <h3 className="font-medium text-amber-400 mb-4">Edit: {t.name}</h3>
                  <TraderForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} saving={saving} />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 text-sm font-bold text-cyan-400">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{t.name}</p>
                        <span className="text-xs text-neutral-500">@{t.handle}</span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">{t.specialty}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          {t.winRate}% win
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {t.monthlyReturn}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                            t.capacity === 'Open'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {t.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditing(t)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
