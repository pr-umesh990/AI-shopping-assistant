import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null

  const { page, totalPages } = pagination

  const pages = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i)
  }

  return (
    <div className="pagination">
      <button
        className="page-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={!pagination.hasPrev}
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <>
          <button className="page-btn" onClick={() => onPageChange(1)}>1</button>
          {pages[0] > 2 && <span style={{ padding: '0 0.25rem', color: 'var(--gray-400)' }}>…</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          className={`page-btn ${p === page ? 'active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span style={{ padding: '0 0.25rem', color: 'var(--gray-400)' }}>…</span>
          )}
          <button className="page-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        className="page-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={!pagination.hasNext}
      >
        <ChevronRight size={16} />
      </button>

      <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
        Page {page} of {totalPages}
      </span>
    </div>
  )
}

export default Pagination
