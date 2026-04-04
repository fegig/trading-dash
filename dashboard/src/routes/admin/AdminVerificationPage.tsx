import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getVerificationQueue,
  downloadVerificationDocument,
  approveVerificationDocument,
  rejectVerificationDocument,
  type VerificationQueueRow,
} from '../../services/adminService'

export default function AdminVerificationPage() {
  const [rows, setRows] = useState<VerificationQueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getVerificationQueue()
      .then(setRows)
      .catch(() => toast.error('Failed to load verification queue'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const key = (p: string, d: string) => `${p}:${d}`

  const onDownload = async (publicId: string, documentId: string) => {
    setBusy(key(publicId, documentId))
    try {
      await downloadVerificationDocument(publicId, documentId)
    } catch {
      toast.error('Download failed')
    } finally {
      setBusy(null)
    }
  }

  const onApprove = async (publicId: string, documentId: string) => {
    if (!confirm('Approve this document?')) return
    setBusy(`approve:${key(publicId, documentId)}`)
    try {
      await approveVerificationDocument(publicId, documentId)
      toast.success('Document approved')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setBusy(null)
    }
  }

  const onReject = async (publicId: string, documentId: string) => {
    if (!confirm('Reject and delete this upload? The user can submit again.')) return
    setBusy(`reject:${key(publicId, documentId)}`)
    try {
      await rejectVerificationDocument(publicId, documentId)
      toast.success('Document rejected')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reject failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div className="text-sm text-neutral-500 py-10 text-center">Loading queue…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Verification queue</h1>
          <p className="text-sm text-neutral-500 mt-1">Documents awaiting review (status: in review).</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-sm rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:bg-neutral-800"
        >
          Refresh
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No documents in review.</p>
      ) : (
        <div className="space-y-8">
          {rows.map((u) => (
            <div key={u.publicId} className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex flex-wrap gap-2 justify-between">
                <div>
                  <div className="text-sm font-medium text-neutral-200">{u.email}</div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">{u.publicId}</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-neutral-500 border-b border-neutral-800">
                      <th className="px-4 py-2 font-medium">Document</th>
                      <th className="px-4 py-2 font-medium">File</th>
                      <th className="px-4 py-2 font-medium">Updated</th>
                      <th className="px-4 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.documents.map((d) => (
                      <tr key={d.id} className="border-b border-neutral-800/80 last:border-0">
                        <td className="px-4 py-3 align-top">
                          <div className="text-neutral-200">{d.title}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{d.subtitle}</div>
                        </td>
                        <td className="px-4 py-3 align-top text-neutral-400">
                          {d.originalFilename ?? '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-neutral-500 text-xs">
                          {new Date(d.updatedAt * 1000).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void onDownload(u.publicId, d.id)}
                            className="text-amber-400/90 hover:text-amber-300 text-xs mr-3"
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void onApprove(u.publicId, d.id)}
                            className="text-emerald-400/90 hover:text-emerald-300 text-xs mr-3"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void onReject(u.publicId, d.id)}
                            className="text-red-400/90 hover:text-red-300 text-xs"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
