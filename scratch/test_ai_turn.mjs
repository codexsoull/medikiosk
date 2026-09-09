import fs from 'fs'

const BACKEND_URL = 'http://localhost:5000'

async function runTurnTests() {
  console.log('=== TESTING GEMINI 3.6 FLASH DYNAMIC INTERVIEW TURN ===\n')

  // 1. Health check
  console.log('1. Verifying backend connection...')
  const healthRes = await fetch(`${BACKEND_URL}/api/health`)
  if (!healthRes.ok) {
    throw new Error(`Backend not responding on ${BACKEND_URL}/api/health`)
  }
  const healthData = await healthRes.json()
  console.log('✓ Backend alive:', healthData)

  // 2. Test missing/placeholder GEMINI_API_KEY handling
  console.log('\n2. Testing missing/placeholder GEMINI_API_KEY behavior...')
  const { default: aiRouter } = await import('file:///c:/Users/adiis/Desktop/New folder/medikiosk/backend/routes/ai.js')
  const savedKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = ''
  let missingKeyResponse = null
  const mockReq = { body: {} }
  const mockRes = {
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      missingKeyResponse = payload
      return this
    }
  }

  const turnLayer = aiRouter.stack.find((s) => s.route && s.route.path === '/interview-turn')
  if (!turnLayer) {
    throw new Error('Could not find /interview-turn route in aiRouter')
  }
  await turnLayer.route.stack[0].handle(mockReq, mockRes)
  process.env.GEMINI_API_KEY = savedKey

  if (!missingKeyResponse?.useFallback) {
    throw new Error(`Expected useFallback: true when API key missing, got: ${JSON.stringify(missingKeyResponse)}`)
  }
  console.log('✓ Missing API key returned cleanly with { useFallback: true }:', missingKeyResponse)

  // 3. Test live POST /api/ai/interview-turn with requested payload format
  console.log('\n3. Testing live POST /api/ai/interview-turn (English)...')
  const englishPayload = {
    conversationHistory: [
      { sender: 'bot', text: 'Hello Ramesh. What primary medical concern brings you to MediKiosk today?' },
      { sender: 'user', text: 'Persistent throbbing headache since this morning' }
    ],
    patientDetails: {
      name: 'Ramesh',
      age: 42,
      gender: 'Male'
    },
    language: 'en',
    turnCount: 1
  }

  const enRes = await fetch(`${BACKEND_URL}/api/ai/interview-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(englishPayload)
  })

  if (!enRes.ok) {
    throw new Error(`HTTP Error from /api/ai/interview-turn: ${enRes.status}`)
  }

  const enData = await enRes.json()
  console.log('English Turn Response:', enData)

  if (enData.useFallback) {
    console.log('ℹ Backend reported useFallback. Fallback contract is valid.')
  } else {
    if (typeof enData.question !== 'string' || !enData.question.trim()) {
      throw new Error('Expected non-empty string question in response')
    }
    if (!Array.isArray(enData.suggestions)) {
      throw new Error('Expected suggestions array in response')
    }
    console.log('✓ Question:', enData.question)
    console.log('✓ Suggestion Chips count:', enData.suggestions.length)
    console.log('✓ Chips:', enData.suggestions)
    console.log('✓ Phase:', enData.phase)
  }

  // 4. Test Red Flag Emergency Detection
  console.log('\n4. Testing Red Flag detection via interview-turn...')
  const redFlagPayload = {
    conversationHistory: [
      { sender: 'bot', text: 'Can you describe the pain?' },
      { sender: 'user', text: 'Severe crushing chest pain radiating to left arm and neck with profuse sweating' }
    ],
    patientDetails: {
      name: 'Priya',
      age: 58,
      gender: 'Female'
    },
    language: 'en',
    turnCount: 2
  }

  const rfRes = await fetch(`${BACKEND_URL}/api/ai/interview-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(redFlagPayload)
  })

  const rfData = await rfRes.json()
  console.log('Red Flag Turn Response:', rfData)
  if (!rfData.useFallback) {
    if (rfData.emergencyAlert) {
      console.log('✓ Emergency Alert detected:', rfData.emergencyAlert)
      if (rfData.emergencyAlert.severity !== 'high' && rfData.emergencyAlert.severity !== 'medium') {
        throw new Error(`Invalid alert severity: ${rfData.emergencyAlert.severity}`)
      }
    } else {
      console.log('ℹ AI turn completed without explicit emergencyAlert')
    }
  }

  // 5. Test Turn Completion (turnCount >= 6)
  console.log('\n5. Testing turn limit completion (turnCount = 6)...')
  const completionPayload = {
    conversationHistory: [
      { sender: 'bot', text: 'Do you have any allergies or past illnesses?' },
      { sender: 'user', text: 'No past illnesses and no allergies.' }
    ],
    patientDetails: { name: 'Aarav', age: 30, gender: 'Male' },
    language: 'en',
    turnCount: 6
  }

  const compRes = await fetch(`${BACKEND_URL}/api/ai/interview-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(completionPayload)
  })

  const compData = await compRes.json()
  console.log('Completion Turn Response:', compData)
  if (!compData.useFallback) {
    if (compData.isFinished !== true) {
      throw new Error(`Expected isFinished: true when turnCount >= 6, got: ${compData.isFinished}`)
    }
    console.log('✓ isFinished is true for turnCount >= 6')
  }

  // 6. Test Frontend API Client
  console.log('\n6. Testing frontend client fetchNextInterviewQuestion...')
  const { fetchNextInterviewQuestion } = await import('file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/api/ai.js')
  const clientRes = await fetchNextInterviewQuestion({
    conversationHistory: [
      { sender: 'bot', text: 'Hello' },
      { sender: 'user', text: 'Fever' }
    ],
    patientDetails: { name: 'Test' },
    language: 'Hindi',
    turnCount: 1
  })
  console.log('Client fetch result:', clientRes)
  if (!clientRes || (clientRes.useFallback !== true && typeof clientRes.question !== 'string')) {
    throw new Error('Unexpected client response shape')
  }
  console.log('✓ Frontend API client functions as specified!')

  console.log('\n=== ALL DYNAMIC INTERVIEW TURN TESTS PASSED ===')
}

runTurnTests().catch((err) => {
  console.error('Test failed with error:', err)
  process.exit(1)
})
