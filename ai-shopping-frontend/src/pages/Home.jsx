import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ShieldCheck, GitCompare, TrendingDown, ArrowRight, ChevronRight } from 'lucide-react'
import SearchBar from '../components/search/SearchBar.jsx'
import ProductCard from '../components/common/ProductCard.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Footer from '../components/layout/Footer.jsx'
import { getCategories, getTrendingProducts } from '../api/axios.js'

const SkeletonCard = () => (
  <div className="skeleton-card" style={{ width:240, flexShrink:0 }}>
    <div className="skeleton" style={{ height:180 }} />
    <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      <div className="skeleton" style={{ height:12, width:'60%' }} />
      <div className="skeleton" style={{ height:16, width:'90%' }} />
      <div className="skeleton" style={{ height:12, width:'40%' }} />
      <div className="skeleton" style={{ height:20, width:'50%' }} />
    </div>
  </div>
)

const Home = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [trending, setTrending] = useState([])
  const [catLoading, setCatLoading] = useState(true)
  const [trendLoading, setTrendLoading] = useState(true)

  useEffect(() => {
    getCategories()
      .then(r => setCategories(r.data?.data?.categories || []))
      .catch(() => {})
      .finally(() => setCatLoading(false))

    getTrendingProducts()
      .then(r => setTrending(r.data?.data?.products || []))
      .catch(() => {})
      .finally(() => setTrendLoading(false))
  }, [])

  const handleSearch = (q) => {
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <div style={{ position:'relative', zIndex:1 }}>
          <div className="hero-badge">
            <Sparkles size={12} /> AI-Powered Shopping Intelligence
          </div>
          <h1 className="hero-title">
            Find Your Perfect Match<br />
            <span>In Seconds</span>
          </h1>
          <p className="hero-subtitle">
            Our AI analyzes thousands of products to give you unbiased recommendations, track price drops, and compare specs — all in one place.
          </p>
          <div className="hero-search">
            <SearchBar large onSearch={handleSearch} />
          </div>
          <div className="hero-chips">
            {categories.slice(0, 6).map(cat => (
              <button key={cat._id} className="hero-chip" onClick={() => handleSearch(cat.name)}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Browse our AI-curated product categories</p>
            </div>
          </div>
          {catLoading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.25rem' }}>
              {[...Array(8)].map((_,i) => (
                <div key={i} className="skeleton" style={{ height:120, borderRadius:'var(--radius-lg)' }} />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="categories-grid">
              {categories.slice(0, 8).map(cat => (
                <div
                  key={cat._id}
                  className="category-card"
                  onClick={() => navigate(`/category/${cat.slug}`)}
                >
                  <div className="category-icon">{cat.icon || '📦'}</div>
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count">{cat.productCount || 0} products</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ShieldCheck} title="No categories yet" description="Check back soon as we add more products." />
          )}
        </div>
      </section>

      {/* ── Trending ── */}
      <section className="section" style={{ background:'var(--gray-50)', paddingTop:'3rem', paddingBottom:'3rem' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">🔥 Trending AI Picks</h2>
              <p className="section-subtitle">Hand-picked by our AI from thousands of reviews</p>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/search?q=trending')}>
              See All <ChevronRight size={15} />
            </button>
          </div>
          {trendLoading ? (
            <div className="scroll-row">
              {[...Array(5)].map((_,i) => <SkeletonCard key={i} />)}
            </div>
          ) : trending.length > 0 ? (
            <div className="scroll-row">
              {trending.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <EmptyState icon={TrendingDown} title="No trending products" description="Our AI is still learning. Check back soon." />
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <h2 className="section-title">Why SmartShop AI?</h2>
            <p className="section-subtitle">The smarter way to discover and buy products online</p>
          </div>
          <div className="features-grid">
            {[
              { icon: ShieldCheck, title: 'Neutral Analysis', desc: 'Our AI has no brand affiliations. Every recommendation is based purely on specs, price, and verified user experiences.' },
              { icon: GitCompare, title: 'Direct Comparison', desc: 'Compare up to 4 products side-by-side with AI-generated winner flags for each spec category.' },
              { icon: TrendingDown, title: 'Price Intelligence', desc: 'Track price histories, set drop alerts, and get notified the moment your dream product goes on sale.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon"><Icon size={26} /></div>
                <h3 className="feature-title">{title}</h3>
                <p className="feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <h2>Ready to Upgrade Your Shopping?</h2>
            <p>Join thousands of smart shoppers who use AI to find the best deals and make confident purchase decisions.</p>
            <div className="cta-actions">
              <button className="btn btn-xl" style={{ background:'white', color:'var(--primary)' }} onClick={() => navigate('/register')}>
                <Sparkles size={18} /> Create Free Account
              </button>
              <button className="btn btn-xl" style={{ border:'2px solid rgba(255,255,255,0.5)', color:'white', background:'transparent' }} onClick={() => navigate('/search?q=best picks')}>
                Learn More <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
