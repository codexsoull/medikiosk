/**
 * Test Suite: Required Clinical History Coverage in MediKiosk
 * Tests:
 * 1. Clinical sections mapping, completion detection, and sequence ordering
 * 2. Intent recognition for allergies, family history, personal history, medications, PMH
 * 3. Fallback questions and quick suggestions for all 8 sections in English & Hindi
 * 4. Guard against early finish when required sections are missing
 * 5. Backend /api/ai/chat validation of currentSection and echo
 * 6. Backend /api/ai/summary handling of explicit negative denials vs "Not reported"
 * 7. MockCase fallback summary integration with answersByIndex 7, 8, 9
 * 8. Red flag precedence preservation
 */

import {
  CLINICAL_SECTIONS,
  mapIndexToSection,
  isSectionCompleted,
  getInterviewSectionStatus,
  getNextIncompleteSection,
  getFallbackQuestionForSection,
  getQuickSuggestionsForSection
} from 'file:///C:/Users/adiis/Desktop/New folder/medikiosk/src/data/clinicalSections.js'
import { generateStructuredSummaryFromAnswers } from 'file:///C:/Users/adiis/Desktop/New folder/medikiosk/src/data/mockCase.js'
import { detectRedFlagTrigger } from 'file:///C:/Users/adiis/Desktop/New folder/medikiosk/src/data/redFlags.js'

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
  console.log('=== Test Group 1: Clinical Sections Definition & Mapping ===')
  assert(Array.isArray(CLINICAL_SECTIONS) && CLINICAL_SECTIONS.length === 8, '8 required clinical sections defined')
  assert(CLINICAL_SECTIONS.includes('allergies'), 'Includes allergies')
  assert(CLINICAL_SECTIONS.includes('familyHistory'), 'Includes familyHistory')
  assert(CLINICAL_SECTIONS.includes('personalHistory'), 'Includes personalHistory')

  assert(mapIndexToSection(0) === 'chiefComplaint', 'Index 0 maps to chiefComplaint')
  assert(mapIndexToSection(1) === 'hpi', 'Index 1 maps to hpi')
  assert(mapIndexToSection(4) === 'pastMedicalHistory', 'Index 4 maps to pastMedicalHistory')
  assert(mapIndexToSection(5) === 'medications', 'Index 5 maps to medications')
  assert(mapIndexToSection(6) === 'allergies', 'Index 6 maps to allergies')
  assert(mapIndexToSection(7) === 'familyHistory', 'Index 7 maps to familyHistory')
  assert(mapIndexToSection(8) === 'personalHistory', 'Index 8 maps to personalHistory')
  assert(mapIndexToSection(9) === 'reviewOfSystems', 'Index 9 maps to reviewOfSystems')

  console.log('\n=== Test Group 2: Section Status & Sequential Ordering ===')
  const emptyConvo = []
  assert(getNextIncompleteSection(emptyConvo) === 'chiefComplaint', 'Empty conversation needs chiefComplaint first')

  const convoChief = [
    { sender: 'ai', section: 'chiefComplaint', text: 'What brings you to the hospital today?' },
    { sender: 'patient', section: 'chiefComplaint', text: 'Severe stomach pain' }
  ]
  assert(isSectionCompleted('chiefComplaint', convoChief) === true, 'chiefComplaint marked completed')
  assert(getNextIncompleteSection(convoChief) === 'hpi', 'Next after chiefComplaint is hpi')

  // Partial conversation missing allergies, familyHistory, personalHistory
  const convoPartial = [
    { sender: 'ai', section: 'chiefComplaint', text: 'What brings you?' },
    { sender: 'patient', section: 'chiefComplaint', text: 'Headache' },
    { sender: 'ai', section: 'hpi', text: 'When did it start?' },
    { sender: 'patient', section: 'hpi', text: 'Yesterday' },
    { sender: 'ai', section: 'pastMedicalHistory', text: 'Past medical conditions?' },
    { sender: 'patient', section: 'pastMedicalHistory', text: 'Hypertension' },
    { sender: 'ai', section: 'medications', text: 'Taking any medications?' },
    { sender: 'patient', section: 'medications', text: 'Amlodipine 5mg' }
  ]
  const statusPartial = getInterviewSectionStatus(convoPartial)
  assert(statusPartial.completedSections.has('chiefComplaint'), 'Has chiefComplaint')
  assert(statusPartial.completedSections.has('hpi'), 'Has hpi')
  assert(statusPartial.completedSections.has('pastMedicalHistory'), 'Has pastMedicalHistory')
  assert(statusPartial.completedSections.has('medications'), 'Has medications')
  assert(!statusPartial.completedSections.has('allergies'), 'Allergies is incomplete')
  assert(!statusPartial.completedSections.has('familyHistory'), 'familyHistory is incomplete')
  assert(!statusPartial.completedSections.has('personalHistory'), 'personalHistory is incomplete')
  assert(getNextIncompleteSection(convoPartial) === 'allergies', 'Next incomplete is allergies')

  console.log('\n=== Test Group 3: Intent Detection & Negative Denials ===')
  const convoWithIntent = [
    { sender: 'patient', text: 'I have no known drug allergies, never had an allergic reaction' }
  ]
  assert(isSectionCompleted('allergies', convoWithIntent) === true, 'Detected allergies intent from negative denial')

  const convoHindiAllergy = [
    { sender: 'patient', text: 'मुझे कोई दवा से एलर्जी नहीं है' }
  ]
  assert(isSectionCompleted('allergies', convoHindiAllergy) === true, 'Detected Hindi allergy denial')

  const convoFamilyDenial = [
    { sender: 'patient', text: 'No hereditary conditions in my family, both parents are healthy' }
  ]
  assert(isSectionCompleted('familyHistory', convoFamilyDenial) === true, 'Detected familyHistory intent')

  const convoPersonalDenial = [
    { sender: 'patient', text: 'Non-smoker, non-alcoholic, vegetarian diet' }
  ]
  assert(isSectionCompleted('personalHistory', convoPersonalDenial) === true, 'Detected personalHistory intent')

  console.log('\n=== Test Group 4: Fallback Questions and Quick Suggestions ===')
  for (const sec of CLINICAL_SECTIONS) {
    const enQ = getFallbackQuestionForSection(sec, 'en')
    const hiQ = getFallbackQuestionForSection(sec, 'hi')
    assert(typeof enQ === 'string' && enQ.length > 10, `English fallback question valid for ${sec}`)
    assert(typeof hiQ === 'string' && hiQ.length > 10, `Hindi fallback question valid for ${sec}`)

    const enChips = getQuickSuggestionsForSection(sec, 'en')
    const hiChips = getQuickSuggestionsForSection(sec, 'hi')
    assert(Array.isArray(enChips) && enChips.length >= 3, `English chips exist for ${sec} (${enChips.length} chips)`)
    assert(Array.isArray(hiChips) && hiChips.length >= 3, `Hindi chips exist for ${sec} (${hiChips.length} chips)`)
  }

  console.log('\n=== Test Group 5: Non-Repetition of Completed Sections ===')
  const fullConvo = [
    { sender: 'patient', section: 'chiefComplaint', text: 'Cough' },
    { sender: 'patient', section: 'hpi', text: 'Since 3 days' },
    { sender: 'patient', section: 'pastMedicalHistory', text: 'None' },
    { sender: 'patient', section: 'medications', text: 'None' },
    { sender: 'patient', section: 'allergies', text: 'No known allergies' },
    { sender: 'patient', section: 'familyHistory', text: 'Father has diabetes' },
    { sender: 'patient', section: 'personalHistory', text: 'Non-smoker' },
    { sender: 'patient', section: 'reviewOfSystems', text: 'No fever or chills' }
  ]
  const fullStatus = getInterviewSectionStatus(fullConvo)
  assert(fullStatus.isComplete === true, 'All 8 sections recognized as completed')
  assert(getNextIncompleteSection(fullConvo) === null, 'getNextIncompleteSection returns null when all 8 are done')

  console.log('\n=== Test Group 6: MockCase Fallback Summary Integration ===')
  const answersByIndex = [
    'Mild joint pain', // 0: chiefComplaint
    '3 days ago',      // 1: hpi onset
    '4/10',            // 2: hpi severity
    'Mild swelling',   // 3: hpi associated
    'None',            // 4: PMH
    'None',            // 5: Meds
    'No known allergies', // 6: Allergies
    'Mother had osteoporosis', // 7: Family History
    'Non-smoker, non-alcoholic', // 8: Personal History
    'No fever or rash' // 9: Review of systems
  ]
  const { summary } = generateStructuredSummaryFromAnswers(answersByIndex, { redFlags: [] })
  assert(summary.chiefComplaint === 'Mild joint pain', 'Summary chief complaint matches')
  assert(summary.allergies.includes('NKDA') || summary.allergies.includes('No known'), 'Summary allergies correctly structured')
  assert(summary.familyHistory.includes('osteoporosis'), 'Summary preserves family history from index 7')
  assert(summary.personalHistory.includes('Non-smoker, non-alcoholic'), 'Summary preserves personal history from index 8')
  assert(summary.reviewOfSystems.includes('Pertinent systemic findings: No fever or rash'), 'Summary preserves review of systems from index 9')

  console.log('\n=== Test Group 7: Red Flag Precedence ===')
  const rfTrigger = detectRedFlagTrigger(0, 'I have sharp chest pain spreading to my left arm', [])
  assert(rfTrigger !== null && rfTrigger.key === 'chestPain', 'Chest pain red flag triggers immediately on question 0')

  console.log('\n=== Test Group 8: Live Backend /api/ai/chat with currentSection ===')
  try {
    // 1. Invalid section should return HTTP 400
    const invalidRes = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        currentSection: 'invalidSectionName'
      })
    })
    assert(invalidRes.status === 400, 'Rejects invalid currentSection with HTTP 400')

    // 2. Valid section: allergies
    const allergyRes = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I have had a mild headache since yesterday',
        language: 'en',
        currentSection: 'allergies',
        conversation: [
          { role: 'assistant', content: 'What brings you to the hospital today?' },
          { role: 'user', content: 'I have had a mild headache since yesterday' }
        ]
      })
    })
    const allergyData = await allergyRes.json()
    assert(allergyRes.status === 200, 'Valid currentSection=allergies returns HTTP 200')
    assert(allergyData.status === 'success', 'Returns status success')
    assert(allergyData.data.currentSection === 'allergies', 'Echoes currentSection=allergies')
    assert(typeof allergyData.data.reply === 'string' && allergyData.data.reply.length > 0, 'Generates AI reply for allergies')
    console.log(`     AI reply for allergies: "${allergyData.data.reply}"`)

    // 3. Valid section: familyHistory in Hindi
    const familyRes = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'कोई ज्ञात एलर्जी नहीं है',
        language: 'hi',
        currentSection: 'familyHistory',
        conversation: [
          { role: 'assistant', content: 'क्या आपको किसी चीज़ से एलर्जी है?' },
          { role: 'user', content: 'कोई ज्ञात एलर्जी नहीं है' }
        ]
      })
    })
    const familyData = await familyRes.json()
    assert(familyRes.status === 200, 'Valid currentSection=familyHistory in Hindi returns HTTP 200')
    assert(familyData.data.currentSection === 'familyHistory', 'Echoes currentSection=familyHistory')
    console.log(`     AI reply for Hindi family history: "${familyData.data.reply}"`)
  } catch (err) {
    assert(false, `Live backend AI test failed: ${err.message}`)
  }

  console.log('\n=== Test Group 9: Live Backend /api/ai/summary with Explicit Denials ===')
  try {
    const summaryRes = await fetch('http://localhost:5000/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'en',
        conversation: [
          { role: 'assistant', content: 'What brings you to the clinic?' },
          { role: 'user', content: 'Persistent dry cough for 3 days' },
          { role: 'assistant', content: 'Do you have any past medical conditions?' },
          { role: 'user', content: 'None' },
          { role: 'assistant', content: 'Are you taking any regular medications?' },
          { role: 'user', content: 'No medications' },
          { role: 'assistant', content: 'Do you have any drug or food allergies?' },
          { role: 'user', content: 'No known allergies' },
          { role: 'assistant', content: 'Does anyone in your family have major medical conditions?' },
          { role: 'user', content: 'No significant family history, parents are healthy' },
          { role: 'assistant', content: 'Do you use tobacco or alcohol, and how is your lifestyle?' },
          { role: 'user', content: 'Non-smoker, non-alcoholic, normal sleep' },
          { role: 'assistant', content: 'Any other symptoms like fever or chills?' },
          { role: 'user', content: 'No other symptoms' }
        ]
      })
    })
    const summaryData = await summaryRes.json()
    assert(summaryRes.status === 200, 'Summary endpoint returns HTTP 200')
    assert(summaryData.status === 'success', 'Summary returned status success')
    const clinicalDraft = summaryData.data.summary
    console.log('     Generated Summary allergies:', clinicalDraft.allergies)
    console.log('     Generated Summary familyHistory:', clinicalDraft.familyHistory)
    console.log('     Generated Summary personalHistory:', clinicalDraft.personalHistory)

    assert(
      clinicalDraft.allergies.toLowerCase().includes('no known') ||
      clinicalDraft.allergies.toLowerCase().includes('none'),
      'Summary captures explicit denial for allergies instead of Not reported'
    )
    assert(
      !clinicalDraft.allergies.toLowerCase().includes('not reported'),
      'Allergies is NOT "Not reported"'
    )
    assert(
      !clinicalDraft.familyHistory.toLowerCase().includes('not reported'),
      'Family history is NOT "Not reported"'
    )
  } catch (err) {
    assert(false, `Live backend AI summary test failed: ${err.message}`)
  }

  console.log(`\n========================================`)
  console.log(`TOTAL: ${passedTests + failedTests} tests | PASSED: ${passedTests} | FAILED: ${failedTests}`)
  console.log(`========================================`)
  if (failedTests > 0) {
    process.exit(1)
  }
}

runTests().catch((e) => {
  console.error('Test run crashed:', e)
  process.exit(1)
})
