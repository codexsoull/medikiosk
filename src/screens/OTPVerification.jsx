import React, { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'
import ReadAloud from '../components/ReadAloud'

export default function OTPVerification({
  onUpdateCase,
  onContinueToDetails,
  onBack,
  language = 'English',
  t
}) {
  const [otp, setOtp] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(val)
    if (errorMessage) setErrorMessage('')
  }

  const handleVerify = (e) => {
    e.preventDefault()
    if (!otp) {
      setErrorMessage(t.otp.wrongOtpError)
      return
    }

    if (otp === '123456') {
      onUpdateCase((prev) => ({
        ...prev,
        authentication: {
          ...prev.authentication,
          status: 'authenticated',
          timestamp: new Date().toISOString()
        }
      }))
      onContinueToDetails()
    } else {
      setErrorMessage(t.otp.wrongOtpError)
    }
  }

  const handleQuickFill = () => {
    setOtp('123456')
    setErrorMessage('')
  }

  const handleResend = () => {
    setToastMessage(t.otp.resendToast)
    setOtp('123456')
    setTimeout(() => {
      setToastMessage('')
    }, 3000)
  }

  return (
    <div className="kiosk-container otp-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label={t.otp.backBtn}
        >
          {t.otp.backBtn}
        </button>

        <StatusBadge type="demo" label={t.otp.demoBadge} />
      </div>

      <ProgressBar currentStep={2} totalSteps={6} t={t} />

      <div className="page-header">
        <h1 className="screen-title">{t.otp.title}</h1>
        <p className="screen-subtitle">{t.otp.subtitle}</p>
      </div>

      <div className="otp-content-box">
        <p className="otp-lead-text">{t.otp.codeSentText}</p>

        {/* Demo Helper Banner */}
        <div className="demo-otp-banner" onClick={handleQuickFill} role="button" tabIndex={0} title="Tap to autofill demo code">
          <strong className="demo-otp-code">{t.otp.demoOtpBanner}</strong>
          <span className="demo-click-hint">(Tap to fill)</span>
        </div>

        <form className="otp-form" onSubmit={handleVerify}>
          <div className="form-group">
            <label htmlFor="otp-input" className="otp-input-label">
              {t.otp.inputLabel}
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              className={`form-input otp-large-input ${errorMessage ? 'input-error' : ''}`}
              placeholder="••••••"
              value={otp}
              onChange={handleOtpChange}
              autoFocus
            />

            {errorMessage && (
              <p className="field-error-message" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="otp-resend-row">
            <button
              type="button"
              className="link-button resend-btn"
              onClick={handleResend}
            >
              {t.otp.resendOtp}
            </button>
          </div>

          {toastMessage && (
            <div className="quick-feedback-toast" role="status">
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="action-buttons-row">
            <button
              type="button"
              className="secondary-button back-nav-btn"
              onClick={onBack}
            >
              {t.otp.backBtn}
            </button>

            <button
              type="submit"
              className="primary-button verify-otp-btn touch-target"
              disabled={otp.length !== 6}
            >
              <span>{t.otp.verifyBtn}</span>
              <span className="arrow-icon" aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>

      {/* Persistent Floating Read Aloud Button */}
      <ReadAloud
        text={`${t.otp.title}. ${t.otp.subtitle}. ${t.otp.codeSentText}`}
        language={language}
        t={t}
        floating={true}
        variant="floating"
      />
    </div>
  )
}
