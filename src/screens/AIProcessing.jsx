import React, { useState, useEffect } from 'react'

export default function AIProcessing({ onComplete, t }) {
  const [completedSteps, setCompletedSteps] = useState(0)
  const steps = t?.processing?.steps || [
    'Reviewing and standardizing responses',
    'Cross-referencing uploaded documents',
    'Checking for clinical red flags and alerts',
    'Generating structured clinical summary'
  ]

  useEffect(() => {
    const timers = []

    // Step 1 check off at 800ms
    timers.push(
      setTimeout(() => {
        setCompletedSteps(1)
      }, 800)
    )

    // Step 2 check off at 1600ms
    timers.push(
      setTimeout(() => {
        setCompletedSteps(2)
      }, 1600)
    )

    // Step 3 check off at 2400ms
    timers.push(
      setTimeout(() => {
        setCompletedSteps(3)
      }, 2400)
    )

    // Step 4 check off at 3200ms
    timers.push(
      setTimeout(() => {
        setCompletedSteps(4)
      }, 3200)
    )

    // Auto-advance to next screen after brief pause
    timers.push(
      setTimeout(() => {
        if (typeof onComplete === 'function') {
          onComplete()
        }
      }, 3900)
    )

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [onComplete])

  const isAllComplete = completedSteps >= steps.length

  return (
    <div className="kiosk-container processing-card" role="main" aria-live="polite">
      <div className="processing-hero">
        {/* Animated Processing Spinner */}
        <div className="processing-spinner-wrapper" aria-hidden="true">
          <svg className="processing-spinner-svg" viewBox="0 0 50 50">
            <circle
              className="spinner-circle-track"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className="spinner-circle-spin"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
          </svg>
        </div>

        <div className="processing-text-group">
          <span className="processing-badge">AI CLINICAL SYNTHESIS</span>
          <h1 className="screen-title">{t.processing.title}</h1>
          <p className="screen-subtitle">{t.processing.subtitle}</p>
        </div>
      </div>

      {/* 4-Step Synthesis Progress Checklist */}
      <div className="processing-steps-container">
        <ul className="processing-steps-list">
          {steps.map((stepLabel, idx) => {
            const isFinished = completedSteps > idx
            const isCurrent = completedSteps === idx

            return (
              <li
                key={idx}
                className={`processing-step-item ${isFinished ? 'step-finished' : isCurrent ? 'step-current' : 'step-pending'}`}
              >
                <div className="step-icon-wrap" aria-hidden="true">
                  {isFinished ? (
                    <span className="step-check-icon">✓</span>
                  ) : isCurrent ? (
                    <span className="step-pulse-dot"></span>
                  ) : (
                    <span className="step-number-dot">{idx + 1}</span>
                  )}
                </div>
                <div className="step-content">
                  <span className="step-label">{stepLabel}</span>
                  {isCurrent && <span className="step-working-tag">Processing...</span>}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer Note and Fallback Continue Button */}
      <div className="processing-footer">
        <p className="processing-footer-note">{t.processing.footerNote}</p>

        {isAllComplete && (
          <button
            type="button"
            className="primary-button processing-continue-btn touch-target"
            onClick={onComplete}
          >
            <span>{t.processing.continueBtn}</span>
            <span className="arrow-icon" aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  )
}

