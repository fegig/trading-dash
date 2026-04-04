import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminBots,
  createAdminBot,
  updateAdminBot,
  deleteAdminBot,
  type AdminBot,
} from '../../services/adminService'
import { asStringArray } from '../../util/asStringArray'

const emptyBot = (): Omit<AdminBot, 'id'> => ({
  name: '',
  strapline: '',
  description: '',
  strategy: '',
  priceUsd: '0',
  monthlyTarget: '',
  winRate: 0,
  maxDrawdown: 0,
  markets: [],
  cadence: 'daily',
  guardrails: [],
  subscriptionDays: 30,
})

function BotForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Partial<AdminBot>
  onSave: (data: Omit<AdminBot, 'id'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Omit<AdminBot, 'id'>>({
    ...emptyBot(),
    ...initial,
    markets: asStringArray(initial.markets),
    guardrails: asStringArray(initial.guardrails),
  })
  const [marketsStr, setMarketsStr] = useState(asStringArray(initial.markets).join(', '))
  const [guardrailsStr, setGuardrailsStr] = useState(asStringArray(initial.guardrails).join('\n'))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.strategy) return toast.error('Name and strategy are required')
    onSave({
      ...form,
      markets: marketsStr.split(',').map((s) => s.trim()).filter(Boolean),
      guardrails: guardrailsStr.split('\n').map((s) => s.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          ['Name *', 'name', 'text'],
          ['Strapline', 'strapline', 'text'],
          ['Strategy *', 'strategy', 'text'],
          ['Monthly Target', 'monthlyTarget', 'text'],
          ['Cadence', 'cadence', 'text'],
        ] as [string, keyof typeof form, string][]).map(([label, key, type]) => (
          <div key={key}>
            <label className="block text-xs text-neutral-400 mb-1">{label}</label>
            <input
              type={type}
              value={String(form[key] ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        ))}
        {([
          ['Price (USD)', 'priceUsd'],
          ['Win Rate (%)', 'winRate'],
          ['Max Drawdown (%)', 'maxDrawdown'],
          ['Subscription Days', 'subscriptionDays'],
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
      </div>

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">
            Markets (comma-separated)
          </label>
          <input
            type="text"
            value={marketsStr}
            onChange={(e) => setMarketsStr(e.target.value)}
            placeholder="Crypto, Forex, Stocks"
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">
            Guardrails (one per line)
          </label>
          <textarea
            value={guardrailsStr}
            onChange={(e) => setGuardrailsStr(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>
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
          {saving ? 'Saving…' : 'Save Bot'}
        </button>
      </div>
    </form>
  )
}

export default function AdminBotsPage() {
  const [bots, setBots] = useState<AdminBot[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminBot | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminBots()
      .then(setBots)
      .catch(() => toast.error('Failed to load bots'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data: Omit<AdminBot, 'id'>) => {
    setSaving(true)
    try {
      await createAdminBot(data)
      toast.success('Bot created')
      setCreating(false)
      load()
    } catch {
      toast.error('Failed to create bot')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data: Omit<AdminBot, 'id'>) => {
    if (!editing) return
    setSaving(true)
    try {
      await updateAdminBot(editing.id, data)
      toast.success('Bot updated')
      setEditing(null)
      load()
    } catch {
      toast.error('Failed to update bot')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (bot: AdminBot) => {
    if (!confirm(`Delete "${bot.name}"? This cannot be undone.`)) return
    try {
      await deleteAdminBot(bot.id)
      toast.success('Bot deleted')
      load()
    } catch {
      toast.error('Failed to delete bot')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Trading Bots</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{bots.length} bots in catalog</p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <i className="fi fi-rr-add" />
            Add Bot
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h3 className="font-medium text-amber-400 mb-4">New Trading Bot</h3>
          <BotForm initial={{}} onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 p-10 text-center">
          <i className="fi fi-rr-robot text-3xl text-neutral-600 block mb-2" />
          <p className="text-neutral-500 text-sm">No bots yet. Add your first bot.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <div key={bot.id} className="rounded-xl border border-neutral-800 bg-neutral-900/30">
              {editing?.id === bot.id ? (
                <div className="p-5">
                  <h3 className="font-medium text-amber-400 mb-4">Edit: {bot.name}</h3>
                  <BotForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} saving={saving} />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                      <i className="fi fi-rr-robot text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white">{bot.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">{bot.strapline}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {bot.strategy}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          {bot.winRate}% win
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          ${Number(bot.priceUsd).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditing(bot)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bot)}
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
