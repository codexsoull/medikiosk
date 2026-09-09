import http from 'http'

function request(options) {
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
    req.end()
  })
}

async function verifyPersistence() {
  console.log('=== VERIFYING SQLITE PERSISTENCE AFTER RESTART ===\n')

  const listRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cases',
    method: 'GET'
  })

  console.log('GET /api/cases Status:', listRes.status)
  console.log('Persisted Cases Count:', listRes.body?.count)
  console.log('Persisted Cases:', listRes.body?.data?.map((c) => ({ id: c.id, case_id: c.case_id, patient_name: c.patient_name })))

  if (listRes.status !== 200 || !listRes.body?.count || listRes.body.count < 2) {
    throw new Error('Persistence check failed: cases not found after restart!')
  }

  const getCase1Res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cases/CASE-0001',
    method: 'GET'
  })

  console.log('GET /api/cases/CASE-0001 Status:', getCase1Res.status)
  console.log('Case 1 Details:', getCase1Res.body?.data?.patient_name, getCase1Res.body?.data?.chief_complaint)

  if (getCase1Res.status !== 200 || getCase1Res.body?.data?.patient_name !== 'Rahul Sharma') {
    throw new Error('Persistence check failed: CASE-0001 details mismatch!')
  }

  console.log('\n>>> SQLITE PERSISTENCE VERIFICATION CONFIRMED SUCCESSFUL! <<<')
}

verifyPersistence().catch((err) => {
  console.error('Persistence verification failed:', err)
  process.exit(1)
})
