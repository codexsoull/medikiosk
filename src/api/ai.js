/**
 * MediKiosk Frontend AI API Utility
 * Connects React frontend to Express Groq AI Backend
 */

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:5000'

/**
 * Sends a patient intake message to the AI assistant for the next interview question
 * @param {Object} params
 * @param {string} params.message - Patient answer text
 * @param {string} [params.language='en'] - 'en' or 'hi'
 * @param {Array<Object>} [params.conversation=[]] - Prior conversation messages
 * @returns {Promise<Object>} API response: { status: 'success', data: { reply, language } }
 */
export async function sendMessageToAI({ message, language = 'en', conversation = [], currentSection }) {
  const payload = {
    message,
    language: language === 'Hindi' || language === 'hi' ? 'hi' : 'en',
    conversation
  }
  if (currentSection) {
    payload.currentSection = currentSection
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`AI service returned status ${response.status}`)
  }

  if (!response.ok) {
    throw new Error(data?.message || `AI service error (HTTP ${response.status})`)
  }

  return data
}

/**
 * Tests the AI backend foundation endpoint
 * @param {Object} params
 * @param {string} params.message
 * @param {string} [params.language='en']
 * @returns {Promise<Object>}
 */
export async function testAIEndpoint({ message, language = 'en' }) {
  const response = await fetch(`${API_BASE_URL}/api/ai/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      language
    })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || `Test endpoint failed (HTTP ${response.status})`)
  }

  return await response.json()
}

/**
 * Generates an AI-powered structured clinical summary from completed interview transcript
 * @param {Object} params
 * @param {Array<Object>} params.conversation - Array of { role: 'user' | 'assistant', content: string }
 * @param {string} [params.language='en'] - 'en' or 'hi'
 * @returns {Promise<Object>} API response: { status: 'success', data: { summary, language } }
 */
export async function generateClinicalSummaryAPI({ conversation = [], language = 'en' }) {
  const response = await fetch(`${API_BASE_URL}/api/ai/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      conversation,
      language: language === 'Hindi' || language === 'hi' ? 'hi' : 'en'
    })
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`AI summary service returned status ${response.status}`)
  }

  if (!response.ok) {
    throw new Error(data?.message || `AI summary service error (HTTP ${response.status})`)
  }

  return data
}

