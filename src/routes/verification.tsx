import { useEffect } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import PageHero from '../components/common/PageHero'
import { useUserStore, useVerificationStore } from '../stores'
import { formatDateWithTime } from '../util/time'

function statusLabel(status: string | undefined) {
  switch (status) {
    case '3':
      return 'Verified'
    case '2':
      return 'Under review'
    default:
      return 'Action required'
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

export default function VerificationPage() {
  const verificationStatus = useUserStore((state) => state.user?.verificationStatus)
  const {
    overview,
    steps,
    documents,
    benefits,
    selectedDocumentId,
    loadVerification,
    selectDocument,
  } = useVerificationStore(
    useShallow((state) => ({
      overview: state.overview,
      steps: state.steps,
      documents: state.documents,
      benefits: state.benefits,
      selectedDocumentId: state.selectedDocumentId,
      loadVerification: state.loadVerification,
      selectDocument: state.selectDocument,
    }))
  )

  useEffect(() => {
    void loadVerification()
  }, [loadVerification])

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        title="Verification shaped for the rest of the platform"
        description="KYC now looks and behaves like part of the trading system: clear unlocks, real document states, enhanced-tier progress, and a layout that matches the rest of the product instead of a generic checklist."
        stats={[
          { label: 'Account Status', value: statusLabel(verificationStatus) },
          { label: 'Daily Limit', value: overview?.dailyLimit ?? 'Loading' },
          { label: 'Settlement', value: overview?.payoutSpeed ?? 'Loading' },
        ]}
        actions={
          <>
            <button
              type="button"
              className="rounded-full bg-green-500/15 px-4 py-2 text-sm text-green-300 hover:bg-green-500/25 transition-colors"
            >
              Continue enhanced review
            </button>
            <Link
              to="/settings"
              className="rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-300 hover:text-green-400 transition-colors"
            >
              Open account settings
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6">
        <div className="space-y-6">
          <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-4">
            <div>
              <div className="text-[8px]  tracking-[0.16em] text-neutral-500">Verification Roadmap</div>
              <h2 className="text-xl font-semibold text-neutral-100 mt-2">
                {overview?.tier ?? 'Verification in progress'}
              </h2>
              <p className="text-xs text-neutral-400 mt-2">{overview?.nextReview}</p>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 flex gap-4 items-start"
                >
                  <div
                    className={`w-10 h-10 rounded-2xl grid place-items-center text-sm font-semibold shrink-0 ${
                      step.status === 'complete'
                        ? 'bg-green-500/10 text-green-300'
                        : step.status === 'active'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs font-semibold text-neutral-100">{step.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs capitalize ${
                          step.status === 'complete'
                            ? 'bg-green-500/10 text-green-300'
                            : step.status === 'active'
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'bg-neutral-900 text-neutral-500'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">{step.body}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-neutral-500">{step.eta}</span>
                      <button type="button" className="text-[8px] text-green-300 hover:text-green-200">
                        {step.action}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className="gradient-background rounded-2xl border border-neutral-800/80 p-5"
              >
                <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-300 grid place-items-center">
                  <i className={benefit.icon} />
                </div>
                <h3 className="text-xs font-semibold text-neutral-100 mt-4">{benefit.title}</h3>
                <p className="text-xs text-neutral-500 mt-2">{benefit.body}</p>
              </div>
            ))}
          </section>
        </div>

        <div>
        <aside className="sticky  gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-5 h-fit">
          <div>
            <div className="text-[8px]  tracking-[0.16em] text-neutral-500">Documents</div>
            <h2 className="text-xl font-semibold text-neutral-100 mt-2">Review package</h2>
          </div>

          <div className="space-y-3">
            {documents.map((document) => (
              <button
                key={document.id}
                type="button"
                onClick={() => selectDocument(document.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  selectedDocument?.id === document.id
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-neutral-800 bg-neutral-950/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-neutral-100">{document.title}</div>
                    <div className="text-xs text-neutral-500 mt-2">{document.subtitle}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${documentStatusClass(document.status)}`}>
                    {document.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selectedDocument ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <div className="text-[8px]  tracking-[0.16em] text-neutral-500">Selected Document</div>
              <div className="text-xs font-semibold text-neutral-100">{selectedDocument.title}</div>
              <div className="text-sm text-neutral-400">{selectedDocument.subtitle}</div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Last update</span>
                <span>{formatDateWithTime(selectedDocument.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Status</span>
                <span className={`px-3 py-1 rounded-full capitalize ${documentStatusClass(selectedDocument.status)}`}>
                  {selectedDocument.status}
                </span>
              </div>
            </div>
          ) : null}
        </aside>
        </div>
      </div>
    </div>
  )
}
