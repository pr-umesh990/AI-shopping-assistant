const SpecTable = ({ specs = {} }) => {
  if (!specs || Object.keys(specs).length === 0) {
    return (
      <div style={{ color:'var(--gray-500)', fontSize:'0.875rem', padding:'1rem 0' }}>
        No specifications available.
      </div>
    )
  }

  const flattenSpecs = (obj, prefix = '') => {
    const rows = []
    for (const [key, val] of Object.entries(obj)) {
      const label = prefix ? `${prefix} › ${key}` : key
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        rows.push(...flattenSpecs(val, label))
      } else {
        const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '—')
        rows.push({ label: label.replace(/_/g, ' '), value: displayVal })
      }
    }
    return rows
  }

  const rows = flattenSpecs(specs)

  return (
    <div style={{ overflowX:'auto' }}>
      <table className="spec-table">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ textTransform:'capitalize' }}>{row.label}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SpecTable
