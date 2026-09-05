import React, { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import ReadAloud from '../components/ReadAloud'

export default function PatientReview({
  caseData,
  onEditSection,
  onSubmit,
  onBack,
  isSubmitting = false,
  errorMessage = '',
  language = 'English',
  t
}) {
  const [reviewConfirmed, setReviewConfirmed] = useState(false)

  const patient = caseData.patient || {}
  const summary = caseData.summary || {}
  const docs = caseData.documents || []

  return (
    <div className="kiosk-container review-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label={t.review.backBtn}
        >
          {t.review.backBtn}
        </button>
      </div>

      <ProgressBar currentStep={6} totalSteps={6} t={t} />

      <div className="page-header">
        <h1 className="screen-title">{t.review.title}</h1>
        <p className="screen-subtitle">{t.review.subtitle}</p>
      </div>

      <div className="review-sections-list">
        {/* Section 1: Personal Details */}
        <div className="review-card-item">
          <div className="review-card-header">
            <h3 className="review-section-heading">{t.review.personalDetails}</h3>
            <button
              type="button"
              className="edit-section-btn touch-target"
              onClick={() => onEditSection('details')}
            >
              {t.review.editBtn}
            </button>
          </div>
          <div className="review-grid-two">
            <div className="review-field">
              <span className="field-name">{t.details.fullName}:</span>
              <strong className="field-val">{patient.name || t.review.notProvided}</strong>
            </div>
            <div className="review-field">
              <span className="field-name">{t.details.age}:</span>
              <strong className="field-val">
                {patient.age ? `${patient.age} ${t.review.years}` : t.review.notProvided}
              </strong>
            </div>
            <div className="review-field">
              <span className="field-name">{t.details.gender}:</span>
              <strong className="field-val">
                {t.details.genderOptions[patient.gender] || patient.gender || t.review.notProvided}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 2: Chief Complaint */}
        <div className="review-card-item">
          <div className="review-card-header">
            <h3 className="review-section-heading">{t.review.chiefComplaint}</h3>
            <button
              type="button"
              className="edit-section-btn touch-target"
              onClick={() => onEditSection('interview')}
            >
              {t.review.editBtn}
            </button>
          </div>
          <div className="review-field-body">
            <p className="highlight-complaint-text">
              {summary.chiefComplaint || t.review.noneReported}
            </p>
          </div>
        </div>

        {/* Section 3: Health History */}
        <div className="review-card-item">
          <div className="review-card-header">
            <h3 className="review-section-heading">{t.review.healthHistory}</h3>
            <button
              type="button"
              className="edit-section-btn touch-target"
              onClick={() => onEditSection('interview')}
            >
              {t.review.editBtn}
            </button>
          </div>
          <div className="review-field-body">
            <p className="review-body-text whitespace-pre-wrap">
              {summary.historyOfPresentIllness || t.review.noneReported}
            </p>
            {summary.pastMedicalHistory && (
              <p className="review-body-subtext">
                <strong>{t.doctorCase.pmh}: </strong>
                {summary.pastMedicalHistory}
              </p>
            )}
          </div>
        </div>

        {/* Section 4: Medications & Allergies */}
        <div className="review-card-item">
          <div className="review-card-header">
            <h3 className="review-section-heading">{t.review.medications} &amp; {t.review.allergies}</h3>
            <button
              type="button"
              className="edit-section-btn touch-target"
              onClick={() => onEditSection('interview')}
            >
              {t.review.editBtn}
            </button>
          </div>
          <div className="review-grid-two">
            <div className="review-field">
              <span className="field-name">{t.review.medications}:</span>
              <strong className="field-val">{summary.medications || t.review.noneReported}</strong>
            </div>
            <div className="review-field">
              <span className="field-name">{t.review.allergies}:</span>
              <strong className="field-val">{summary.allergies || t.review.noneReported}</strong>
            </div>
          </div>
        </div>

        {/* Section 5: Attached Documents */}
        <div className="review-card-item">
          <div className="review-card-header">
            <h3 className="review-section-heading">{t.review.uploadedDocuments} ({docs.length})</h3>
            <button
              type="button"
              className="edit-section-btn touch-target"
              onClick={() => onEditSection('upload')}
            >
              {t.review.editBtn}
            </button>
          </div>
          <div className="review-field-body">
            {docs.length === 0 ? (
              <p className="review-empty-text">{t.review.noDocs}</p>
            ) : (
              <ul className="review-docs-mini-list">
                {docs.map((doc) => (
                  <li key={doc.id} className="review-doc-mini-item">
                    <span>{doc.name}</span>
                    <span className="mini-meta">({doc.size} • {doc.type})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Final Verification Checkbox */}
      <div className="review-confirmation-box">
        <label className="custom-checkbox-label">
          <input
            type="checkbox"
            className="custom-checkbox-input"
            checked={reviewConfirmed}
            onChange={(e) => setReviewConfirmed(e.target.checked)}
          />
          <span className="checkbox-custom-box" aria-hidden="true">
            {reviewConfirmed && '✓'}
          </span>
          <span className="checkbox-text-content">
            <strong>{t.review.confirmCheckbox}</strong>
          </span>
        </label>
      </div>

      {/* Optional Submission Error Banner */}
      {errorMessage && (
        <div className="submit-error-banner" role="alert">
          <span className="error-icon" aria-hidden="true">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Navigation Row */}
      <div className="action-buttons-row">
        <button
          type="button"
          className="secondary-button back-nav-btn"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {t.common.back}
        </button>

        <button
          type="button"
          className={`primary-button submit-intake-btn touch-target ${
            !reviewConfirmed || isSubmitting ? 'disabled-state' : ''
          }`}
          onClick={onSubmit}
          disabled={!reviewConfirmed || isSubmitting}
          aria-disabled={!reviewConfirmed || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="submit-spinner" aria-hidden="true"></span>
              <span>{t.review.submittingBtn || 'Submitting...'}</span>
            </>
          ) : (
            <>
              <span>{t.review.submitBtn}</span>
              <span className="arrow-icon" aria-hidden="true">✓</span>
            </>
          )}
        </button>
      </div>

      {/* Persistent Floating Read Aloud Button */}
      <ReadAloud
        text={`${t.review.title}. ${t.review.subtitle}`}
        language={language}
        t={t}
        floating={true}
        variant="floating"
      />
    </div>
  )
}
