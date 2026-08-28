import React, { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'

export default function IdentityVerification({
  caseData,
  onUpdateCase,
  onContinueToOtp,
  onBack,
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

  return (
    <div className="kiosk-container identity-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label={t.common.back}
        >
          {t.common.back}
        </button>

        <StatusBadge type="demo" label={t.identity.demoBadge} />
      </div>

      <ProgressBar currentStep={2} totalSteps={6} t={t} />

      <div className="page-header">
        <h1 className="screen-title">{t.identity.title}</h1>
        <p className="screen-subtitle">{t.identity.subtitle}</p>
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
              className={`auth-method-card ${selectedMethod === 'mock-aadhaar' ? 'active-method' : ''}`}
              onClick={() => handleMethodSelect('mock-aadhaar')}
            >
              <strong className="method-title">{t.identity.methods.aadhaar}</strong>
              <span className="method-tag">Default</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedMethod === 'mock-mobile'}
              className={`auth-method-card ${selectedMethod === 'mock-mobile' ? 'active-method' : ''}`}
              onClick={() => handleMethodSelect('mock-mobile')}
            >
              <strong className="method-title">{t.identity.methods.mobile}</strong>
              <span className="method-tag">SMS</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedMethod === 'mock-existing'}
              className={`auth-method-card ${selectedMethod === 'mock-existing' ? 'active-method' : ''}`}
              onClick={() => handleMethodSelect('mock-existing')}
            >
              <strong className="method-title">{t.identity.methods.existing}</strong>
              <span className="method-tag">Hospital ID</span>
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
              className="form-input masked-input"
              value={maskedAadhaar}
              onChange={(e) => setMaskedAadhaar(e.target.value)}
              placeholder="XXXX XXXX 1234"
              maxLength={14}
            />
          </div>
          <span className="helper-hint-text">
            Simulated 12-digit UID for demonstration.
          </span>
        </div>

        <div className="mock-disclaimer-banner">
          <span className="disclaimer-dot"></span>
          <span>{t.identity.mockDisclaimer}</span>
        </div>

        {/* Navigation Action Buttons */}
        <div className="action-buttons-row">
          <button
            type="button"
            className="secondary-button back-nav-btn"
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
    </div>
  )
}
