'use client'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-rim">
      <p className="text-sm text-muted">
        {from}–{to} de {total}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-rim text-muted hover:text-ink hover:border-brand/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ‹ Anterior
        </button>
        <span className="px-3 py-1.5 text-sm text-ink">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-rim text-muted hover:text-ink hover:border-brand/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente ›
        </button>
      </div>
    </div>
  )
}
