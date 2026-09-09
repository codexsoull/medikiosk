import { getGroqClient } from './ai.js'

/**
 * Clinical Summary Service for MediKiosk
 * Converts completed conversational intake interview and optional uploaded medical documents
 * into a standardized, physician-readable clinical history draft.
 */

const MAX_DOCUMENT_CHARS = 12000

const SUMMARY_SYSTEM_INSTRUCTION = `You are an expert Clinical Documentation Assistant for MediKiosk, an outpatient department (OPD) triage kiosk in India.
Your job is to convert a patient intake interview transcript and any supporting uploaded medical documents into a standardized, physician-ready intake summary draft.

DATA SOURCES & CLINICAL ROLE:
1. Primary Source: Patient Interview Transcript.
2. Supporting Source: Uploaded Medical Documents (prescriptions, lab reports, prior test records).
3. Treat uploaded documents as supporting source material, NOT as automatically verified clinical truth.
4. Populate existing summary fields from both sources where appropriate (e.g. lab findings to priorInvestigations, past prescriptions to medications, documented conditions to pastMedicalHistory).

CLINICAL GUARDRAILS & SAFETY RULES:
1. Extract ONLY information explicitly stated in the interview transcript or contained in the uploaded document text.
2. DO NOT invent, assume, extrapolate, or hallucinate any symptoms, durations, medications, allergies, family history, lab values, or dates.
3. NEVER infer, suggest, or provide any clinical diagnosis.
4. NEVER prescribe or recommend any medications, dosages, or treatments.
5. Do not convert an absent field into a guessed value. If an item was not mentioned in either source, write "Not reported".
6. Explicit negative denials: If the patient explicitly denies having allergies (e.g. 'none', 'no known allergies', 'no allergies'), record "No known allergies". If the patient denies chronic illness, record "None reported". If the patient denies regular medications, record "None reported". If the patient denies family medical history, record "No significant family history reported". If the patient denies smoking/alcohol, record "Non-smoker, non-alcoholic". ONLY write "Not reported" if the topic was completely omitted or not asked.
7. OCR error caution: OCR document text may contain scan artifacts or typographical errors. DO NOT silently "correct" questionable numbers or drug names. Transcribe them conservatively as documented.
8. Conflict Handling: If interview information conflicts with document information (e.g., patient says "I take amlodipine" but document lists "losartan"), DO NOT choose which source is correct. Retain both and explicitly document the discrepancy in "additionalNotes" for physician review.
9. Document Attribution: When uploaded document information materially contributes to the summary, append a citation in "additionalNotes" indicating the contributing document filename (e.g. "Information also identified from uploaded document: cbc_report.pdf"). Do not cite documents that contributed no relevant clinical information.
10. Output Language: Even if the interview or documents contain Hindi, output all clinical summary fields in standard English for the physician.
11. Output Format: Respond ONLY with valid JSON matching the REQUIRED JSON SCHEMA. Do not include markdown preamble or conversational commentary outside the JSON.

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
  "medications": "Current regular medications reported from interview and/or records (or None reported / Not reported)",
  "allergies": "Known drug/food allergies reported (or No known allergies / Not reported)",
  "familyHistory": "Relevant family medical history e.g. Hypertension in father, or No significant family history reported / Not reported",
  "personalHistory": {
    "diet": "Dietary habits e.g. Vegetarian (or Not reported)",
    "sleep": "Sleep pattern (or Not reported)",
    "smoking": "Smoking or tobacco use status e.g. Non-smoker (or Not reported)",
    "alcohol": "Alcohol use status e.g. Non-alcoholic (or Not reported)",
    "activity": "Physical activity (or Not reported)"
  },
  "reviewOfSystems": "Pertinent positive or negative systemic symptoms mentioned (or Not reported)",
  "priorInvestigations": "Relevant lab tests, scans, or document findings mentioned or extracted from records (or Not reported)",
  "additionalNotes": "Any discrepancies, contributing document citations, or other factual clinical details"
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
  if (!personal) return 'Not reported'
  if (typeof personal === 'string') return personal.trim() || 'Not reported'
  if (typeof personal !== 'object') return 'Not reported'

  const items = []
  if (personal.diet && personal.diet !== 'Not reported') items.push(`Diet: ${personal.diet}`)
  if (personal.smoking && personal.smoking !== 'Not reported') items.push(`Smoking: ${personal.smoking}`)
  if (personal.alcohol && personal.alcohol !== 'Not reported') items.push(`Alcohol: ${personal.alcohol}`)
  if (personal.sleep && personal.sleep !== 'Not reported') items.push(`Sleep: ${personal.sleep}`)
  if (personal.activity && personal.activity !== 'Not reported') items.push(`Activity: ${personal.activity}`)

  return items.length > 0 ? items.join('. ') + '.' : 'Not reported'
}

/**
 * Normalizes, deduplicates, and character-bounds uploaded medical documents
 * @param {Array<Object>} documents
 * @returns {Array<{ name: string, type: string, text: string }>}
 */
export function normalizeAndBoundDocuments(documents = []) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return []
  }

  const validDocs = []
  const seenTexts = new Set()
  let cumulativeChars = 0

  for (const doc of documents) {
    // 1. Ignore non-object entries
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) continue

    // 2. Ignore extractionStatus !== "completed"
    if (doc.extractionStatus !== 'completed') continue

    // 3. Ignore missing, non-string, or whitespace-only extractedText
    if (typeof doc.extractedText !== 'string') continue
    const trimmedRawText = doc.extractedText.trim()
    if (!trimmedRawText) continue

    // Clean and normalize excessive whitespace
    const cleanedText = trimmedRawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!cleanedText) continue

    // 4. Do not duplicate identical document text
    if (seenTexts.has(cleanedText)) continue
    seenTexts.add(cleanedText)

    // 5. Check character budget (max 12000 combined characters)
    if (cumulativeChars >= MAX_DOCUMENT_CHARS) {
      break
    }

    const availableChars = MAX_DOCUMENT_CHARS - cumulativeChars
    const boundedText = cleanedText.length <= availableChars
      ? cleanedText
      : cleanedText.slice(0, availableChars).trim()

    if (boundedText.length === 0) {
      break
    }

    cumulativeChars += boundedText.length

    validDocs.push({
      name: (typeof doc.originalName === 'string' && doc.originalName.trim()) || 'document',
      type: (typeof doc.fileType === 'string' && doc.fileType.trim()) || 'unknown',
      text: boundedText
    })

    if (cumulativeChars >= MAX_DOCUMENT_CHARS) {
      break
    }
  }

  return validDocs
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
 * Generates a structured clinical summary from completed patient interview conversation and optional documents
 * @param {Object} params
 * @param {Array<Object>} params.conversation - Array of { role: 'user' | 'assistant', content: string }
 * @param {Array<Object>} [params.documents=[]] - Optional uploaded medical documents
 * @param {string} [params.language='en'] - 'en' or 'hi'
 * @returns {Promise<Object>} Normalized physician-ready clinical summary
 */
export async function generateClinicalSummary({ conversation = [], documents = [], language = 'en' }) {
  const model = process.env.AI_MODEL || 'openai/gpt-oss-120b'
  const groq = getGroqClient()

  // Bounded conversation history to conserve tokens (last 30 messages max)
  const boundedConversation = (Array.isArray(conversation) ? conversation : [])
    .slice(-30)
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => `${m.role === 'user' || m.role === 'patient' ? 'Patient' : 'MediKiosk'}: ${m.content.trim()}`)
    .join('\n')

  if (!boundedConversation) {
    throw new Error('Conversation history is empty or invalid')
  }

  const normalizedDocs = normalizeAndBoundDocuments(documents)

  let userPrompt = `Language of interview: ${language === 'hi' ? 'Hindi' : 'English'}\n\nPATIENT INTERVIEW TRANSCRIPT:\n${boundedConversation}`

  if (normalizedDocs.length > 0) {
    const formattedDocs = normalizedDocs
      .map((doc) => `[Document: ${doc.name} | Type: ${doc.type}]\n${doc.text}`)
      .join('\n\n')

    userPrompt += `\n\nUPLOADED MEDICAL DOCUMENTS:\n${formattedDocs}`
  }

  userPrompt += `\n\nGenerate the complete structured clinical intake summary in valid JSON.`

  const messages = [
    { role: 'system', content: SUMMARY_SYSTEM_INSTRUCTION },
    { role: 'user', content: userPrompt }
  ]

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.1,
    max_tokens: 2000
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

