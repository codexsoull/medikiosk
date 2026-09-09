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

  // Safely format HPI if stored as raw object
  let formattedHpi = summary.historyOfPresentIllness || row.symptoms || ''
  if (!formattedHpi && summary.hpi && typeof summary.hpi === 'object') {
    const lines = []
    Object.entries(summary.hpi).forEach(([k, v]) => {
      if (v && v !== 'Not reported') lines.push(`${k}: ${v}`)
    })
    formattedHpi = lines.join('. ')
  } else if (typeof formattedHpi === 'object') {
    formattedHpi = JSON.stringify(formattedHpi)
  }

  // Safely format personal history if stored as raw object
  let formattedPersonal = summary.personalHistory || ''
  if (typeof formattedPersonal === 'object') {
    const items = []
    Object.entries(formattedPersonal).forEach(([k, v]) => {
      if (v && v !== 'Not reported') items.push(`${k}: ${v}`)
    })
    formattedPersonal = items.join('. ')
  }

  // Ensure clinical_alerts is an array
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

  // Safely parse and normalize documents array
  let rawDocs = row.documents
  if (typeof rawDocs === 'string') {
    try {
      rawDocs = JSON.parse(rawDocs)
    } catch {
      rawDocs = []
    }
  }
  if (!Array.isArray(rawDocs)) {
    rawDocs = []
  }

  const documents = rawDocs
    .map((doc, idx) => {
      if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null

      const originalName = (
        (typeof doc.originalName === 'string' && doc.originalName.trim()) ||
        (typeof doc.name === 'string' && doc.name.trim()) ||
        `Document ${idx + 1}`
      )

      const mimeType = (
        (typeof doc.mimeType === 'string' && doc.mimeType.trim()) ||
        (originalName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png')
      )

      const fileType = (
        (typeof doc.fileType === 'string' && doc.fileType.trim()) ||
        (mimeType.includes('pdf') ? 'pdf' : 'image')
      )

      const category = (
        (typeof doc.category === 'string' && doc.category.trim()) ||
        fileType
      )

      const rawBytes = (
        typeof doc.size === 'number'
          ? doc.size
          : typeof doc.rawSize === 'number'
          ? doc.rawSize
          : 0
      )

      const formattedSize = rawBytes > 0
        ? (rawBytes / 1024 >= 1024
            ? `${(rawBytes / (1024 * 1024)).toFixed(1)} MB`
            : `${(rawBytes / 1024).toFixed(1)} KB`)
        : (typeof doc.size === 'string' ? doc.size : '—')

      const extractionStatus = (
        (typeof doc.extractionStatus === 'string' && doc.extractionStatus.trim()) ||
        'completed'
      )

      const extractedText = typeof doc.extractedText === 'string' ? doc.extractedText : ''
      const characterCount = typeof doc.characterCount === 'number'
        ? doc.characterCount
        : extractedText.length

      const extractionMethod = (
        (typeof doc.extractionMethod === 'string' && doc.extractionMethod.trim()) ||
        (fileType === 'pdf' ? 'pdf-text' : 'ocr')
      )

      const processedAt = (
        (typeof doc.processedAt === 'string' && doc.processedAt.trim()) ||
        (typeof doc.uploadDate === 'string' && doc.uploadDate.trim()) ||
        ''
      )

      return {
        id: doc.id || `doc-${idx + 1}`,
        originalName,
        name: originalName,
        mimeType,
        fileType,
        category,
        size: rawBytes,
        formattedSize,
        extractionStatus,
        extractedText,
        characterCount,
        extractionMethod,
        processedAt
      }
    })
    .filter(Boolean)

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
      ...summary,
      chiefComplaint: summary.chiefComplaint || row.chief_complaint || '',
      historyOfPresentIllness: formattedHpi || '',
      pastMedicalHistory: typeof summary.pastMedicalHistory === 'string' ? summary.pastMedicalHistory : (row.medical_history || ''),
      medications: typeof summary.medications === 'string' ? summary.medications : (row.medications || ''),
      allergies: typeof summary.allergies === 'string' ? summary.allergies : (row.allergies || ''),
      familyHistory: typeof summary.familyHistory === 'string' ? summary.familyHistory : '',
      personalHistory: formattedPersonal || '',
      reviewOfSystems: typeof summary.reviewOfSystems === 'string' ? summary.reviewOfSystems : '',
      isAiDraft: Boolean(summary.isAiDraft)
    },
    clinicalAlerts: clinicalAlerts,
    documents: documents,
    doctor_notes: row.doctor_notes || '',
    physicianNotes: row.doctor_notes || ''
  }
}

