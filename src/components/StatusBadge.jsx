import React from 'react'

export default function StatusBadge({ type = 'info', label, icon, size = 'medium' }) {
  let badgeClass = 'status-badge-neutral'

  switch (type) {
    case 'demo':
      badgeClass = 'status-badge-demo'
      break
    case 'draft':
      badgeClass = 'status-badge-draft'
      break
    case 'success':
      badgeClass = 'status-badge-success'
      break
    case 'warning':
      badgeClass = 'status-badge-warning'
      break
    case 'danger':
      badgeClass = 'status-badge-danger'
      break
    case 'info':
    default:
      badgeClass = 'status-badge-info'
      break
  }

  return (
    <span className={`status-badge ${badgeClass} ${size === 'small' ? 'badge-small' : ''}`}>
      {icon && <span className="status-badge-icon" aria-hidden="true">{icon}</span>}
      <span className="status-badge-text">{label}</span>
    </span>
  )
}

