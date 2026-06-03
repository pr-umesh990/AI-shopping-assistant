const LoadingSpinner = ({ size = 'md', fullPage = false }) => {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 48 : 32
  const bw = size === 'sm' ? 2 : size === 'lg' ? 4 : 3

  const spinner = (
    <div style={{
      width: dim, height: dim,
      border: `${bw}px solid var(--gray-200)`,
      borderTop: `${bw}px solid var(--primary)`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )

  if (fullPage) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
        {spinner}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {spinner}
    </div>
  )
}

export default LoadingSpinner
