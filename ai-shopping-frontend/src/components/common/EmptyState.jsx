const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="empty-state">
    {Icon && (
      <div className="empty-icon">
        <Icon size={36} />
      </div>
    )}
    <h3 className="empty-title">{title}</h3>
    {description && <p className="empty-desc">{description}</p>}
    {actionLabel && onAction && (
      <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
    )}
  </div>
)

export default EmptyState
