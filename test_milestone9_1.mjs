/**
 * Acceptance Test Suite for Milestone 9.1: Document-Aware AI Clinical Summary
 * Verifies:
 * 1. Summary service accepts documents.
 * 2. Existing summary without documents works.
 * 3. One completed PDF document is included.
 * 4. Multiple completed documents are included.
 * 5. Pending documents are ignored.
 * 6. Failed documents are ignored.
 * 7. Empty extractedText is ignored.
 * 8. Non-string extractedText is ignored.
 * 9. Document text is bounded to 12000 characters.
 * 10. Documents are normalized correctly.
 * 11. Existing summary JSON schema remains intact.
 * 12. Missing information remains "Not reported" or existing default.
 * 13. Conflicting interview/document information is preserved rather than silently resolved.
 * 14. Existing POST /api/ai/summary without documents works.
 * 15. POST /api/ai/summary with documents works.
 * 16. POST /api/ai/chat still works.
 * 17. POST /api/ai/test still works.
 * 18. GET /api/health still works.
 * 19. GET /api/cases still works.
 * 20. No API credentials appear in source/test responses.
 */

import { normalizeAndBoundDocuments, generateClinicalSummary } from 'file:///C:/Users/adiis/Desktop/New%20folder/medikiosk/backend/services/summary.js'

let passedTests = 0
let failedTests = 0

function assert(condition, message) {
  if (condition) {
    passedTests++
    console.log(`  ✅ PASS: ${message}`)
  } else {
    failedTests++
    console.error(`  ❌ FAIL: ${message}`)
  }
}

async function runTests() {
  console.log('🧪 Starting Milestone 9.1 Acceptance Tests...\n')

  // 1. Summary service accepts documents
  console.log('--- Test 1 & 10: normalizeAndBoundDocuments filtering and normalization ---')
  const rawDocs = [
    {
      originalName: 'cbc_report.pdf',
      fileType: 'pdf',
      extractionStatus: 'completed',
      extractedText: '  Hemoglobin: 13.2 g/dL\n  WBC: 6,500 /uL  '
    },
    {
      // Missing name / fileType fallback
      extractionStatus: 'completed',
      extractedText: 'Prescription: Metformin 500mg daily'
    }
  ]
  const normalized = normalizeAndBoundDocuments(rawDocs)
  assert(normalized.length === 2, 'Summary service accepts documents array and processes valid entries')
  assert(normalized[0].name === 'cbc_report.pdf', 'Document 1 name normalized')
  assert(normalized[0].type === 'pdf', 'Document 1 type normalized')
  assert(normalized[0].text === 'Hemoglobin: 13.2 g/dL\nWBC: 6,500 /uL', 'Document 1 text trimmed and normalized')
  assert(normalized[1].name === 'document', 'Default name applied when originalName omitted')
  assert(normalized[1].type === 'unknown', 'Default type applied when fileType omitted')

  // 3 & 4. One and multiple completed documents
  console.log('\n--- Test 3 & 4: Single and Multiple completed documents handling ---')
  const singleDoc = [{ originalName: 'rx.png', fileType: 'png', extractionStatus: 'completed', extractedText: 'Amlodipine 5mg' }]
  const singleNormalized = normalizeAndBoundDocuments(singleDoc)
  assert(singleNormalized.length === 1 && singleNormalized[0].name === 'rx.png', 'One completed document properly handled')

  const multiDocs = [
    { originalName: 'lab.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: 'Glucose: 95 mg/dL' },
    { originalName: 'discharge.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: 'Discharged in stable condition' }
  ]
  const multiNormalized = normalizeAndBoundDocuments(multiDocs)
  assert(multiNormalized.length === 2 && multiNormalized[1].name === 'discharge.pdf', 'Multiple completed documents properly handled')

  // 5, 6, 7, 8. Ignoring invalid, pending, failed, empty, non-string entries
  console.log('\n--- Test 5, 6, 7, 8: Document Filtering & Rejection of Invalid Entries ---')
  const invalidCollection = [
    null,
    undefined,
    'not an object',
    { originalName: 'pending.pdf', fileType: 'pdf', extractionStatus: 'pending', extractedText: 'Some text' },
    { originalName: 'failed.pdf', fileType: 'pdf', extractionStatus: 'failed', extractedText: 'Error text' },
    { originalName: 'empty.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: '' },
    { originalName: 'whitespace.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: '   \n\t   ' },
    { originalName: 'number.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: 12345 },
    { originalName: 'obj.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: { text: 'invalid' } },
    { originalName: 'valid.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: 'Valid clinical finding' }
  ]
  const filteredResult = normalizeAndBoundDocuments(invalidCollection)
  assert(filteredResult.length === 1 && filteredResult[0].name === 'valid.pdf', 'Pending, failed, empty, whitespace-only, and non-string documents ignored')

  // 9. Document text bounded to 12000 characters
  console.log('\n--- Test 9: Character Bounding to 12000 Characters ---')
  const largeDoc1 = {
    originalName: 'large1.pdf',
    fileType: 'pdf',
    extractionStatus: 'completed',
    extractedText: 'A'.repeat(8000)
  }
  const largeDoc2 = {
    originalName: 'large2.pdf',
    fileType: 'pdf',
    extractionStatus: 'completed',
    extractedText: 'B'.repeat(8000)
  }
  const boundedDocs = normalizeAndBoundDocuments([largeDoc1, largeDoc2])
  const totalChars = boundedDocs.reduce((acc, d) => acc + d.text.length, 0)
  assert(totalChars <= 12000, `Total document characters bounded (actual: ${totalChars} <= 12000)`)
  assert(boundedDocs[0].text.length === 8000, 'First document fully preserved within budget')
  assert(boundedDocs[1].text.length === 4000, 'Second document truncated to exactly meet 12000 character limit')

  // Deduplication check
  const duplicateDocs = [
    { originalName: 'doc1.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: 'Duplicate text' },
    { originalName: 'doc2.pdf', fileType: 'pdf', extractionStatus: 'completed', extractedText: 'Duplicate text' }
  ]
  const dedupedResult = normalizeAndBoundDocuments(duplicateDocs)
  assert(dedupedResult.length === 1, 'Identical extracted document text deduplicated')

  // 2, 11, 12, 14. Live POST /api/ai/summary without documents
  console.log('\n--- Test 2, 11, 12, 14: Existing POST /api/ai/summary without documents ---')
  const conversationBase = [
    { role: 'assistant', content: 'What brings you to the hospital today?' },
    { role: 'user', content: 'Persistent dry cough for 3 days' },
    { role: 'assistant', content: 'Do you have any past medical conditions?' },
    { role: 'user', content: 'None' },
    { role: 'assistant', content: 'Are you taking any medications?' },
    { role: 'user', content: 'None' },
    { role: 'assistant', content: 'Any known allergies?' },
    { role: 'user', content: 'No known allergies' }
  ]

  const summaryWithoutDocsRes = await fetch('http://localhost:5000/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation: conversationBase,
      language: 'en'
    })
  })
  assert(summaryWithoutDocsRes.status === 200, 'POST /api/ai/summary without documents returns HTTP 200')
  const summaryWithoutDocsData = await summaryWithoutDocsRes.json()
  assert(summaryWithoutDocsData.status === 'success', 'Summary without docs returns status success')
  const sWithout = summaryWithoutDocsData.data.summary

  // Check existing JSON schema keys intact
  const expectedKeys = [
    'chiefComplaint',
    'hpi',
    'historyOfPresentIllness',
    'pastMedicalHistory',
    'pastSurgicalHistory',
    'medications',
    'allergies',
    'familyHistory',
    'personalHistory',
    'personalHistoryDetails',
    'reviewOfSystems',
    'priorInvestigations',
    'additionalNotes',
    'isAiDraft'
  ]
  const allKeysPresent = expectedKeys.every((k) => k in sWithout)
  assert(allKeysPresent, 'Existing summary JSON schema remains 100% intact')
  assert(sWithout.pastSurgicalHistory === 'Not reported', 'Missing information remains "Not reported"')
  assert(sWithout.isAiDraft === true, 'Summary marked isAiDraft: true')

  // 15. Live POST /api/ai/summary WITH documents
  console.log('\n--- Test 15: Live POST /api/ai/summary WITH valid completed documents ---')
  const summaryWithDocsRes = await fetch('http://localhost:5000/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation: [
        { role: 'assistant', content: 'What brings you to the hospital today?' },
        { role: 'user', content: 'Mild fever and fatigue' }
      ],
      documents: [
        {
          originalName: 'lab_report.pdf',
          fileType: 'pdf',
          extractionStatus: 'completed',
          extractedText: 'CBC Report: Hemoglobin 11.2 g/dL, Platelets 180,000 /uL, WBC 7,200 /uL'
        }
      ],
      language: 'en'
    })
  })
  assert(summaryWithDocsRes.status === 200, 'POST /api/ai/summary with documents returns HTTP 200')
  const summaryWithDocsData = await summaryWithDocsRes.json()
  assert(summaryWithDocsData.status === 'success', 'Summary with docs returns status success')
  const sWith = summaryWithDocsData.data.summary
  console.log('     priorInvestigations:', sWith.priorInvestigations)
  console.log('     additionalNotes:', sWith.additionalNotes)
  assert(
    sWith.priorInvestigations.toLowerCase().includes('hemoglobin') ||
    sWith.priorInvestigations.toLowerCase().includes('cbc') ||
    sWith.priorInvestigations.toLowerCase().includes('platelet'),
    'Document lab findings incorporated into priorInvestigations'
  )
  assert(
    sWith.additionalNotes.includes('lab_report.pdf'),
    'Contributing document name cited in additionalNotes'
  )

  // 13. Conflicting interview vs document information preserved rather than silently resolved
  console.log('\n--- Test 13: Conflicting Interview vs Document Information Handling ---')
  const conflictSummaryRes = await fetch('http://localhost:5000/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation: [
        { role: 'assistant', content: 'What brings you in?' },
        { role: 'user', content: 'Routine checkup' },
        { role: 'assistant', content: 'What regular medications do you take?' },
        { role: 'user', content: 'I take amlodipine 5mg daily for blood pressure' }
      ],
      documents: [
        {
          originalName: 'discharge_slip.pdf',
          fileType: 'pdf',
          extractionStatus: 'completed',
          extractedText: 'Discharge Medications: Losartan 50mg OD'
        }
      ],
      language: 'en'
    })
  })
  assert(conflictSummaryRes.status === 200, 'Summary with conflicting medication returns HTTP 200')
  const conflictData = await conflictSummaryRes.json()
  const sConflict = conflictData.data.summary
  console.log('     medications:', sConflict.medications)
  console.log('     additionalNotes:', sConflict.additionalNotes)
  const combinedMedsAndNotes = `${sConflict.medications} ${sConflict.additionalNotes}`.toLowerCase()
  assert(
    combinedMedsAndNotes.includes('amlodipine') && combinedMedsAndNotes.includes('losartan'),
    'Both conflicting medications (amlodipine & losartan) are preserved without silent elimination'
  )

  // Validation: non-array documents rejected with HTTP 400
  console.log('\n--- Route Validation: Invalid documents type ---')
  const invalidDocRes = await fetch('http://localhost:5000/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation: conversationBase,
      documents: 'invalid_not_an_array'
    })
  })
  assert(invalidDocRes.status === 400, 'Rejects non-array documents with HTTP 400')

  // 16. POST /api/ai/chat still works
  console.log('\n--- Test 16: Existing POST /api/ai/chat endpoint regression check ---')
  const chatRes = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'I have severe headache',
      language: 'en'
    })
  })
  assert(chatRes.status === 200, 'POST /api/ai/chat returns HTTP 200')
  const chatData = await chatRes.json()
  assert(chatData.status === 'success' && chatData.data.reply, 'AI chat generates valid reply')

  // 17. POST /api/ai/test still works
  console.log('\n--- Test 17: Existing POST /api/ai/test endpoint regression check ---')
  const testRes = await fetch('http://localhost:5000/api/ai/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Ping test', language: 'en' })
  })
  assert(testRes.status === 200, 'POST /api/ai/test returns HTTP 200')

  // 18. GET /api/health still works
  console.log('\n--- Test 18: Existing GET /api/health regression check ---')
  const healthRes = await fetch('http://localhost:5000/api/health')
  assert(healthRes.status === 200, 'GET /api/health returns HTTP 200')
  const healthData = await healthRes.json()
  assert(healthData.status === 'ok', 'Health status is ok')

  // 19. GET /api/cases still works
  console.log('\n--- Test 19: Existing GET /api/cases regression check ---')
  const casesRes = await fetch('http://localhost:5000/api/cases')
  assert(casesRes.status === 200, 'GET /api/cases returns HTTP 200')
  const casesData = await casesRes.json()
  assert(casesData.status === 'success' && Array.isArray(casesData.data), 'Cases retrieved successfully')

  // 20. No API credentials appear in source/test responses
  console.log('\n--- Test 20: Security - No API keys leaked ---')
  const responsesToCheck = [
    JSON.stringify(summaryWithoutDocsData),
    JSON.stringify(summaryWithDocsData),
    JSON.stringify(conflictData),
    JSON.stringify(chatData)
  ]
  const apiKeyExposed = responsesToCheck.some(
    (str) => str.includes('gsk_') || str.includes('AIza') || str.includes('GROQ_API_KEY')
  )
  assert(!apiKeyExposed, 'Zero API keys or provider credentials leaked in any response')

  console.log(`\n========================================`)
  console.log(`TOTAL: ${passedTests + failedTests} tests | PASSED: ${passedTests} | FAILED: ${failedTests}`)
  console.log(`========================================`)
  if (failedTests > 0) {
    process.exit(1)
  }
}

runTests().catch((e) => {
  console.error('Acceptance test run crashed:', e)
  process.exit(1)
})
