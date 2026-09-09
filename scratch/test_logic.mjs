import { detectRedFlagTrigger, getTriggerByKey, RED_FLAG_TRIGGERS } from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/data/redFlags.js'
import {
  extractAnswersByIndex,
  extractRedFlagResponses,
  generateStructuredSummaryFromAnswers
} from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/data/mockCase.js'

console.log('--- Testing Red Flag Detection ---')
const rf1 = detectRedFlagTrigger(0, 'I have severe chest discomfort')
console.log('Trigger for Chest Discomfort (Q0):', rf1?.key, 'Expected: chestPain')

const rf2 = detectRedFlagTrigger(2, '9 – 10 (Very Severe)', ['chestPain'])
console.log('Trigger for 9-10 Severity (Q2):', rf2?.key, 'Expected: severeSeverity')

const rf3 = detectRedFlagTrigger(3, 'Feeling breathless since morning', ['chestPain', 'severeSeverity'])
console.log('Trigger for Breathless (Q3):', rf3?.key, 'Expected: breathingDifficulty')

const rfAlreadyFired = detectRedFlagTrigger(0, 'chest pain', ['chestPain'])
console.log('Trigger when already fired:', rfAlreadyFired, 'Expected: null')

console.log('\n--- Testing Conversation Extraction ---')
const sampleConversation = [
  { id: 'msg-ai-0', sender: 'ai', type: 'greeting', questionIndex: 0, text: 'Hello...' },
  { id: 'msg-patient-1', sender: 'patient', answerIndex: 0, text: 'Chest Discomfort' },
  { id: 'msg-ai-followup-2', sender: 'ai', type: 'followup', triggerKey: 'chestPain', text: 'Are you experiencing...' },
  { id: 'msg-patient-2', sender: 'patient', followUpKey: 'chestPain', text: 'Yes, pain spreading to left arm' },
  { id: 'msg-ai-3', sender: 'ai', type: 'question', questionIndex: 1, text: 'When did this begin?' },
  { id: 'msg-patient-3', sender: 'patient', answerIndex: 1, text: 'Yesterday' },
  { id: 'msg-ai-4', sender: 'ai', type: 'question', questionIndex: 2, text: 'How severe is it?' },
  { id: 'msg-patient-4', sender: 'patient', answerIndex: 2, text: '9 – 10 (Very Severe)' },
  { id: 'msg-ai-followup-5', sender: 'ai', type: 'followup', triggerKey: 'severeSeverity', text: 'Since this is severe...' },
  { id: 'msg-patient-5', sender: 'patient', followUpKey: 'severeSeverity', text: 'It comes and goes' },
  { id: 'msg-ai-6', sender: 'ai', type: 'question', questionIndex: 3, text: 'Other symptoms?' },
  { id: 'msg-patient-6', sender: 'patient', answerIndex: 3, text: 'Dizziness and nausea' },
  { id: 'msg-ai-7', sender: 'ai', type: 'question', questionIndex: 4, text: 'Past medical history?' },
  { id: 'msg-patient-7', sender: 'patient', answerIndex: 4, text: 'Hypertension (BP)' },
  { id: 'msg-ai-8', sender: 'ai', type: 'question', questionIndex: 5, text: 'Medications?' },
  { id: 'msg-patient-8', sender: 'patient', answerIndex: 5, text: 'BP meds, occasional smoking' },
  { id: 'msg-ai-9', sender: 'ai', type: 'question', questionIndex: 6, text: 'Allergies?' },
  { id: 'msg-patient-9', sender: 'patient', answerIndex: 6, text: 'Penicillin' }
]

const answersByIndex = extractAnswersByIndex(sampleConversation)
console.log('Extracted answersByIndex:', answersByIndex)
console.log('Length:', answersByIndex.length, 'Expected: 7')

const redFlagResponses = extractRedFlagResponses(sampleConversation)
console.log('Extracted redFlagResponses:', redFlagResponses)
console.log('Length:', redFlagResponses.length, 'Expected: 2')

console.log('\n--- Testing Structured Summary Generation ---')
const result = generateStructuredSummaryFromAnswers(answersByIndex, {
  redFlags: redFlagResponses,
  documentCount: 2
})

console.log('Summary result:\n', JSON.stringify(result, null, 2))

if (
  answersByIndex[0] === 'Chest Discomfort' &&
  answersByIndex[6] === 'Penicillin' &&
  redFlagResponses.length === 2 &&
  result.clinicalAlerts.length === 2 &&
  result.clinicalAlerts.some((a) => a.severity === 'high') &&
  result.clinicalAlerts.some((a) => a.severity === 'medium') &&
  result.summary.historyOfPresentIllness.includes('On follow-up: Yes, pain spreading to left arm') &&
  result.summary.historyOfPresentIllness.includes('Patient provided 2 prior medical documents') &&
  result.summary.personalHistory.includes('smoking')
) {
  console.log('\n>>> ALL TEST CHECKS PASSED SUCCESSFULLY! <<<')
} else {
  console.error('\n>>> TEST CHECK FAILED! <<<')
  process.exit(1)
}
