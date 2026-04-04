import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import PageHero from '@/components/common/PageHero'
import { errorToast, successToast } from '@/components/common/sweetAlerts'
import { useUserStore, useVerificationStore } from '@/stores'
import { formatDateWithTime } from '@/util/time'
import { paths } from '@/navigation/paths'

function statusLabel(status: string | undefined) {
  switch (status) {
    case '3':
      return 'Verified'
    case '2':
      return 'Under review'
    case '1':
      return 'Documents needed'
    case '0':
      return 'Confirm email'
    default:
      return 'Unknown'
  }
}

function documentStatusClass(status: 'approved' | 'review' | 'missing') {
  switch (status) {
    case 'approved':
      return 'bg-green-500/10 text-green-300'
    case 'review':
      return 'bg-amber-500/10 text-amber-300'
    default:
      return 'bg-rose-500/10 text-rose-300'
  }
}

function documentStatusLabel(status: 'approved' | 'review' | 'missing') {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'review':
      return 'In review'
    default:
      return 'Not uploaded'
  }
}

function documentIdForStep(stepId: string): string | null {
  if (stepId === 'step-identity') return 'doc-passport'
  if (stepId === 'step-address') return 'doc-address'
  return null
}

export default function VerificationPage() {
  const verificationStatus = useUserStore((state) => state.user?.verificationStatus)
  const {
    overview,
    steps,
    documents,
    benefits,
    selectedDocumentId,
    loading,
    loadVerification,
    selectDocument,
    uploadVerificationFile,
    downloadVerificationFile,
  } = useVerificationStore(
    useShallow((state) => ({
      overview: state.overview,
      steps: state.steps,
      documents: state.documents,
      benefits: state.benefits,
      selectedDocumentId: state.selectedDocumentId,
      loading: state.loading,
      loadVerification: state.loadVerification,
      selectDocument: state.selectDocument,
      uploadVerificationFile: state.uploadVerificationFile,
      downloadVerificationFile: state.downloadVerificationFile,
    }))
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentsPanelRef = useRef<HTMLElement>(null)
  const [uploadBusy, setUploadBusy] = useState(false)

  useEffect(() => {
    void loadVerification(true)
  }, [loadVerification])

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null

  const scrollToDocuments = () => {
    documentsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const focusDocumentForStep = (stepId: string) => {
    const docId = documentIdForStep(stepId)
    if (docId) selectDocument(docId)
    scrollToDocuments()
  }

  const isVerified = verificationStatus === '3'

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        title="Identity verification"
        description="Complete KYC so we can meet regulatory requirements and unlock higher limits. Upload your ID and proof of address on the right — the checklist below tracks email confirmation, each file, and team review."
        stats={[
          { label: 'Account status', value: loading ? '…' : statusLabel(verificationStatus) },
          { label: 'Trading tier', value: loading ? '…' : (overview?.tier ?? 'Standard') },
          { label: 'Typical payout speed', value: loading ? '…' : (overview?.payoutSpeed ?? '—') },
        ]}
        actions={
          <>
            {!isVerified ? (
              <button
                type="button"
                onClick={scrollToDocuments}
                className="rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-green-400 transition-colors"
              >
                Upload documents
              </button>
            ) : null}
            <Link
              to={paths.dashboardSettings}
              className="rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-300 hover:text-green-400 transition-colors"
            >
              Account settings
            </Link>
          </>
        }
      />

      {isVerified ? (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          Your account is verified. Limits and payout timing follow your current tier (
          {overview?.dailyLimit ?? 'see above'}). You can still replace files below if we ask for an update.
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6">
        <div className="space-y-6">
          <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Your checklist</div>
              <h2 className="text-lg font-semibold text-neutral-100 mt-2">Verification steps</h2>
              <p className="text-xs text-neutral-400 mt-1">
                {overview?.nextReview ? `${overview.nextReview}. ` : null}
                Required: email confirmed, government ID, and proof of address. Source-of-funds is optional unless we
                request it.
              </p>
            </div>

            {loading && steps.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-neutral-900/80 border border-neutral-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const linkedDocId = documentIdForStep(step.id)
                  const showJump = Boolean(linkedDocId) && step.status === 'active'
                  return (
                    <div
                      key={step.id}
                      className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 flex gap-4 items-start"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl grid place-items-center text-sm font-semibold shrink-0 ${
                          step.status === 'complete'
                            ? 'bg-green-500/10 text-green-300'
                            : step.status === 'active'
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'bg-neutral-900 text-neutral-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-neutral-100">{step.title}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] capitalize ${
                              step.status === 'complete'
                                ? 'bg-green-500/10 text-green-300'
                                : step.status === 'active'
                                  ? 'bg-amber-500/10 text-amber-300'
                                  : 'bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{step.body}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                          <span className="text-xs text-neutral-500">{step.eta}</span>
                          {showJump ? (
                            <button
                              type="button"
                              onClick={() => focusDocumentForStep(step.id)}
                              className="text-xs font-medium text-green-400 hover:text-green-300"
                            >
                              Open upload panel
                            </button>
                          ) : step.action && step.action !== '—' ? (
                            <span className="text-[11px] text-neutral-600 max-w-56 text-right">{step.action}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className="gradient-background rounded-2xl border border-neutral-800/80 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-300 grid place-items-center">
                  <i className={benefit.icon} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-100 mt-4">{benefit.title}</h3>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{benefit.body}</p>
              </div>
            ))}
          </section>
        </div>

        <div>
          <aside
            ref={documentsPanelRef}
            id="kyc-documents"
            className="sticky top-4 gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-5 h-fit scroll-mt-24"
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Documents</div>
              <h2 className="text-lg font-semibold text-neutral-100 mt-2">Uploads</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Select a slot, then upload PDF or image. We encrypt storage and only use files for compliance.
              </p>
            </div>

            {loading && documents.length === 0 ? (
              <div className="h-40 rounded-xl bg-neutral-900/80 border border-neutral-800 animate-pulse" />
            ) : documents.length === 0 ? (
              <p className="text-sm text-neutral-500">No document slots yet. Refresh the page or contact support.</p>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => selectDocument(document.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      selectedDocument?.id === document.id
                        ? 'border-green-500/40 bg-green-500/5'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-100">{document.title}</div>
                        <div className="text-xs text-neutral-500 mt-1 leading-relaxed">{document.subtitle}</div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] shrink-0 ${documentStatusClass(document.status)}`}
                      >
                        {documentStatusLabel(document.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedDocument ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Selected</div>
                <div className="text-sm font-semibold text-neutral-100">{selectedDocument.title}</div>
                <div className="text-xs text-neutral-500 leading-relaxed">{selectedDocument.subtitle}</div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Last update</span>
                  <span>{formatDateWithTime(selectedDocument.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Status</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full ${documentStatusClass(selectedDocument.status)}`}
                  >
                    {documentStatusLabel(selectedDocument.status)}
                  </span>
                </div>
                {selectedDocument.hasFile ? (
                  <div className="text-xs text-neutral-500 pt-1">
                    <span className="text-neutral-400">File: </span>
                    {selectedDocument.originalFilename ?? 'uploaded'}
                    {selectedDocument.fileSize != null ? (
                      <span className="text-neutral-600"> ({Math.round(selectedDocument.fileSize / 1024)} KB)</span>
                    ) : null}
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file || !selectedDocument) return
                    setUploadBusy(true)
                    void uploadVerificationFile(selectedDocument.id, file)
                      .then((r) => {
                        if (r.ok) successToast('File uploaded — we will review it shortly')
                        else errorToast(r.error ?? 'Upload failed')
                      })
                      .finally(() => setUploadBusy(false))
                  }}
                />
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    disabled={uploadBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-green-500/20 px-4 py-2 text-xs font-medium text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    {uploadBusy ? 'Uploading…' : selectedDocument.hasFile ? 'Replace file' : 'Choose file'}
                  </button>
                  {selectedDocument.hasFile ? (
                    <button
                      type="button"
                      onClick={() =>
                        void downloadVerificationFile(
                          selectedDocument.id,
                          selectedDocument.originalFilename ?? `${selectedDocument.id}-document`
                        ).then((r) => {
                          if (!r.ok) errorToast(r.error ?? 'Download failed')
                        })
                      }
                      className="rounded-full border border-neutral-700 px-4 py-2 text-xs text-neutral-300 hover:border-green-500/40 transition-colors"
                    >
                      Download your copy
                    </button>
                  ) : null}
                </div>
                <p className="text-[10px] text-neutral-600 leading-relaxed pt-1">
                  JPEG, PNG, WebP, or PDF · max 10 MB. By uploading you confirm the document is yours and accurate.
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
