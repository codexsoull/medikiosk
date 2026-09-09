import {
  createCase,
  fetchCases,
  fetchCaseById,
  mapBackendCaseToFrontend
} from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/api/cases.js'

async function runMilestone4Tests() {
  console.log('=== STARTING MILESTONE 4 TESTS: DOCTOR DASHBOARD → CASE API ===\n')

  // 1. Health check
  console.log('1. Verifying backend service health...')
  const healthRes = await fetch('http://localhost:5000/api/health')
  const healthJson = await healthRes.json()
  console.log('Health Response:', healthJson)
  if (healthRes.status !== 200 || healthJson.status !== 'ok') {
    throw new Error('Backend health check failed!')
  }
  console.log('✓ Health check passed!\n')

  // 2. Submit new case through patient workflow API
  console.log('2. Submitting test patient case with clinical alerts...')
  const testPatient = {
    patient_name: 'Devendra Nath',
    age: 61,
    gender: 'Male',
    mobile: '9844556677',
    identity_verification_status: 'authenticated',
    consent_status: 'given',
    consent_timestamp: new Date().toISOString(),
    chief_complaint: 'Chest Discomfort',
    symptoms: 'Pain radiating to jaw, severe sweating',
    medical_history: 'Diabetes, Hypertension (BP)',
    medications: 'Metformin, Telmisartan',
    allergies: 'Sulfa Drugs',
    ai_summary: {
      chiefComplaint: 'Chest Discomfort',
      historyOfPresentIllness: 'Chest Discomfort reported starting since Today.\nPatient reports severity of 9 – 10 (Very Severe).\nAssociated symptoms reported: Pain radiating to jaw, severe sweating.\nOn follow-up: Radiating to left arm and jaw.',
      pastMedicalHistory: 'Diabetes, Hypertension (BP)',
      medications: 'Metformin, Telmisartan',
      allergies: 'Sulfa Drugs',
      familyHistory: 'Father had myocardial infarction at age 55.',
      personalHistory: 'Patient reports history of tobacco/smoking use. Non-alcoholic.',
      reviewOfSystems: 'Cardiovascular: Tachycardia sensation. Respiratory: Shortness of breath on exertion. GI: Mild nausea.'
    },
    clinical_alerts: [
      {
        key: 'chestPain',
        text: 'Chest pain reported — possible cardiac-pattern symptoms. Flagged for urgent physician review.',
        textHindi: 'सीने में दर्द दर्ज — संभावित हृदय-संबंधी लक्षण। तत्काल चिकित्सक समीक्षा हेतु चिह्नित।',
        severity: 'high'
      },
      {
        key: 'severeSeverity',
        text: 'Patient-reported severity is very high (9–10/10) — recommend prioritizing this case.',
        textHindi: 'मरीज़ द्वारा दर्ज गंभीरता बहुत अधिक है (9–10/10) — इस केस को प्राथमिकता देने की सलाह।',
        severity: 'medium'
      }
    ],
    doctor_notes: '',
    case_status: 'ready_for_doctor'
  }

  const createdCase = await createCase(testPatient)
  console.log('Created Case ID:', createdCase.case_id)
  if (!createdCase.case_id) {
    throw new Error('Case submission failed!')
  }
  const caseId = createdCase.case_id
  console.log(`✓ Case created with ID: ${caseId}\n`)

  // 3. Test DoctorDashboard fetching all cases from GET /api/cases
  console.log('3. Testing DoctorDashboard fetchCases() from GET /api/cases...')
  const casesResponse = await fetchCases()
  console.log('Total Cases in Database:', casesResponse.count)
  console.log('Cases List:', casesResponse.data.map((c) => ({
    case_id: c.case_id,
    patient: c.patient_name,
    complaint: c.chief_complaint,
    has_alerts: Boolean(c.clinical_alerts?.length)
  })))

  const newest = casesResponse.data[0]
  if (newest.case_id !== caseId || newest.patient_name !== 'Devendra Nath') {
    throw new Error('DoctorDashboard newest case mismatch!')
  }
  if (!newest.clinical_alerts || newest.clinical_alerts.length !== 2) {
    throw new Error('DoctorDashboard clinical alerts missing on newest case!')
  }
  console.log('✓ DoctorDashboard successfully retrieved case list with Flagged alert status!\n')

  // 4. Test selecting case in DoctorCase via fetchCaseById()
  console.log(`4. Testing DoctorCase fetchCaseById("${caseId}")...`)
  const singleCaseResponse = await fetchCaseById(caseId)
  console.log('Raw Backend Case Record:', singleCaseResponse.data)

  if (!singleCaseResponse.data || singleCaseResponse.data.case_id !== caseId) {
    throw new Error('fetchCaseById failed!')
  }

  // 5. Test mapping backend record to frontend format
  console.log('\n5. Testing mapBackendCaseToFrontend normalization...')
  const mapped = mapBackendCaseToFrontend(singleCaseResponse.data)
  console.log('Normalized Frontend caseData:', JSON.stringify(mapped, null, 2))

  if (
    mapped.caseId !== caseId ||
    mapped.patient.name !== 'Devendra Nath' ||
    mapped.patient.age !== 61 ||
    mapped.patient.gender !== 'Male' ||
    mapped.summary.chiefComplaint !== 'Chest Discomfort' ||
    mapped.summary.pastMedicalHistory !== 'Diabetes, Hypertension (BP)' ||
    mapped.summary.medications !== 'Metformin, Telmisartan' ||
    mapped.summary.allergies !== 'Sulfa Drugs' ||
    mapped.clinicalAlerts.length !== 2 ||
    mapped.clinicalAlerts[0].severity !== 'high' ||
    mapped.clinicalAlerts[1].severity !== 'medium' ||
    mapped.status !== 'ready_for_doctor'
  ) {
    throw new Error('Data normalization mapping failed!')
  }
  console.log('✓ Data normalization mapping verified for DoctorCase!\n')

  console.log('>>> ALL MILESTONE 4 TESTS PASSED SUCCESSFULLY! <<<')
}

runMilestone4Tests().catch((err) => {
  console.error('Milestone 4 Test Error:', err)
  process.exit(1)
})
