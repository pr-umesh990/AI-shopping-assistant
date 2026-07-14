import { useState, useEffect, useCallback } from 'react'
import { Star, ThumbsUp, Pencil, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import StarRating from '../common/StarRating.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { getProductReviews, createReview, updateReview, deleteReview, markReviewHelpful, getMyReview} from '../../api/axios.js'
import { useAuth } from '../../hooks/useAuth.js'

// Star Picker
const StarPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '0.25rem' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}
        key={n}
        type="button"
        onClick={() => onChange(n)}       
      >
        <Star
          size={24}
          fill={n <= value ? '#f59e0b' : 'none'}
          style={{ color: n <= value ? '#f59e0b' : 'var(--gray-300)', transition: 'color 0.1s' }}
        />
      </button>
    ))}
  </div>
)

// Rating Distribution Bar 
const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
      <span style={{ width: 40, color: 'var(--gray-600)', textAlign: 'right' }}>{star} ★</span>
      <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 999, transition: 'width 0.3s' }} />
      </div>
      <span style={{ width: 28, color: 'var(--gray-500)' }}>{count}</span>
    </div>
  )
}

//Review Form
const ReviewForm = ({ productId, existing, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(existing?.rating || 0)
  const [title, setTitle] = useState(existing?.title || '')
  const [body, setBody] = useState(existing?.body || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a star rating.'); return }
    if (body.trim().length < 10) { toast.error('Review must be at least 10 characters.'); return }
    setLoading(true)
    try {
      if (existing) {
        await updateReview(productId, { rating, title, body })
        toast.success('Review updated!')
      } else {
        await createReview(productId, { rating, title, body })
        toast.success('Review submitted!')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label className="form-label">Your Rating *</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div className="form-group">
        <label className="form-label">Title (optional)</label>
        <input
          className="form-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          maxLength={100}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Review *</label>
        <textarea
          className="form-input"
          rows={4}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share what you liked or disliked (min 10 characters)"
          maxLength={1000}
          style={{ resize: 'vertical' }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
          {body.length}/1000
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : existing ? 'Update Review' : 'Submit Review'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// Single Review Card 
const ReviewCard = ({ review, onHelpful, currentUserId }) => {
  const isOwn = review.userId?._id === currentUserId || review.userId === currentUserId
  const date = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
          }}>
            {review.userId?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>
              {review.userId?.name || 'Anonymous'}
              {isOwn && (
                <span style={{ marginLeft: '0.4rem', background: 'var(--primary-50)', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>
                  You
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{date}</div>
          </div>
        </div>
        <StarRating rating={review.rating} size={13} />
      </div>

      {review.title && (
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-800)', marginTop: '0.6rem' }}>
          {review.title}
        </div>
      )}
      {review.body && (
        <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', lineHeight: 1.65, marginTop: '0.4rem' }}>
          {review.body}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
        {!isOwn && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78rem', color: 'var(--gray-500)', padding: '0.25rem 0.6rem' }}
            onClick={() => onHelpful(review._id)}
          >
            <ThumbsUp size={12} /> Helpful ({review.helpfulCount || 0})
          </button>
        )}
      </div>
    </div>
  )
}

// Main ReviewSection Component
const ReviewSection = ({ productId, productRating, productReviewCount }) => {
  const { isAuthenticated, user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState(null)
  const [ratingDist, setRatingDist] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
  const [loading, setLoading] = useState(true)
  const [myReview, setMyReview] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProductReviews(productId, { page, sort, limit: 5 })
      const data = res.data?.data
      setReviews(data?.reviews || [])
      setPagination(data?.pagination || null)
      setRatingDist(data?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
    } catch {
      toast.error('Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }, [productId, page, sort])

  const fetchMyReview = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await getMyReview(productId)
      setMyReview(res.data?.data?.review || null)
    } catch { /* silent */ }
  }, [productId, isAuthenticated])

  useEffect(() => { fetchReviews() }, [fetchReviews])
  useEffect(() => { fetchMyReview() }, [fetchMyReview])

  const handleReviewSuccess = () => {
    setShowForm(false)
    setEditing(false)
    fetchReviews()
    fetchMyReview()
  }

  const handleDeleteReview = async () => {
    if (!window.confirm('Delete your review?')) return
    try {
      await deleteReview(productId)
      toast.success('Review deleted.')
      setMyReview(null)
      fetchReviews()
    } catch {
      toast.error('Could not delete review.')
    }
  }

  const handleHelpful = async (reviewId) => {
    try {
      await markReviewHelpful(reviewId)
      setReviews(prev => prev.map(r =>
        r._id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
      ))
    } catch { /* silent */ }
  }

  const totalReviews = Object.values(ratingDist).reduce((a, b) => a + b, 0)

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
        Customer Reviews
        {productReviewCount > 0 && (
          <span style={{ fontWeight: 400, fontSize: '0.875rem', color: 'var(--gray-500)', marginLeft: '0.5rem' }}>
            ({productReviewCount} review{productReviewCount !== 1 ? 's' : ''})
          </span>
        )}
      </h2>

      {/* Rating Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.75rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gray-900)', lineHeight: 1 }}>
            {productRating > 0 ? productRating.toFixed(1) : '—'}
          </div>
          <StarRating rating={productRating} size={16} />
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.4rem' }}>
            {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[5, 4, 3, 2, 1].map(star => (
            <RatingBar key={star} star={star} count={ratingDist[star] || 0} total={totalReviews} />
          ))}
        </div>
      </div>

      {/* My Review Banner */}
      {isAuthenticated && myReview && !editing && (
        <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-100)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                Your Review
              </div>
              <StarRating rating={myReview.rating} size={13} />
              {myReview.title && <div style={{ fontWeight: 600, marginTop: '0.3rem', fontSize: '0.875rem' }}>{myReview.title}</div>}
              {myReview.body && <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{myReview.body}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                <Pencil size={13} /> Edit
              </button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={handleDeleteReview}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {isAuthenticated && (editing || (!myReview && showForm)) && (
        <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--gray-200)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
            {editing ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <ReviewForm
            productId={productId}
            existing={editing ? myReview : null}
            onSuccess={handleReviewSuccess}
            onCancel={() => { setShowForm(false); setEditing(false) }}
          />
        </div>
      )}

      {/* Write Review CTA */}
      {isAuthenticated && !myReview && !showForm && (
        <button
          className="btn btn-secondary"
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} /> Write a Review
        </button>
      )}
      {!isAuthenticated && (
        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</a> to write a review.
        </p>
      )}

      {/* Sort Controls */}
      {totalReviews > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Sort by:</span>
          {[['newest', 'Newest'], ['helpful', 'Most Helpful'], ['highest', 'Highest Rated'], ['lowest', 'Lowest Rated']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setSort(val); setPage(1) }}
              style={{
                fontSize: '0.8rem', padding: '0.25rem 0.65rem', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: sort === val ? 'var(--primary)' : 'var(--gray-100)',
                color: sort === val ? 'white' : 'var(--gray-600)',
                fontWeight: sort === val ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <LoadingSpinner />
      ) : reviews.length > 0 ? (
        <>
          {reviews.map(r => (
            <ReviewCard
              key={r._id}
              review={r}
              onHelpful={handleHelpful}
              currentUserId={user?.id}
            />
          ))}
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>
                Previous
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', padding: '0.35rem 0.5rem' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Be the first to share your experience with this product."
        />
      )}
    </div>
  )
}

export default ReviewSection
