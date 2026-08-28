import React from 'react'
import Logo from '../components/Logo'

export default function Welcome({ language, onSelectLanguage, onStart, t }) {
  return (
    <div className="kiosk-container welcome-card" role="main">
      <div className="welcome-hero-content">
        <Logo size="large" />

        <div className="welcome-brand-header">
          <h1 className="brand-title">{t.welcome.brand}</h1>
          <p className="brand-tagline">{t.welcome.tagline}</p>
        </div>

        <div className="welcome-messaging-block">
          <h2 className="welcome-heading">{t.welcome.heading}</h2>
          <p className="welcome-subheading">{t.welcome.subheading}</p>
        </div>

        {/* Primary Action Button */}
        <div className="welcome-primary-action">
          <button
            type="button"
            className="primary-button start-button touch-target"
            onClick={onStart}
            aria-label={t.welcome.startBtn}
          >
            <span>{t.welcome.startBtn}</span>
            <span className="arrow-icon" aria-hidden="true">→</span>
          </button>
        </div>

        {/* Secondary Language Selection */}
        <div className="language-selector-section">
          <span className="language-section-label" id="lang-select-heading">
            {t.welcome.selectLanguage}
          </span>
          <div
            className="welcome-lang-pills"
            role="radiogroup"
            aria-labelledby="lang-select-heading"
          >
            <button
              type="button"
              role="radio"
              aria-checked={language === 'English'}
              className={`welcome-lang-btn ${language === 'English' ? 'active' : ''}`}
              onClick={() => onSelectLanguage('English')}
            >
              {t.welcome.english}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={language === 'Hindi'}
              className={`welcome-lang-btn ${language === 'Hindi' ? 'active' : ''}`}
              onClick={() => onSelectLanguage('Hindi')}
            >
              {t.welcome.hindi}
            </button>
          </div>
        </div>

        {/* Subtle Text-Only Trust Statement at Bottom */}
        <div className="welcome-trust-statement">
          <span>{t.welcome.trustStatement}</span>
        </div>
      </div>
    </div>
  )
}
