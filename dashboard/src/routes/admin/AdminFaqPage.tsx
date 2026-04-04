import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminFaqCategories,
  createAdminFaqCategory,
  updateAdminFaqCategory,
  deleteAdminFaqCategory,
  getAdminFaqItems,
  createAdminFaqItem,
  updateAdminFaqItem,
  deleteAdminFaqItem,
  type AdminFaqCategoryRow,
  type AdminFaqItemRow,
} from '../../services/adminService'

export default function AdminFaqPage() {
  const [categories, setCategories] = useState<AdminFaqCategoryRow[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [items, setItems] = useState<AdminFaqItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [newCatName, setNewCatName] = useState('')
  const [editingCat, setEditingCat] = useState<AdminFaqCategoryRow | null>(null)
  const [catNameEdit, setCatNameEdit] = useState('')

  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [editingItem, setEditingItem] = useState<AdminFaqItemRow | null>(null)
  const [editQ, setEditQ] = useState('')
  const [editA, setEditA] = useState('')

  const loadCats = () => {
    setLoading(true)
    getAdminFaqCategories()
      .then((rows) => {
        setCategories(rows)
        setSelectedId((prev) => {
          if (prev != null && rows.some((r) => r.id === prev)) return prev
          return rows[0]?.id ?? null
        })
      })
      .catch(() => toast.error('Failed to load FAQ categories'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCats()
  }, [])

  useEffect(() => {
    if (selectedId == null) {
      setItems([])
      return
    }
    getAdminFaqItems(selectedId)
      .then(setItems)
      .catch(() => toast.error('Failed to load FAQ items'))
  }, [selectedId])

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      await createAdminFaqCategory({ name: newCatName.trim() })
      setNewCatName('')
      toast.success('Category created')
      loadCats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const saveCategoryEdit = async () => {
    if (!editingCat) return
    setSaving(true)
    try {
      await updateAdminFaqCategory(editingCat.id, { name: catNameEdit.trim() })
      toast.success('Category updated')
      setEditingCat(null)
      loadCats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async (c: AdminFaqCategoryRow) => {
    if (!confirm(`Delete category “${c.name}” and all questions inside?`)) return
    setSaving(true)
    try {
      await deleteAdminFaqCategory(c.id)
      toast.success('Category deleted')
      if (selectedId === c.id) setSelectedId(null)
      loadCats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedId == null) return
    if (!newQ.trim() || !newA.trim()) {
      toast.error('Question and answer are required')
      return
    }
    setSaving(true)
    try {
      await createAdminFaqItem({
        categoryId: selectedId,
        question: newQ.trim(),
        answer: newA.trim(),
      })
      setNewQ('')
      setNewA('')
      toast.success('Question added')
      const list = await getAdminFaqItems(selectedId)
      setItems(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const saveItem = async () => {
    if (!editingItem) return
    setSaving(true)
    try {
      await updateAdminFaqItem(editingItem.id, {
        question: editQ.trim(),
        answer: editA.trim(),
      })
      toast.success('Question updated')
      setEditingItem(null)
      if (selectedId != null) {
        const list = await getAdminFaqItems(selectedId)
        setItems(list)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (it: AdminFaqItemRow) => {
    if (!confirm('Delete this question?')) return
    setSaving(true)
    try {
      await deleteAdminFaqItem(it.id)
      toast.success('Deleted')
      if (selectedId != null) {
        const list = await getAdminFaqItems(selectedId)
        setItems(list)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-neutral-500 py-10 text-center">Loading FAQ…</div>
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">FAQ</h1>
        <p className="text-sm text-neutral-500 mt-1">Categories and questions shown on the help center and in-app help.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-200">Categories</h2>
          <form onSubmit={addCategory} className="flex flex-col gap-2">
            <input
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              placeholder="New category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-500/90 text-neutral-950 text-sm font-medium py-2 disabled:opacity-50"
            >
              Add category
            </button>
          </form>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`flex-1 text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                      selectedId === c.id
                        ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                        : 'text-neutral-300 hover:bg-neutral-800 border border-transparent'
                    }`}
                  >
                    {c.name}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-neutral-500 px-2"
                    onClick={() => {
                      setEditingCat(c)
                      setCatNameEdit(c.name)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-400/80 px-2"
                    onClick={() => void removeCategory(c)}
                  >
                    Del
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 min-w-0">
          {editingCat && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
              <div className="text-xs text-neutral-500">Rename category</div>
              <input
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                value={catNameEdit}
                onChange={(e) => setCatNameEdit(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveCategoryEdit()}
                  disabled={saving}
                  className="text-sm rounded-lg bg-amber-500/90 text-neutral-950 px-3 py-1.5"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="text-sm rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <h2 className="text-sm font-semibold text-neutral-200">Questions</h2>
          {selectedId == null ? (
            <p className="text-sm text-neutral-500">Select or create a category.</p>
          ) : (
            <>
              <form onSubmit={addItem} className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  placeholder="Question"
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                />
                <textarea
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 min-h-[88px]"
                  placeholder="Answer"
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm px-4 py-2"
                >
                  Add question
                </button>
              </form>

              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4 space-y-2"
                  >
                    {editingItem?.id === it.id ? (
                      <>
                        <input
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                          value={editQ}
                          onChange={(e) => setEditQ(e.target.value)}
                        />
                        <textarea
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 min-h-[100px]"
                          value={editA}
                          onChange={(e) => setEditA(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void saveItem()}
                            className="text-sm rounded-lg bg-amber-500/90 text-neutral-950 px-3 py-1.5"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="text-sm text-neutral-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium text-neutral-200">{it.question}</div>
                        <div className="text-sm text-neutral-500 whitespace-pre-wrap">{it.answer}</div>
                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            className="text-xs text-amber-400/90"
                            onClick={() => {
                              setEditingItem(it)
                              setEditQ(it.question)
                              setEditA(it.answer)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-400/80"
                            onClick={() => void removeItem(it)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-neutral-600">No questions in this category yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
