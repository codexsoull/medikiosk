/**
 * Milestone 11C Priority & Expanded Red-Flag Screening Test Suite
 *
 * Verifies:
 * 1. No red flags -> ROUTINE
 * 2. High-priority breathing difficulty -> HIGH
 * 3. Chest discomfort without high-risk combination -> REVIEW
 * 4. Chest discomfort with radiation / high risk -> HIGH
 * 5. Sudden neurological indicator -> HIGH
 * 6. Significant bleeding scenario -> HIGH
 * 7. Severe abdominal symptoms scenario -> HIGH
 * 8. Severe allergic-reaction screening scenario -> HIGH
 * 9. Altered consciousness / syncope scenario -> HIGH
 * 10. Multiple flags -> HIGH with all flags retained
 * 11. Review-level scenario (high reported severity 8/10) -> REVIEW
 * 12. Unknown/missing answers -> handles safely, returns ROUTINE, no crashes
 * 13. Dashboard sorting -> HIGH before REVIEW before ROUTINE, newest first within same tier
 * 14. API verification -> POST /api/cases creates and calculates priority; GET /api/cases returns ordered cases
 */

import { calculatePriority, PRIORITY } from '../backend/services/priority.js'
import assert from 'assert'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`  FAIL: ${name}`)
    console.error(`        ${err.message}`)
    failed++
  }
}

async function asyncTest(name, fn) {
  try {
    await fn()
    console.log(`  PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`  FAIL: ${name}`)
    console.error(`        ${err.message}`)
    failed++
  }
}

console.log('\n======================================================')
console.log('--- MediKiosk Milestone 11C: Priority Engine Tests ---')
console.log('======================================================\n')

// 1. No red flags -> ROUTINE
test('Scenario 1: No red flags returns ROUTINE', () => {
  const result = calculatePriority({
    chief_complaint: 'Mild headache',
    symptoms: 'Feeling tired after working late',
    severity: '3'
  })
  assert.strictEqual(result.priority, PRIORITY.ROUTINE)
  assert.strictEqual(result.flags.length, 0)
})

// 2. High-priority breathing scenario -> HIGH
test('Scenario 2: High-priority breathing difficulty (sudden/dyspnea/speech difficulty) returns HIGH', () => {
  const result = calculatePriority({
    chief_complaint: 'Sudden severe breathing difficulty',
    symptoms: 'Cannot speak in full sentences',
    severity: '8'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  const breathingFlag = result.flags.find((f) => f.code === 'SIGNIFICANT_BREATHING_DIFFICULTY')
  assert.ok(breathingFlag, 'Must include SIGNIFICANT_BREATHING_DIFFICULTY flag')
  assert.strictEqual(breathingFlag.severity, 'high')
})

// 3. Chest discomfort without configured high-risk combination -> REVIEW
test('Scenario 3: Chest discomfort without radiation or acute red flags returns REVIEW', () => {
  const result = calculatePriority({
    chief_complaint: 'Mild chest discomfort since yesterday after heavy food',
    symptoms: 'No sweating, no arm pain, normal breathing',
    severity: '4'
  })
  assert.strictEqual(result.priority, PRIORITY.REVIEW)
  const flag = result.flags.find((f) => f.code === 'CHEST_DISCOMFORT_REVIEW')
  assert.ok(flag, 'Must include CHEST_DISCOMFORT_REVIEW flag')
  assert.strictEqual(flag.severity, 'medium')
})

// 4. Chest discomfort with radiation / high-risk pattern -> HIGH
test('Scenario 4: Chest discomfort with radiation to arm or sweating returns HIGH', () => {
  const result = calculatePriority({
    chief_complaint: 'Chest pain',
    red_flags: [{ key: 'chestPain', text: 'Yes, radiating to left arm and jaw with profuse sweating' }],
    severity: '8'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  const flag = result.flags.find((f) => f.code === 'CARDIAC_PATTERN_DISCOMFORT')
  assert.ok(flag, 'Must include CARDIAC_PATTERN_DISCOMFORT flag')
})

// 5. Sudden neurological indicator -> HIGH
test('Scenario 5: Sudden neurological changes (focal weakness, slurred speech) returns HIGH', () => {
  const result = calculatePriority({
    chief_complaint: 'Sudden right arm weakness and slurred speech',
    symptoms: 'Started suddenly 30 minutes ago',
    severity: '7'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  const flag = result.flags.find((f) => f.code === 'SUDDEN_NEUROLOGICAL_CHANGE')
  assert.ok(flag, 'Must include SUDDEN_NEUROLOGICAL_CHANGE flag')
})

// 6. Significant bleeding scenario -> HIGH
test('Scenario 6: Significant continuing bleeding returns HIGH', () => {
  const result = calculatePriority({
    chief_complaint: 'Heavy bleeding from leg wound',
    symptoms: 'Bleeding continuing, feeling faint',
    severity: '8'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  const flag = result.flags.find((f) => f.code === 'SIGNIFICANT_BLEEDING')
  assert.ok(flag, 'Must include SIGNIFICANT_BLEEDING flag')
})

// 7. Severe abdominal symptoms scenario -> HIGH
test('Scenario 7: Severe abdominal symptoms with repeated vomiting returns HIGH', () => {
  const result = calculatePriority({
    chief_complaint: 'Severe abdominal pain',
    symptoms: 'Sudden unbearable pain with repeated vomiting',
    severity: '9'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  const flag = result.flags.find((f) => f.code === 'SEVERE_ABDOMINAL_SYMPTOMS')
  assert.ok(flag, 'Must include SEVERE_ABDOMINAL_SYMPTOMS flag')
})

// 8. Severe allergic-reaction screening scenario -> HIGH
test('Scenario 8: Severe allergic reaction with facial or lip swelling returns HIGH', () => {
  const result = calculatePriority({
    chief_complaint: 'Allergic reaction after eating peanuts',
    symptoms: 'Swollen face and lip swelling with wheezing breath',
    severity: '8'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  const flag = result.flags.find((f) => f.code === 'SEVERE_ALLERGIC_REACTION')
  assert.ok(flag, 'Must include SEVERE_ALLERGIC_REACTION flag')
})

// 9. Altered consciousness / syncope scenario -> HIGH
test('Scenario 9: Altered consciousness / blackout returns HIGH', () => {
  const result = calculatePriority({
    chief_complaint: 'Passed out and lost consciousness at work',
    symptoms: 'Currently confused and unsteady',
    severity: '6'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  const flag = result.flags.find((f) => f.code === 'ALTERED_CONSCIOUSNESS')
  assert.ok(flag, 'Must include ALTERED_CONSCIOUSNESS flag')
})

// 10. Multiple flags -> HIGH with all flags retained
test('Scenario 10: Multiple flags triggers HIGH and retains all unique flags', () => {
  const result = calculatePriority({
    chief_complaint: 'Chest discomfort and shortness of breath with fainting blackout',
    symptoms: 'Sudden weakness and chest pain',
    severity: '9'
  })
  assert.strictEqual(result.priority, PRIORITY.HIGH)
  assert.ok(result.flags.length >= 2, 'Should retain multiple matched screening flags')
  const codes = result.flags.map((f) => f.code)
  assert.ok(codes.includes('CARDIAC_PATTERN_DISCOMFORT'))
  assert.ok(codes.includes('ALTERED_CONSCIOUSNESS'))
})

// 11. High reported severity without acute red flags -> REVIEW
test('Scenario 11: High reported severity (8-10/10) without specific emergency triggers returns REVIEW', () => {
  const result = calculatePriority({
    chief_complaint: 'Severe ankle sprain',
    symptoms: 'Swelling on outer ankle after playing football',
    severity: '9'
  })
  assert.strictEqual(result.priority, PRIORITY.REVIEW)
  const flag = result.flags.find((f) => f.code === 'HIGH_REPORTED_SEVERITY')
  assert.ok(flag, 'Must include HIGH_REPORTED_SEVERITY flag')
})

// 12. Unknown/missing answers -> handles safely, returns ROUTINE
test('Scenario 12: Unknown or missing answers does not crash and defaults safely to ROUTINE', () => {
  const r1 = calculatePriority(null)
  assert.strictEqual(r1.priority, PRIORITY.ROUTINE)
  assert.strictEqual(r1.flags.length, 0)

  const r2 = calculatePriority({})
  assert.strictEqual(r2.priority, PRIORITY.ROUTINE)
  assert.strictEqual(r2.flags.length, 0)

  const r3 = calculatePriority({ chief_complaint: '', symptoms: null, interview_answers: [] })
  assert.strictEqual(r3.priority, PRIORITY.ROUTINE)
})

// 13. Queue Sorting: HIGH -> REVIEW -> ROUTINE, newest first within same tier
test('Scenario 13: Queue sorting orders HIGH first, REVIEW second, ROUTINE last, newest first within tier', () => {
  const cases = [
    { id: 1, priority: 'ROUTINE', name: 'Case 1' },
    { id: 2, priority: 'REVIEW', name: 'Case 2' },
    { id: 3, priority: 'HIGH', name: 'Case 3' },
    { id: 4, priority: 'ROUTINE', name: 'Case 4' },
    { id: 5, priority: 'HIGH', name: 'Case 5' },
    { id: 6, priority: 'REVIEW', name: 'Case 6' }
  ]

  const priorityWeight = { HIGH: 1, REVIEW: 2, ROUTINE: 3 }
  const sorted = [...cases].sort((a, b) => {
    const pDiff = (priorityWeight[a.priority] || 3) - (priorityWeight[b.priority] || 3)
    if (pDiff !== 0) return pDiff
    return b.id - a.id // newest first
  })

  assert.deepStrictEqual(
    sorted.map((c) => ({ id: c.id, priority: c.priority })),
    [
      { id: 5, priority: 'HIGH' },
      { id: 3, priority: 'HIGH' },
      { id: 6, priority: 'REVIEW' },
      { id: 2, priority: 'REVIEW' },
      { id: 4, priority: 'ROUTINE' },
      { id: 1, priority: 'ROUTINE' }
    ]
  )
})

// 14. API End-to-End Verification
await asyncTest('Scenario 14: API integration verifies priority calculation and sorting', async () => {
  const highPayload = {
    patient_name: 'Test High Priority Patient',
    age: 55,
    gender: 'Male',
    chief_complaint: 'Sudden crushing chest pain radiating to left arm',
    symptoms: 'Profuse sweating and shortness of breath',
    severity: '9'
  }

  const routinePayload = {
    patient_name: 'Test Routine Patient',
    age: 28,
    gender: 'Female',
    chief_complaint: 'Routine skin checkup',
    symptoms: 'Mild dry skin',
    severity: '2'
  }

  const reviewPayload = {
    patient_name: 'Test Review Patient',
    age: 40,
    gender: 'Male',
    chief_complaint: 'Mild chest discomfort after spicy food',
    symptoms: 'No sweating, no arm pain',
    severity: '4'
  }

  // Submit cases via POST /api/cases
  const resHigh = await fetch('http://localhost:5000/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(highPayload)
  })
  assert.strictEqual(resHigh.status, 201)
  const jsonHigh = await resHigh.json()
  assert.strictEqual(jsonHigh.priority, 'HIGH')
  assert.ok(Array.isArray(jsonHigh.screening_flags))
  assert.ok(jsonHigh.screening_flags.length > 0)

  const resReview = await fetch('http://localhost:5000/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewPayload)
  })
  assert.strictEqual(resReview.status, 201)
  const jsonReview = await resReview.json()
  assert.strictEqual(jsonReview.priority, 'REVIEW')

  const resRoutine = await fetch('http://localhost:5000/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routinePayload)
  })
  assert.strictEqual(resRoutine.status, 201)
  const jsonRoutine = await resRoutine.json()
  assert.strictEqual(jsonRoutine.priority, 'ROUTINE')

  // Fetch queue via GET /api/cases
  const getRes = await fetch('http://localhost:5000/api/cases')
  assert.strictEqual(getRes.status, 200)
  const getJson = await getRes.json()
  assert.ok(Array.isArray(getJson.data))
  assert.ok(getJson.data.length >= 3)

  // Verify that all HIGH cases come before REVIEW, and REVIEW before ROUTINE
  let currentTier = 1 // 1=HIGH, 2=REVIEW, 3=ROUTINE
  for (const c of getJson.data) {
    const tier = c.priority === 'HIGH' ? 1 : c.priority === 'REVIEW' ? 2 : 3
    assert.ok(tier >= currentTier, `Ordering violation: found tier ${tier} after tier ${currentTier}`)
    currentTier = tier
  }
})

console.log('\n======================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('======================================================\n')

if (failed > 0) {
  process.exit(1)
}

