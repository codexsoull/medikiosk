import React from 'react'

export default function ClinicalSection({
  title,
  value,
  fieldKey,
  isEditing,
  onChange,
  isTextarea = false,
  rows = 3,
  placeholder = '',
  highlight = false,
  editingTag = 'Editing',
  emptyFallback = 'None reported.'
}) {
  return (
    <div className={`clinical-section-card ${highlight ? 'highlighted' : ''}`}>
      <div className="section-header-row">
        <h3 className="section-title-label">{title}</h3>
        {isEditing && <span className="editing-pill">{editingTag}</span>}
      </div>

      {isEditing ? (
        isTextarea ? (
          <textarea
            className="clinical-edit-textarea"
            rows={rows}
            value={value || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={placeholder}
            aria-label={title}
          />
        ) : (
          <input
            type="text"
            className="clinical-edit-input"
            value={value || ''}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={placeholder}
            aria-label={title}
          />
        )
      ) : (
        <div className={`clinical-content-display ${highlight ? 'content-highlight' : ''}`}>
          {value ? (
            <p className="clinical-text-paragraph">{value}</p>
          ) : (
            <p className="clinical-empty-paragraph">{emptyFallback}</p>
          )}
        </div>
      )}
    </div>
  )
}

