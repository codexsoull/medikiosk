/**
 * Comprehensive Acceptance Test Suite for Milestone 9.2: Doctor Document Evidence & Review
 * Validates SQLite persistence of documents, backend API retrieval, frontend mapping,
 * DoctorCase UI rendering, security, and full regression.
 */

import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { mapBackendCaseToFrontend } from '../src/api/cases.js'

const BASE_URL = 'http://localhost:5000'
const WORKSPACE_DIR = 'c:/Users/adiis/Desktop/New folder/medikiosk'

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    // raw text
  }
  return { status: res.status, data, text }
}

async function runMilestone9_2Tests() {
  console.log('🧪 Starting Milestone 9.2 Acceptance Tests (Doctor Document Evidence & Review)...\n')
  let passedCount = 0

  // 1. Existing case creation without documents still works
  console.log('--- Test 1: Case creation without documents ---')
  const case1Payload = {
    patient_name: 'Ananya Verma',
    age: 34,
    gender: 'Female',
    mobile: '9876543210',
    chief_complaint: 'Routine checkup',
    ai_summary: { chiefComplaint: 'Routine checkup', isAiDraft: true }
  }
  const res1 = await requestJson(`${BASE_URL}/api/cases`, {
    method: 'POST',
    body: JSON.stringify(case1Payload)
  })
  assert.strictEqual(res1.status, 201, 'Case without documents should return 201')
  assert.strictEqual(res1.data?.status, 'success', 'Status should be success')
  assert.ok(res1.data?.case_id, 'Generated case_id should exist')
  assert.deepStrictEqual(res1.data?.data?.documents, [], 'Case without documents should resolve to documents: []')
  console.log(`  ✅ PASS: Case without documents created with ID: ${res1.data.case_id}`)
  passedCount++

  // 2. Case can contain documents array
  console.log('\n--- Test 2, 3, 4: Case creation with documents array, metadata & text persistence ---')
  const case2Payload = {
    patient_name: 'Rajesh Kumar',
    age: 52,
    gender: 'Male',
    mobile: '9812345678',
    chief_complaint: 'Chest discomfort and shortness of breath',
    symptoms: 'Mild pain radiating to shoulder',
    medical_history: 'Hypertension',
    medications: 'Amlodipine 5mg',
    allergies: 'No known allergies',
    ai_summary: {
      chiefComplaint: 'Chest discomfort',
      historyOfPresentIllness: 'Mild pain radiating to shoulder',
      medications: 'Amlodipine 5mg',
      isAiDraft: true
    },
    clinical_alerts: [
      { key: 'chestPain', severity: 'high', text: 'Chest pain reported' }
    ],
    documents: [
      {
        originalName: 'cardiac_ecg_report.pdf',
        mimeType: 'application/pdf',
        fileType: 'pdf',
        category: 'pdf',
        size: 148500,
        extractionStatus: 'completed',
        extractedText: 'ECG Report: Normal sinus rhythm, HR 72 bpm, ST segments normal, no acute ischemic changes.',
        characterCount: 92,
        extractionMethod: 'pdf-text',
        processedAt: '2026-09-09T10:00:00.000Z'
      }
    ]
  }

  const res2 = await requestJson(`${BASE_URL}/api/cases`, {
    method: 'POST',
    body: JSON.stringify(case2Payload)
  })
  assert.strictEqual(res2.status, 201, 'Case with documents should return 201')
  const createdCaseId = res2.data?.case_id
  assert.ok(createdCaseId, 'Created case should have case_id')
  const createdDocs = res2.data?.data?.documents
  assert.ok(Array.isArray(createdDocs), 'Returned documents should be an array')
  assert.strictEqual(createdDocs.length, 1, 'Should contain 1 persisted document')
  assert.strictEqual(createdDocs[0].originalName, 'cardiac_ecg_report.pdf', 'Document originalName persisted')
  assert.strictEqual(createdDocs[0].fileType, 'pdf', 'Document fileType persisted')
  assert.strictEqual(createdDocs[0].extractionMethod, 'pdf-text', 'Document extractionMethod persisted')
  assert.strictEqual(createdDocs[0].extractionStatus, 'completed', 'Document extractionStatus persisted')
  assert.strictEqual(createdDocs[0].characterCount, 92, 'Character count persisted')
  assert.ok(createdDocs[0].extractedText.includes('Normal sinus rhythm'), 'Extracted text persisted')
  console.log(`  ✅ PASS (2): Case with documents array created (${createdCaseId})`)
  passedCount++
  console.log('  ✅ PASS (3): Document metadata persisted')
  passedCount++
  console.log('  ✅ PASS (4): Extracted text persisted')
  passedCount++

  // 5. GET /api/cases/:id returns documents
  console.log('\n--- Test 5: GET /api/cases/:id returns persisted documents ---')
  const fetchRes = await requestJson(`${BASE_URL}/api/cases/${createdCaseId}`)
  assert.strictEqual(fetchRes.status, 200, 'GET case should return 200')
  const fetchedDocs = fetchRes.data?.data?.documents
  assert.ok(Array.isArray(fetchedDocs), 'Fetched case documents must be array')
  assert.strictEqual(fetchedDocs.length, 1, 'Fetched documents length must match')
  assert.strictEqual(fetchedDocs[0].originalName, 'cardiac_ecg_report.pdf')
  assert.strictEqual(fetchedDocs[0].extractedText, 'ECG Report: Normal sinus rhythm, HR 72 bpm, ST segments normal, no acute ischemic changes.')
  console.log('  ✅ PASS (5): GET /api/cases/:id returned persisted documents with extracted text')
  passedCount++

  // 6. Existing cases without documents return documents: []
  console.log('\n--- Test 6: Existing cases without documents return documents: [] ---')
  const fetchRes1 = await requestJson(`${BASE_URL}/api/cases/${res1.data.case_id}`)
  assert.strictEqual(fetchRes1.status, 200)
  assert.deepStrictEqual(fetchRes1.data?.data?.documents, [], 'Older case returns empty documents array')
  console.log('  ✅ PASS (6): Case without documents safely returns documents: []')
  passedCount++

  // 7, 8, 9, 10, 11: Multiple documents (PDF, OCR, pending, failed)
  console.log('\n--- Test 7, 8, 9, 10, 11: Multi-format and multi-status documents persistence ---')
  const multiDocsPayload = {
    patient_name: 'Sunita Sharma',
    age: 48,
    gender: 'Female',
    mobile: '9988776655',
    chief_complaint: 'Joint pain and fever',
    documents: [
      {
        originalName: 'cbc_blood_test.pdf',
        mimeType: 'application/pdf',
        fileType: 'pdf',
        size: 210000,
        extractionStatus: 'completed',
        extractedText: 'WBC: 6,800 /uL, RBC: 4.5 M/uL, Hemoglobin: 13.1 g/dL, Platelets: 240,000 /uL',
        characterCount: 77,
        extractionMethod: 'pdf-text',
        processedAt: '2026-09-09T10:15:00.000Z'
      },
      {
        originalName: 'prescription_scan.webp',
        mimeType: 'image/webp',
        fileType: 'image',
        size: 85000,
        extractionStatus: 'completed',
        extractedText: 'Rx: Tab Paracetamol 650mg TDS x 3 days, Tab Ibuprofen 400mg BD x 2 days',
        characterCount: 71,
        extractionMethod: 'ocr',
        processedAt: '2026-09-09T10:15:30.000Z'
      },
      {
        originalName: 'radiology_scan.jpg',
        mimeType: 'image/jpeg',
        fileType: 'image',
        size: 1500000,
        extractionStatus: 'pending',
        extractedText: '',
        characterCount: 0,
        extractionMethod: 'ocr',
        processedAt: '2026-09-09T10:16:00.000Z'
      },
      {
        originalName: 'blurry_slip.png',
        mimeType: 'image/png',
        fileType: 'image',
        size: 45000,
        extractionStatus: 'failed',
        extractedText: '',
        characterCount: 0,
        extractionMethod: 'ocr',
        processedAt: '2026-09-09T10:16:30.000Z'
      }
    ]
  }

  const multiRes = await requestJson(`${BASE_URL}/api/cases`, {
    method: 'POST',
    body: JSON.stringify(multiDocsPayload)
  })
  assert.strictEqual(multiRes.status, 201, 'Multiple docs case creation returns 201')
  const multiDocs = multiRes.data?.data?.documents
  assert.strictEqual(multiDocs.length, 4, 'All 4 documents should be persisted')
  console.log('  ✅ PASS (7): Multiple documents persist correctly')
  passedCount++

  // PDF
  assert.strictEqual(multiDocs[0].originalName, 'cbc_blood_test.pdf')
  assert.strictEqual(multiDocs[0].extractionMethod, 'pdf-text')
  assert.strictEqual(multiDocs[0].extractionStatus, 'completed')
  console.log('  ✅ PASS (8): PDF document metadata survives persistence')
  passedCount++

  // OCR
  assert.strictEqual(multiDocs[1].originalName, 'prescription_scan.webp')
  assert.strictEqual(multiDocs[1].extractionMethod, 'ocr')
  assert.strictEqual(multiDocs[1].extractionStatus, 'completed')
  console.log('  ✅ PASS (9): OCR document metadata survives persistence')
  passedCount++

  // Pending
  assert.strictEqual(multiDocs[2].originalName, 'radiology_scan.jpg')
  assert.strictEqual(multiDocs[2].extractionStatus, 'pending')
  console.log('  ✅ PASS (10): Pending documents survive persistence')
  passedCount++

  // Failed
  assert.strictEqual(multiDocs[3].originalName, 'blurry_slip.png')
  assert.strictEqual(multiDocs[3].extractionStatus, 'failed')
  console.log('  ✅ PASS (11): Failed documents survive persistence')
  passedCount++

  // 12. Security & Performance: No binary/base64 content in responses
  console.log('\n--- Test 12: No binary/base64 payload in case response ---')
  const multiRawText = JSON.stringify(multiRes.data)
  assert.ok(!multiRawText.includes('base64'), 'No base64 field in response')
  assert.ok(!multiRawText.includes('data:application'), 'No data URLs in response')
  assert.ok(!multiRawText.includes('data:image'), 'No image data URLs in response')
  console.log('  ✅ PASS: Zero binary or base64 data returned in case responses')
  passedCount++

  // 13. Security: No API keys leaked
  console.log('\n--- Test 13: Zero API keys or secrets leaked ---')
  const groqKey = process.env.GROQ_API_KEY || ''
  if (groqKey && groqKey.length > 8) {
    assert.ok(!multiRawText.includes(groqKey), 'GROQ_API_KEY must not be in response')
  }
  assert.ok(!multiRawText.includes('GROQ_API_KEY'), 'No key environment variable name in response')
  console.log('  ✅ PASS: No API keys or environment secrets exposed')
  passedCount++

  // 14 & 15: DoctorCase UI document rendering & View Extracted Text
  console.log('\n--- Test 14: DoctorCase document rendering logic ---')
  const doctorCaseSrc = fs.readFileSync(path.join(WORKSPACE_DIR, 'src/screens/DoctorCase.jsx'), 'utf8')
  assert.ok(doctorCaseSrc.includes('physician-records-panel'), 'DoctorCase includes physician-records-panel')
  assert.ok(doctorCaseSrc.includes('physician-docs-grid'), 'DoctorCase includes physician-docs-grid')
  assert.ok(doctorCaseSrc.includes('Patient Uploaded • View Only'), 'DoctorCase displays view-only evidence badge')
  console.log('  ✅ PASS (14): DoctorCase contains document rendering logic')
  passedCount++

  console.log('\n--- Test 15: DoctorCase View Extracted Text interaction ---')
  assert.ok(doctorCaseSrc.includes('View Extracted Text'), 'DoctorCase has View Extracted Text button text')
  assert.ok(doctorCaseSrc.includes('activeDocumentForModal'), 'DoctorCase manages activeDocumentForModal state')
  assert.ok(doctorCaseSrc.includes('extracted-text-modal-card'), 'DoctorCase renders modal dialog for extracted text')
  assert.ok(doctorCaseSrc.includes('extracted-text-content'), 'DoctorCase renders preformatted extracted text')
  console.log('  ✅ PASS (15): View Extracted Text interaction and modal exist')
  passedCount++

  // 16: Frontend mapping robustness (mapBackendCaseToFrontend)
  console.log('\n--- Test 16: mapBackendCaseToFrontend safe normalization ---')
  // Null row
  assert.strictEqual(mapBackendCaseToFrontend(null), null)

  // Missing documents
  const mapped1 = mapBackendCaseToFrontend({ id: 10, patient_name: 'Test' })
  assert.deepStrictEqual(mapped1.documents, [], 'Missing documents maps to []')

  // Corrupted string documents
  const mapped2 = mapBackendCaseToFrontend({ id: 11, patient_name: 'Test', documents: '{invalid json' })
  assert.deepStrictEqual(mapped2.documents, [], 'Corrupted json maps to []')

  // Non-array documents
  const mapped3 = mapBackendCaseToFrontend({ id: 12, patient_name: 'Test', documents: { notAnArray: true } })
  assert.deepStrictEqual(mapped3.documents, [], 'Non-array object maps to []')

  // Array with partial documents
  const mapped4 = mapBackendCaseToFrontend({
    id: 13,
    patient_name: 'Test',
    documents: [
      null,
      { originalName: 'test.pdf', extractedText: 'Hello world', size: 10240, extractionStatus: 'completed' },
      { name: 'scan.png', extractionStatus: 'failed' }
    ]
  })
  assert.strictEqual(mapped4.documents.length, 2, 'Maps only valid document objects')
  assert.strictEqual(mapped4.documents[0].originalName, 'test.pdf')
  assert.strictEqual(mapped4.documents[0].formattedSize, '10.0 KB')
  assert.strictEqual(mapped4.documents[0].characterCount, 11)
  assert.strictEqual(mapped4.documents[1].originalName, 'scan.png')
  assert.strictEqual(mapped4.documents[1].extractionStatus, 'failed')
  assert.strictEqual(mapped4.documents[1].extractedText, '')
  console.log('  ✅ PASS (16): mapBackendCaseToFrontend normalizes missing, null, corrupted, and partial docs safely')
  passedCount++

  // 17 & 18: Existing AI summary and doctor notes intact
  console.log('\n--- Test 17 & 18: Existing AI summary and doctor notes remain intact ---')
  assert.ok(fetchRes.data?.data?.ai_summary, 'AI summary is present on retrieved case')
  assert.strictEqual(fetchRes.data?.data?.ai_summary?.chiefComplaint, 'Chest discomfort')
  console.log('  ✅ PASS (17): Existing AI summary remains intact')
  passedCount++

  assert.strictEqual(fetchRes.data?.data?.medications, 'Amlodipine 5mg')
  console.log('  ✅ PASS (18): Existing clinical fields & doctor notes remain intact')
  passedCount++

  // 19: Existing PATCH /api/cases/:id status update works
  console.log('\n--- Test 19: Updating case status and doctor notes via PATCH /api/cases/:id ---')
  const patchRes = await requestJson(`${BASE_URL}/api/cases/${createdCaseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      case_status: 'accepted',
      doctor_notes: 'Reviewed ECG and patient history. Scheduled for stress test.'
    })
  })
  assert.strictEqual(patchRes.status, 200, 'PATCH should return 200')
  assert.strictEqual(patchRes.data?.data?.case_status, 'accepted')
  assert.strictEqual(patchRes.data?.data?.doctor_notes, 'Reviewed ECG and patient history. Scheduled for stress test.')
  // Documents must still be present after patch!
  assert.strictEqual(patchRes.data?.data?.documents?.length, 1, 'Documents preserved after status update')
  console.log('  ✅ PASS: Case updated to accepted and doctor notes persisted without losing documents')
  passedCount++

  // 20: GET /api/health still works
  console.log('\n--- Test 20: GET /api/health regression ---')
  const healthRes = await requestJson(`${BASE_URL}/api/health`)
  assert.strictEqual(healthRes.status, 200)
  assert.strictEqual(healthRes.data?.status, 'ok')
  console.log('  ✅ PASS: GET /api/health returns 200 ok')
  passedCount++

  // 21: POST /api/ai/chat still works
  console.log('\n--- Test 21: POST /api/ai/chat regression ---')
  const chatRes = await requestJson(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({
      message: 'I have had a mild headache since this morning.',
      language: 'en',
      conversation: []
    })
  })
  assert.strictEqual(chatRes.status, 200)
  assert.ok(chatRes.data?.data?.reply, 'Chat returns AI reply')
  console.log('  ✅ PASS: POST /api/ai/chat functional')
  passedCount++

  // 22: POST /api/ai/summary still works
  console.log('\n--- Test 22: POST /api/ai/summary regression ---')
  const summaryRes = await requestJson(`${BASE_URL}/api/ai/summary`, {
    method: 'POST',
    body: JSON.stringify({
      conversation: [
        { role: 'user', content: 'Severe migraine since yesterday' },
        { role: 'user', content: 'No known drug allergies' }
      ],
      language: 'en'
    })
  })
  assert.strictEqual(summaryRes.status, 200)
  assert.ok(summaryRes.data?.data?.summary?.chiefComplaint, 'Summary has chiefComplaint')
  console.log('  ✅ PASS: POST /api/ai/summary functional')
  passedCount++

  // 23: Milestone 8.2 OCR pipeline check
  console.log('\n--- Test 23: Milestone 8.2 Document extraction endpoint check ---')
  const samplePdfBase64 = 'JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0gL0NvbnRlbnRzIDQgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggNTEgPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihQYXRpZW50IFJlcG9ydDogSGVtb2dsb2JpbiAxNC4yKSBUagogRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTI1IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA1IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgozMjYKJSVFT0YK'
  const docRes = await requestJson(`${BASE_URL}/api/documents/process`, {
    method: 'POST',
    body: JSON.stringify({
      originalName: 'test_report.pdf',
      mimeType: 'application/pdf',
      size: 400,
      content: samplePdfBase64
    })
  })
  assert.strictEqual(docRes.status, 200)
  assert.strictEqual(docRes.data?.data?.extractionStatus, 'completed')
  assert.ok(docRes.data?.data?.extractedText.includes('Hemoglobin 14.2'), 'PDF text extracted successfully')
  console.log('  ✅ PASS: Milestone 8.2 text extraction functional')
  passedCount++

  // 24: Milestone 9.1 document-aware summary check
  console.log('\n--- Test 24: Milestone 9.1 document-aware summary endpoint check ---')
  const docSummaryRes = await requestJson(`${BASE_URL}/api/ai/summary`, {
    method: 'POST',
    body: JSON.stringify({
      conversation: [
        { role: 'user', content: 'I have fever since two days' }
      ],
      documents: [
        {
          originalName: 'cbc.pdf',
          fileType: 'pdf',
          extractionStatus: 'completed',
          extractedText: 'Platelet count: 185,000 /uL, WBC: 8,400 /uL'
        }
      ],
      language: 'en'
    })
  })
  assert.strictEqual(docSummaryRes.status, 200)
  assert.ok(docSummaryRes.data?.data?.summary?.priorInvestigations, 'Prior investigations synthesizes document data')
  console.log('  ✅ PASS: Milestone 9.1 document-aware summary functional')
  passedCount++

  console.log('\n========================================')
  console.log(`TOTAL: 24 acceptance criteria | PASSED: ${passedCount} | FAILED: 0`)
  console.log('========================================\n')
}

runMilestone9_2Tests().catch((err) => {
  console.error('\n❌ Milestone 9.2 Acceptance Test Failed:', err)
  process.exit(1)
})
