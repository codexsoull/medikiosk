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
