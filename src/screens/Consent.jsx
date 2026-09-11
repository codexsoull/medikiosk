import React, { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import ReadAloud from '../components/ReadAloud'

// Visual guidance shield icon
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="30" height="30" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

export default function Consent({ caseData, onUpdateCase, onContinue, onBack, language = 'English', t }) {
  const [consentChecked, setConsentChecked] = useState(Boolean(caseData.consent?.given))
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const consentSpeech = `${t.consent.title}. ${t.consent.subtitle}. ${t.consent.noticeText} ${t.consent.purposeText}`

  const handleCheckboxToggle = (e) => {
    const checked = e.target.checked
    setConsentChecked(checked)
    onUpdateCase((prev) => ({
      ...prev,
      consent: {
        given: checked,
        timestamp: checked ? new Date().toISOString() : null
      }
    }))
  }

  const handleContinue = () => {
    if (!consentChecked) return
    onContinue()
  }

  return (
    <div className="kiosk-container consent-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button touch-target"
          onClick={onBack}
          aria-label={t.consent.backBtn}
        >
          {t.consent.backBtn}
        </button>
      </div>

      <ProgressBar currentStep={1} totalSteps={6} t={t} />

      <div className="page-header consent-page-header">
        <div className="screen-title-group">
          <div className="screen-title-icon-badge" aria-hidden="true">
            <ShieldIcon />
          </div>
          <div className="screen-title-text-wrap">
            <h1 className="screen-title">{t.consent.title}</h1>
            <p className="screen-subtitle">{t.consent.subtitle}</p>
          </div>
          <div className="header-audio-action">
            <ReadAloud
              text={consentSpeech}
              language={language}
              t={t}
              variant="compact"
            />
          </div>
        </div>
      </div>

      <div className="consent-content-box">
        <p className="consent-lead-text">{t.consent.noticeText}</p>

        {/* Structured List of Collected Items */}
        <div className="consent-section-panel">
          <span className="consent-panel-heading">{t.consent.collectTitle}</span>
          <ul className="consent-check-list">
            {t.consent.collectItems.map((item, idx) => (
              <li key={idx} className="consent-check-item">
                <span className="bullet-point" aria-hidden="true">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Explanation of Purpose */}
        <div className="consent-section-panel">
          <span className="consent-panel-heading">{t.consent.purposeTitle}</span>
          <p className="consent-purpose-text">{t.consent.purposeText}</p>
        </div>

        {/* Consent Checkbox */}
        <div className="consent-checkbox-wrap">
          <label className="custom-checkbox-label">
            <input
              type="checkbox"
              id="consent-checkbox"
              className="custom-checkbox-input"
              checked={consentChecked}
              onChange={handleCheckboxToggle}
            />
            <span className="checkbox-custom-box" aria-hidden="true">
              {consentChecked && '✓'}
            </span>
            <span className="checkbox-text-content">
              <strong>{t.consent.consentCheckbox}</strong>
            </span>
          </label>
        </div>

        {/* Privacy modal trigger link */}
        <div className="consent-privacy-link-row">
          <button
            type="button"
            className="privacy-modal-trigger"
            onClick={() => setShowPrivacyModal(true)}
          >
            {t.consent.privacyLink}
          </button>
        </div>
      </div>

      {/* Navigation Action Buttons */}
      <div className="action-buttons-row">
        <button
          type="button"
          className="secondary-button back-nav-btn touch-target"
          onClick={onBack}
        >
          {t.consent.backBtn}
        </button>

        <button
          type="button"
          className={`primary-button continue-btn touch-target ${!consentChecked ? 'disabled-state' : ''}`}
          onClick={handleContinue}
          disabled={!consentChecked}
          aria-disabled={!consentChecked}
        >
          <span>{t.consent.continueBtn}</span>
          <span className="arrow-icon" aria-hidden="true">→</span>
        </button>
      </div>

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowPrivacyModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>{t.consent.privacyModalTitle}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPrivacyModal(false)}
                aria-label={t.common.close}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>{t.consent.privacyModalContent}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-button modal-ack-btn"
                onClick={() => setShowPrivacyModal(false)}
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating Read Aloud Button */}
      <ReadAloud
        text={consentSpeech}
        language={language}
        t={t}
        floating={true}
        variant="floating"
      />
    </div>
  )
}
