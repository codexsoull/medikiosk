import React, { useState } from 'react'
import StatusBadge from '../components/StatusBadge'

// SVG search icon
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export default function DoctorDashboard({
  caseData,
  onOpenCase,
  onStartNewIntake,
  t
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const isAccepted = caseData.status === 'physician_accepted'
  const patient = caseData.patient || {}
  const summary = caseData.summary || {}
  const hasAlerts = Array.isArray(caseData.clinicalAlerts) && caseData.clinicalAlerts.length > 0

  const caseMatches =
    (caseData.caseId && caseData.caseId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (patient.name && patient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (summary.chiefComplaint && summary.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())) ||
    searchQuery === ''

  return (
    <div className="physician-portal-container" role="main">
      {/* Portal Top Bar */}
      <div className="portal-header-bar">
        <div className="portal-header-left">
          <span className="portal-dept-badge">OPD GENERAL MEDICINE</span>
          <h1 className="portal-title">{t.doctorDashboard.title}</h1>
          <p className="portal-subtitle">{t.doctorDashboard.subtitle}</p>
        </div>

        <div className="portal-header-right">
          <div className="live-sync-indicator">
            <span className="live-dot-pulse"></span>
            <span>{t.doctorDashboard.sharedDataNotice}</span>
          </div>

          <button
            type="button"
            className="secondary-button new-patient-btn touch-target"
            onClick={onStartNewIntake}
            title="Simulate new patient intake on Kiosk"
          >
            + New Kiosk Intake
          </button>
        </div>
      </div>

      {/* Queue Toolbar */}
      <div className="portal-toolbar">
        <div className="queue-title-group">
          <h2>{t.doctorDashboard.todayCases}</h2>
          <span className="queue-count-pill">{t.doctorDashboard.casesCount(caseMatches ? 1 : 0)}</span>
        </div>

        <div className="queue-search-box">
          <span className="search-icon" aria-hidden="true"><SearchIcon /></span>
          <input
            type="text"
            className="portal-search-input"
            placeholder={t.doctorDashboard.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t.doctorDashboard.searchPlaceholder}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Case Queue Table */}
      <div className="portal-table-wrapper">
        <table className="portal-cases-table" aria-label={t.doctorDashboard.todayCases}>
          <thead>
            <tr>
              <th scope="col">{t.doctorDashboard.caseIdHeader}</th>
              <th scope="col">{t.doctorDashboard.patientHeader}</th>
              <th scope="col">{t.doctorDashboard.demographicsHeader}</th>
              <th scope="col">{t.doctorDashboard.complaintHeader}</th>
              <th scope="col">{t.doctorDashboard.statusHeader}</th>
              <th scope="col" className="text-right">{t.doctorDashboard.actionHeader}</th>
            </tr>
          </thead>
          <tbody>
            {caseMatches ? (
              <tr className="case-table-row">
                <td className="cell-case-id">
                  <strong>{caseData.caseId || 'CASE-2026-0001'}</strong>
                  <span className="cell-sub-info">
                    {caseData.intakeTimestamp
                      ? new Date(caseData.intakeTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Just now'}
                  </span>
                </td>
                <td className="cell-patient">
                  <div className="patient-avatar-cell">
                    <span className="avatar-initial">
                      {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                    </span>
                    <div>
                      <strong className="patient-cell-name">{patient.name || 'Walk-in Patient'}</strong>
                      <span className="patient-lang-tag">
                        {patient.language ? `Intake: ${patient.language}` : 'English'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="cell-demographics">
                  <span>
                    {patient.age ? `${patient.age} yrs` : '—'} /{' '}
                    {patient.gender ? (t.details.genderOptions[patient.gender] || patient.gender) : '—'}
                  </span>
                </td>
                <td className="cell-complaint">
                  <span className="complaint-highlight-pill">
                    {summary.chiefComplaint || 'Pending interview'}
                  </span>
                  {caseData.documents && caseData.documents.length > 0 && (
                    <span className="doc-count-micro" title={`${caseData.documents.length} records attached`}>
                      {caseData.documents.length} doc{caseData.documents.length === 1 ? '' : 's'}
                    </span>
                  )}
                </td>
                <td className="cell-status">
                  <div className="status-badges-group">
                    {hasAlerts && (
                      <StatusBadge
                        type="danger"
                        size="small"
                        label={t.doctorDashboard.flaggedBadge || 'Flagged'}
                      />
                    )}
                    {isAccepted ? (
                      <StatusBadge
                        type="success"
                        label={t.doctorDashboard.statusAccepted}
                      />
                    ) : (
                      <StatusBadge
                        type="warning"
                        label={t.doctorDashboard.statusReady}
                      />
                    )}
                  </div>
                </td>
                <td className="cell-action text-right">
                  <button
                    type="button"
                    className="primary-button view-case-action-btn touch-target"
                    onClick={() => onOpenCase(caseData.caseId)}
                  >
                    <span>{t.doctorDashboard.viewCaseBtn}</span>
                  </button>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="6" className="empty-queue-cell">
                  <p>{t.doctorDashboard.emptyCases}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
