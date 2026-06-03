import { Star } from 'lucide-react'

const StarRating = ({ rating = 0, count = 0, size = 14 }) => {
  const filled = Math.floor(rating)
  const half = rating % 1 >= 0.5

  return (
    <div className="star-rating">
      <div className="stars">
        {[1,2,3,4,5].map(i => (
          <Star
            key={i}
            size={size}
            className={i <= filled ? 'star-filled' : 'star-empty'}
            fill={i <= filled ? 'currentColor' : 'none'}
          />
        ))}
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
