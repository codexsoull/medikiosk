import React, { useState } from 'react'
import ClinicalSection from '../components/ClinicalSection'
import StatusBadge from '../components/StatusBadge'
import { updateCase } from '../api/cases'

// SVG file icon for records panel
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

export default function DoctorCase({
  caseData,
  onUpdateSummary,
  onAcceptCase,
  onBackToDashboard,
  t
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedFields, setEditedFields] = useState({ ...caseData.summary })
  const [doctorNotes, setDoctorNotes] = useState(caseData.doctor_notes || caseData.physicianNotes || '')
  const [editedNotes, setEditedNotes] = useState(caseData.doctor_notes || caseData.physicianNotes || '')
  const [hasPhysicianEdited, setHasPhysicianEdited] = useState(Boolean(caseData.doctor_notes || caseData.physicianNotes))
  const [consultationToast, setConsultationToast] = useState(false)
  const [saveSuccessToast, setSaveSuccessToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const isAccepted =
    caseData.status === 'physician_accepted' ||
    caseData.status === 'accepted' ||
    caseData.case_status === 'accepted'

  const patient = caseData.patient || {}
  const summary = isEditing ? editedFields : (caseData.summary || {})
  const docs = caseData.documents || []
  const alerts = caseData.clinicalAlerts || []
  const hasHighSeverity = alerts.some((a) => a.severity === 'high')

  const handleFieldChange = (fieldKey, value) => {
    setEditedFields((prev) => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  const handleStartEdit = () => {
    setEditedFields({ ...caseData.summary })
    setEditedNotes(doctorNotes)
    setSaveError('')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedFields({ ...caseData.summary })
    setEditedNotes(doctorNotes)
    setSaveError('')
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    setSaveError('')
    const caseId = caseData.case_id || caseData.caseId || caseData.id
    try {
      const response = await updateCase(caseId, {
        doctor_notes: editedNotes
      })
      setDoctorNotes(editedNotes)
      setIsEditing(false)
      setHasPhysicianEdited(true)
      setSaveSuccessToast(true)
      setTimeout(() => setSaveSuccessToast(false), 4000)
      if (onUpdateSummary) {
        onUpdateSummary(editedFields, response?.data)
      }
    } catch (err) {
      console.error('Failed to save doctor notes/summary:', err)
      setSaveError(err.message || t.doctorCase.updateError || 'Unable to update case in database. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAccept = async () => {
    setIsSaving(true)
    setSaveError('')
    const caseId = caseData.case_id || caseData.caseId || caseData.id
    try {
      const response = await updateCase(caseId, {
        case_status: 'accepted',
        doctor_notes: isEditing ? editedNotes : doctorNotes
      })
      if (isEditing) {
        setDoctorNotes(editedNotes)
        setIsEditing(false)
      }
      setSaveSuccessToast(true)
      setTimeout(() => setSaveSuccessToast(false), 4000)
      if (onAcceptCase) {
        onAcceptCase(response?.data)
      }
    } catch (err) {
      console.error('Failed to accept case in database:', err)
      setSaveError(err.message || t.doctorCase.updateError || 'Unable to update case in database. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartConsultation = () => {
    setConsultationToast(true)
    setTimeout(() => {
      setConsultationToast(false)
    }, 4500)
  }

  return (
    <div className="physician-portal-container physician-case-view" role="main">
      {/* Top Clinical Breadcrumb & Nav */}
      <div className="case-view-top-bar">
        <button
          type="button"
          className="back-button case-back-btn"
          onClick={onBackToDashboard}
          aria-label={t.doctorCase.backToDashboardBtn}
        >
          {t.doctorCase.backToDashboardBtn}
        </button>

        <div className="case-id-status-group">
          <span className="case-id-tag">{caseData.caseId || caseData.case_id || 'CASE-2026-0001'}</span>
          {isAccepted ? (
            <StatusBadge
              type="success"
              label={t.doctorCase.readyForConsultationBadge}
            />
          ) : (
            <StatusBadge
              type="warning"
              label={t.doctorDashboard.statusReady}
            />
          )}
          {hasPhysicianEdited && (
            <span className="physician-edited-badge">
              {t.doctorCase.updatedByPhysician}
            </span>
          )}
        </div>
      </div>

      {/* Inline Save Error Banner */}
      {saveError && (
        <div className="submit-error-banner" role="alert" style={{ margin: '8px 0 16px' }}>
          <span>⚠️ {saveError}</span>
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSaveError('')}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI Draft Disclaimer Banner */}
      <div className="ai-draft-alert-banner">
        <div className="draft-badge-row">
          <span className="draft-lead-badge">{t.doctorCase.draftBadge}</span>
          <span className="draft-sub-badge">• {t.doctorCase.draftNotice}</span>
        </div>
        <p className="draft-banner-text">{t.doctorCase.bannerDisclaimer}</p>
      </div>

      {/* Patient Demographics Clinical Header */}
      <div className="clinical-demographics-card">
        <div className="demographics-main-col">
          <div className="patient-name-row">
            <span className="patient-label">{t.doctorCase.patientNameLabel}</span>
            <h2 className="patient-full-name">{patient.name || 'Walk-in Patient'}</h2>
          </div>
          <div className="demographics-pills-row">
            <div className="demographic-item-pill">
              <span className="demographic-key">{t.doctorCase.ageLabel}</span>
              <strong className="demographic-val">{patient.age ? `${patient.age} ${t.doctorCase.years}` : '—'}</strong>
            </div>
            <div className="demographic-item-pill">
              <span className="demographic-key">{t.doctorCase.genderLabel}</span>
              <strong className="demographic-val">{patient.gender ? (t.details.genderOptions[patient.gender] || patient.gender) : '—'}</strong>
            </div>
            <div className="demographic-item-pill">
              <span className="demographic-key">{t.doctorCase.intakeLanguageLabel}</span>
              <strong className="demographic-val">{patient.language || 'English'}</strong>
            </div>
            <div className="demographic-item-pill">
              <span className="demographic-key">{t.doctorCase.caseIdLabel}</span>
              <strong className="demographic-val">{caseData.caseId || caseData.case_id || 'CASE-2026-0001'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Alerts Card — Real Alerts or Fallback */}
      {alerts.length === 0 ? (
        <div className="clinical-alerts-card alerts-card-none">
          <div className="alerts-card-header">
            <strong>{t.doctorCase.clinicalAlerts}</strong>
          </div>
          <p className="alerts-content">{t.doctorCase.noAlerts}</p>
        </div>
      ) : (
        <div className={`clinical-alerts-card ${hasHighSeverity ? 'alerts-card-high' : 'alerts-card-medium'}`}>
          <div className="alerts-card-header">
            <div className="alerts-header-title-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="alerts-header-icon" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <strong>{t.doctorCase.clinicalAlerts}</strong>
              <span className="alerts-count-badge">{alerts.length}</span>
            </div>
          </div>
          <ul className="alerts-items-list" aria-label={t.doctorCase.clinicalAlerts}>
            {alerts.map((alert, idx) => {
              const alertText = patient.language === 'Hindi' && alert.textHindi ? alert.textHindi : alert.text
              const isHigh = alert.severity === 'high'
              return (
                <li key={idx} className={`alert-list-item ${isHigh ? 'alert-item-high' : 'alert-item-medium'}`}>
                  <div className="alert-item-icon-wrapper" aria-hidden="true">
                    <span className={`alert-indicator-dot ${isHigh ? 'dot-high' : 'dot-medium'}`}></span>
                  </div>
                  <div className="alert-item-body">
                    <span className="alert-item-text">{alertText}</span>
                  </div>
                  <span className={`alert-severity-badge ${isHigh ? 'badge-high' : 'badge-medium'}`}>
                    {isHigh ? 'Urgent Review' : 'Priority Attention'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Structured Clinical Sections Grid */}
      <div className="clinical-sections-grid">
        {/* Chief Complaint */}
        <ClinicalSection
          title={t.doctorCase.chiefComplaint}
          value={summary.chiefComplaint}
          fieldKey="chiefComplaint"
          isEditing={isEditing}
          onChange={handleFieldChange}
          placeholder="e.g. Headache and fever for 2 days"
          highlight={true}
          editingTag={t.doctorCase.editSummaryBtn}
        />

        {/* HPI */}
        <ClinicalSection
          title={t.doctorCase.hpi}
          value={summary.historyOfPresentIllness}
          fieldKey="historyOfPresentIllness"
          isEditing={isEditing}
          onChange={handleFieldChange}
          isTextarea={true}
          rows={4}
          placeholder="Onset, timeline, severity, aggravating/relieving factors..."
        />

        {/* Two-Column: PMH & Medications */}
        <div className="clinical-two-col-row">
          <ClinicalSection
            title={t.doctorCase.pmh}
            value={summary.pastMedicalHistory}
            fieldKey="pastMedicalHistory"
            isEditing={isEditing}
            onChange={handleFieldChange}
            isTextarea={true}
            rows={3}
            placeholder="Previous conditions, surgeries, chronic illnesses..."
          />

          <ClinicalSection
            title={t.doctorCase.medications}
            value={summary.medications}
            fieldKey="medications"
            isEditing={isEditing}
            onChange={handleFieldChange}
            isTextarea={true}
            rows={3}
            placeholder="Current dosage, frequency, prescriptions..."
          />
        </div>

        {/* Allergies */}
        <ClinicalSection
          title={t.doctorCase.allergies}
          value={summary.allergies}
          fieldKey="allergies"
          isEditing={isEditing}
          onChange={handleFieldChange}
          placeholder="Known drug or food allergies (NKDA if none)"
        />

        {/* Family & Personal History */}
        <div className="clinical-two-col-row">
          <ClinicalSection
            title={t.doctorCase.familyHistory}
            value={summary.familyHistory}
            fieldKey="familyHistory"
            isEditing={isEditing}
            onChange={handleFieldChange}
            isTextarea={true}
            rows={2}
          />

          <ClinicalSection
            title={t.doctorCase.personalHistory}
            value={summary.personalHistory}
            fieldKey="personalHistory"
            isEditing={isEditing}
            onChange={handleFieldChange}
            isTextarea={true}
            rows={2}
          />
        </div>

        {/* Review of Systems */}
        <ClinicalSection
          title={t.doctorCase.reviewOfSystems}
          value={summary.reviewOfSystems}
          fieldKey="reviewOfSystems"
          isEditing={isEditing}
          onChange={handleFieldChange}
          isTextarea={true}
          rows={2}
        />

        {/* Doctor Notes & Clinical Impression */}
        <ClinicalSection
          title={t.doctorCase.doctorNotes || 'DOCTOR NOTES / CLINICAL IMPRESSION'}
          value={isEditing ? editedNotes : doctorNotes}
          fieldKey="doctorNotes"
          isEditing={isEditing}
          onChange={(key, val) => setEditedNotes(val)}
          isTextarea={true}
          rows={3}
          placeholder={t.doctorCase.doctorNotesPlaceholder || 'Enter clinical impression, recommendations, or consultation notes...'}
          emptyFallback="No physician notes recorded yet. Tap 'Edit Summary' to add clinical notes."
          highlight={Boolean(doctorNotes || editedNotes)}
        />
      </div>

      {/* Previous Medical Records */}
      <div className="physician-records-panel">
        <div className="records-panel-header">
          <div className="records-title-group">
            <FileIcon />
            <h3>{t.doctorCase.previousRecords}</h3>
            <span className="records-badge-count">{t.doctorCase.recordsCount(docs.length)}</span>
          </div>
          <span className="view-only-tag">{t.doctorCase.viewOnlyBadge}</span>
        </div>

        {docs.length === 0 ? (
          <p className="no-records-msg">{t.doctorCase.noPreviousRecords}</p>
        ) : (
          <div className="physician-docs-grid">
            {docs.map((doc) => (
              <div key={doc.id} className="physician-doc-card">
                <div className="physician-doc-top">
                  <div className="doc-details-col">
                    <strong className="doc-filename">{doc.name}</strong>
                    <span className="doc-meta-sub">{doc.type} • {doc.size} • {doc.uploadDate}</span>
                  </div>
                </div>
                <div className="ocr-status-box">
                  <span className="ocr-status-label">{t.doctorCase.ocrStatusLabel}</span>
                  <span className="ocr-status-value">{t.doctorCase.ocrStatusValue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Physician Accepted Banner */}
      {isAccepted && (
        <div className="summary-accepted-confirmation" role="status">
          <div className="accepted-check-circle">✓</div>
          <div className="accepted-text-col">
            <strong>{t.doctorCase.acceptedAlertTitle}</strong>
            <p>{t.doctorCase.acceptedAlertText}</p>
          </div>
        </div>
      )}

      {/* Toast feedback for Consultation Placeholder */}
      {consultationToast && (
        <div className="consultation-toast" role="alert">
          <span>{t.doctorCase.consultationPlaceholderToast}</span>
        </div>
      )}

      {/* Toast feedback for Case Updated in DB */}
      {saveSuccessToast && (
        <div className="consultation-toast success-toast" role="status">
          <span>✓ {t.doctorCase.updateSuccess || 'Case updated successfully in database.'}</span>
        </div>
      )}

      {/* Physician Action Bar */}
      <div className="physician-bottom-action-bar">
        {isEditing ? (
          <div className="editing-actions-row">
            <button
              type="button"
              className="secondary-button cancel-edit-btn"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              {t.doctorCase.cancelEditingBtn}
            </button>
            <button
              type="button"
              className="primary-button save-edit-btn"
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              <span>{isSaving ? (t.doctorCase.saving || 'Saving...') : t.doctorCase.saveChangesBtn}</span>
              <span className="arrow-icon" aria-hidden="true">{isSaving ? '⏳' : '✓'}</span>
            </button>
          </div>
        ) : (
          <div className="standard-actions-row">
            <button
              type="button"
              className="secondary-button edit-summary-toggle-btn"
              onClick={handleStartEdit}
              disabled={isSaving}
            >
              {t.doctorCase.editSummaryBtn}
            </button>

            {!isAccepted ? (
              <button
                type="button"
                className="primary-button accept-summary-btn"
                onClick={handleAccept}
                disabled={isSaving}
              >
                <span>{isSaving ? (t.doctorCase.saving || 'Saving...') : t.doctorCase.acceptSummaryBtn}</span>
                <span className="arrow-icon" aria-hidden="true">{isSaving ? '⏳' : '✓'}</span>
              </button>
            ) : (
              <button
                type="button"
                className="primary-button start-consultation-btn"
                onClick={handleStartConsultation}
              >
                <span>{t.doctorCase.startConsultationBtn}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
