import React from 'react'

export default function SubmissionSuccess({
  caseData,
  onGoToDoctorDashboard,
  onStartNewIntake,
  t
}) {
  return (
    <div className="kiosk-container success-card" role="main">
      <div className="success-content-wrapper">
        <div className="success-icon-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="success-check-svg">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 className="success-title">{t.success.title}</h1>
        <p className="success-subtitle">{t.success.subtitle}</p>

        {/* Case Token Summary Card */}
        <div className="case-token-card">
          <div className="token-row">
            <span className="token-label">{t.success.caseIdLabel}</span>
            <strong className="token-value-code">{caseData.caseId || 'CASE-2026-0001'}</strong>
          </div>
          <div className="token-divider"></div>
          <div className="token-row">
            <span className="token-label">{t.success.statusLabel}</span>
            <span className="token-status-pill">
              <span className="status-dot-pulse"></span>
              {t.success.statusValue}
            </span>
          </div>
        </div>

        <p className="success-instruction-notice">{t.success.readyNotice}</p>

        {/* Hackathon Demo Transition Buttons */}
        <div className="success-actions-col">
          <button
            type="button"
            className="primary-button doctor-portal-transition-btn touch-target"
            onClick={onGoToDoctorDashboard}
          >
            <span>{t.success.doctorDashboardBtn}</span>
          </button>

          <button
            type="button"
            className="secondary-button reset-intake-link-btn touch-target"
            onClick={onStartNewIntake}
          >
            {t.success.newIntakeBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

