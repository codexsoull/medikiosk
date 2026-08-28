/**
 * Shared Mock Case State for MediKiosk
 *
 * Simulates a single hospital intake case object shared between
 * the Patient Kiosk and Physician Dashboard.
 */

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
    answers: []
  },

  documents: [],

  summary: {
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    medications: '',
    allergies: '',
    familyHistory: 'No significant family medical history reported.',
    personalHistory: 'Non-smoker, non-alcoholic. Regular diet and routine reported.',
    reviewOfSystems: 'Cardiovascular: Normal. Respiratory: Normal. Gastrointestinal: Normal. Neurological: Normal.'
  },

  clinicalAlerts: [],

  status: 'intake', // 'intake' | 'ready_for_doctor' | 'physician_accepted'
  intakeTimestamp: null,
  acceptedTimestamp: null,
  physicianNotes: ''
}

/**
 * Builds structured clinical summary draft from patient interview answers
 */
export function generateStructuredSummaryFromAnswers(answers = []) {
  const q1 = answers[0]?.trim() || 'Headache'
  const q2 = answers[1]?.trim() || 'Yesterday'
  const q3 = answers[2]?.trim() || '6'
  const q4 = answers[3]?.trim() || 'Mild nausea'
  const q5 = answers[4]?.trim() || 'None'
  const q6 = answers[5]?.trim() || 'None'
  const q7 = answers[6]?.trim() || 'No known allergies'

  // History of Present Illness (HPI)
  const hpiLines = []
  const onsetFormatted =
    q2.toLowerCase().startsWith('since') || q2.toLowerCase().startsWith('a') || q2.toLowerCase().startsWith('ongoing')
      ? q2
      : `since ${q2}`
  hpiLines.push(`${q1} reported starting ${onsetFormatted}.`)

  const severityFormatted = q3.includes('/') || q3.toLowerCase().includes('mild') || q3.toLowerCase().includes('severe')
    ? q3
    : `${q3}/10`
  hpiLines.push(`Patient reports severity of ${severityFormatted}.`)

  if (q4 && q4.toLowerCase() !== 'none' && q4.toLowerCase() !== 'no other symptoms' && q4.toLowerCase() !== 'कोई अन्य लक्षण नहीं') {
    hpiLines.push(`Associated symptoms reported: ${q4}.`)
  } else {
    hpiLines.push('No acute associated secondary symptoms reported.')
  }

  // Past Medical History (PMH)
  let pmh = q5
  if (!q5 || q5.toLowerCase() === 'none' || q5.toLowerCase() === 'no' || q5.toLowerCase() === 'कोई नहीं') {
    pmh = 'No previous major medical conditions or surgical history reported.'
  }

  // Medications
  let meds = q6
  if (!q6 || q6.toLowerCase() === 'none' || q6.toLowerCase() === 'no' || q6.toLowerCase() === 'कोई नहीं') {
    meds = 'No regular or current medications reported.'
  }

  // Allergies
  let allergies = q7
  if (
    !q7 ||
    q7.toLowerCase() === 'none' ||
    q7.toLowerCase() === 'no' ||
    q7.toLowerCase() === 'no known allergies' ||
    q7.toLowerCase() === 'कोई ज्ञात एलर्जी नहीं'
  ) {
    allergies = 'No known drug or environmental allergies reported (NKDA).'
  }

  return {
    chiefComplaint: q1,
    historyOfPresentIllness: hpiLines.join('\n'),
    pastMedicalHistory: pmh,
    medications: meds,
    allergies: allergies,
    familyHistory: 'No significant family history of hereditary illnesses reported.',
    personalHistory: 'Non-smoker, non-alcoholic. Regular sleep and dietary pattern reported.',
    reviewOfSystems: 'Cardiovascular: Normal rhythm. Respiratory: Clear. GI: No acute complaints. CNS: Alert & Oriented.'
  }
}

