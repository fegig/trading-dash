type PaginationProps = {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const canPrev = safePage > 1
  const canNext = safePage < totalPages

  if (totalCount <= pageSize) return null

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 pt-2 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      <p className="text-xs text-neutral-500">
        Page {safePage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 hover:text-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 hover:text-neutral-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
