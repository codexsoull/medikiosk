import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('🧪 Running Comprehensive Acceptance Tests for Milestone 8.2 (Medical Document Text Extraction & OCR)...\n')

const BASE_URL = process.env.API_URL || 'http://localhost:5000'
const rootDir = 'c:/Users/adiis/Desktop/New folder/medikiosk'

const processorPath = path.join(rootDir, 'backend', 'services', 'documentProcessor.js')
const routesPath = path.join(rootDir, 'backend', 'routes', 'documents.js')
const apiPath = path.join(rootDir, 'src', 'api', 'documents.js')
const canvasPath = path.join(rootDir, 'backend', 'node_modules', '@napi-rs', 'canvas', 'index.js')

const processorSrc = fs.readFileSync(processorPath, 'utf8')
const routesSrc = fs.readFileSync(routesPath, 'utf8')
const apiSrc = fs.readFileSync(apiPath, 'utf8')

// Import canvas from backend node_modules
const { createCanvas } = await import(`file:///${canvasPath.replace(/\\/g, '/')}`)

// Test 1: Document processor extraction API exists and exports extractDocumentText
console.log('Test 1: Verifying Document processor extraction API exists...')
assert.ok(processorSrc.includes('export async function extractDocumentText'), 'documentProcessor.js must export extractDocumentText')
assert.ok(processorSrc.includes('export function cleanExtractedText'), 'documentProcessor.js must export cleanExtractedText')
assert.ok(processorSrc.includes('export async function extractPdfText'), 'documentProcessor.js must export extractPdfText')
assert.ok(processorSrc.includes('export async function extractImageOcr'), 'documentProcessor.js must export extractImageOcr')
console.log('✅ Passed Test 1: Document processor extraction API verified.')

// Import service directly for unit validation
const {
  extractDocumentText,
  cleanExtractedText,
  extractPdfText,
  extractImageOcr,
  processDocument
} = await import(`file:///${processorPath.replace(/\\/g, '/')}`)

// Generate synthetic test documents
const samplePdfBuffer = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
  '4 0 obj<</Length 110>>stream\n' +
  'BT\n' +
  '/F1 12 Tf\n' +
  '100 700 Td\n' +
  '(Patient Name: Test Patient) Tj\n' +
  '0 -20 Td\n' +
  '(Chief Complaint: Headache since yesterday.) Tj\n' +
  '0 -20 Td\n' +
  '(Medication: Paracetamol 500mg) Tj\n' +
  'ET\n' +
  'endstream\n' +
  'endobj\n' +
  '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
  'xref\n' +
  '0 6\n' +
  '0000000000 65535 f \n' +
  '0000000009 00000 n \n' +
  '0000000056 00000 n \n' +
  '0000000111 00000 n \n' +
  '0000000226 00000 n \n' +
  '0000000386 00000 n \n' +
  'trailer<</Size 6/Root 1 0 R>>\n' +
  'startxref\n' +
  '454\n' +
  '%%EOF'
)

const canvas = createCanvas(600, 300)
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#ffffff'
ctx.fillRect(0, 0, 600, 300)
ctx.fillStyle = '#000000'
ctx.font = '24px Arial'
ctx.fillText('Patient Name: Test Patient', 30, 60)
ctx.fillText('Chief Complaint: Headache since yesterday.', 30, 110)
ctx.fillText('Medication: Paracetamol', 30, 160)
ctx.fillText('Blood Pressure: 120/80 mmHg', 30, 210)

const samplePngBuffer = canvas.toBuffer('image/png')
const sampleJpgBuffer = canvas.toBuffer('image/jpeg')
const sampleWebpBuffer = canvas.toBuffer('image/webp')

const blankCanvas = createCanvas(200, 100)
const blankCtx = blankCanvas.getContext('2d')
blankCtx.fillStyle = '#ffffff'
blankCtx.fillRect(0, 0, 200, 100)
const blankImageBuffer = blankCanvas.toBuffer('image/png')

// Test 2: PDF text extraction works
console.log('Test 2: Verifying PDF text extraction...')
const pdfResult = await extractDocumentText({
  originalName: 'discharge_summary.pdf',
  mimeType: 'application/pdf',
  size: samplePdfBuffer.length,
  content: samplePdfBuffer
})
assert.equal(pdfResult.success, true)
assert.equal(pdfResult.extractionStatus, 'completed')
assert.equal(pdfResult.extractionMethod, 'pdf-text')
assert.ok(pdfResult.extractedText.includes('Test Patient'))
assert.ok(pdfResult.extractedText.includes('Paracetamol 500mg'))
console.log('✅ Passed Test 2: PDF direct text extraction works.')

// Test 3: PNG OCR works
console.log('Test 3: Verifying PNG OCR extraction...')
const pngResult = await extractDocumentText({
  originalName: 'prescription_scan.png',
  mimeType: 'image/png',
  size: samplePngBuffer.length,
  content: samplePngBuffer
})
assert.equal(pngResult.success, true)
assert.equal(pngResult.extractionStatus, 'completed')
assert.equal(pngResult.extractionMethod, 'ocr')
assert.ok(pngResult.extractedText.includes('Test Patient'))
assert.ok(pngResult.extractedText.includes('120/80'))
console.log('✅ Passed Test 3: PNG OCR extraction works.')

// Test 4: JPG OCR works
console.log('Test 4: Verifying JPG OCR extraction...')
const jpgResult = await extractDocumentText({
  originalName: 'lab_report.jpg',
  mimeType: 'image/jpeg',
  size: sampleJpgBuffer.length,
  content: sampleJpgBuffer
})
assert.equal(jpgResult.success, true)
assert.equal(jpgResult.extractionStatus, 'completed')
assert.equal(jpgResult.extractionMethod, 'ocr')
assert.ok(jpgResult.extractedText.includes('Headache'))
assert.ok(jpgResult.extractedText.includes('Paracetamol'))
console.log('✅ Passed Test 4: JPG OCR extraction works.')

// Test 5: WEBP OCR works
console.log('Test 5: Verifying WEBP OCR extraction...')
const webpResult = await extractDocumentText({
  originalName: 'medical_record.webp',
  mimeType: 'image/webp',
  size: sampleWebpBuffer.length,
  content: sampleWebpBuffer
})
assert.equal(webpResult.success, true)
assert.equal(webpResult.extractionStatus, 'completed')
assert.equal(webpResult.extractionMethod, 'ocr')
assert.ok(webpResult.extractedText.includes('Test Patient'))
console.log('✅ Passed Test 5: WEBP OCR extraction works.')

// Test 6: extractedText is actually non-empty for valid sample documents
console.log('Test 6: Verifying extractedText is non-empty for valid documents...')
assert.ok(pdfResult.extractedText.length > 0)
assert.ok(pngResult.extractedText.length > 0)
assert.ok(jpgResult.extractedText.length > 0)
assert.ok(webpResult.extractedText.length > 0)
console.log('✅ Passed Test 6: extractedText is non-empty for all valid formats.')

// Test 7: extractionStatus becomes "completed" when extraction succeeds
console.log('Test 7: Verifying extractionStatus is "completed" on success...')
assert.equal(pdfResult.extractionStatus, 'completed')
assert.equal(pngResult.extractionStatus, 'completed')
assert.equal(jpgResult.extractionStatus, 'completed')
assert.equal(webpResult.extractionStatus, 'completed')
console.log('✅ Passed Test 7: extractionStatus is "completed" on success.')

// Test 8: characterCount is correct/consistent
console.log('Test 8: Verifying characterCount consistency...')
assert.equal(pdfResult.characterCount, pdfResult.extractedText.length)
assert.equal(pngResult.characterCount, pngResult.extractedText.length)
assert.equal(jpgResult.characterCount, jpgResult.extractedText.length)
assert.equal(webpResult.characterCount, webpResult.extractedText.length)
console.log('✅ Passed Test 8: characterCount exactly matches text length.')

// Test 9: extractionMethod is reported correctly
console.log('Test 9: Verifying extractionMethod reporting...')
assert.equal(pdfResult.extractionMethod, 'pdf-text')
assert.equal(pngResult.extractionMethod, 'ocr')
assert.equal(jpgResult.extractionMethod, 'ocr')
assert.equal(webpResult.extractionMethod, 'ocr')
console.log('✅ Passed Test 9: extractionMethod reports "pdf-text" and "ocr" accurately.')

// Test 10: Unsupported files are still rejected
console.log('Test 10: Verifying unsupported files rejected...')
await assert.rejects(
  () => extractDocumentText({ originalName: 'virus.exe', size: 1024, content: Buffer.from('test') }),
  /Unsupported file type/
)
await assert.rejects(
  () => extractDocumentText({ originalName: 'doc.docx', size: 1024, content: Buffer.from('test') }),
  /Unsupported file type/
)
console.log('✅ Passed Test 10: Unsupported files safely rejected.')

// Test 11: Empty files are still rejected
console.log('Test 11: Verifying empty files rejected...')
await assert.rejects(
  () => extractDocumentText({ originalName: 'empty.pdf', mimeType: 'application/pdf', size: 0, content: Buffer.alloc(0) }),
  /File is empty/
)
console.log('✅ Passed Test 11: Empty files safely rejected.')

// Test 12: Oversized files are still rejected
console.log('Test 12: Verifying oversized files rejected...')
await assert.rejects(
  () => extractDocumentText({ originalName: 'huge.pdf', mimeType: 'application/pdf', size: 20 * 1024 * 1024, content: Buffer.alloc(100) }),
  /exceeds the maximum allowed limit/
)
console.log('✅ Passed Test 12: Oversized files safely rejected.')

// Test 13: Invalid MIME/extension combinations rejected
console.log('Test 13: Verifying invalid MIME/extension rejected...')
await assert.rejects(
  () => extractDocumentText({ originalName: 'test.badext', size: 500, content: Buffer.from('test') }),
  /Unsupported file type/
)
console.log('✅ Passed Test 13: Invalid file types rejected.')

// Test 14: Extraction failure is handled safely (blank image)
console.log('Test 14: Verifying extraction failure on blank image...')
const failResult = await extractDocumentText({
  originalName: 'blank.png',
  mimeType: 'image/png',
  size: blankImageBuffer.length,
  content: blankImageBuffer
})
assert.equal(failResult.success, false)
assert.equal(failResult.extractionStatus, 'failed')
assert.equal(failResult.extractedText, '')
assert.equal(failResult.characterCount, 0)
console.log('✅ Passed Test 14: Extraction failure handled safely with "failed" status.')

// Test 15: Live HTTP API on POST /api/documents/process returns no stack traces
console.log('Test 15: Verifying live API with PDF extraction and security check...')
const rApiPdf = await fetch(`${BASE_URL}/api/documents/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalName: 'prescription.pdf',
    mimeType: 'application/pdf',
    size: samplePdfBuffer.length,
    content: samplePdfBuffer.toString('base64')
  })
})
assert.equal(rApiPdf.status, 200)
const dApiPdf = await rApiPdf.json()
assert.equal(dApiPdf.status, 'success')
assert.equal(dApiPdf.data.extractionStatus, 'completed')
assert.equal(dApiPdf.data.extractionMethod, 'pdf-text')
assert.ok(dApiPdf.data.extractedText.includes('Test Patient'))

// Live API with blank image returning 422 error
const rApiFail = await fetch(`${BASE_URL}/api/documents/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalName: 'blank.png',
    mimeType: 'image/png',
    size: blankImageBuffer.length,
    content: blankImageBuffer.toString('base64')
  })
})
assert.equal(rApiFail.status, 422)
const dApiFail = await rApiFail.json()
assert.equal(dApiFail.status, 'error')
assert.equal(dApiFail.message, 'Document text could not be extracted.')
assert.ok(!JSON.stringify(dApiFail).includes('at extractDocumentText'), 'No stack trace leaked')
console.log('✅ Passed Test 15: Live API extraction and safe error handling verified.')

// Test 16: /api/health still works
console.log('Test 16: Checking /api/health regression...')
const rHealth = await fetch(`${BASE_URL}/api/health`)
assert.equal(rHealth.status, 200)
const dHealth = await rHealth.json()
assert.equal(dHealth.status, 'ok')
console.log('✅ Passed Test 16: /api/health functional.')

// Test 17: /api/ai/chat still works
console.log('Test 17: Checking /api/ai/chat regression...')
const rChat = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'I have mild body aches.' })
})
assert.equal(rChat.status, 200)
const dChat = await rChat.json()
assert.equal(dChat.status, 'success')
console.log('✅ Passed Test 17: /api/ai/chat functional.')

// Test 18: /api/ai/summary still works
console.log('Test 18: Checking /api/ai/summary regression...')
const rSum = await fetch(`${BASE_URL}/api/ai/summary`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversation: [
      { role: 'assistant', content: 'What brings you to the clinic?' },
      { role: 'user', content: 'High fever since morning.' }
    ],
    language: 'en'
  })
})
assert.equal(rSum.status, 200)
const dSum = await rSum.json()
assert.equal(dSum.status, 'success')
assert.ok(dSum.data?.summary?.chiefComplaint)
console.log('✅ Passed Test 18: /api/ai/summary functional.')

// Test 19: /api/cases still works
console.log('Test 19: Checking /api/cases regression...')
const rCases = await fetch(`${BASE_URL}/api/cases`)
assert.equal(rCases.status, 200)
const dCases = await rCases.json()
assert.equal(dCases.status, 'success')
assert.ok(Array.isArray(dCases.data))
console.log('✅ Passed Test 19: /api/cases functional.')

// Test 20: Existing document foundation tests still pass (metadata-only without content)
console.log('Test 20: Checking Milestone 8.1 foundation backwards compatibility...')
const rFound = await fetch(`${BASE_URL}/api/documents/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalName: 'lab_report_CBC.pdf',
    mimeType: 'application/pdf',
    size: 245000
  })
})
assert.equal(rFound.status, 200)
const dFound = await rFound.json()
assert.equal(dFound.status, 'success')
assert.equal(dFound.data.extractionStatus, 'pending')
assert.equal(dFound.data.extractedText, '')
console.log('✅ Passed Test 20: Milestone 8.1 foundation mode preserved.')

console.log('\n🎉 ALL 20 ACCEPTANCE TESTS FOR MILESTONE 8.2 PASSED SUCCESSFULLY!')
