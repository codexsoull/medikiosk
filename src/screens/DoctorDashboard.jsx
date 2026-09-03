import React, { useState, useEffect } from 'react'
import StatusBadge from '../components/StatusBadge'
import { fetchCases } from '../api/cases'

// SVG search icon
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export default function DoctorDashboard({
  onOpenCase,
  onStartNewIntake,
  t
}) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadCases = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchCases()
      setCases(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Failed to load cases from backend:', err)
      setError(
        t.doctorDashboard?.loadError ||
        'Unable to load patient cases. Please check the connection and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  // Filter cases based on search query
  const filteredCases = cases.filter((item) => {
    const caseId = (item.case_id || item.caseId || '').toLowerCase()
    const patientName = (item.patient_name || item.patient?.name || '').toLowerCase()
    const complaint = (
      item.chief_complaint ||
      item.summary?.chiefComplaint ||
      item.ai_summary?.chiefComplaint ||
      ''
    ).toLowerCase()
    const query = searchQuery.toLowerCase().trim()

    return !query || caseId.includes(query) || patientName.includes(query) || complaint.includes(query)
  })

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

          <div className="portal-header-actions-row">
            <button
              type="button"
              className="secondary-button refresh-cases-btn touch-target"
              onClick={loadCases}
              disabled={loading}
              title="Refresh case queue from database"
            >
              🔄 {t.doctorDashboard.retryBtn || 'Refresh'}
            </button>

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
      </div>

      {/* Queue Toolbar */}
      <div className="portal-toolbar">
        <div className="queue-title-group">
          <h2>{t.doctorDashboard.todayCases}</h2>
          <span className="queue-count-pill">
            {t.doctorDashboard.casesCount(filteredCases.length)}
          </span>
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
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-queue-cell">
                  <div className="table-loading-spinner-wrap">
                    <span className="submit-spinner" aria-hidden="true"></span>
                    <span>{t.doctorDashboard.loadingCases || 'Loading patient cases from database...'}</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="empty-queue-cell error-cell">
                  <p className="table-error-text">⚠️ {error}</p>
                  <button
                    type="button"
                    className="secondary-button retry-load-btn touch-target"
                    onClick={loadCases}
                  >
                    🔄 {t.doctorDashboard.retryBtn || 'Retry'}
                  </button>
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-queue-cell">
                  <p>{t.doctorDashboard.emptyCases}</p>
                </td>
              </tr>
            ) : (
              filteredCases.map((item) => {
                const caseId = item.case_id || item.caseId || `CASE-${item.id}`
                const patientName = item.patient_name || item.patient?.name || 'Walk-in Patient'
                const age = item.age !== undefined && item.age !== null ? item.age : item.patient?.age
                const gender = item.gender || item.patient?.gender
                const complaint =
                  item.chief_complaint ||
                  item.summary?.chiefComplaint ||
                  item.ai_summary?.chiefComplaint ||
                  'No complaint recorded'

                const alerts = Array.isArray(item.clinical_alerts)
                  ? item.clinical_alerts
                  : Array.isArray(item.clinicalAlerts)
                  ? item.clinicalAlerts
                  : []

                const hasAlerts = alerts.length > 0
                const isAccepted =
                  item.case_status === 'physician_accepted' ||
                  item.status === 'physician_accepted'

                const timeString = item.created_at
                  ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : item.intakeTimestamp
                  ? new Date(item.intakeTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now'

                return (
                  <tr key={item.id || caseId} className="case-table-row">
                    <td className="cell-case-id">
                      <strong>{caseId}</strong>
                      <span className="cell-sub-info">{timeString}</span>
                    </td>
                    <td className="cell-patient">
                      <div className="patient-avatar-cell">
                        <span className="avatar-initial">
                          {patientName.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong className="patient-cell-name">{patientName}</strong>
                          <span className="patient-lang-tag">
                            {item.language || 'English'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="cell-demographics">
                      <span>
                        {age ? `${age} yrs` : '—'} /{' '}
                        {gender ? (t.details?.genderOptions?.[gender] || gender) : '—'}
                      </span>
                    </td>
                    <td className="cell-complaint">
                      <span className="complaint-highlight-pill">{complaint}</span>
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
                        onClick={() => onOpenCase(caseId)}
                      >
                        <span>{t.doctorDashboard.viewCaseBtn}</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
