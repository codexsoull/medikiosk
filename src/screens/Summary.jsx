import React, { useState } from 'react'
import Logo from '../components/Logo'
import ProgressBar from '../components/ProgressBar'
import HeaderControls from '../components/HeaderControls'

export default function Summary({
  patientData,
  summaryData,
  uploadedDocuments = [],
  onUpdateSummary,
  isAccepted,
  onAcceptSummary,
  onStartNewIntake,
  onBack,
  language,
  onSelectLanguage,
  theme,
  onToggleTheme,
  t
}) {
  const [isEditing, setIsEditing] = useState(false)

  const handleFieldChange = (field, value) => {
    onUpdateSummary({
      ...summaryData,
      [field]: value
    })
  }

  return (
    <div className="kiosk-container summary-card">
      {/* Top Navigation */}
      <div className="card-top-nav summary-top-bar">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label={t.summary.backToDocsBtn}
        >
          {t.summary.backToDocsBtn}
        </button>

        <div className="summary-nav-right">
          <button
            type="button"
            className="secondary-button reset-intake-btn"
            onClick={onStartNewIntake}
          >
            {t.summary.newIntakeBtn}
          </button>

          <HeaderControls
            language={language}
            onSelectLanguage={onSelectLanguage}
            theme={theme}
            onToggleTheme={onToggleTheme}
            t={t}
          />
        </div>
      </div>

      <ProgressBar currentStep={4} totalSteps={4} t={t} />

      {/* Header */}
      <div className="summary-page-header">
        <div className="brand-badge-row">
          <Logo size="small" />
          <div>
            <h1 className="screen-title physician-title">{t.common.brand}</h1>
            <span className="physician-subtitle">{t.summary.dashboardTitle}</span>
          </div>
        </div>

        {/* AI & Review Status Notice */}
        <div className="ai-status-banner">
          <div className="banner-badge-group">
            <span className="status-pill green">
              <span className="dot"></span> {t.summary.historyCaptured}
            </span>
            <span className="status-pill green">
              <span className="dot"></span> {t.summary.summaryGenerated}
            </span>
            <span className="status-pill draft">
              {t.summary.draftNotice}
            </span>
          </div>
          <p className="banner-disclaimer">
            {t.summary.bannerDisclaimer}
          </p>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="patient-demographics-card">
        <div className="demographics-header">
          <h2 className="section-title">{t.summary.patientSummary}</h2>
          <span className="intake-time">
            {t.summary.intakeDate} {new Date().toLocaleDateString()}
          </span>
        </div>
        <div className="demographics-grid">
          <div className="demographic-item">
            <span className="demographic-label">{t.summary.fullNameLabel}</span>
            <strong className="demographic-value">{patientData.name || t.summary.notProvided}</strong>
          </div>
          <div className="demographic-item">
            <span className="demographic-label">{t.summary.ageLabel}</span>
            <strong className="demographic-value">
              {patientData.age ? `${patientData.age} ${t.summary.years}` : t.summary.notProvided}
            </strong>
          </div>
          <div className="demographic-item">
            <span className="demographic-label">{t.summary.genderLabel}</span>
            <strong className="demographic-value">
              {t.details.genderOptions[patientData.gender] || patientData.gender || t.summary.notProvided}
            </strong>
          </div>
          <div className="demographic-item">
            <span className="demographic-label">{t.summary.languageLabel}</span>
            <strong className="demographic-value">{patientData.language || 'English'}</strong>
          </div>
        </div>
      </div>

      {/* Clinical Alerts Box */}
      <div className="clinical-alerts-card">
        <div className="alerts-card-header">
          <span className="alert-shield-icon">🛡️</span>
          <strong>{t.summary.clinicalAlerts}</strong>
        </div>
        <p className="alerts-content">
          {t.summary.noAlerts}
        </p>
      </div>

      {/* Structured Clinical Sections */}
      <div className="clinical-sections-container">
        <div className="section-block">
          <div className="section-label-row">
            <h3>{t.summary.chiefComplaint}</h3>
            {isEditing && <span className="editing-tag">{t.summary.editingTag}</span>}
          </div>
          {isEditing ? (
            <input
              type="text"
              className="summary-edit-input"
              value={summaryData.chiefComplaint || ''}
              onChange={(e) => handleFieldChange('chiefComplaint', e.target.value)}
              placeholder="e.g. Headache"
            />
          ) : (
            <p className="clinical-text highlight-complaint">
              {summaryData.chiefComplaint || 'None reported'}
            </p>
          )}
        </div>

        <div className="section-block">
          <div className="section-label-row">
            <h3>{t.summary.hpi}</h3>
            {isEditing && <span className="editing-tag">{t.summary.editingTag}</span>}
          </div>
          {isEditing ? (
            <textarea
              className="summary-edit-textarea"
              rows={4}
              value={summaryData.historyOfPresentIllness || ''}
              onChange={(e) => handleFieldChange('historyOfPresentIllness', e.target.value)}
              placeholder="Detailed description of present symptoms, onset, severity, and timeline"
            />
          ) : (
            <div className="clinical-text whitespace-pre-wrap">
              {summaryData.historyOfPresentIllness || 'No history recorded.'}
            </div>
          )}
        </div>

        <div className="section-grid-two-col">
          <div className="section-block">
            <div className="section-label-row">
              <h3>{t.summary.pmh}</h3>
            </div>
            {isEditing ? (
              <textarea
                className="summary-edit-textarea"
                rows={3}
                value={summaryData.pastMedicalHistory || ''}
                onChange={(e) => handleFieldChange('pastMedicalHistory', e.target.value)}
              />
            ) : (
              <p className="clinical-text">
                {summaryData.pastMedicalHistory || 'No previous medical conditions reported.'}
              </p>
            )}
          </div>

          <div className="section-block">
            <div className="section-label-row">
              <h3>{t.summary.medications}</h3>
            </div>
            {isEditing ? (
              <textarea
                className="summary-edit-textarea"
                rows={3}
                value={summaryData.medications || ''}
                onChange={(e) => handleFieldChange('medications', e.target.value)}
              />
            ) : (
              <p className="clinical-text">
                {summaryData.medications || 'No medications reported.'}
              </p>
            )}
          </div>
        </div>

        <div className="section-block">
          <div className="section-label-row">
            <h3>{t.summary.allergies}</h3>
          </div>
          {isEditing ? (
            <input
              type="text"
              className="summary-edit-input"
              value={summaryData.allergies || ''}
              onChange={(e) => handleFieldChange('allergies', e.target.value)}
            />
          ) : (
            <p className="clinical-text">
              {summaryData.allergies || 'No known allergies reported.'}
            </p>
          )}
        </div>
      </div>

      {/* Previous Medical Records (View-Only for Physician) */}
      <div className="documents-section-card physician-records-card">
        <div className="documents-header">
          <div className="documents-title-group">
            <span className="doc-icon">📑</span>
            <strong>{t.summary.previousRecords}</strong>
            <span className="doc-count-tag">
              {t.summary.recordsCount(uploadedDocuments.length)}
            </span>
          </div>
          <span className="view-only-badge">{t.summary.viewOnlyBadge}</span>
        </div>

        {uploadedDocuments.length === 0 ? (
          <p className="no-docs-text">{t.summary.noPreviousRecords}</p>
        ) : (
          <div className="physician-docs-grid">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className="physician-doc-card">
                <div className="physician-doc-top">
                  <span className="physician-doc-icon">{doc.icon || '📄'}</span>
                  <div className="physician-doc-info">
                    <strong className="physician-doc-name">{doc.name}</strong>
                    <span className="physician-doc-meta">
                      {doc.type} • {doc.size} • Uploaded {doc.uploadDate}
                    </span>
                  </div>
                </div>
                {doc.mockSummary && (
                  <div className="physician-doc-extracted">
                    <span className="extracted-label">{t.summary.extractedPreviewLabel}</span>
                    <p className="extracted-text">{doc.mockSummary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accepted Confirmation State */}
      {isAccepted && (
        <div className="physician-accepted-alert" role="status">
          <span className="accepted-check-icon">✓</span>
          <div>
            <strong>{t.summary.acceptedAlertTitle}</strong>
            <p>{t.summary.acceptedAlertText}</p>
          </div>
        </div>
      )}

      {/* Physician Action Bar */}
      <div className="physician-controls-bar">
        <button
          type="button"
          className={`secondary-button edit-toggle-btn ${isEditing ? 'editing-active' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? t.summary.doneEditingBtn : t.summary.editSummaryBtn}
        </button>

        <button
          type="button"
          className={`primary-button accept-summary-btn ${isAccepted ? 'is-accepted' : ''}`}
          onClick={onAcceptSummary}
          disabled={isAccepted}
        >
          {isAccepted ? t.summary.summaryAcceptedBtn : t.summary.acceptSummaryBtn}
        </button>
      </div>
    </div>
  )
}
