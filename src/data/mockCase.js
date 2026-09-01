/**
 * Shared Mock Case State for MediKiosk
 *
 * Simulates a single hospital intake case object shared between
 * the Patient Kiosk and Physician Dashboard.
 */

import { getTriggerByKey } from './redFlags.js'

export const initialCaseData = {
  caseId: 'CASE-2026-0001',

  patient: {
    name: '',
    age: '',
    gender: '',
    language: 'English'
  },

  consent: {
    given: false,
    timestamp: null
  },

  authentication: {
    method: 'mock-aadhaar',
    status: 'not_authenticated', // 'not_authenticated' | 'authenticated'
    aadhaarMasked: 'XXXX XXXX 1234'
  },

  complaint: {
    chiefComplaint: '',
    onset: '',
    severity: '',
    associatedSymptoms: ''
  },

  interview: {
    answers: [],
    answersByIndex: [],
    redFlags: []
  },

  documents: [],

  summary: {
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    medications: '',
    allergies: '',
    familyHistory: 'No significant family medical history reported.',
    personalHistory: 'Non-smoker, non-alcoholic. Regular sleep and dietary pattern reported.',
    reviewOfSystems: 'Cardiovascular: Normal rhythm. Respiratory: Clear. GI: No acute complaints. CNS: Alert & Oriented.'
  },

  clinicalAlerts: [],

  status: 'intake', // 'intake' | 'ready_for_doctor' | 'physician_accepted'
  intakeTimestamp: null,
  acceptedTimestamp: null,
  physicianNotes: ''
}

/**
 * Extracts base 7-question patient answers indexed by question index
 */
export function extractAnswersByIndex(conversation = []) {
  const answers = []
  conversation.forEach((msg) => {
    if (msg.sender === 'patient' && typeof msg.answerIndex === 'number') {
      answers[msg.answerIndex] = msg.text.trim()
    }
  })
  return answers
}

/**
 * Extracts patient follow-up responses from red flag branches
 */
export function extractRedFlagResponses(conversation = []) {
  return conversation
    .filter((msg) => msg.sender === 'patient' && msg.followUpKey)
    .map((msg) => ({ key: msg.followUpKey, text: msg.text.trim() }))
}

/**
 * Builds structured clinical summary draft and clinical alerts from patient interview answers
 */
export function generateStructuredSummaryFromAnswers(answersByIndex = [], options = { redFlags: [], documentCount: 0 }) {
  const q1 = answersByIndex[0]?.trim() || 'Headache'
  const q2 = answersByIndex[1]?.trim() || 'Yesterday'
  const q3 = answersByIndex[2]?.trim() || '6'
  const q4 = answersByIndex[3]?.trim() || 'None'
  const q5 = answersByIndex[4]?.trim() || 'None'
  const q6 = answersByIndex[5]?.trim() || 'None'
  const q7 = answersByIndex[6]?.trim() || 'No known allergies'

  // History of Present Illness (HPI)
  const hpiLines = []
  const onsetFormatted =
    q2.toLowerCase().startsWith('since') || q2.toLowerCase().startsWith('a') || q2.toLowerCase().startsWith('ongoing')
      ? q2
      : `since ${q2}`
  hpiLines.push(`${q1} reported starting ${onsetFormatted}.`)

  const severityFormatted =
    q3.includes('/') || q3.toLowerCase().includes('mild') || q3.toLowerCase().includes('severe')
      ? q3
      : `${q3}/10`
  hpiLines.push(`Patient reports severity of ${severityFormatted}.`)

  if (
    q4 &&
    q4.toLowerCase() !== 'none' &&
    q4.toLowerCase() !== 'no other symptoms' &&
    q4.toLowerCase() !== 'कोई अन्य लक्षण नहीं' &&
    q4.toLowerCase() !== 'no' &&
    q4.toLowerCase() !== 'none / no other symptoms'
  ) {
    hpiLines.push(`Associated symptoms reported: ${q4}.`)
  } else {
    hpiLines.push('No acute associated secondary symptoms reported.')
  }

  // Fold red flag follow-up answers into HPI
  if (Array.isArray(options.redFlags) && options.redFlags.length > 0) {
    options.redFlags.forEach((rf) => {
      if (rf.text) {
        hpiLines.push(`On follow-up: ${rf.text}`)
      }
    })
  }

  // Fold document count into HPI if available
  const docCount = Number(options.documentCount) || 0
  if (docCount > 0) {
    hpiLines.push(`Patient provided ${docCount} prior medical document${docCount === 1 ? '' : 's'} for clinical review.`)
  }

  // Past Medical History (PMH)
  let pmh = q5
  if (!q5 || ['none', 'no', 'कोई नहीं', 'nothing'].includes(q5.toLowerCase())) {
    pmh = 'No previous major medical conditions or surgical history reported.'
  }

  // Medications
  let meds = q6
  if (!q6 || ['none', 'no', 'कोई नहीं', 'no meds', 'no medications'].includes(q6.toLowerCase())) {
    meds = 'No regular or current medications reported.'
  }

  // Allergies
  let allergies = q7
  if (
    !q7 ||
    [
      'none',
      'no',
      'no known allergies',
      'कोई ज्ञात एलर्जी नहीं',
      'कोई नहीं',
      'nkda'
    ].includes(q7.toLowerCase())
  ) {
    allergies = 'No known drug or environmental allergies reported (NKDA).'
  }

  // Deduplicate and map clinical alerts from fired triggers
  const seenKeys = new Set()
  const clinicalAlerts = []
  if (Array.isArray(options.redFlags)) {
    options.redFlags.forEach((rf) => {
      if (rf.key && !seenKeys.has(rf.key)) {
        seenKeys.add(rf.key)
        const trigger = getTriggerByKey(rf.key)
        if (trigger) {
          clinicalAlerts.push({
            key: trigger.key,
            text: trigger.alert.English,
            textHindi: trigger.alert.Hindi,
            severity: trigger.severity
          })
        }
      }
    })
  }

  // Lifestyle mentions detection
  const smokingKeywords = ['smoke', 'smoking', 'cigarette', 'धूम्रपान', 'सिगरेट', 'tobacco', 'bidi']
  const alcoholKeywords = ['alcohol', 'drink', 'drinking', 'शराब', 'दारू']

  const allAnswerTexts = [
    ...answersByIndex.filter(Boolean),
    ...(options.redFlags || []).map((r) => r.text).filter(Boolean)
  ]
    .join(' ')
    .toLowerCase()

  const hasSmoking = smokingKeywords.some((kw) => allAnswerTexts.includes(kw.toLowerCase()))
  const hasAlcohol = alcoholKeywords.some((kw) => allAnswerTexts.includes(kw.toLowerCase()))

  let personalHistory = 'Non-smoker, non-alcoholic. Regular sleep and dietary pattern reported.'
  if (hasSmoking && hasAlcohol) {
    personalHistory = 'Patient reports history of tobacco/smoking use and alcohol consumption. Dietary pattern and routine noted.'
  } else if (hasSmoking) {
    personalHistory = 'Patient reports history of tobacco/smoking use. Non-alcoholic. Dietary pattern and routine noted.'
  } else if (hasAlcohol) {
    personalHistory = 'Patient reports history of alcohol consumption. Non-smoker. Dietary pattern and routine noted.'
  }

  return {
    summary: {
      chiefComplaint: q1,
      historyOfPresentIllness: hpiLines.join('\n'),
      pastMedicalHistory: pmh,
      medications: meds,
      allergies: allergies,
      familyHistory: 'No significant family history of hereditary illnesses reported.',
      personalHistory: personalHistory,
      reviewOfSystems: 'Cardiovascular: Normal rhythm. Respiratory: Clear. GI: No acute complaints. CNS: Alert & Oriented.'
    },
    clinicalAlerts
  }
}
