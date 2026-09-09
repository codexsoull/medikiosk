import http from 'http'

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data })
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: null, raw: data })
        }
      })
    })

    req.on('error', (err) => reject(err))

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData))
    }
    req.end()
  })
}

async function runTests() {
  console.log('=== STARTING BACKEND MILESTONE 2 TESTS ===\n')

  // Test 1: GET /api/health
  console.log('1. Testing GET /api/health...')
  const healthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  })
  console.log('Status:', healthRes.status, 'Body:', healthRes.body)
  if (healthRes.status !== 200 || healthRes.body?.status !== 'ok') {
    throw new Error('Health check failed!')
  }
  console.log('✓ Health check passed!\n')

  // Test 2: POST /api/cases (validation failure on empty patient_name)
  console.log('2. Testing POST /api/cases validation failure (missing patient_name)...')
  const invalidRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/cases',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { age: 45, gender: 'Male' }
  )
  console.log('Status:', invalidRes.status, 'Body:', invalidRes.body)
  if (invalidRes.status !== 400 || invalidRes.body?.status !== 'error') {
    throw new Error('Validation failure test failed!')
  }
  console.log('✓ 400 Bad Request validation passed!\n')

  // Test 3: POST /api/cases (valid case creation 1)
  console.log('3. Testing POST /api/cases (creating Case 1 with red flags and clinical summary)...')
  const case1Payload = {
    patient_name: 'Rahul Sharma',
    age: 52,
    gender: 'Male',
    mobile: '9876543210',
    identity_verification_status: 'authenticated',
    consent_status: 'given',
    chief_complaint: 'Chest Discomfort',
    symptoms: 'Mild nausea and shortness of breath',
    medical_history: 'Hypertension (BP)',
    medications: 'BP meds (Amlodipine)',
    allergies: 'Penicillin',
    ai_summary: {
      chiefComplaint: 'Chest Discomfort',
      historyOfPresentIllness: 'Chest Discomfort reported since Yesterday. Patient reports severity 9/10. On follow-up: pain spreading to arm.',
      personalHistory: 'Patient reports history of smoking. Non-alcoholic.'
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

  const createRes1 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/cases',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    },
    case1Payload
  )
  console.log('Status:', createRes1.status)
  console.log('Created Case ID:', createRes1.body?.case_id)
  console.log('Response Data:', JSON.stringify(createRes1.body?.data, null, 2))
  if (createRes1.status !== 201 || !createRes1.body?.case_id) {
    throw new Error('Case 1 creation failed!')
  }
  const case1Id = createRes1.body.case_id
  const case1DbId = createRes1.body.data.id
  console.log('✓ Case 1 created successfully!\n')

  // Test 4: POST /api/cases (valid case creation 2)
  console.log('4. Testing POST /api/cases (creating Case 2)...')
  const case2Payload = {
    patientName: 'Priya Patel',
    age: 29,
    gender: 'Female',
    mobile: '9123456780',
    chiefComplaint: 'Headache & Fever',
    associatedSymptoms: 'Mild body ache',
    pastMedicalHistory: 'None',
    medications: 'Paracetamol',
    allergies: 'No known allergies',
    status: 'ready_for_doctor'
  }

  const createRes2 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/cases',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    case2Payload
  )
  console.log('Status:', createRes2.status, 'Created Case ID:', createRes2.body?.case_id)
  if (createRes2.status !== 201 || !createRes2.body?.case_id) {
    throw new Error('Case 2 creation failed!')
  }
  const case2Id = createRes2.body.case_id
  console.log('✓ Case 2 created successfully!\n')

  // Test 5: GET /api/cases (all cases sorted newest first)
  console.log('5. Testing GET /api/cases...')
  const listRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cases',
    method: 'GET'
  })
  console.log('Status:', listRes.status, 'Total Cases Count:', listRes.body?.count)
  if (listRes.status !== 200 || !Array.isArray(listRes.body?.data) || listRes.body.count < 2) {
    throw new Error('GET /api/cases failed!')
  }
  // Check newest first
  const firstItem = listRes.body.data[0]
  console.log('First (newest) case in list:', firstItem.case_id, firstItem.patient_name)
  if (firstItem.case_id !== case2Id) {
    console.warn('Note: expected newest case to be first:', case2Id, 'got:', firstItem.case_id)
  }
  console.log('✓ GET /api/cases passed!\n')

  // Test 6: GET /api/cases/:id by database integer ID
  console.log(`6. Testing GET /api/cases/${case1DbId} by numeric ID...`)
  const getByIdRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/cases/${case1DbId}`,
    method: 'GET'
  })
  console.log('Status:', getByIdRes.status, 'Found patient:', getByIdRes.body?.data?.patient_name)
  if (getByIdRes.status !== 200 || getByIdRes.body?.data?.patient_name !== 'Rahul Sharma') {
    throw new Error('GET /api/cases/:id by numeric ID failed!')
  }
  console.log('✓ GET by numeric ID passed!\n')

  // Test 7: GET /api/cases/:id by case_id string (e.g. CASE-0001)
  console.log(`7. Testing GET /api/cases/${case1Id} by case_id string...`)
  const getByCaseIdRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/cases/${case1Id}`,
    method: 'GET'
  })
  console.log('Status:', getByCaseIdRes.status, 'Found case_id:', getByCaseIdRes.body?.data?.case_id)
  if (getByCaseIdRes.status !== 200 || getByCaseIdRes.body?.data?.case_id !== case1Id) {
    throw new Error('GET /api/cases/:id by case_id string failed!')
  }
  console.log('✓ GET by case_id string passed!\n')

  // Test 8: GET /api/cases/CASE-9999 (404 not found)
  console.log('8. Testing GET /api/cases/CASE-9999 (404 expected)...')
  const notFoundRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cases/CASE-9999',
    method: 'GET'
  })
  console.log('Status:', notFoundRes.status, 'Body:', notFoundRes.body)
  if (notFoundRes.status !== 404 || notFoundRes.body?.status !== 'error') {
    throw new Error('404 test failed!')
  }
  console.log('✓ 404 Not Found passed!\n')

  console.log('>>> ALL MILESTONE 2 API TESTS PASSED SUCCESSFULLY! <<<')
}

runTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
