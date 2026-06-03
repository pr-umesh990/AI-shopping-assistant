import { useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { getSearchSuggestions } from '../../api/axios.js'

const SearchBar = ({ large = false, onSearch }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return }
    try {
      const res = await getSearchSuggestions(q)
      setSuggestions(res.data?.data?.suggestions || [])
    } catch { setSuggestions([]) }
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setShowSuggestions(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const handleSubmit = (q) => {
    const term = q || query
    if (!term.trim()) return
    setShowSuggestions(false)
    setSuggestions([])
    if (onSearch) onSearch(term.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={`search-bar${large ? ' large' : ''}`} ref={containerRef} style={{ width: '100%' }}>
      <input
        ref={inputRef}
        className="search-input"
        type="text"
        placeholder={large ? 'Search laptops, TVs, furniture and more…' : 'Search products…'}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        autoComplete="off"
      />
      <button className="search-btn" onClick={() => handleSubmit()}>
        <Search size={15} />
        {large && 'Search'}
      </button>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="suggestion-item"
              onMouseDown={() => { setQuery(s.text); handleSubmit(s.text) }}
            >
              <Search size={13} style={{ color: 'var(--gray-400)' }} />
              {s.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
