import React from 'react'
import ReadAloud from '../components/ReadAloud'

export default function IntakeMode({
  intakeMode = 'standard',
  onSelectIntakeMode,
  onContinue,
  onBack,
  language = 'English',
  t
}) {
  const intakeTexts = t.intakeMode || {}
  const speechText = `${intakeTexts.title || 'Choose your intake type'}. ${intakeTexts.subtitle || ''}`

  const handleSelect = (mode) => {
    if (onSelectIntakeMode) {
      onSelectIntakeMode(mode)
    }
    if (onContinue) {
      onContinue()
    }
  }

  return (
    <div className="kiosk-container intake-mode-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button touch-target"
          onClick={onBack}
          aria-label={t.common.back}
        >
          {t.common.back}
        </button>
      </div>

      <div className="page-header">
        <h1 className="screen-title">{intakeTexts.title || 'Choose your intake type'}</h1>
        <p className="screen-subtitle">{intakeTexts.subtitle || 'Select your medical consultation framework'}</p>
      </div>

      <div className="intake-mode-selector" role="radiogroup" aria-label={intakeTexts.title}>
        {/* Standard Clinical Intake Card */}
        <button
          type="button"
          role="radio"
          aria-checked={intakeMode === 'standard'}
          className={`intake-mode-card touch-target ${intakeMode === 'standard' ? 'selected' : ''}`}
          onClick={() => handleSelect('standard')}
        >
          <div className="intake-mode-card-header">
            <span className="intake-mode-title">
              {intakeTexts.standardTitle || 'Standard Clinical Intake'}
            </span>
            <span className="intake-mode-badge standard">
              {intakeTexts.standardBadge || 'General OPD / Modern Medicine'}
            </span>
          </div>
          <p className="intake-mode-desc">
            {intakeTexts.standardSubtitle || 'General patient history and clinical information'}
          </p>
          <div className="intake-mode-action-row">
            <span className="intake-mode-select-text">
              {t.common.continue}
            </span>
            <span className="intake-mode-arrow" aria-hidden="true">→</span>
          </div>
        </button>

        {/* AYUSH Intake Prototype Card */}
        <button
          type="button"
          role="radio"
          aria-checked={intakeMode === 'ayush'}
          className={`intake-mode-card touch-target ${intakeMode === 'ayush' ? 'selected' : ''}`}
          onClick={() => handleSelect('ayush')}
        >
          <div className="intake-mode-card-header">
            <span className="intake-mode-title">
              {intakeTexts.ayushTitle || 'AYUSH Intake — Prototype'}
            </span>
            <span className="intake-mode-badge prototype">
              {intakeTexts.ayushBadge || 'Prototype'}
            </span>
          </div>
          <p className="intake-mode-desc">
            {intakeTexts.ayushSubtitle || 'AYUSH intake framework prototype'}
          </p>
          <div className="ayush-disclaimer-box" role="note">
            <span className="disclaimer-icon" aria-hidden="true">ℹ️</span>
            <span>{intakeTexts.ayushDisclaimer || 'This is an intake framework prototype. It does not diagnose or prescribe treatment.'}</span>
          </div>
          <div className="intake-mode-action-row">
            <span className="intake-mode-select-text">
              {t.common.continue}
            </span>
            <span className="intake-mode-arrow" aria-hidden="true">→</span>
          </div>
        </button>
      </div>

      <div className="action-buttons-row">
        <button
          type="button"
          className="secondary-button back-nav-btn touch-target"
          onClick={onBack}
        >
          {t.common.back}
        </button>
      </div>

      {/* Persistent Floating Read Aloud Button */}
      <ReadAloud
        text={speechText}
        language={language}
        t={t}
        floating={true}
        variant="floating"
      />
    </div>
  )
}

