import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { getAdminUsers, type AdminUserRow } from '../../services/adminService'

function VerificationBadge({ status }: { status: number }) {
  const labels: Record<number, { label: string; cls: string }> = {
    0: { label: 'Unverified', cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
    1: { label: 'Email verified', cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
    2: { label: 'KYC L2', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    3: { label: 'Fully verified', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  }
  const m = labels[status] ?? labels[0]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${m.cls}`}>
      {m.label}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25">
      Admin
    </span>
  ) : null
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminUsers({ page, limit, search: search || undefined })
      setUsers(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{total} total users</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email or name…"
            className="w-56 sm:w-72 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 text-sm font-medium hover:bg-amber-500/25 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-400 border border-neutral-700 text-sm hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="text-left px-4 py-3 font-medium text-neutral-400 whitespace-nowrap">User</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-400 whitespace-nowrap hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-400 whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-400 whitespace-nowrap hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-400 whitespace-nowrap hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">
                        {u.firstName || u.lastName
                          ? `${u.firstName} ${u.lastName}`.trim()
                          : <span className="text-neutral-500 italic">No name</span>}
                      </div>
                      <div className="text-xs text-neutral-500 sm:hidden">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={u.verificationStatus} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs hidden lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <i className="fi fi-rr-angle-right text-neutral-600" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800 bg-neutral-900/30">
            <span className="text-xs text-neutral-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
