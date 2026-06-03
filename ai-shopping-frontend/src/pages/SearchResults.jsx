import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Grid, List, Search as SearchIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import ProductCard from '../components/common/ProductCard.jsx'
import FilterSidebar from '../components/search/FilterSidebar.jsx'
import AIQueryBanner from '../components/search/AIQueryBanner.jsx'
import ComparisonTray from '../components/search/ComparisonTray.jsx'
import Pagination from '../components/common/Pagination.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { searchProducts } from '../api/axios.js'
import { useCompare } from '../hooks/useCompare.js'

const SkeletonGrid = () => (
  <div className="products-grid">
    {[...Array(8)].map((_,i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton" style={{ height:180 }} />
        <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          <div className="skeleton" style={{ height:12, width:'60%' }} />
          <div className="skeleton" style={{ height:16, width:'90%' }} />
          <div className="skeleton" style={{ height:14, width:'50%' }} />
        </div>
      </div>
    ))}
  </div>
)

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [products, setProducts] = useState([])
  const [interpretation, setInterpretation] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState('relevance')
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const { items: compareItems } = useCompare()

  const doSearch = useCallback(async (query, pg, currentFilters, sortBy) => {
    if (!query) return
    setLoading(true)
    try {
      const res = await searchProducts({
        query,
        page: pg,
        limit: 12,
        sort: sortBy,
        ...currentFilters,
      })
      const data = res.data?.data
      setProducts(data?.products || [])
      setInterpretation(data?.interpretation || null)
      setPagination(data?.pagination || null)
    } catch (err) {
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    doSearch(q, 1, filters, sort)
  }, [q])

  useEffect(() => {
    doSearch(q, page, filters, sort)
  }, [page, sort])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
    doSearch(q, 1, newFilters, sort)
  }

  return (
    <div>
      <div className="container" style={{ padding:'2rem 1rem', paddingBottom: compareItems.length >= 2 ? '100px' : undefined }}>
        {/* Page header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--gray-900)' }}>
            Search Results
          </h1>
          {q && <p style={{ color:'var(--gray-500)', marginTop:'0.25rem' }}>Showing results for "<strong style={{ color:'var(--gray-800)' }}>{q}</strong>"</p>}
        </div>

        {/* AI Banner */}
        {interpretation && <AIQueryBanner interpretation={interpretation} />}

        <div className="search-layout">
          {/* Sidebar */}
          <div className="filter-sidebar" style={{ flexShrink: 0 }}>
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Main */}
          <div className="search-main">
            <div className="results-toolbar">
              {!loading && (
                <p className="results-count">
                  {pagination?.total ? (
                    <><strong>{pagination.total.toLocaleString()}</strong> products found</>
                  ) : (
                    <strong>{products.length}</strong>
                  )} products found
                </p>
              )}
              <div className="toolbar-right">
                <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}>
                  <option value="relevance">Most Relevant</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest</option>
                </select>
                <div className="view-toggle">
                  <button className={`view-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>
                    <Grid size={15} />
                  </button>
                  <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : products.length > 0 ? (
              <>
                <div className={view === 'grid' ? 'products-grid' : 'products-list'}>
                  {products.map(p => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      fullWidth={view === 'list'}
                      showCompare
                      showWishlist
                    />
                  ))}
                </div>
                <Pagination pagination={pagination} onPageChange={setPage} />
              </>
            ) : q ? (
              <EmptyState
                icon={SearchIcon}
                title="No results found"
                description={`We couldn't find any products matching "${q}". Try different keywords or browse categories.`}
              />
            ) : null}
          </div>
        </div>
      </div>

      <ComparisonTray />
    </div>
  )
}

export default SearchResults
