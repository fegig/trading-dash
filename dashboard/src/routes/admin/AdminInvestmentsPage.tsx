import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminInvestments,
  createAdminInvestment,
  updateAdminInvestment,
  deleteAdminInvestment,
  type AdminInvestmentProduct,
} from '../../services/adminService'

const empty = (): Omit<AdminInvestmentProduct, 'id'> => ({
  name: '',
  subtitle: '',
  category: 'Short Term',
  vehicle: '',
  apy: '0',
  termDays: 30,
  minAmount: 100,
  liquidity: 'Low',
  distribution: 'Monthly',
  fundedPct: 0,
  risk: 'Low',
  focus: [],
  objective: '',
  suitableFor: '',
  description: '',
})

function InvestmentForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Partial<AdminInvestmentProduct>
  onSave: (d: Omit<AdminInvestmentProduct, 'id'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Omit<AdminInvestmentProduct, 'id'>>({ ...empty(), ...initial })
  const [focusStr, setFocusStr] = useState((initial.focus ?? []).join(', '))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return toast.error('Name is required')
    onSave({ ...form, focus: focusStr.split(',').map((s) => s.trim()).filter(Boolean) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Subtitle</label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AdminInvestmentProduct['category'] }))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option>Short Term</option>
            <option>Long Term</option>
            <option>Retirement</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Risk</label>
          <select
            value={form.risk}
            onChange={(e) => setForm((f) => ({ ...f, risk: e.target.value as AdminInvestmentProduct['risk'] }))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
        </div>
        {([
          ['Vehicle', 'vehicle', 'text'],
          ['Liquidity', 'liquidity', 'text'],
          ['Distribution', 'distribution', 'text'],
        ] as [string, keyof typeof form, string][]).map(([label, key]) => (
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
          ['APY (%)', 'apy'],
          ['Term (days)', 'termDays'],
          ['Min Amount ($)', 'minAmount'],
          ['Funded %', 'fundedPct'],
        ] as [string, keyof typeof form][]).map(([label, key]) => (
          <div key={key}>
            <label className="block text-xs text-neutral-400 mb-1">{label}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={String(form[key] ?? 0)}
              onChange={(e) => setForm((f) => ({ ...f, [key]: key === 'apy' ? e.target.value : Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Focus (comma-separated)</label>
          <input
            type="text"
            value={focusStr}
            onChange={(e) => setFocusStr(e.target.value)}
            placeholder="Crypto, DeFi, Staking"
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {(['objective', 'suitableFor', 'description'] as const).map((key) => (
        <div key={key}>
          <label className="block text-xs text-neutral-400 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
          <textarea
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>
      ))}

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
          {saving ? 'Saving…' : 'Save Product'}
        </button>
      </div>
    </form>
  )
}

const riskColor: Record<string, string> = {
  Low: 'bg-green-500/10 text-green-400 border-green-500/20',
  Moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  High: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AdminInvestmentsPage() {
  const [products, setProducts] = useState<AdminInvestmentProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminInvestmentProduct | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAdminInvestments()
      .then(setProducts)
      .catch(() => toast.error('Failed to load investments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data: Omit<AdminInvestmentProduct, 'id'>) => {
    setSaving(true)
    try {
      await createAdminInvestment(data)
      toast.success('Investment product created')
      setCreating(false)
      load()
    } catch {
      toast.error('Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data: Omit<AdminInvestmentProduct, 'id'>) => {
    if (!editing) return
    setSaving(true)
    try {
      await updateAdminInvestment(editing.id, data)
      toast.success('Product updated')
      setEditing(null)
      load()
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: AdminInvestmentProduct) => {
    if (!confirm(`Delete "${p.name}"?`)) return
    try {
      await deleteAdminInvestment(p.id)
      toast.success('Product deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Investment Products</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{products.length} products in catalog</p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <i className="fi fi-rr-add" />
            Add Product
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h3 className="font-medium text-amber-400 mb-4">New Investment Product</h3>
          <InvestmentForm initial={{}} onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 p-10 text-center">
          <i className="fi fi-rr-chart-pie text-3xl text-neutral-600 block mb-2" />
          <p className="text-neutral-500 text-sm">No investment products yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-neutral-800 bg-neutral-900/30">
              {editing?.id === p.id ? (
                <div className="p-5">
                  <h3 className="font-medium text-amber-400 mb-4">Edit: {p.name}</h3>
                  <InvestmentForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} saving={saving} />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                      <i className="fi fi-rr-chart-pie text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">{p.subtitle}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {p.category}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          {Number(p.apy).toFixed(2)}% APY
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${riskColor[p.risk] ?? ''}`}>
                          {p.risk}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {p.termDays}d
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditing(p)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
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
