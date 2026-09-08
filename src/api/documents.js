/**
 * MediKiosk Frontend Document Processing API Utility
 * Connects React frontend to Express Document Processor Backend
 */

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:5000'

/**
 * Sends uploaded document descriptor to backend for validation and metadata normalization
 * @param {Object} fileData - { originalName, mimeType, size, content? }
 * @returns {Promise<Object>} API response: { status: 'success', data: { ... } }
 */
export async function processDocumentAPI(fileData) {
  const response = await fetch(`${API_BASE_URL}/api/documents/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fileData)
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Document service returned status ${response.status}`)
  }

  if (!response.ok) {
    throw new Error(data?.message || `Document processing error (HTTP ${response.status})`)
  }

  return data
}

