import React, { useState } from 'react'
import Logo from './Logo'

export default function AppHeader({
  language,
  onSelectLanguage,
  theme,
  onToggleTheme,
  currentMode, // 'kiosk' | 'doctor'
  onSwitchMode,
  t
}) {
  const [showInfoModal, setShowInfoModal] = useState(false)
  const isDark = theme === 'dark'
  const isDoctor = currentMode === 'doctor'

  return (
    <>
      <header className="app-header" role="banner">
        {/* Left: Brand Identity */}
        <div className="header-left">
          <div className="header-brand-group" onClick={() => !isDoctor && window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size="small" />
            <div className="header-titles">
              <span className="header-brand-name">{t.common.brand}</span>
              <span className="header-brand-sub">{t.common.tagline}</span>
            </div>
          </div>
        </div>

        {/* Center: Stage / Environment Indicator */}
        <div className="header-center">
          <span className={`header-stage-label ${isDoctor ? 'stage-doctor' : 'stage-patient'}`}>
            <span className="stage-indicator-dot" aria-hidden="true"></span>
            {isDoctor ? t.common.stageDoctor : t.common.stagePatient}
          </span>
        </div>

        {/* Right: Clean Utility Controls */}
        <div className="header-right">
          {/* Language Switcher */}
          <div className="header-lang-segmented" role="group" aria-label="Language selector">
            <button
              type="button"
              className={`header-lang-item ${language === 'English' ? 'active' : ''}`}
              onClick={() => onSelectLanguage('English')}
              aria-pressed={language === 'English'}
            >
              English
            </button>
            <span className="header-lang-divider" aria-hidden="true">|</span>
            <button
              type="button"
              className={`header-lang-item ${language === 'Hindi' ? 'active' : ''}`}
              onClick={() => onSelectLanguage('Hindi')}
              aria-pressed={language === 'Hindi'}
            >
              हिंदी
            </button>
          </div>

          {/* Theme Toggle Button with Clean SVG */}
          <button
            type="button"
            className="header-icon-btn"
            onClick={onToggleTheme}
            aria-label={isDark ? t.common.switchToLight : t.common.switchToDark}
            title={isDark ? t.common.switchToLight : t.common.switchToDark}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-svg-icon" aria-hidden="true">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="1" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-svg-icon" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
            <span className="header-btn-text">{isDark ? t.common.lightMode : t.common.darkMode}</span>
          </button>

          {/* Privacy & Info Modal Trigger */}
          <button
            type="button"
            className="header-icon-btn info-btn"
            onClick={() => setShowInfoModal(true)}
            aria-label={t.common.help}
            title={t.common.help}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-svg-icon" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>

          {/* Subtle Secondary Role Switcher (Non-Distracting Demo Utility) */}
          <button
            type="button"
            className="header-subtle-switch"
            onClick={onSwitchMode}
            title={isDoctor ? t.common.switchToKiosk : t.common.switchToPhysician}
            aria-label={isDoctor ? t.common.switchToKiosk : t.common.switchToPhysician}
          >
            <span>{isDoctor ? t.common.switchToKiosk : t.common.switchToPhysician}</span>
          </button>
        </div>
      </header>

      {/* Info / Privacy Modal */}
      {showInfoModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowInfoModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modal-svg-icon" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <h3>{t.consent.privacyModalTitle}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowInfoModal(false)}
                aria-label={t.common.close}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>{t.consent.privacyModalContent}</p>
              <div className="modal-info-box">
                <strong>MediKiosk Core Principles:</strong>
                <ul>
                  <li>Patient-led structured intake before consultation.</li>
                  <li>AI prepares an intake draft only — no autonomous diagnoses.</li>
                  <li>Physician reviews, edits if needed, and accepts the history.</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="primary-button modal-ack-btn"
                onClick={() => setShowInfoModal(false)}
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
