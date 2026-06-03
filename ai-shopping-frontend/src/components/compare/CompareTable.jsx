import { useNavigate } from 'react-router-dom'
import { Sparkles, Award } from 'lucide-react'
import PriceTag from '../common/PriceTag.jsx'
import { trackAffiliateClick } from '../../api/axios.js'
import toast from 'react-hot-toast'

const PLACEHOLDER = 'https://placehold.co/80x80/eef2ff/6366f1?text=?'

const CompareTable = ({ products = [], specRows = [] }) => {
  const navigate = useNavigate()

  const handleBuy = async (product, retailer) => {
    try {
      const link = product.affiliateLinks?.find(l => l.retailer?.toLowerCase().includes(retailer.toLowerCase()))
      if (!link?.url) {
        toast.error(`No ${retailer} link for this product.`)
        return
      }
      const res = await trackAffiliateClick({ productId: product._id, retailer: link.retailer })
      window.open(res.data?.data?.redirectUrl || link.url, '_blank', 'noopener')
    } catch {
      const link = product.affiliateLinks?.find(l => l.retailer?.toLowerCase().includes(retailer.toLowerCase()))
      if (link?.url) window.open(link.url, '_blank', 'noopener')
    }
  }

  return (
    <div className="compare-wrapper">
      <table className="compare-table">
        <thead>
          <tr>
            <th style={{ textAlign:'left', background:'var(--gray-50)' }}></th>
            {products.map(p => (
              <th key={p._id} style={{ minWidth:200 }}>
                <img
                  src={p.images?.[0] || PLACEHOLDER}
                  alt={p.name}
                  className="compare-product-img"
                  onError={e => { e.target.src = PLACEHOLDER }}
                />
                <div className="compare-product-name">{p.name}</div>
                <div className="compare-product-price">${p.currentPrice}</div>
                {p.winnerFields?.length > 0 && (
                  <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap', justifyContent:'center', marginTop:'0.4rem' }}>
                    {p.winnerFields.slice(0,2).map(f => (
                      <span key={f} className="badge badge-primary" style={{ fontSize:'0.68rem' }}>
                        <Award size={9} /> {f}
                      </span>
                    ))}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specRows.map((row, ri) => (
            <tr key={ri}>
              <td>{row.label}</td>
              {row.values?.map((v, vi) => (
                <td key={vi} className={v.isWinner ? 'compare-winner' : ''}>
                  {v.isWinner && <Sparkles size={11} style={{ marginRight:4, verticalAlign:'middle' }} />}
                  {String(v.value)}
                </td>
              ))}
            </tr>
          ))}

          {/* Buy buttons row */}
          <tr>
            <td style={{ fontWeight:700 }}>Buy Now</td>
            {products.map(p => (
              <td key={p._id}>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  <button className="buy-btn-amazon" style={{ padding:'0.55rem 0.75rem', fontSize:'0.8rem', borderRadius:'var(--radius)' }} onClick={() => handleBuy(p, 'Amazon')}>🛒 Amazon</button>
                  <button className="buy-btn-flipkart" style={{ padding:'0.55rem 0.75rem', fontSize:'0.8rem', borderRadius:'var(--radius)' }} onClick={() => handleBuy(p, 'Flipkart')}>🛍️ Flipkart</button>
                </div>
              </td>
            ))}
          </tr>

          {/* View Detail row */}
          <tr>
            <td></td>
            {products.map(p => (
              <td key={p._id}>
                <button className="btn btn-secondary btn-sm" style={{ width:'100%' }} onClick={() => navigate(`/product/${p._id}`)}>
                  View Details
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default CompareTable
