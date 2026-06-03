import { useState } from 'react'
import { ImageOff } from 'lucide-react'

const PLACEHOLDER = 'https://placehold.co/400x380/eef2ff/6366f1?text=No+Image'

const ProductGallery = ({ images = [] }) => {
  const [active, setActive] = useState(0)
  const validImages = images.filter(Boolean)
  const currentImg = validImages[active] || PLACEHOLDER

  return (
    <div>
      <div className="gallery-main">
        {validImages.length > 0 ? (
          <img
            src={currentImg}
            alt="Product"
            onError={e => { e.target.src = PLACEHOLDER }}
            style={{ width:'100%', height:'100%', objectFit:'contain' }}
          />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', color:'var(--gray-400)' }}>
            <ImageOff size={40} />
            <span style={{ fontSize:'0.875rem' }}>No image available</span>
          </div>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="gallery-thumbs">
          {validImages.map((img, i) => (
            <div
              key={i}
              className={`gallery-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              <img src={img} alt={`Thumb ${i+1}`} onError={e => { e.target.src = PLACEHOLDER }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductGallery
