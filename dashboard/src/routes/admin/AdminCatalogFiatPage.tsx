import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminCatalogFiat,
  createAdminCatalogFiat,
  updateAdminCatalogFiat,
  deleteAdminCatalogFiat,
  type AdminCatalogFiat,
} from '../../services/adminService'

export default function AdminCatalogFiatPage() {
  const [rows, setRows] = useState<AdminCatalogFiat[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminCatalogFiat | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [code, setCode] = useState('')

  const load = () => {
    setLoading(true)
    getAdminCatalogFiat()
      .then(setRows)
      .catch(() => toast.error('Failed to load fiat currencies'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setName('')
    setSymbol('')
    setCode('')
    setCreating(false)
    setEditing(null)
  }

  const startEdit = (r: AdminCatalogFiat) => {
    setEditing(r)
    setName(r.name)
    setSymbol(r.symbol)
    setCode(r.code)
    setCreating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !symbol.trim() || !code.trim()) {
      toast.error('Name, symbol and ISO code are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateAdminCatalogFiat(editing.id, {
          name: name.trim(),
          symbol: symbol.trim(),
          code: code.trim().toUpperCase(),
        })
        toast.success('Fiat currency updated')
      } else {
        await createAdminCatalogFiat({
          name: name.trim(),
          symbol: symbol.trim(),
          code: code.trim().toUpperCase(),
        })
        toast.success('Fiat currency added')
      }
      resetForm()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (r: AdminCatalogFiat) => {
    if (!confirm(`Delete ${r.code} (${r.name})? Users assigned to this currency must be reassigned first.`))
      return
    setSaving(true)
    try {
      await deleteAdminCatalogFiat(r.id)
      toast.success('Deleted')
      if (editing?.id === r.id) resetForm()
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Fiat currencies</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Reference list for user account currency. Delete is blocked if any user uses the row.
          </p>
        </div>
        {!creating && !editing && (
          <button
            type="button"
            onClick={() => {
              setCreating(true)
              setEditing(null)
              setName('')
              setSymbol('')
              setCode('')
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <i className="fi fi-rr-add" />
            Add fiat
          </button>
        )}
      </div>

      {(creating || editing) && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h3 className="font-medium text-amber-400 mb-4">
            {editing ? `Edit ${editing.code}` : 'New fiat currency'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="block text-xs text-neutral-400 mb-1">ISO code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="sm:col-span-3 flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-900/80 text-neutral-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {rows.map((r) => (
                <tr key={r.id} className="bg-neutral-950/30 hover:bg-neutral-900/50">
                  <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{r.code}</td>
                  <td className="px-4 py-3 text-neutral-300">{r.name}</td>
                  <td className="px-4 py-3 text-neutral-400">{r.symbol}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleDelete(r)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !creating && (
            <p className="text-center text-neutral-500 text-sm py-10">No fiat currencies.</p>
          )}
        </div>
      )}
    </div>
  )
}
