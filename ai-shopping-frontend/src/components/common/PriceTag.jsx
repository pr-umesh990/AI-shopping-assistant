const PriceTag = ({ current, original, currency = 'USD', size = 'md' }) => {
  const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '$'
  const hasDiscount = original && original > current
  const pctOff = hasDiscount ? Math.round(((original - current) / original) * 100) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
      <span className={`price-current${size === 'lg' ? ' price-lg' : ''}`}>
        {symbol}{current?.toLocaleString()}
      </span>
      {hasDiscount && (
        <>
          <span className="price-original">{symbol}{original?.toLocaleString()}</span>
          <span className="price-off">-{pctOff}%</span>
        </>
      )}
    </div>
  )
}

export default PriceTag
