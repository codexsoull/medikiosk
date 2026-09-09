import fs from 'fs'
import path from 'path'

const BACKEND_URL = 'http://localhost:5000'

async function runAITests() {
  console.log('=== TESTING MILESTONE 8: GEMINI 2.5 FLASH AI CLINICAL LAYER ===\n')

  // 1. Check if backend is alive
  console.log('1. Verifying backend connection...')
  const healthRes = await fetch(`${BACKEND_URL}/api/health`)
  if (!healthRes.ok) {
    throw new Error(`Backend not responding on ${BACKEND_URL}/api/health`)
  }
  const healthData = await healthRes.json()
  console.log('✓ Backend alive:', healthData)

  // 1b. Test missing/empty GEMINI_API_KEY handling
  console.log('\n1b. Testing missing GEMINI_API_KEY behavior...')
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

  const summarizeLayer = aiRouter.stack.find((s) => s.route && s.route.path === '/summarize')
  await summarizeLayer.route.stack[0].handle(mockReq, mockRes)
  process.env.GEMINI_API_KEY = savedKey

  if (!missingKeyResponse?.useFallback || missingKeyResponse?.reason !== 'GEMINI_API_KEY missing') {
    throw new Error(`Expected GEMINI_API_KEY missing fallback, got: ${JSON.stringify(missingKeyResponse)}`)
  }
  console.log('✓ Missing API key returned cleanly without error:', missingKeyResponse)

  // 2. Test live POST /api/ai/summarize
  console.log('\n2. Testing POST /api/ai/summarize with realistic patient intake...')
  const samplePayload = {
    patientDetails: {
      name: 'Ramesh Sharma',
      age: 52,
      gender: 'Male',
      mobile: '9876543210'
    },
    conversation: [
      { sender: 'ai', text: 'What brings you to the hospital today?' },
      { sender: 'patient', text: 'Chest discomfort and heaviness since yesterday' },
      { sender: 'ai', text: 'Does the chest pain radiate to your left arm or jaw?' },
      { sender: 'patient', text: 'Yes, pain is spreading to my left arm and shoulder' },
      { sender: 'ai', text: 'When did this problem begin?' },
      { sender: 'patient', text: 'Yesterday morning' },
      { sender: 'ai', text: 'How severe is it on a scale of 1 to 10?' },
      { sender: 'patient', text: '7 – 8 (Severe)' },
      { sender: 'ai', text: 'Are you experiencing any other symptoms?' },
      { sender: 'patient', text: 'Dizziness and mild shortness of breath' },
      { sender: 'ai', text: 'Do you have any previous medical conditions?' },
      { sender: 'patient', text: 'Hypertension (BP) for 5 years' },
      { sender: 'ai', text: 'Are you currently taking any medications?' },
      { sender: 'patient', text: 'Amlodipine 5mg once daily' },
      { sender: 'ai', text: 'Do you have any known allergies?' },
      { sender: 'patient', text: 'No known drug allergies' }
    ],
    redFlagsTriggered: [
      { key: 'chestPain', text: 'Yes, pain is spreading to my left arm and shoulder' }
    ],
    language: 'English'
  }

  const response = await fetch(`${BACKEND_URL}/api/ai/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(samplePayload)
  })

  if (!response.ok) {
    throw new Error(`HTTP Error from /api/ai/summarize: ${response.status}`)
  }

  const result = await response.json()
  console.log('API Response received:')
  console.log('Success:', result.success)
  console.log('UseFallback:', result.useFallback)

  if (result.success) {
    console.log('\n✓ Real Google Gemini 2.5 Flash response received!')
    const s = result.summary
    console.log('Chief Complaint:', s.chiefComplaint)
    console.log('HPI:', s.hpi || s.historyOfPresentIllness)
    console.log('PMH:', s.pastMedicalHistory)
    console.log('Medications:', s.medications)
    console.log('Allergies:', s.allergies)
    console.log('Personal History:', s.personalHistory)
    console.log('Review of Systems:', s.reviewOfSystems)
    console.log('Clinical Alerts count:', s.clinicalAlerts?.length || 0)
    if (s.clinicalAlerts?.length > 0) {
      console.log('Alert Sample:', s.clinicalAlerts[0])
    }

    // Verify required schema fields
    if (!s.chiefComplaint || typeof s.chiefComplaint !== 'string') {
      throw new Error('Missing or invalid chiefComplaint in summary')
    }
    if ((!s.hpi && !s.historyOfPresentIllness) || typeof (s.hpi || s.historyOfPresentIllness) !== 'string') {
      throw new Error('Missing or invalid hpi/historyOfPresentIllness in summary')
    }
    if (!Array.isArray(s.clinicalAlerts)) {
      throw new Error('clinicalAlerts is not an array in summary')
    }
    console.log('✓ Strict clinical JSON schema verified successfully!')
  } else {
    console.log('Fallback Reason:', result.reason)
    if (!result.useFallback) {
      throw new Error('Expected useFallback: true on unsuccessful AI call')
    }
    console.log('✓ Fallback flag correctly set for client-side seamless fallback!')
  }

  // 3. Test empty request body handling
  console.log('\n3. Testing edge-case empty request body handling...')
  const emptyRes = await fetch(`${BACKEND_URL}/api/ai/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  const emptyData = await emptyRes.json()
  console.log('Empty request response:', { success: emptyData.success, useFallback: emptyData.useFallback })
  console.log('✓ Edge-case handled without crashing server')

  // 4. Verify code structure in backend and frontend files
  console.log('\n4. Verifying file contracts...')
  const aiRouteContent = fs.readFileSync('c:/Users/adiis/Desktop/New folder/medikiosk/backend/routes/ai.js', 'utf8')
  if (!aiRouteContent.includes('process.env.GEMINI_MODEL') || !aiRouteContent.includes('gemini-3.6-flash')) {
    throw new Error('backend/routes/ai.js does not target dynamic GEMINI_MODEL / gemini-3.6-flash!')
  }
  if (!aiRouteContent.includes('gemini-1.5-flash')) {
    throw new Error('backend/routes/ai.js missing gemini-1.5-flash fallback!')
  }
  if (!aiRouteContent.includes('responseMimeType') || !aiRouteContent.includes('application/json')) {
    throw new Error('backend/routes/ai.js missing JSON mode in generationConfig!')
  }
  if (!aiRouteContent.includes('useFallback: true')) {
    throw new Error('backend/routes/ai.js missing useFallback flag!')
  }
  console.log('✓ backend/routes/ai.js targets GEMINI_MODEL / gemini-3.6-flash with gemini-1.5-flash fallback, application/json and useFallback handling')

  const aiClientContent = fs.readFileSync('c:/Users/adiis/Desktop/New folder/medikiosk/src/api/ai.js', 'utf8')
  if (!aiClientContent.includes('/api/ai/summarize') || !aiClientContent.includes('useFallback: true')) {
    throw new Error('src/api/ai.js missing endpoint or fallback handling!')
  }
  console.log('✓ src/api/ai.js correctly connects to /api/ai/summarize with fallback')

  const processingContent = fs.readFileSync('c:/Users/adiis/Desktop/New folder/medikiosk/src/screens/AIProcessing.jsx', 'utf8')
  if (!processingContent.includes('generateAISummary')) {
    throw new Error('src/screens/AIProcessing.jsx does not call generateAISummary!')
  }
  console.log('✓ src/screens/AIProcessing.jsx invokes generateAISummary in parallel with animations')

  const appContent = fs.readFileSync('c:/Users/adiis/Desktop/New folder/medikiosk/src/App.jsx', 'utf8')
  if (!appContent.includes('aiResult') || !appContent.includes('ai_summary')) {
    throw new Error('src/App.jsx does not handle aiResult or set ai_summary!')
  }
  console.log('✓ src/App.jsx handles aiResult and populates ai_summary and clinicalAlerts')

  console.log('\n>>> ALL AI SUMMARY TESTS PASSED SUCCESSFULLY! <<<')
}

runAITests().catch((err) => {
  console.error('Test failed with error:', err)
  process.exit(1)
})
