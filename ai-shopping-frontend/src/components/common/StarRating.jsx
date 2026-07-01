import { Star } from 'lucide-react'

const StarRating = ({ rating = 0, count = 0, size = 14 }) => {
  const filled = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5

  return (
    <div className="star-rating">
      <div className="stars">
        {[1, 2, 3, 4, 5].map(i => {
          const isFilled = i <= filled
          const isHalf = !isFilled && i === filled + 1 && hasHalf
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
              {/* Empty star base */}
              <Star
                size={size}
                style={{ color: 'var(--gray-300)' }}
                fill="none"
              />
              {/* Full or half overlay */}
              {(isFilled || isHalf) && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: isHalf ? '50%' : '100%',
                  overflow: 'hidden',
                  display: 'inline-block',
                }}>
                  <Star
                    size={size}
                    style={{ color: 'var(--accent, #f59e0b)' }}
                    fill="var(--accent, #f59e0b)"
                  />
                </span>
              )}
            </span>
          )
        })}
      </div>
      {(rating > 0 || count > 0) && (
        <span className="rating-text">
          {rating > 0 && <strong>{rating.toFixed(1)}</strong>}
          {count > 0 && ` (${count.toLocaleString()})`}
        </span>
      )}
    </div>
  )
}

export default StarRating
