import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getVerificationQueue,
  fetchVerificationDocumentBlob,
  approveVerificationDocument,
  rejectVerificationDocument,
  type VerificationQueueRow,
} from '../../services/adminService'

function sortQueue(rows: VerificationQueueRow[]): VerificationQueueRow[] {
  const statusRank = (s: string) => (s === 'review' ? 0 : 1)
  return [...rows]
    .map((u) => ({
      ...u,
      documents: [...u.documents].sort((a, b) => {
        const ra = statusRank(a.status)
        const rb = statusRank(b.status)
        if (ra !== rb) return ra - rb
        return b.updatedAt - a.updatedAt
      }),
    }))
    .sort((a, b) => {
      const aPending = a.documents.some((d) => d.status === 'review')
      const bPending = b.documents.some((d) => d.status === 'review')
      if (aPending !== bPending) return aPending ? -1 : 1
      return a.email.localeCompare(b.email)
    })
}

function VerificationDocPreview({
  publicId,
  documentId,
  mimeType,
}: {
  publicId: string
  documentId: string
  mimeType: string | null
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    void (async () => {
      try {
        const { blob } = await fetchVerificationDocumentBlob(publicId, documentId)
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) {
          setUrl(objectUrl)
          setPhase('ready')
        } else {
          URL.revokeObjectURL(objectUrl)
        }
      } catch {
        if (!cancelled) setPhase('error')
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [publicId, documentId])

  if (phase === 'error') {
    return <span className="text-xs text-red-400/80">Preview unavailable</span>
  }
  if (phase === 'loading' || !url) {
    return <span className="text-xs text-neutral-500">Loading preview…</span>
  }

  const m = (mimeType || '').toLowerCase()
  if (m.startsWith('image/')) {
    return (
      <img
        src={url}
        alt=""
        className="max-h-44 max-w-[220px] rounded-lg border border-neutral-700 bg-neutral-950 object-contain"
      />
    )
  }
  if (m === 'application/pdf') {
    return (
      <iframe
        title="Document preview"
        src={url}
        className="h-48 w-full min-w-[200px] max-w-[280px] rounded-lg border border-neutral-700 bg-neutral-950"
      />
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-amber-400/90 underline hover:text-amber-300"
    >
      Open in new tab
    </a>
  )
}

export default function AdminVerificationPage() {
  const [rows, setRows] = useState<VerificationQueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getVerificationQueue()
      .then((r) => setRows(sortQueue(r)))
      .catch(() => toast.error('Failed to load verification queue'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const key = (p: string, d: string) => `${p}:${d}`

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
          <p className="text-sm text-neutral-500 mt-1">
            Submitted documents in review and approved uploads (preview only; rows stay after approval).
          </p>
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
        <p className="text-sm text-neutral-500">No submitted verification files yet.</p>
      ) : (
        <div className="space-y-8">
          {rows.map((u) => (
            <div
              key={u.publicId}
              className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden"
            >
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
                      <th className="px-4 py-2 font-medium w-[240px]">Preview</th>
                      <th className="px-4 py-2 font-medium">Document</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Updated</th>
                      <th className="px-4 py-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.documents.map((d) => (
                      <tr key={d.id} className="border-b border-neutral-800/80 last:border-0 align-top">
                        <td className="px-4 py-3">
                          <VerificationDocPreview
                            publicId={u.publicId}
                            documentId={d.id}
                            mimeType={d.mimeType}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-neutral-200">{d.title}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{d.subtitle}</div>
                          <div className="text-xs text-neutral-500 mt-1 font-mono truncate max-w-[200px]">
                            {d.originalFilename ?? '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {d.status === 'approved' ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
                              In review
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                          {new Date(d.updatedAt * 1000).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {d.status === 'review' ? (
                            <>
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
                            </>
                          ) : (
                            <span className="text-xs text-neutral-600">—</span>
                          )}
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
