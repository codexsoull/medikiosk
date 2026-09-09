import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('🧪 Running Comprehensive Acceptance Tests for Milestone 8.1 (Document Text Extraction Foundation)...\n')

const BASE_URL = process.env.API_URL || 'http://localhost:5000'
const rootDir = 'c:/Users/adiis/Desktop/New folder/medikiosk'

const processorPath = path.join(rootDir, 'backend', 'services', 'documentProcessor.js')
const routesPath = path.join(rootDir, 'backend', 'routes', 'documents.js')
const apiPath = path.join(rootDir, 'src', 'api', 'documents.js')
const uploadScreenPath = path.join(rootDir, 'src', 'screens', 'DocumentUpload.jsx')

const processorSrc = fs.readFileSync(processorPath, 'utf8')
const routesSrc = fs.readFileSync(routesPath, 'utf8')
const apiSrc = fs.readFileSync(apiPath, 'utf8')
const uploadScreenSrc = fs.readFileSync(uploadScreenPath, 'utf8')

// Test 1: Document processor service exists and exports processDocument
console.log('Test 1: Verifying Document processor service...')
assert.ok(processorSrc.includes('export function processDocument'), 'documentProcessor.js must export processDocument')
assert.ok(processorSrc.includes('SUPPORTED_MIME_TYPES'), 'documentProcessor.js defines SUPPORTED_MIME_TYPES')
assert.ok(processorSrc.includes('SUPPORTED_EXTENSIONS'), 'documentProcessor.js defines SUPPORTED_EXTENSIONS')
console.log('✅ Passed Test 1: documentProcessor service exists and exports required interface.')

// Import service directly for unit validation
const { processDocument } = await import(`file:///${processorPath.replace(/\\/g, '/')}`)

// Test 2: Supported PDF recognized
console.log('Test 2: Supported PDF recognized...')
const pdfMeta = processDocument({
  originalName: 'lab_report_CBC.pdf',
  mimeType: 'application/pdf',
  size: 245000
})
assert.equal(pdfMeta.fileType, 'pdf')
assert.equal(pdfMeta.mimeType, 'application/pdf')
assert.equal(pdfMeta.category, 'pdf')
assert.equal(pdfMeta.extractionStatus, 'pending')
assert.equal(pdfMeta.extractedText, '')
console.log('✅ Passed Test 2: PDF recognized with correct metadata.')

// Test 3: Supported PNG recognized
console.log('Test 3: Supported PNG recognized...')
const pngMeta = processDocument({
  originalName: 'chest_xray_scan.png',
  mimeType: 'image/png',
  size: 512000
})
assert.equal(pngMeta.fileType, 'png')
assert.equal(pngMeta.mimeType, 'image/png')
assert.equal(pngMeta.category, 'image')
assert.equal(pngMeta.extractionStatus, 'pending')
assert.equal(pngMeta.extractedText, '')
console.log('✅ Passed Test 3: PNG recognized with correct metadata.')

// Test 4: Supported JPG/JPEG recognized
console.log('Test 4: Supported JPG/JPEG recognized...')
const jpgMeta = processDocument({
  originalName: 'prescription_slip.jpg',
  mimeType: 'image/jpeg',
  size: 320000
})
assert.equal(jpgMeta.fileType, 'jpg')
assert.equal(jpgMeta.mimeType, 'image/jpeg')
assert.equal(jpgMeta.category, 'image')
assert.equal(jpgMeta.extractionStatus, 'pending')
assert.equal(jpgMeta.extractedText, '')

const jpegMeta = processDocument({
  originalName: 'hospital_discharge.jpeg',
  size: 180000
})
assert.equal(jpegMeta.fileType, 'jpg')
assert.equal(jpegMeta.mimeType, 'image/jpeg')
console.log('✅ Passed Test 4: JPG/JPEG recognized with correct metadata.')

// Test 5: Supported WEBP recognized
console.log('Test 5: Supported WEBP recognized...')
const webpMeta = processDocument({
  originalName: 'mri_scan.webp',
  mimeType: 'image/webp',
  size: 420000
})
assert.equal(webpMeta.fileType, 'webp')
assert.equal(webpMeta.mimeType, 'image/webp')
assert.equal(webpMeta.category, 'image')
assert.equal(webpMeta.extractionStatus, 'pending')
assert.equal(webpMeta.extractedText, '')
console.log('✅ Passed Test 5: WEBP recognized with correct metadata.')

// Test 6: Unsupported type rejected
console.log('Test 6: Unsupported type rejected...')
assert.throws(
  () => processDocument({ originalName: 'malicious_script.exe', size: 1024 }),
  /Unsupported file type/
)
assert.throws(
  () => processDocument({ originalName: 'notes.docx', size: 2048 }),
  /Unsupported file type/
)
assert.throws(
  () => processDocument({ originalName: 'unknown', mimeType: 'application/octet-stream', size: 1024 }),
  /Unsupported MIME type/
)
console.log('✅ Passed Test 6: Unsupported formats safely rejected with controlled error.')

// Test 7: Missing file input rejected
console.log('Test 7: Missing file rejected...')
assert.throws(() => processDocument(null), /Missing file data/)
assert.throws(() => processDocument(undefined), /Missing file data/)
assert.throws(() => processDocument({}), /Invalid file descriptor/)
console.log('✅ Passed Test 7: Missing file input safely rejected.')

// Test 8: Empty file (0 bytes) rejected
console.log('Test 8: Empty file rejected...')
assert.throws(
  () => processDocument({ originalName: 'empty.pdf', mimeType: 'application/pdf', size: 0 }),
  /File is empty \(0 bytes\)/
)
console.log('✅ Passed Test 8: Empty file (0 bytes) rejected.')

// Test 9: Oversized file rejected (> 10MB)
console.log('Test 9: Oversized file rejected...')
assert.throws(
  () => processDocument({ originalName: 'giant_scan.png', mimeType: 'image/png', size: 15 * 1024 * 1024 }),
  /exceeds the maximum allowed limit/
)
console.log('✅ Passed Test 9: Oversized file (> 10MB) safely rejected.')

// Test 10: Normalized metadata contains all required fields
console.log('Test 10: Normalized metadata structure verification...')
const requiredFields = ['originalName', 'mimeType', 'fileType', 'size', 'extractionStatus', 'extractedText', 'category', 'processedAt']
for (const field of requiredFields) {
  assert.ok(field in pdfMeta, `Field ${field} missing from metadata`)
}
console.log('✅ Passed Test 10: Normalized metadata contains all required fields.')

// Test 11 & 12: extractionStatus is "pending" and extractedText is ""
console.log('Test 11 & 12: extractionStatus is "pending" and extractedText is empty string...')
assert.equal(pdfMeta.extractionStatus, 'pending')
assert.equal(pdfMeta.extractedText, '')
console.log('✅ Passed Test 11 & 12: extractionStatus is "pending" and extractedText is empty.')

// Test 13: Live API POST /api/documents/process tests
console.log('Test 13: Live HTTP API verification on POST /api/documents/process...')
// 13a: Valid PDF
const rApiPdf = await fetch(`${BASE_URL}/api/documents/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalName: 'ECG_Report_Patient.pdf',
    mimeType: 'application/pdf',
    size: 150000
  })
})
assert.equal(rApiPdf.status, 200, 'HTTP status must be 200')
const dApiPdf = await rApiPdf.json()
assert.equal(dApiPdf.status, 'success')
assert.equal(dApiPdf.data.originalName, 'ECG_Report_Patient.pdf')
assert.equal(dApiPdf.data.fileType, 'pdf')
assert.equal(dApiPdf.data.extractionStatus, 'pending')
assert.equal(dApiPdf.data.extractedText, '')

// 13b: Controlled error on invalid file type
const rApiBad = await fetch(`${BASE_URL}/api/documents/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalName: 'danger.bat',
    size: 500
  })
})
assert.equal(rApiBad.status, 400, 'Invalid file type must return HTTP 400')
const dApiBad = await rApiBad.json()
assert.equal(dApiBad.status, 'error')
assert.ok(dApiBad.message.includes('Unsupported file type'))
assert.ok(!JSON.stringify(dApiBad).includes('at processDocument'), 'No stack trace leaked in response')

// 13c: Controlled error on oversized file
const rApiBig = await fetch(`${BASE_URL}/api/documents/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalName: 'heavy_file.pdf',
    size: 20 * 1024 * 1024
  })
})
assert.equal(rApiBig.status, 400)
const dApiBig = await rApiBig.json()
assert.equal(dApiBig.status, 'error')
assert.ok(dApiBig.message.includes('exceeds the maximum allowed limit'))
console.log('✅ Passed Test 13: Live HTTP API returns normalized metadata and controlled errors.')

// Test 14: Existing /api/health still works
console.log('Test 14: Existing GET /api/health regression check...')
const rHealth = await fetch(`${BASE_URL}/api/health`)
assert.equal(rHealth.status, 200)
const dHealth = await rHealth.json()
assert.equal(dHealth.status, 'ok')
console.log('✅ Passed Test 14: GET /api/health functional.')

// Test 15: Existing /api/ai/chat still works
console.log('Test 15: Existing POST /api/ai/chat regression check...')
const rChat = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'I have a mild sore throat since yesterday' })
})
assert.equal(rChat.status, 200)
const dChat = await rChat.json()
assert.equal(dChat.status, 'success')
assert.ok(dChat.data?.reply)
console.log('✅ Passed Test 15: POST /api/ai/chat functional.')

// Test 16: Existing /api/ai/summary still works
console.log('Test 16: Existing POST /api/ai/summary regression check...')
const rSummary = await fetch(`${BASE_URL}/api/ai/summary`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversation: [
      { role: 'assistant', content: 'What brings you to the clinic?' },
      { role: 'user', content: 'Cough and fever for 2 days.' }
    ],
    language: 'en'
  })
})
assert.equal(rSummary.status, 200)
const dSummary = await rSummary.json()
assert.equal(dSummary.status, 'success')
assert.ok(dSummary.data?.summary?.chiefComplaint)
console.log('✅ Passed Test 16: POST /api/ai/summary functional.')

// Test 17: Existing Case APIs remain functional
console.log('Test 17: Existing Case APIs regression check...')
const rCases = await fetch(`${BASE_URL}/api/cases`)
assert.equal(rCases.status, 200)
const dCases = await rCases.json()
assert.equal(dCases.status, 'success')
assert.ok(Array.isArray(dCases.data))
console.log('✅ Passed Test 17: GET /api/cases functional.')

console.log('\n🎉 ALL 17 ACCEPTANCE TESTS FOR MILESTONE 8.1 PASSED SUCCESSFULLY!')
