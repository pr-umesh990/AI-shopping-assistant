import { useState, useEffect, useCallback, useRef } from 'react'
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
  const isMountRef = useRef(true)

  // Load More state
  const [allProducts, setAllProducts] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [viewMode, setViewMode] = useState('pagination') // 'pagination' | 'loadmore'

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
      console.log("Search results:", res);
      const data = res.data?.data
      setProducts(data?.results || [])
      // Reset allProducts on fresh search
      setAllProducts(data?.results || [])
      setInterpretation(data?.interpretation || null)
      setPagination(data?.pagination || null)
    } catch (err) {
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!pagination?.hasNext || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await searchProducts({
        query: q,
        page: page + 1,
        limit: 12,
        sort,
        ...filters,
      })
      const data = res.data?.data
      const newProducts = data?.results || []
      setAllProducts(prev => [...prev, ...newProducts])
      setProducts(newProducts)
      setPagination(data?.pagination || null)
      setPage(prev => prev + 1)
    } catch {
      toast.error('Could not load more products.')
    } finally {
      setLoadingMore(false)
    }
  }, [pagination, loadingMore, q, page, sort, filters])

  useEffect(() => {
    setPage(1)
    setAllProducts([])
    doSearch(q, 1, filters, sort)
  }, [q])

  useEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false
      return
    }
    doSearch(q, page, filters, sort)
  }, [page, sort])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
    setAllProducts([])
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
                <button
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    border: '1px solid var(--gray-200)',
                    padding: '0.3rem 0.65rem',
                  }}
                  onClick={() => {
                    setViewMode(v => v === 'pagination' ? 'loadmore' : 'pagination')
                    setAllProducts(products)
                  }}
                  title="Toggle between pagination and Load More"
                >
                  {viewMode === 'pagination' ? '↓ Load More Mode' : '# Page Mode'}
                </button>
              </div>
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : (viewMode === 'loadmore' ? allProducts : products).length > 0 ? (
              <>
                <div className={view === 'grid' ? 'products-grid' : 'products-list'}>
                  {(viewMode === 'loadmore' ? allProducts : products).map(p => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      fullWidth={view === 'list'}
                      showCompare
                      showWishlist
                    />
                  ))}
                </div>

                {viewMode === 'pagination' ? (
                  <Pagination pagination={pagination} onPageChange={(newPage) => {
                    setPage(newPage)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }} />
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    {pagination?.hasNext ? (
                      <button
                        className="btn btn-secondary"
                        style={{ minWidth: 160, padding: '0.65rem 1.5rem' }}
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <div style={{ width: 14, height: 14, border: '2px solid var(--gray-300)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                            Loading…
                          </span>
                        ) : (
                          `Load More (${pagination.total - allProducts.length} remaining)`
                        )}
                      </button>
                    ) : allProducts.length > 0 ? (
                      <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                        All {allProducts.length} results loaded ✓
                      </p>
                    ) : null}
                  </div>
                )}
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
