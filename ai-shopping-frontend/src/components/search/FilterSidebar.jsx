import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

const BRANDS = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Nike', 'IKEA']

const FilterSidebar = ({ filters = {}, onChange }) => {
  const [localFilters, setLocalFilters] = useState({
    brands: filters.brands || [],
    priceMin: filters.priceMin || '',
    priceMax: filters.priceMax || '',
    rating: filters.rating || '',
  })

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
    onChange?.(empty)
  }

  return (
    <div className="filter-sidebar card" style={{ padding: '1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:700, fontSize:'0.9rem' }}>
          <SlidersHorizontal size={16} style={{ color:'var(--primary)' }} />
          Filters
        </div>
        <button
          style={{ fontSize:'0.78rem', color:'var(--gray-500)', display:'flex', alignItems:'center', gap:'0.25rem' }}
          onClick={clear}
        >
          <X size={12} /> Clear All
        </button>
      </div>

      {/* Brands */}
      <div className="filter-section">
        <div className="filter-section-title">Brand</div>
        {BRANDS.map(b => (
          <div key={b} className="filter-option">
            <input
              type="checkbox"
              id={`brand-${b}`}
              checked={localFilters.brands?.includes(b)}
              onChange={() => toggleBrand(b)}
            />
            <label htmlFor={`brand-${b}`}>{b}</label>
          </div>
        ))}
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <div className="filter-section-title">Price Range</div>
        <div className="filter-range">
          <input
            type="number"
            className="form-input"
            placeholder="Min $"
            value={localFilters.priceMin}
            onChange={e => update({ priceMin: e.target.value })}
            style={{ padding:'0.4rem 0.6rem', fontSize:'0.825rem' }}
          />
          <span style={{ color:'var(--gray-400)', flexShrink:0 }}>–</span>
          <input
            type="number"
            className="form-input"
            placeholder="Max $"
            value={localFilters.priceMax}
            onChange={e => update({ priceMax: e.target.value })}
            style={{ padding:'0.4rem 0.6rem', fontSize:'0.825rem' }}
          />
        </div>
      </div>

      {/* Rating */}
      <div className="filter-section">
        <div className="filter-section-title">Min Rating</div>
        <div className="filter-radio">
          {[['4', '⭐ 4+ Stars'], ['3', '⭐ 3+ Stars'], ['2', '⭐ 2+ Stars']].map(([val, label]) => (
            <label key={val}>
              <input
                type="radio"
                name="rating"
                value={val}
                checked={localFilters.rating === val}
                onChange={e => update({ rating: e.target.value })}
              />
              {label}
            </label>
          ))}
          {localFilters.rating && (
            <label style={{ cursor:'pointer', color:'var(--gray-400)', fontSize:'0.78rem' }} onClick={() => update({ rating: '' })}>
              ✕ Clear rating
            </label>
          )}
        </div>
      </div>
    </div>
  )
}

export default FilterSidebar
