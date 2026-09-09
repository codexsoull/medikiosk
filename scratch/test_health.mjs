import http from 'http'

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Origin': 'http://localhost:5173'
  }
}

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`)
  console.log(`CORS Header (Access-Control-Allow-Origin): ${res.headers['access-control-allow-origin']}`)
  
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('Response Body:', data)
    try {
      const parsed = JSON.parse(data)
      if (res.statusCode === 200 && parsed.status === 'ok' && parsed.service === 'MediKiosk Backend') {
        console.log('>>> HEALTH ENDPOINT VALIDATION PASSED! <<<')
      } else {
        console.error('>>> HEALTH ENDPOINT VALIDATION FAILED! <<<')
        process.exit(1)
      }
    } catch (err) {
      console.error('JSON parse error:', err)
      process.exit(1)
    }
  })
})

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`)
  process.exit(1)
})

req.end()
