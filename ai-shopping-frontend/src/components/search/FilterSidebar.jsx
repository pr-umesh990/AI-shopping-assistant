import { useState, useEffect, useCallback } from 'react'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { getFilterOptions } from '../../api/axios.js'

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="filter-section">
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, marginBottom: open ? '0.6rem' : 0,
        }}
      >
        <span className="filter-section-title" style={{ marginBottom: 0 }}>{title}</span>
        {open ? <ChevronUp size={14} style={{ color: 'var(--gray-400)' }} /> : <ChevronDown size={14} style={{ color: 'var(--gray-400)' }} />}
      </button>
      {open && children}
    </div>
  )
}

const FilterSidebar = ({ filters = {}, onChange, categorySlug }) => {
  const [brands, setBrands] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [brandSearch, setBrandSearch] = useState('')

  const [localFilters, setLocalFilters] = useState({
    brands: filters.brands || [],
    priceMin: filters.priceMin || '',
    priceMax: filters.priceMax || '',
    rating: filters.rating || '',
  })

  // Active filter count
  const activeCount =
    (localFilters.brands?.length || 0) +
    (localFilters.priceMin ? 1 : 0) +
    (localFilters.priceMax ? 1 : 0) +
    (localFilters.rating ? 1 : 0)

  // Fetch dynamic filter options from backend
  const fetchOptions = useCallback(async () => {
    setOptionsLoading(true)
    try {
      const res = await getFilterOptions(categorySlug ? { category: categorySlug } : {})
      const data = res.data?.data
      setBrands(data?.brands || [])
      setPriceRange(data?.priceRange || { min: 0, max: 10000 })
    } catch {
      // Fall back gracefully — sidebar still functional
    } finally {
      setOptionsLoading(false)
    }
  }, [categorySlug])

  useEffect(() => { fetchOptions() }, [fetchOptions])

  const update = (patch) => {
    const next = { ...localFilters, ...patch }
    setLocalFilters(next)
    onChange?.(next)
  }

  const toggleBrand = (brand) => {
    const current = localFilters.brands || []
    const updated = current.includes(brand)
      ? current.filter(b => b !== brand)
      : [...current, brand]
    update({ brands: updated })
  }

  const clear = () => {
    const empty = { brands: [], priceMin: '', priceMax: '', rating: '' }
    setLocalFilters(empty)
    setBrandSearch('')
    onChange?.(empty)
  }

  const visibleBrands = brandSearch.trim()
    ? brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands

  return (
    <div style={{ padding: '1.25rem' }} className="card">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} />
          Filters
          {activeCount > 0 && (
            <span style={{
              background: 'var(--primary)', color: 'white', fontSize: '0.7rem',
              fontWeight: 700, width: 18, height: 18, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clear}
            style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={12} /> Clear All
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
          {localFilters.brands.map(b => (
            <span key={b} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'var(--primary-50)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem',
              borderRadius: 999, border: '1px solid var(--primary-100)',
            }}>
              {b}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => toggleBrand(b)} />
            </span>
          ))}
          {localFilters.priceMin && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'var(--primary-50)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem',
              borderRadius: 999, border: '1px solid var(--primary-100)',
            }}>
              Min ${localFilters.priceMin}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => update({ priceMin: '' })} />
            </span>
          )}
          {localFilters.priceMax && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'var(--primary-50)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem',
              borderRadius: 999, border: '1px solid var(--primary-100)',
            }}>
              Max ${localFilters.priceMax}
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => update({ priceMax: '' })} />
            </span>
          )}
          {localFilters.rating && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: 'var(--primary-50)', color: 'var(--primary)',
              fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem',
              borderRadius: 999, border: '1px solid var(--primary-100)',
            }}>
              {localFilters.rating}★ & up
              <X size={10} style={{ cursor: 'pointer' }} onClick={() => update({ rating: '' })} />
            </span>
          )}
        </div>
      )}

      {/* Brand Filter */}
      <Section title="Brand">
        {brands.length > 6 && (
          <input
            className="form-input"
            placeholder="Search brands..."
            value={brandSearch}
            onChange={e => setBrandSearch(e.target.value)}
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}
          />
        )}
        {optionsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 16, borderRadius: 4, width: `${60 + i * 8}%` }} />
            ))}
          </div>
        ) : visibleBrands.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 200, overflowY: 'auto' }}>
            {visibleBrands.map(b => (
              <div key={b} className="filter-option">
                <input
                  type="checkbox"
                  id={`brand-${b}`}
                  checked={localFilters.brands?.includes(b)}
                  onChange={() => toggleBrand(b)}
                />
                <label htmlFor={`brand-${b}`} style={{ fontSize: '0.875rem', cursor: 'pointer' }}>{b}</label>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: 0 }}>
            {brandSearch ? 'No brands match.' : 'No brands available.'}
          </p>
        )}
      </Section>

      {/* Price Range */}
      <Section title="Price Range">
        <div style={{ marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: '0.4rem' }}>
            <span>Range: ${priceRange.min} — ${priceRange.max.toLocaleString()}</span>
          </div>
          <div className="filter-range">
            <input
              type="number"
              className="form-input"
              placeholder={`Min $${priceRange.min}`}
              value={localFilters.priceMin}
              onChange={e => update({ priceMin: e.target.value })}
              min={priceRange.min}
              max={priceRange.max}
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
            />
            <span style={{ color: 'var(--gray-400)', flexShrink: 0 }}>–</span>
            <input
              type="number"
              className="form-input"
              placeholder={`Max $${priceRange.max.toLocaleString()}`}
              value={localFilters.priceMax}
              onChange={e => update({ priceMax: e.target.value })}
              min={priceRange.min}
              max={priceRange.max}
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
            />
          </div>
        </div>
      </Section>

      {/* Rating */}
      <Section title="Min Rating">
        <div className="filter-radio" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            ['4', '⭐⭐⭐⭐ 4 Stars & up'],
            ['3', '⭐⭐⭐ 3 Stars & up'],
            ['2', '⭐⭐ 2 Stars & up'],
          ].map(([val, label]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="radio"
                name="filter-rating"
                value={val}
                checked={localFilters.rating === val}
                onChange={e => update({ rating: e.target.value })}
              />
              {label}
            </label>
          ))}
          {localFilters.rating && (
            <button
              onClick={() => update({ rating: '' })}
              style={{ fontSize: '0.78rem', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: '0.25rem' }}
            >
              ✕ Clear rating
            </button>
          )}
        </div>
      </Section>
    </div>
  )
}

export default FilterSidebar
