import {
  fetchCases,
  fetchCaseById,
  updateCase,
  mapBackendCaseToFrontend
} from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/api/cases.js'

async function runMilestone5Tests() {
  console.log('=== STARTING MILESTONE 5 TESTS: DOCTOR ACTIONS + CASE UPDATE API ===\n')

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health')
  const healthJson = await healthRes.json()
  console.log('Health check:', healthJson)
  if (healthRes.status !== 200 || healthJson.status !== 'ok') {
    throw new Error('Backend health check failed!')
  }
  console.log('✓ Backend health check OK\n')

  // 2. Test validation on PATCH /api/cases/:id
  console.log('2. Testing validation on PATCH /api/cases/:id...')

  // 2a. 404 for unknown case
  const res404 = await fetch('http://localhost:5000/api/cases/CASE-9999', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_status: 'accepted' })
  })
  if (res404.status !== 404) {
    throw new Error(`Expected 404 for unknown case, got ${res404.status}`)
  }
  console.log('✓ 404 returned for unknown case ID')

  // 2b. 400 for empty body
  const resEmpty = await fetch('http://localhost:5000/api/cases/CASE-0004', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  if (resEmpty.status !== 400) {
    throw new Error(`Expected 400 for empty body, got ${resEmpty.status}`)
  }
  console.log('✓ 400 returned for empty update payload')

  // 2c. 400 for invalid status
  const resInvalidStatus = await fetch('http://localhost:5000/api/cases/CASE-0004', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_status: 'discharged' })
  })
  if (resInvalidStatus.status !== 400) {
    throw new Error(`Expected 400 for invalid case_status, got ${resInvalidStatus.status}`)
  }
  console.log('✓ 400 returned for unsupported case_status')

  // 2d. 400 for invalid doctor_notes type
  const resInvalidNotes = await fetch('http://localhost:5000/api/cases/CASE-0004', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctor_notes: 12345 })
  })
  if (resInvalidNotes.status !== 400) {
    throw new Error(`Expected 400 for non-string doctor_notes, got ${resInvalidNotes.status}`)
  }
  console.log('✓ 400 returned for non-string doctor_notes\n')

  // 3. Step 1: Retrieve CASE-0004 before update
  console.log('3. Retrieving CASE-0004 before update...')
  const beforeRes = await fetchCaseById('CASE-0004')
  const caseBefore = beforeRes.data
  console.log('Initial state:', {
    case_id: caseBefore.case_id,
    patient_name: caseBefore.patient_name,
    case_status: caseBefore.case_status,
    doctor_notes: caseBefore.doctor_notes
  })
  console.log('✓ CASE-0004 retrieved successfully\n')

  // 4. Step 2 & 3: Update doctor_notes and change status to accepted
  const newDoctorNotes = 'Immediate ECG performed; shows sinus tachycardia with ST elevations. Initiated STEMI clinical pathway and ordered emergency cardiology consult.'
  console.log('4. Updating CASE-0004 via PATCH with doctor_notes and case_status="accepted"...')

  const updateResult = await updateCase('CASE-0004', {
    doctor_notes: newDoctorNotes,
    case_status: 'accepted'
  })

  console.log('PATCH Response Status:', updateResult.status)
  console.log('PATCH Response Message:', updateResult.message)
  console.log('PATCH Updated Record:', {
    case_id: updateResult.data.case_id,
    case_status: updateResult.data.case_status,
    doctor_notes: updateResult.data.doctor_notes,
    updated_at: updateResult.data.updated_at
  })

  if (updateResult.data.case_status !== 'accepted') {
    throw new Error(`Expected case_status to be 'accepted', got '${updateResult.data.case_status}'`)
  }
  if (updateResult.data.doctor_notes !== newDoctorNotes) {
    throw new Error('doctor_notes did not match updated value!')
  }
  console.log('✓ PATCH update succeeded!\n')

  // 5. Step 4 & 5: Retrieve CASE-0004 again and verify values
  console.log('5. Retrieving CASE-0004 again to verify update in SQLite...')
  const afterRes = await fetchCaseById('CASE-0004')
  const caseAfter = afterRes.data

  if (caseAfter.case_status !== 'accepted') {
    throw new Error(`Verification failed: case_status is '${caseAfter.case_status}', expected 'accepted'`)
  }
  if (caseAfter.doctor_notes !== newDoctorNotes) {
    throw new Error('Verification failed: doctor_notes mismatch!')
  }
  if (caseAfter.patient_name !== 'Devendra Nath' || caseAfter.age !== 61 || caseAfter.gender !== 'Male') {
    throw new Error('Verification failed: Patient demographics were inadvertently modified!')
  }
  if (!caseAfter.ai_summary || caseAfter.ai_summary.chiefComplaint !== 'Chest Discomfort') {
    throw new Error('Verification failed: AI summary was inadvertently modified!')
  }
  if (!Array.isArray(caseAfter.clinical_alerts) || caseAfter.clinical_alerts.length !== 2) {
    throw new Error('Verification failed: Clinical alerts were inadvertently modified!')
  }

  console.log('✓ Both values changed and verified in SQLite:')
  console.log('  - case_status:', caseAfter.case_status)
  console.log('  - doctor_notes:', caseAfter.doctor_notes)
  console.log('  - patient details (unchanged):', `${caseAfter.patient_name}, ${caseAfter.age}y/${caseAfter.gender}`)
  console.log('  - clinical alerts (unchanged):', caseAfter.clinical_alerts.length, 'alerts')
  console.log('  - updated_at:', caseAfter.updated_at, '\n')

  // 6. Verify GET /api/cases reflects updated status
  console.log('6. Verifying GET /api/cases queue reflection...')
  const allCasesRes = await fetchCases()
  const caseInQueue = allCasesRes.data.find((c) => c.case_id === 'CASE-0004')
  if (!caseInQueue) {
    throw new Error('CASE-0004 not found in /api/cases queue!')
  }
  if (caseInQueue.case_status !== 'accepted') {
    throw new Error(`Queue case_status is '${caseInQueue.case_status}', expected 'accepted'`)
  }
  console.log('✓ CASE-0004 in GET /api/cases displays updated status: "accepted"\n')

  // 7. Verify frontend normalized mapping
  console.log('7. Verifying mapBackendCaseToFrontend normalization...')
  const mapped = mapBackendCaseToFrontend(caseAfter)
  if (
    mapped.status !== 'physician_accepted' ||
    mapped.case_status !== 'accepted' ||
    mapped.doctor_notes !== newDoctorNotes ||
    mapped.physicianNotes !== newDoctorNotes
  ) {
    throw new Error('Frontend mapping mismatch for doctor status and notes!')
  }
  console.log('✓ mapBackendCaseToFrontend properly normalizes status to physician_accepted and sets notes!\n')

  console.log('>>> MILESTONE 5 API TESTS PASSED! <<<')
}

runMilestone5Tests().catch((err) => {
  console.error('Milestone 5 Test Error:', err)
  process.exit(1)
})
