import { fetchCaseById, fetchCases } from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/api/cases.js'

async function verifyPersistence() {
  console.log('=== VERIFYING MILESTONE 5 PERSISTENCE AFTER RESTART ===\n')

  const expectedNotes = 'Immediate ECG performed; shows sinus tachycardia with ST elevations. Initiated STEMI clinical pathway and ordered emergency cardiology consult.'

  // 1. Fetch CASE-0004
  const res = await fetchCaseById('CASE-0004')
  const c = res.data

  console.log('Retrieved CASE-0004 after backend restart:', {
    case_id: c.case_id,
    patient_name: c.patient_name,
    case_status: c.case_status,
    doctor_notes: c.doctor_notes,
    updated_at: c.updated_at
  })

  if (c.case_status !== 'accepted') {
    throw new Error(`Persistence failure: case_status is '${c.case_status}', expected 'accepted'`)
  }
  if (c.doctor_notes !== expectedNotes) {
    throw new Error('Persistence failure: doctor_notes mismatch!')
  }
  if (c.patient_name !== 'Devendra Nath' || c.age !== 61 || c.gender !== 'Male') {
    throw new Error('Persistence failure: Patient demographics changed!')
  }
  if (!Array.isArray(c.clinical_alerts) || c.clinical_alerts.length !== 2) {
    throw new Error('Persistence failure: Clinical alerts changed!')
  }

  // 2. Fetch all cases and verify queue status
  const queueRes = await fetchCases()
  const queueCase = queueRes.data.find((item) => item.case_id === 'CASE-0004')
  if (!queueCase || queueCase.case_status !== 'accepted') {
    throw new Error('Queue verification failure: CASE-0004 not accepted in queue list!')
  }

  console.log('\n>>> PERSISTENCE VERIFICATION PASSED: ALL DOCTOR UPDATES SURVIVED RESTART! <<<')
}

verifyPersistence().catch((err) => {
  console.error('Persistence Verification Error:', err)
  process.exit(1)
})
