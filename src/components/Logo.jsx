import React from 'react'

export default function Logo({ size = 'medium', showText = false }) {
  const isSmall = size === 'small'
  const isLarge = size === 'large'

  let sizeClass = 'logo-medium'
  if (isSmall) sizeClass = 'logo-small'
  if (isLarge) sizeClass = 'logo-large'

  return (
    <div className={`medikiosk-logo-wrap ${sizeClass}`} aria-label="MediKiosk Medical Cross Logo" role="img">
      <div className="logo-circle">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-svg"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      {showText && (
        <div className="logo-text-col">
          <span className="logo-brand-title">MEDIKIOSK</span>
          <span className="logo-brand-subtitle">AI Clinical Intake</span>
        </div>
      )}
    </div>
  )
}
