import React, { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'
import ReadAloud from '../components/ReadAloud'

// Visual guidance ID icon
const IdCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <circle cx="7" cy="15" r="1.5" />
    <line x1="12" y1="15" x2="18" y2="15" />
  </svg>
)

export default function IdentityVerification({
  caseData,
  onUpdateCase,
  onContinueToOtp,
  onBack,
  language = 'English',
  t
}) {
  const [selectedMethod, setSelectedMethod] = useState(caseData.authentication?.method || 'mock-aadhaar')
  const [maskedAadhaar, setMaskedAadhaar] = useState('XXXX XXXX 1234')

  const handleMethodSelect = (methodKey) => {
    setSelectedMethod(methodKey)
    onUpdateCase((prev) => ({
      ...prev,
      authentication: {
        ...prev.authentication,
        method: methodKey
      }
    }))
  }

  const handleKeypadInput = (digit) => {
    setMaskedAadhaar((prev) => {
      const current = prev === 'XXXX XXXX 1234' ? '' : prev
      if (current.length >= 14) return current
      const digitsOnly = current.replace(/\s+/g, '')
      if (/^\d*$/.test(digitsOnly) && digitsOnly.length < 12) {
        const nextDigits = digitsOnly + digit
        return nextDigits.replace(/(\d{4})(?=\d)/g, '$1 ')
      }
      return current + digit
    })
  }

  const handleKeypadBackspace = () => {
    setMaskedAadhaar((prev) => {
      if (!prev || prev === 'XXXX XXXX 1234') return ''
      const trimmed = prev.trimEnd()
      return trimmed.slice(0, -1)
    })
  }

  const handleKeypadClear = () => {
    setMaskedAadhaar('')
  }

  const handleSendOtp = (e) => {
    e.preventDefault()
    onUpdateCase((prev) => ({
      ...prev,
      authentication: {
        ...prev.authentication,
        method: selectedMethod,
        aadhaarMasked: maskedAadhaar
      }
    }))
    onContinueToOtp()
  }

  const speechText = `${t.identity.title}. ${t.identity.subtitle}. ${t.identity.methodLabel}`

  return (
    <div className="kiosk-container identity-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button touch-target"
          onClick={onBack}
          aria-label={t.common.back}
        >
          {t.common.back}
        </button>

        <StatusBadge type="demo" label={t.identity.demoBadge} />
      </div>

      <ProgressBar currentStep={2} totalSteps={6} t={t} />

      <div className="page-header identity-page-header">
        <div className="screen-title-group">
          <div className="screen-title-icon-badge" aria-hidden="true">
            <IdCardIcon />
          </div>
          <div className="screen-title-text-wrap">
            <h1 className="screen-title">{t.identity.title}</h1>
            <p className="screen-subtitle">{t.identity.subtitle}</p>
          </div>
          <div className="header-audio-action">
            <ReadAloud
              text={speechText}
              language={language}
              t={t}
              variant="compact"
            />
          </div>
        </div>
      </div>

      <div className="demo-notice-box">
        <p>{t.identity.demoSubtext}</p>
      </div>

      <form className="identity-form" onSubmit={handleSendOtp}>
        {/* Method selection */}
        <div className="form-group">
          <label className="input-group-label" id="method-select-label">
            {t.identity.methodLabel}
          </label>
          <div className="auth-method-grid" role="radiogroup" aria-labelledby="method-select-label">
            <button
              type="button"
              role="radio"
              aria-checked={selectedMethod === 'mock-aadhaar'}
              className={`auth-method-card touch-target ${selectedMethod === 'mock-aadhaar' ? 'active-method' : ''}`}
              onClick={() => handleMethodSelect('mock-aadhaar')}
            >
              <strong className="method-title">{t.identity.methods.aadhaar}</strong>
              <span className="method-tag">
                {t.identity.defaultTag || (language === 'Hindi' ? 'प्राथमिक' : 'Default')}
              </span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedMethod === 'mock-mobile'}
              className={`auth-method-card touch-target ${selectedMethod === 'mock-mobile' ? 'active-method' : ''}`}
              onClick={() => handleMethodSelect('mock-mobile')}
            >
              <strong className="method-title">{t.identity.methods.mobile}</strong>
              <span className="method-tag">
                {t.identity.smsTag || (language === 'Hindi' ? 'एसएमएस' : 'SMS')}
              </span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedMethod === 'mock-existing'}
              className={`auth-method-card touch-target ${selectedMethod === 'mock-existing' ? 'active-method' : ''}`}
              onClick={() => handleMethodSelect('mock-existing')}
            >
              <strong className="method-title">{t.identity.methods.existing}</strong>
              <span className="method-tag">
                {t.identity.hospitalIdTag || (language === 'Hindi' ? 'अस्पताल आईडी' : 'Hospital ID')}
              </span>
            </button>
          </div>
        </div>

        {/* Masked Aadhaar / ID Field */}
        <div className="form-group">
          <label htmlFor="aadhaar-input">
            {t.identity.aadhaarInputLabel}
          </label>
          <div className="masked-input-wrapper">
            <input
              id="aadhaar-input"
              type="text"
              className="form-input masked-input touch-target"
              value={maskedAadhaar}
              onChange={(e) => setMaskedAadhaar(e.target.value)}
              placeholder="XXXX XXXX 1234"
              maxLength={14}
            />
          </div>
          <span className="helper-hint-text">
            {language === 'Hindi'
              ? 'डेमो के लिए अनुकृत 12-अंकों का यूआईडी नंबर।'
              : 'Simulated 12-digit UID for demonstration.'}
          </span>
        </div>

        {/* Touchscreen Numeric Keypad */}
        <div className="kiosk-keypad-container" aria-label={t.identity.keypadTitle || 'Touchscreen Numeric Keypad'}>
          <div className="kiosk-keypad-grid" role="group" aria-label="Keypad numbers">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                className="keypad-btn touch-target"
                onClick={() => handleKeypadInput(String(num))}
                aria-label={`Digit ${num}`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="keypad-btn keypad-action-btn keypad-backspace-btn touch-target"
              onClick={handleKeypadBackspace}
              aria-label={t.identity.keypadBackspace || 'Backspace'}
              title={t.identity.keypadBackspace || 'Backspace'}
            >
              ⌫
            </button>
            <button
              type="button"
              className="keypad-btn touch-target"
              onClick={() => handleKeypadInput('0')}
              aria-label="Digit 0"
            >
              0
            </button>
            <button
              type="button"
              className="keypad-btn keypad-action-btn keypad-clear-btn touch-target"
              onClick={handleKeypadClear}
              aria-label={t.identity.keypadClear || 'Clear'}
            >
              {t.identity.keypadClear || 'Clear'}
            </button>
          </div>
        </div>

        <div className="mock-disclaimer-banner">
          <span className="disclaimer-dot"></span>
          <span>{t.identity.mockDisclaimer}</span>
        </div>

        {/* Navigation Action Buttons */}
        <div className="action-buttons-row">
          <button
            type="button"
            className="secondary-button back-nav-btn touch-target"
            onClick={onBack}
          >
            {t.common.back}
          </button>

          <button
            type="submit"
            className="primary-button send-otp-btn touch-target"
          >
            <span>{t.identity.sendOtpBtn}</span>
            <span className="arrow-icon" aria-hidden="true">→</span>
          </button>
        </div>
      </form>

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
