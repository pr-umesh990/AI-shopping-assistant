import { Sparkles } from 'lucide-react'

const AIBadge = ({ label, variant = 'primary' }) => {
  const cls = `ai-badge ai-badge-${variant}`
  return (
    <span className={cls}>
      <Sparkles size={9} />
      {label}
    </span>
  )
}

export default AIBadge
