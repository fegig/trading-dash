import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  confirmAdminWalletPending,
  getAdminWalletPending,
  type AdminPendingWalletRow,
} from '../../services/adminService'

function formatTime(createdAt: number) {
  return new Date(createdAt * 1000).toLocaleString()
}

export default function AdminWalletPendingPage() {
  const [rows, setRows] = useState<AdminPendingWalletRow[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminWalletPending()
      setRows(data)
    } catch {
      toast.error('Failed to load pending wallet requests.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleConfirm = async (id: string) => {
    setConfirmingId(id)
    try {
      const r = await confirmAdminWalletPending(id)
      toast.success(r.emailSent ? 'Confirmed and user notified by email.' : 'Confirmed.')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Confirm failed')
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Pending wallet requests</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Send and receive requests from users. Confirming applies the balance change and emails the user.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-8 text-center text-neutral-500 text-sm">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-8 text-center text-neutral-500 text-sm">
          No pending requests.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
          <table className="w-full min-w-[960px] text-sm text-left">
            <thead>
              <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-neutral-800/80 last:border-0">
                  <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">{formatTime(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="text-neutral-200">{r.userEmail}</div>
                    <div className="text-xs text-neutral-500 font-mono">{r.userPublicId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.type === 'withdrawal'
                          ? 'text-amber-400/90'
                          : 'text-emerald-400/90'
                      }
                    >
                      {r.type === 'withdrawal' ? 'Send' : 'Receive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-200">{r.methodSymbol}</td>
                  <td className="px-4 py-3">
                    <div className="text-neutral-200">
                      {r.amount} {r.methodSymbol}
                    </div>
                    <div className="text-xs text-neutral-500">≈ ${r.eqAmount.toFixed(2)} USD</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400 max-w-xs">
                    <div className="font-mono text-[11px] text-neutral-500 break-all">{r.id}</div>
                    {r.type === 'withdrawal' && r.counterpartyAddress ? (
                      <div className="mt-1 text-neutral-300 break-all">
                        To: {r.counterpartyAddress}
                      </div>
                    ) : null}
                    {r.type === 'deposit' && r.expiresAt != null ? (
                      <div className="mt-1 text-neutral-500">
                        Intent expires: {new Date(r.expiresAt * 1000).toLocaleString()}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={confirmingId === r.id}
                      onClick={() => void handleConfirm(r.id)}
                      className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-200 disabled:opacity-50"
                    >
                      {confirmingId === r.id ? 'Working…' : 'Confirm'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
