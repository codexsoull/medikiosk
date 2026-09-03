/**
 * MediKiosk Frontend API Utility
 * Connects React frontend to Express SQLite Backend
 */

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:5000'

/**
 * Creates and persists a patient case in the backend SQLite database
 * @param {Object} casePayload - Patient intake record
 * @returns {Promise<Object>} API response including generated case_id
 */
export async function createCase(casePayload) {
  const response = await fetch(`${API_BASE_URL}/api/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(casePayload)
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server returned status ${response.status}`)
  }

  if (!response.ok) {
    throw new Error(data?.message || `Failed to submit case (HTTP ${response.status})`)
  }

  return data
}

/**
 * Fetches all cases from backend (sorted newest first)
 * @returns {Promise<Object>} API response with list of cases
 */
export async function fetchCases() {
  const response = await fetch(`${API_BASE_URL}/api/cases`)
  if (!response.ok) {
    throw new Error(`Failed to fetch cases (HTTP ${response.status})`)
  }
  return await response.json()
}

/**
 * Fetches a single case by database ID or case_id
 * @param {string|number} id - Case identifier
 * @returns {Promise<Object>} API response with case record
 */
export async function fetchCaseById(id) {
  const response = await fetch(`${API_BASE_URL}/api/cases/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch case ${id} (HTTP ${response.status})`)
  }
  return await response.json()
}

/**
 * Updates doctor_notes and/or case_status for a case via PATCH /api/cases/:id
 * @param {string|number} id - Case identifier
 * @param {Object} updates - { doctor_notes, case_status }
 * @returns {Promise<Object>} API response with updated case record
 */
export async function updateCase(id, updates) {
  const response = await fetch(`${API_BASE_URL}/api/cases/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server returned status ${response.status}`)
  }

  if (!response.ok) {
    throw new Error(data?.message || `Failed to update case (HTTP ${response.status})`)
  }

  return data
}

/**
 * Maps raw backend case record to the frontend state format
 * @param {Object} row - SQLite case record
 * @returns {Object} Normalized caseData structure
 */
export function mapBackendCaseToFrontend(row) {
  if (!row) return null

  // Ensure ai_summary is an object
  let summary = row.ai_summary
  if (typeof summary === 'string') {
    try {
      summary = JSON.parse(summary)
    } catch {
      summary = { chiefComplaint: row.chief_complaint || '' }
    }
  }
  if (!summary || typeof summary !== 'object') {
    summary = {
      chiefComplaint: row.chief_complaint || '',
      historyOfPresentIllness: row.symptoms || '',
      pastMedicalHistory: row.medical_history || '',
      medications: row.medications || '',
      allergies: row.allergies || '',
      familyHistory: '',
      personalHistory: '',
      reviewOfSystems: ''
    }
  }

  // Ensure clinical_alerts is an array
  let clinicalAlerts = row.clinical_alerts
  if (typeof clinicalAlerts === 'string') {
    try {
      clinicalAlerts = JSON.parse(clinicalAlerts)
    } catch {
      clinicalAlerts = []
    }
  }
  if (!Array.isArray(clinicalAlerts)) {
    clinicalAlerts = []
  }

  return {
    id: row.id,
    caseId: row.case_id || `CASE-${row.id}`,
    case_id: row.case_id || `CASE-${row.id}`,
    status: row.case_status === 'accepted' || row.case_status === 'physician_accepted' ? 'physician_accepted' : (row.case_status || 'ready_for_doctor'),
    case_status: row.case_status || 'ready_for_doctor',
    intakeTimestamp: row.created_at || new Date().toISOString(),
    patient: {
      name: row.patient_name || 'Walk-in Patient',
      age: row.age || '',
      gender: row.gender || '',
      mobile: row.mobile || '',
      language: 'English'
    },
    consent: {
      given: row.consent_status === 'given',
      timestamp: row.consent_timestamp
    },
    authentication: {
      status: row.identity_verification_status || 'not_authenticated'
    },
    complaint: {
      chiefComplaint: row.chief_complaint || summary.chiefComplaint || '',
      associatedSymptoms: row.symptoms || ''
    },
    summary: {
      chiefComplaint: summary.chiefComplaint || row.chief_complaint || '',
      historyOfPresentIllness: summary.historyOfPresentIllness || '',
      pastMedicalHistory: summary.pastMedicalHistory || row.medical_history || '',
      medications: summary.medications || row.medications || '',
      allergies: summary.allergies || row.allergies || '',
      familyHistory: summary.familyHistory || '',
      personalHistory: summary.personalHistory || '',
      reviewOfSystems: summary.reviewOfSystems || ''
    },
    clinicalAlerts: clinicalAlerts,
    documents: [],
    doctor_notes: row.doctor_notes || '',
    physicianNotes: row.doctor_notes || ''
  }
}

