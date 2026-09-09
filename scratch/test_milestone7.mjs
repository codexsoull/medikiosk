import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('🧪 Running Comprehensive Acceptance Tests for MediKiosk Milestone 7...\n')

const BASE_URL = process.env.API_URL || 'http://localhost:5000'
const rootDir = 'c:/Users/adiis/Desktop/New folder/medikiosk'

const summaryServicePath = path.join(rootDir, 'backend', 'services', 'summary.js')
const aiRoutePath = path.join(rootDir, 'backend', 'routes', 'ai.js')
const aiApiPath = path.join(rootDir, 'src', 'api', 'ai.js')
const interviewPath = path.join(rootDir, 'src', 'screens', 'Interview.jsx')
const appPath = path.join(rootDir, 'src', 'App.jsx')
const casesApiPath = path.join(rootDir, 'src', 'api', 'cases.js')
const doctorCasePath = path.join(rootDir, 'src', 'screens', 'DoctorCase.jsx')

const summaryServiceSrc = fs.readFileSync(summaryServicePath, 'utf8')
const aiRouteSrc = fs.readFileSync(aiRoutePath, 'utf8')
const aiApiSrc = fs.readFileSync(aiApiPath, 'utf8')
const interviewSrc = fs.readFileSync(interviewPath, 'utf8')
const appSrc = fs.readFileSync(appPath, 'utf8')
const casesApiSrc = fs.readFileSync(casesApiPath, 'utf8')
const doctorCaseSrc = fs.readFileSync(doctorCasePath, 'utf8')

// Test 1: Code Structure & Contract Checks
console.log('Test 1: Verifying Service & Route Architecture...')
assert.ok(summaryServiceSrc.includes('generateClinicalSummary'), 'summary.js exports generateClinicalSummary')
assert.ok(summaryServiceSrc.includes('getGroqClient'), 'summary.js reuses getGroqClient')
assert.ok(summaryServiceSrc.includes('DO NOT invent, assume, extrapolate, or hallucinate'), 'Strict anti-hallucination instruction')
assert.ok(summaryServiceSrc.includes('Not reported'), 'Defaults unmentioned fields to Not reported')
assert.ok(summaryServiceSrc.includes('formatHpiText'), 'Formats HPI object into readable string')
assert.ok(aiRouteSrc.includes("router.post(['/summary', '/ai/summary']"), 'ai.js route defines POST /summary')
assert.ok(aiApiSrc.includes('generateClinicalSummaryAPI'), 'src/api/ai.js exports generateClinicalSummaryAPI')
console.log('✅ Passed Test 1: Service and route architecture verified.')

// Test 2: Validation - Empty conversation rejected
console.log('Test 2: Validation - Empty conversation rejected...')
const rEmpty = await fetch(`${BASE_URL}/api/ai/summary`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversation: [] })
})
assert.equal(rEmpty.status, 400, 'Empty conversation must return HTTP 400')
const dEmpty = await rEmpty.json()
assert.equal(dEmpty.status, 'error')
console.log('✅ Passed Test 2: Empty conversation rejected with HTTP 400.')

// Test 3: Validation - Non-array conversation rejected
console.log('Test 3: Validation - Non-array conversation rejected...')
const rNonArray = await fetch(`${BASE_URL}/api/ai/summary`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversation: 'hello world' })
})
assert.equal(rNonArray.status, 400, 'Non-array conversation must return HTTP 400')
const dNonArray = await rNonArray.json()
assert.equal(dNonArray.status, 'error')
console.log('✅ Passed Test 3: Non-array conversation rejected with HTTP 400.')

// Test 4: Validation - Unsupported language rejected
console.log('Test 4: Validation - Unsupported language rejected...')
const rLang = await fetch(`${BASE_URL}/api/ai/summary`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversation: [{ role: 'user', content: 'Headache' }],
    language: 'es'
  })
})
assert.equal(rLang.status, 400, 'Unsupported language must return HTTP 400')
const dLang = await rLang.json()
assert.equal(dLang.status, 'error')
console.log('✅ Passed Test 4: Unsupported language rejected with HTTP 400.')

// Test 5: Live English Clinical Summary Request
console.log('Test 5: Live English Clinical Summary Request...')
const rEng = await fetch(`${BASE_URL}/api/ai/summary`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversation: [
      { role: 'assistant', content: 'What brings you to the clinic today?' },
      { role: 'user', content: 'I have severe chest discomfort and shortness of breath since this morning.' },
      { role: 'assistant', content: 'How severe is the pain on a scale of 1 to 10?' },
      { role: 'user', content: 'It is an 8 out of 10, radiating to my left shoulder.' },
      { role: 'assistant', content: 'Do you take any medications or have medical conditions?' },
      { role: 'user', content: 'I have high blood pressure, taking Amlodipine. No allergies.' }
    ],
    language: 'en'
  })
})
assert.equal(rEng.status, 200, 'English summary returned HTTP 200')
const dEng = await rEng.json()
assert.equal(dEng.status, 'success')
const sEng = dEng.data.summary
assert.ok(sEng.chiefComplaint && sEng.chiefComplaint !== 'Not reported', 'Chief complaint extracted')
assert.ok(sEng.hpi && typeof sEng.hpi === 'object', 'HPI structured object present')
assert.ok(sEng.historyOfPresentIllness.includes('8') || sEng.hpi.severity.includes('8'), 'Severity captured in HPI')
assert.ok(sEng.pastMedicalHistory.toLowerCase().includes('blood pressure') || sEng.pastMedicalHistory.toLowerCase().includes('hypertension'), 'Past medical history captured')
assert.ok(sEng.medications.toLowerCase().includes('amlodipine'), 'Medications captured')
assert.ok(sEng.allergies.toLowerCase().includes('no') || sEng.allergies.toLowerCase().includes('none'), 'Allergies captured')
assert.equal(sEng.isAiDraft, true, 'Tagged as isAiDraft')
console.log('✅ Passed Test 5: Live English clinical summary generated accurately.')

// Test 6: Live Hindi Clinical Summary Request
console.log('Test 6: Live Hindi Clinical Summary Request...')
const rHi = await fetch(`${BASE_URL}/api/ai/summary`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversation: [
      { role: 'assistant', content: 'आप अस्पताल किस कारण से आए हैं?' },
      { role: 'user', content: 'मुझे दो दिन से बहुत तेज बुखार और जोड़ों में दर्द है।' },
      { role: 'assistant', content: 'क्या कोई पहले से बीमारी या एलर्जी है?' },
      { role: 'user', content: 'कोई एलर्जी नहीं है, कोई दवा नहीं लेता।' }
    ],
    language: 'hi'
  })
})
assert.equal(rHi.status, 200, 'Hindi summary returned HTTP 200')
const dHi = await rHi.json()
assert.equal(dHi.status, 'success')
const sHi = dHi.data.summary
assert.ok(sHi.chiefComplaint && sHi.chiefComplaint.length > 0, 'Chief complaint extracted from Hindi')
assert.ok(typeof sHi.historyOfPresentIllness === 'string', 'HPI formatted as string')
assert.equal(sHi.isAiDraft, true, 'Tagged as isAiDraft')
console.log('✅ Passed Test 6: Live Hindi clinical summary generated accurately in English.')

// Test 7: Non-hallucination check (unmentioned surgical/family history marked Not reported)
console.log('Test 7: Verifying Non-hallucination on unmentioned fields...')
assert.equal(sEng.pastSurgicalHistory, 'Not reported', 'Surgical history must be Not reported')
assert.equal(sEng.familyHistory, 'Not reported', 'Family history must be Not reported')
console.log('✅ Passed Test 7: Unmentioned clinical fields correctly marked "Not reported".')

// Test 8: Case Submission with AI Summary
console.log('Test 8: Submitting Case with AI Summary via POST /api/cases...')
const newCasePayload = {
  patient_name: 'Test Milestone7 Patient',
  age: 48,
  gender: 'Male',
  mobile: '9876543210',
  identity_verification_status: 'authenticated',
  consent_status: 'given',
  chief_complaint: sEng.chiefComplaint,
  symptoms: sEng.historyOfPresentIllness,
  medical_history: sEng.pastMedicalHistory,
  medications: sEng.medications,
  allergies: sEng.allergies,
  ai_summary: sEng,
  clinical_alerts: [
    { key: 'chestPain', text: 'Chest pain reported — flagged for urgent review', severity: 'high' }
  ],
  doctor_notes: 'Initial triage intake completed.',
  case_status: 'ready_for_doctor'
}

const rCase = await fetch(`${BASE_URL}/api/cases`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newCasePayload)
})
assert.equal(rCase.status, 201, 'Case created with HTTP 201')
const dCase = await rCase.json()
assert.equal(dCase.status, 'success')
const createdCaseId = dCase.data?.case_id
assert.ok(createdCaseId, 'Created case ID returned')
console.log(`✅ Passed Test 8: Case submitted successfully with ID: ${createdCaseId}.`)

// Test 9: Case Retrieval and AI Summary Verification
console.log('Test 9: Retrieving Created Case via GET /api/cases/:id...')
const rGetCase = await fetch(`${BASE_URL}/api/cases/${createdCaseId}`)
assert.equal(rGetCase.status, 200, 'GET case returned HTTP 200')
const dGetCase = await rGetCase.json()
assert.equal(dGetCase.status, 'success')
const retrievedSummary = dGetCase.data?.ai_summary
assert.ok(retrievedSummary && typeof retrievedSummary === 'object', 'ai_summary retrieved as object')
assert.equal(retrievedSummary.chiefComplaint, sEng.chiefComplaint)
assert.equal(retrievedSummary.isAiDraft, true)
console.log('✅ Passed Test 9: Case retrieved from SQLite with full AI summary intact.')

// Test 10: Doctor Notes & Status Update via PATCH /api/cases/:id
console.log('Test 10: Updating Doctor Notes & Accepting Case via PATCH /api/cases/:id...')
const rPatch = await fetch(`${BASE_URL}/api/cases/${createdCaseId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    doctor_notes: 'Reviewed AI intake summary. Patient scheduled for ECG immediately.',
    case_status: 'accepted'
  })
})
assert.equal(rPatch.status, 200, 'PATCH returned HTTP 200')
const dPatch = await rPatch.json()
assert.equal(dPatch.status, 'success')
assert.equal(dPatch.data?.doctor_notes, 'Reviewed AI intake summary. Patient scheduled for ECG immediately.')
assert.equal(dPatch.data?.case_status, 'accepted')
console.log('✅ Passed Test 10: Doctor notes and status update persisted.')

// Test 11: DoctorCase UI Mapping & Safety
console.log('Test 11: Verifying DoctorCase mapping logic...')
assert.ok(casesApiSrc.includes('formattedHpi'), 'mapBackendCaseToFrontend handles formatted HPI')
assert.ok(casesApiSrc.includes('formattedPersonal'), 'mapBackendCaseToFrontend handles formatted personal history')
assert.ok(doctorCaseSrc.includes('summary.historyOfPresentIllness'), 'DoctorCase renders historyOfPresentIllness')
assert.ok(doctorCaseSrc.includes('summary.personalHistory'), 'DoctorCase renders personalHistory')
assert.ok(interviewSrc.includes('const handleFinish = () => {\n    cancelSpeech()\n    stopListening()'), 'Interview maintains exact handleFinish signature')
console.log('✅ Passed Test 11: DoctorCase mapping and interview signature safety verified.')

// Test 12: Existing AI Chat Route still works
console.log('Test 12: Verifying POST /api/ai/chat continues to work...')
const rChat = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello, I have knee pain' })
})
assert.equal(rChat.status, 200, 'POST /api/ai/chat returned HTTP 200')
const dChat = await rChat.json()
assert.equal(dChat.status, 'success')
assert.ok(dChat.data?.reply)
console.log('✅ Passed Test 12: Existing AI chat endpoint functional.')

console.log('\n🎉 ALL MILESTONE 7 AUTOMATED ACCEPTANCE TESTS PASSED SUCCESSFULLY!')
