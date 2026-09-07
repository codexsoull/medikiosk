import { getGroqClient } from './ai.js'

/**
 * Clinical Summary Service for MediKiosk
 * Converts completed conversational intake interview into a standardized,
 * physician-readable clinical history draft.
 */

const SUMMARY_SYSTEM_INSTRUCTION = `You are an expert Clinical Documentation Assistant for MediKiosk, an outpatient department (OPD) triage kiosk in India.
Your job is to convert a completed patient intake interview transcript into a standardized, physician-ready intake summary draft.

CLINICAL GUARDRAILS:
1. Extract ONLY information actually stated or confirmed by the patient.
2. DO NOT invent, assume, extrapolate, or hallucinate any symptoms, durations, medications, or history.
3. If an item was not mentioned or asked about, write "Not reported".
4. DO NOT provide any clinical diagnosis.
5. DO NOT prescribe or recommend any medications, dosages, or treatments.
6. Preserve crucial patient-reported symptom characteristics (e.g. onset, severity, quality, radiation).
7. Even if the conversation was in Hindi, output all clinical summary fields in standard English for the physician.
8. Respond ONLY with valid JSON. Do not write introductory words or conversational comments.

REQUIRED JSON SCHEMA:
{
  "chiefComplaint": "Primary symptom or reason for visit (concise phrase)",
  "hpi": {
    "onset": "When it started (e.g. Yesterday, 2 days ago, or Not reported)",
    "duration": "How long it lasts or total duration (or Not reported)",
    "location": "Anatomical site or radiation if applicable (or Not reported)",
    "character": "Quality e.g. sharp, throbbing, dull, burning (or Not reported)",
    "severity": "Reported score or description e.g. 6/10, moderate (or Not reported)",
    "timing": "Constant, intermittent, worsens at night (or Not reported)",
    "aggravatingFactors": "What makes it worse (or Not reported)",
    "relievingFactors": "What makes it better (or Not reported)",
    "associatedSymptoms": "Other symptoms reported together e.g. nausea, fever (or Not reported)"
  },
  "pastMedicalHistory": "Chronic conditions reported e.g. Diabetes, Hypertension, or None reported / Not reported",
  "pastSurgicalHistory": "Previous surgeries or hospitalizations (or Not reported)",
  "medications": "Current regular medications reported (or None reported / Not reported)",
  "allergies": "Known drug/food allergies reported (or No known allergies / Not reported)",
  "familyHistory": "Relevant family medical history (or Not reported)",
  "personalHistory": {
    "diet": "Dietary habits e.g. Vegetarian (or Not reported)",
    "sleep": "Sleep pattern (or Not reported)",
    "smoking": "Smoking or tobacco use status (or Not reported)",
    "alcohol": "Alcohol use status (or Not reported)",
    "activity": "Physical activity (or Not reported)"
  },
  "reviewOfSystems": "Pertinent positive or negative systemic symptoms mentioned (or Not reported)",
  "priorInvestigations": "Any lab tests, scans, or documents mentioned by patient (or Not reported)",
  "additionalNotes": "Any other factual details directly reported by patient"
}`

/**
 * Formats structured HPI object into a cohesive, physician-readable string
 * for textareas in doctor portal screens.
 */
function formatHpiText(hpi = {}) {
  if (!hpi || typeof hpi !== 'object') return 'Not reported'

  const lines = []
  if (hpi.onset && hpi.onset !== 'Not reported') lines.push(`Onset: ${hpi.onset}`)
  if (hpi.duration && hpi.duration !== 'Not reported') lines.push(`Duration: ${hpi.duration}`)
  if (hpi.location && hpi.location !== 'Not reported') lines.push(`Location: ${hpi.location}`)
  if (hpi.character && hpi.character !== 'Not reported') lines.push(`Character: ${hpi.character}`)
  if (hpi.severity && hpi.severity !== 'Not reported') lines.push(`Severity: ${hpi.severity}`)
  if (hpi.timing && hpi.timing !== 'Not reported') lines.push(`Timing: ${hpi.timing}`)
  if (hpi.aggravatingFactors && hpi.aggravatingFactors !== 'Not reported') lines.push(`Aggravating: ${hpi.aggravatingFactors}`)
  if (hpi.relievingFactors && hpi.relievingFactors !== 'Not reported') lines.push(`Relieving: ${hpi.relievingFactors}`)
  if (hpi.associatedSymptoms && hpi.associatedSymptoms !== 'Not reported') lines.push(`Associated symptoms: ${hpi.associatedSymptoms}`)

  return lines.length > 0 ? lines.join('. ') + '.' : 'Not reported'
}

/**
 * Formats structured personal history object into a readable string
 */
function formatPersonalHistoryText(personal = {}) {
  if (!personal || typeof personal !== 'object') return 'Not reported'

  const items = []
  if (personal.diet && personal.diet !== 'Not reported') items.push(`Diet: ${personal.diet}`)
  if (personal.smoking && personal.smoking !== 'Not reported') items.push(`Smoking: ${personal.smoking}`)
  if (personal.alcohol && personal.alcohol !== 'Not reported') items.push(`Alcohol: ${personal.alcohol}`)
  if (personal.sleep && personal.sleep !== 'Not reported') items.push(`Sleep: ${personal.sleep}`)
  if (personal.activity && personal.activity !== 'Not reported') items.push(`Activity: ${personal.activity}`)

  return items.length > 0 ? items.join('. ') + '.' : 'Not reported'
}

/**
 * Cleanly extract and parse JSON summary from Groq model output
 * @param {string} rawContent
 * @returns {Object} parsed JSON summary
 */
function parseSummaryResponse(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Empty response received from AI provider')
  }

  const trimmed = rawContent.trim()

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // Continue to fallback
  }

  // 2. Extract JSON object from markdown code fence or outer braces
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch {
      // Continue to fallback
    }
  }

  throw new Error('Could not parse valid clinical summary JSON from AI provider')
}

/**
 * Generates a structured clinical summary from completed patient interview conversation
 * @param {Object} params
 * @param {Array<Object>} params.conversation - Array of { role: 'user' | 'assistant', content: string }
 * @param {string} [params.language='en'] - 'en' or 'hi'
 * @returns {Promise<Object>} Normalized physician-ready clinical summary
 */
export async function generateClinicalSummary({ conversation = [], language = 'en' }) {
  const model = process.env.AI_MODEL || 'openai/gpt-oss-120b'
  const groq = getGroqClient()

  // Bounded conversation history to conserve tokens (last 15 messages max)
  const boundedConversation = (Array.isArray(conversation) ? conversation : [])
    .slice(-15)
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => `${m.role === 'user' || m.role === 'patient' ? 'Patient' : 'MediKiosk'}: ${m.content.trim()}`)
    .join('\n')

  if (!boundedConversation) {
    throw new Error('Conversation history is empty or invalid')
  }

  const userPrompt = `Language of interview: ${language === 'hi' ? 'Hindi' : 'English'}\n\nPATIENT INTERVIEW TRANSCRIPT:\n${boundedConversation}\n\nGenerate the complete structured clinical intake summary in valid JSON.`

  const messages = [
    { role: 'system', content: SUMMARY_SYSTEM_INSTRUCTION },
    { role: 'user', content: userPrompt }
  ]

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.1,
    max_tokens: 1800
  })

  const rawContent = completion.choices?.[0]?.message?.content
  const rawSummary = parseSummaryResponse(rawContent)

  // Normalize fields for both rich structured consumption and existing DoctorCase textarea compatibility
  const normalizedSummary = {
    chiefComplaint: rawSummary.chiefComplaint || 'Not reported',
    hpi: rawSummary.hpi && typeof rawSummary.hpi === 'object' ? rawSummary.hpi : {},
    historyOfPresentIllness: formatHpiText(rawSummary.hpi),
    pastMedicalHistory: rawSummary.pastMedicalHistory || 'Not reported',
    pastSurgicalHistory: rawSummary.pastSurgicalHistory || 'Not reported',
    medications: rawSummary.medications || 'Not reported',
    allergies: rawSummary.allergies || 'Not reported',
    familyHistory: rawSummary.familyHistory || 'Not reported',
    personalHistory: formatPersonalHistoryText(rawSummary.personalHistory),
    personalHistoryDetails: rawSummary.personalHistory && typeof rawSummary.personalHistory === 'object' ? rawSummary.personalHistory : {},
    reviewOfSystems: rawSummary.reviewOfSystems || 'Not reported',
    priorInvestigations: rawSummary.priorInvestigations || 'Not reported',
    additionalNotes: rawSummary.additionalNotes || '',
    isAiDraft: true
  }

  return normalizedSummary
}

