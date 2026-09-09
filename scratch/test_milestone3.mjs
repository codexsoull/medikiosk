import http from 'http'
import { createCase, fetchCases, fetchCaseById } from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/api/cases.js'

async function runMilestone3Tests() {
  console.log('=== STARTING MILESTONE 3 TESTS: PATIENT SUBMISSION → CASE API ===\n')

  // 1. Check health
  console.log('1. Checking backend health...')
  const healthRes = await fetch('http://localhost:5000/api/health')
  const healthJson = await healthRes.json()
  console.log('Health status:', healthJson)
  if (healthRes.status !== 200 || healthJson.status !== 'ok') {
    throw new Error('Backend health check failed!')
  }
  console.log('✓ Backend health check passed!\n')

  // 2. Simulate patient submission via createCase API utility
  console.log('2. Simulating full patient intake submission via createCase()...')
  const patientIntakePayload = {
    patient_name: 'Ananya Verma',
    age: 48,
    gender: 'Female',
    mobile: '9811223344',
    identity_verification_status: 'authenticated',
    consent_status: 'given',
    consent_timestamp: new Date().toISOString(),
    chief_complaint: 'Chest Discomfort',
    symptoms: 'Breathlessness & dizziness',
    medical_history: 'Hypertension (BP)',
    medications: 'Amlodipine, occasional smoking',
    allergies: 'Penicillin',
    ai_summary: {
      chiefComplaint: 'Chest Discomfort',
      historyOfPresentIllness: 'Chest Discomfort reported starting since Yesterday.\nPatient reports severity of 9 – 10 (Very Severe).\nAssociated symptoms reported: Breathlessness & dizziness.\nOn follow-up: Pain spreading to left arm\nPatient provided 1 prior medical document for clinical review.',
      pastMedicalHistory: 'Hypertension (BP)',
      medications: 'Amlodipine, occasional smoking',
      allergies: 'Penicillin',
      familyHistory: 'No significant family history of hereditary illnesses reported.',
      personalHistory: 'Patient reports history of tobacco/smoking use. Non-alcoholic.',
      reviewOfSystems: 'Cardiovascular: Normal rhythm. Respiratory: Clear. GI: No acute complaints. CNS: Alert & Oriented.'
    },
    clinical_alerts: [
      {
        key: 'chestPain',
        text: 'Chest pain reported — possible cardiac-pattern symptoms. Flagged for urgent physician review.',
        severity: 'high'
      },
      {
        key: 'severeSeverity',
        text: 'Patient-reported severity is very high (9–10/10) — recommend prioritizing this case.',
        severity: 'medium'
      }
    ],
    doctor_notes: '',
    case_status: 'ready_for_doctor'
  }

  const submissionResult = await createCase(patientIntakePayload)
  console.log('Submission Result Status:', submissionResult.status)
  console.log('Returned Case ID:', submissionResult.case_id)
  console.log('Created Record Data:', JSON.stringify(submissionResult.data, null, 2))

  if (!submissionResult.case_id || !submissionResult.case_id.startsWith('CASE-')) {
    throw new Error('Case creation failed or invalid case_id!')
  }
  const createdCaseId = submissionResult.case_id
  console.log(`✓ Patient case submitted successfully! Generated Case ID: ${createdCaseId}\n`)

  // 3. Fetch all cases and verify new case is first (newest)
  console.log('3. Verifying case in GET /api/cases list...')
  const allCasesRes = await fetchCases()
  console.log('Total Cases in DB:', allCasesRes.count)
  const newestCase = allCasesRes.data[0]
  console.log('Newest Case:', newestCase.case_id, newestCase.patient_name, newestCase.chief_complaint)

  if (newestCase.case_id !== createdCaseId || newestCase.patient_name !== 'Ananya Verma') {
    throw new Error('Newest case does not match submitted patient!')
  }
  console.log('✓ Case confirmed in full cases list!\n')

  // 4. Fetch specific case by case_id
  console.log(`4. Fetching case by identifier: ${createdCaseId}...`)
  const singleCaseRes = await fetchCaseById(createdCaseId)
  console.log('Found Case:', singleCaseRes.data?.case_id, singleCaseRes.data?.patient_name)
  console.log('Clinical Alerts count:', singleCaseRes.data?.clinical_alerts?.length)
  console.log('AI Summary HPI snippet:', singleCaseRes.data?.ai_summary?.historyOfPresentIllness?.slice(0, 50))

  if (singleCaseRes.data?.case_id !== createdCaseId) {
    throw new Error('Case fetch by ID failed!')
  }
  console.log('✓ Case verified by direct ID lookup!\n')

  console.log('>>> ALL MILESTONE 3 TESTS PASSED SUCCESSFULLY! <<<')
}

runMilestone3Tests().catch((err) => {
  console.error('Milestone 3 Test Failure:', err)
  process.exit(1)
})
