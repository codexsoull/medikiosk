import React from 'react'

export default function ProgressBar({ currentStep = 1, totalSteps = 6, t }) {
  const stepWord = t?.common?.step || 'Step'
  const ofWord = t?.common?.of || 'of'

  const steps = [
    { num: 1, key: 'consent', label: t?.common?.steps ? t.common.steps[1] : 'Consent' },
    { num: 2, key: 'identity', label: t?.common?.steps ? t.common.steps[2] : 'Identity' },
    { num: 3, key: 'details', label: t?.common?.steps ? t.common.steps[3] : 'Details' },
    { num: 4, key: 'history', label: t?.common?.steps ? t.common.steps[4] : 'History' },
    { num: 5, key: 'documents', label: t?.common?.steps ? t.common.steps[5] : 'Documents' },
    { num: 6, key: 'review', label: t?.common?.steps ? t.common.steps[6] : 'Review' }
  ]

  const activeStep = steps.find((s) => s.num === currentStep) || steps[0]

  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`${stepWord} ${currentStep} ${ofWord} ${totalSteps}: ${activeStep.label}`}
    >
      <div className="progress-header">
        <span className="step-badge">
          {stepWord} {currentStep} {ofWord} {totalSteps}
        </span>
        <span className="step-label-text">{activeStep.label}</span>
      </div>

      <div className="progress-track-wrapper">
        <div className="progress-visual-steps">
          {steps.map((step, index) => {
            const isCompleted = step.num < currentStep
            const isActive = step.num === currentStep

            return (
              <React.Fragment key={step.num}>
                <div
                  className={`step-dot ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  title={`${stepWord} ${step.num}: ${step.label}`}
                >
                  <span className="step-num-icon">{isCompleted ? '✓' : step.num}</span>
                  <span className="step-dot-label">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-line ${step.num < currentStep ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
