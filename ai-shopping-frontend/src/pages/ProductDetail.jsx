import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, ExternalLink, Tag, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import ProductGallery from '../components/product/ProductGallery.jsx'
import AIReviewCard from '../components/product/AIReviewCard.jsx'
import PriceHistoryChart from '../components/product/PriceHistoryChart.jsx'
import SpecTable from '../components/product/SpecTable.jsx'
import AlternativesRow from '../components/product/AlternativesRow.jsx'
import AIBadge from '../components/common/AIBadge.jsx'
import StarRating from '../components/common/StarRating.jsx'
import ComparisonTray from '../components/search/ComparisonTray.jsx'
import ReviewSection from '../components/product/ReviewSection.jsx'
import ShareButton from '../components/product/ShareButton.jsx'
import RecentlyViewed from '../components/product/RecentlyViewed.jsx'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed.js'
import { getProduct, getPriceHistory, getAiReview, getAlternatives, addToWishlist, trackAffiliateClick } from '../api/axios.js'
import { useAuth } from '../hooks/useAuth.js'
import { useCompare } from '../hooks/useCompare.js'
import { useWishlist } from '../hooks/useWishlist.js'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { add: addCompare } = useCompare()
  const { items: wishlistItems, addToWishlistLocal } = useWishlist()
  const { addItem: addRecentlyViewed } = useRecentlyViewed()
  const [product, setProduct] = useState(null)
  const [history, setHistory] = useState([])
  const [review, setReview] = useState(null)
  const [alternatives, setAlternatives] = useState([])
  const [loading, setLoading] = useState(true)
  const wishlisted = wishlistItems.some(i => (i.productId?._id || i.productId || i._id || i) === id)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getProduct(id),
      getPriceHistory(id).catch(() => ({ data: { data: { history: [] } } })),
      getAiReview(id).catch(() => null),
      getAlternatives(id).catch(() => null),
    ]).then(([pRes, hRes, rRes, aRes]) => {
      const loadedProduct = pRes.data?.data?.product || null
      setProduct(loadedProduct)
      if (loadedProduct) addRecentlyViewed(loadedProduct)
      setHistory(hRes.data?.data?.history || [])
      setReview(rRes?.data?.data?.review || null)
      setAlternatives(aRes?.data?.data?.alternatives || [])
    }).catch(() => {
      toast.error('Failed to load product.')
      navigate('/')
    }).finally(() => setLoading(false))
  }, [id])

  const handleBuy = async (retailer) => {
    if (!product) return
    const link = product.affiliateLinks?.find(l => l.retailer?.toLowerCase().includes(retailer.toLowerCase()))
    if (!link?.url) {
      toast.error(`No ${retailer} link for this product.`)
      return
    }
    try {
      const res = await trackAffiliateClick({ productId: product._id, retailer: link.retailer, url: link.url })
      window.open(res.data?.data?.redirectUrl || link.url, '_blank', 'noopener')
    } catch {
      window.open(link.url, '_blank', 'noopener')
    }
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Login to save products.'); navigate('/login'); return }
    if (wishlisted) return
    try {
      await addToWishlist(product._id)
      addToWishlistLocal({ productId: product._id })
      toast.success('Added to wishlist!')
    } catch (err) {
      if (err.response?.status === 409) {
        addToWishlistLocal({ productId: product._id })
        toast('Already in your wishlist.', { icon:'💙' })
      }
      else toast.error('Could not add to wishlist.')
    }
  }

  if (loading) return <LoadingSpinner fullPage />
  if (!product) return null

  const discount = product.originalPrice && product.originalPrice > product.currentPrice
    ? Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100) : 0

  return (
    <div>
      <div className="container" style={{ padding:'2rem 1rem' }}>
        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--gray-500)', fontSize:'0.875rem', marginBottom:'1.5rem' }}>
          <span style={{ cursor:'pointer', color:'var(--primary)' }} onClick={() => navigate('/')}>Home</span>
          <span>/</span>
          {product.categoryId?.name && (
            <>
              <span style={{ cursor:'pointer', color:'var(--primary)' }} onClick={() => navigate(`/category/${product.categoryId?.slug}`)}>{product.categoryId.name}</span>
              <span>/</span>
            </>
          )}
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:300 }}>{product.name}</span>
        </div>

        {/* Main Layout */}
        <div className="product-detail-layout">
          {/* Gallery */}
          <div>
            <ProductGallery images={product.images} />
          </div>

          {/* Info */}
          <div className="product-detail-right">
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.5rem', flexWrap:'wrap' }}>
              <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--primary)', textTransform:'uppercase' }}>{product.brand}</span>
              {product.badges?.map((b, i) => <AIBadge key={i} label={b} variant={i===0?'primary':'success'} />)}
            </div>

            <h1 style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--gray-900)', lineHeight:1.3, marginBottom:'0.85rem' }}>
              {product.name}
            </h1>

            {product.rating > 0 && (
              <div style={{ marginBottom:'0.85rem' }}>
                <StarRating rating={product.rating} count={product.reviewCount} size={16} />
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom:'1.25rem', padding:'1rem', background:'var(--gray-50)', borderRadius:'var(--radius-lg)', border:'1px solid var(--gray-200)' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:'0.75rem', flexWrap:'wrap' }}>
                <span style={{ fontSize:'2rem', fontWeight:900, color:'var(--gray-900)' }}>
                  ${product.currentPrice?.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice !== product.currentPrice && (
                  <span style={{ fontSize:'1.1rem', textDecoration:'line-through', color:'var(--gray-400)' }}>
                    ${product.originalPrice?.toLocaleString()}
                  </span>
                )}
                {discount > 0 && (
                  <span style={{ background:'var(--success-light)', color:'#065f46', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:700 }}>
                    -{discount}% OFF
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p style={{ color:'var(--success)', fontSize:'0.82rem', fontWeight:600, marginTop:'0.4rem' }}>
                  You save ${(product.originalPrice - product.currentPrice).toFixed(2)}
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ color:'var(--gray-600)', fontSize:'0.9rem', lineHeight:1.7, marginBottom:'1.25rem' }}>
                {product.description}
              </p>
            )}

            {/* Buy Buttons */}
            <div className="buy-buttons">
              <button className="buy-btn-amazon" onClick={() => handleBuy('amazon')}>
                🛒 Buy on Amazon
              </button>
              <button className="buy-btn-flipkart" onClick={() => handleBuy('flipkart')}>
                🛍️ View on Flipkart
              </button>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button
                  className={`wishlist-heart-btn ${wishlisted ? 'saved' : ''}`}
                  style={{ flex:1 }}
                  onClick={handleWishlist}
                >
                  <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
                  {wishlisted ? 'Saved' : 'Save to Wishlist'}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ flex:1, border:'1.5px solid var(--gray-300)', borderRadius:'var(--radius-lg)', justifyContent:'center' }}
                  onClick={() => addCompare(product)}
                >
                  Compare
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <ShareButton product={product} />
              </div>
            </div>

            {/* Tags */}
            {product.useCaseTags?.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'1rem' }}>
                {product.useCaseTags.map((t, i) => (
                  <span key={i} style={{ display:'flex', alignItems:'center', gap:'0.25rem', background:'var(--gray-100)', color:'var(--gray-600)', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.75rem' }}>
                    <Tag size={10} /> {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sections below */}
        <div style={{ display:'flex', flexDirection:'column', gap:'2rem', marginTop:'2.5rem' }}>
          {review && <AIReviewCard review={review} />}

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="card" style={{ padding:'1.5rem' }}>
              <h2 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'1.05rem' }}>Technical Specifications</h2>
              <SpecTable specs={product.specs} />
            </div>
          )}

          <PriceHistoryChart history={history} currentPrice={product.currentPrice} />

          {alternatives.length > 0 && <AlternativesRow alternatives={alternatives} />}

          <ReviewSection
            productId={product._id}
            productRating={product.rating}
            productReviewCount={product.reviewCount}
          />

          <RecentlyViewed excludeId={product._id} />
        </div>
      </div>

      <ComparisonTray />
    </div>
  )
}

export default ProductDetail
