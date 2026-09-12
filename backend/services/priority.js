/**
 * MediKiosk Deterministic Priority Engine
 *
 * Evaluates patient intake responses against configured clinical screening rules
 * to authoritatively assign an intake review priority:
 * - HIGH: One or more high-priority screening indicators detected
 * - REVIEW: Concerning or elevated screening responses detected without high-risk criteria
 * - ROUTINE: No configured priority indicators detected
 *
 * IMPORTANT:
 * This engine is strictly deterministic and rules-based.
 * It is a screening and queue prioritization tool, NOT a medical diagnosis or definitive triage decision.
 * The LLM never independently determines or overrides priority.
 */

// Priority Constants
export const PRIORITY = {
  HIGH: 'HIGH',
  REVIEW: 'REVIEW',
  ROUTINE: 'ROUTINE'
}

/**
 * Normalizes input text for keyword and phrase matching
 */
function normalizeText(text) {
  if (!text) return ''
  if (typeof text === 'string') return text.toLowerCase().trim()
  if (Array.isArray(text)) return text.map(normalizeText).join(' ')
  if (typeof text === 'object') {
    return Object.values(text).map(normalizeText).join(' ')
  }
  return String(text).toLowerCase().trim()
}

/**
 * Checks if text contains any keyword or phrase, excluding clearly negated instances
 * (e.g. "no sweating", "no arm pain", "normal breathing", "denies shortness of breath", "नहीं")
 */
function hasPositiveMatch(text, keywords = []) {
  const norm = normalizeText(text)
  if (!norm) return false

  const negations = ['no ', 'not ', 'without ', 'denies ', 'none ', 'normal ', 'no other ', 'कोई नहीं', 'नहीं']

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase()
    let idx = norm.indexOf(kwLower)
    while (idx !== -1) {
      // Look back up to 25 chars before the keyword for negation
      const prefix = norm.slice(Math.max(0, idx - 25), idx)
      const isNegated = negations.some((neg) => prefix.endsWith(neg) || prefix.trim().endsWith(neg.trim()))
      if (!isNegated) {
        return true
      }
      idx = norm.indexOf(kwLower, idx + kwLower.length)
    }
  }
  return false
}

/**
 * Checks if text contains any keyword or phrase
 */
function hasAny(text, keywords = []) {
  const norm = normalizeText(text)
  return keywords.some((kw) => norm.includes(kw.toLowerCase()))
}

/**
 * Extracts all searchable text from case intake inputs
 */
function gatherIntakeText(caseInputs = {}) {
  const pieces = []

  if (caseInputs.chief_complaint) pieces.push(caseInputs.chief_complaint)
  if (caseInputs.chiefComplaint) pieces.push(caseInputs.chiefComplaint)
  if (caseInputs.symptoms) pieces.push(caseInputs.symptoms)
  if (caseInputs.associatedSymptoms) pieces.push(caseInputs.associatedSymptoms)
  if (caseInputs.medical_history) pieces.push(caseInputs.medical_history)
  if (caseInputs.pastMedicalHistory) pieces.push(caseInputs.pastMedicalHistory)

  // Interview answers
  if (Array.isArray(caseInputs.interview_answers)) {
    pieces.push(...caseInputs.interview_answers)
  }
  if (Array.isArray(caseInputs.answersByIndex)) {
    pieces.push(...caseInputs.answersByIndex)
  }

  // Red flag follow-ups
  if (Array.isArray(caseInputs.red_flags)) {
    caseInputs.red_flags.forEach((rf) => {
      if (typeof rf === 'string') pieces.push(rf)
      else if (rf?.text) pieces.push(rf.text)
    })
  }
  if (Array.isArray(caseInputs.redFlags)) {
    caseInputs.redFlags.forEach((rf) => {
      if (typeof rf === 'string') pieces.push(rf)
      else if (rf?.text) pieces.push(rf.text)
    })
  }

  // Clinical alerts
  if (Array.isArray(caseInputs.clinical_alerts)) {
    caseInputs.clinical_alerts.forEach((ca) => {
      if (typeof ca === 'string') pieces.push(ca)
      else if (ca?.text) pieces.push(ca.text)
    })
  }

  // Summary fields
  if (caseInputs.ai_summary && typeof caseInputs.ai_summary === 'object') {
    pieces.push(
      caseInputs.ai_summary.chiefComplaint,
      caseInputs.ai_summary.historyOfPresentIllness,
      caseInputs.ai_summary.reviewOfSystems
    )
  } else if (caseInputs.summary && typeof caseInputs.summary === 'object') {
    pieces.push(
      caseInputs.summary.chiefComplaint,
      caseInputs.summary.historyOfPresentIllness,
      caseInputs.summary.reviewOfSystems
    )
  }

  return pieces.filter(Boolean).join(' ').toLowerCase()
}

/**
 * Extracts patient-reported pain or severity number (1-10)
 */
function extractSeverityNumber(caseInputs = {}) {
  const candidates = [
    caseInputs.severity,
    caseInputs.complaint?.severity,
    caseInputs.interview_answers?.[2],
    caseInputs.answersByIndex?.[2]
  ]

  for (const c of candidates) {
    if (c !== undefined && c !== null) {
      const str = String(c).trim()
      const match = str.match(/\b(10|[1-9])(?:\s*\/\s*10)?\b/)
      if (match) {
        return parseInt(match[1], 10)
      }
    }
  }
  return null
}

/**
 * Authoritatively calculates case priority and screening flags
 *
 * @param {Object} caseInputs - Structured patient intake fields
 * @returns {{ priority: string, flags: Array<Object> }}
 */
export function calculatePriority(caseInputs = {}) {
  const flags = []
  if (!caseInputs || typeof caseInputs !== 'object') {
    return { priority: PRIORITY.ROUTINE, flags: [] }
  }

  const allText = gatherIntakeText(caseInputs)
  const severityScore = extractSeverityNumber(caseInputs)

  // Follow-up responses mapped by trigger key
  const followUpMap = {}
  const rawFollowUps = caseInputs.red_flags || caseInputs.redFlags || []
  if (Array.isArray(rawFollowUps)) {
    rawFollowUps.forEach((item) => {
      if (item && item.key) {
        followUpMap[item.key] = normalizeText(item.text)
      }
    })
  }

  // Helper flags with negation awareness
  const hasChestKeywords = hasPositiveMatch(allText, [
    'chest pain', 'chest discomfort', 'chest pressure', 'chest tightness', 'सीने में दर्द', 'छाती में दर्द'
  ]) || hasPositiveMatch(allText, ['chest', 'सीने', 'सीना', 'छाती'])

  const hasBreathingKeywords = hasPositiveMatch(allText, [
    'shortness of breath', 'difficulty breathing', 'breathless', 'breathlessness',
    'trouble breathing', 'hard to breathe', 'gasping', 'dyspnea', 'breathing difficulty',
    'सांस लेने में तकलीफ', 'सांस फूलना', 'दम फूलना', 'दम घुटना'
  ]) || (hasPositiveMatch(allText, ['breath', 'breathing']) && hasPositiveMatch(allText, ['difficulty', 'trouble', 'short', 'hard', 'worse', 'तकलीफ', 'परेशानी', 'problem']))

  const hasSuddenOnset = hasPositiveMatch(allText, [
    'sudden', 'suddenly', 'acute', 'अचानक', 'एकदम', 'तुरंत'
  ])

  const hasWorsening = hasPositiveMatch(allText, [
    'worse', 'worsening', 'increasing', 'getting worse', 'बढ़ रहा', 'खराब'
  ])

  // -------------------------------------------------------------------------
  // 1. SIGNIFICANT BREATHING DIFFICULTY
  // -------------------------------------------------------------------------
  if (hasBreathingKeywords) {
    const breathingFollowUp = followUpMap['breathingDifficulty'] || ''
    const hasSpeechDifficulty = hasPositiveMatch(allText, [
      'cannot speak', 'difficulty speaking', 'speaking difficulty', 'hard to speak',
      'unable to talk', 'cannot talk', 'sentence', 'बोलने में परेशानी', 'बात नहीं कर पा'
    ])
    const hasBreathingWithChest = hasChestKeywords

    if (hasSuddenOnset || hasWorsening || hasSpeechDifficulty || hasBreathingWithChest || breathingFollowUp.includes('worse') || breathingFollowUp.includes('lying down') || breathingFollowUp.includes('activity')) {
      flags.push({
        code: 'SIGNIFICANT_BREATHING_DIFFICULTY',
        label: 'Significant breathing difficulty reported',
        labelHindi: 'सांस लेने में गंभीर कठिनाई दर्ज',
        severity: 'high',
        reason: hasBreathingWithChest
          ? 'Breathing difficulty reported in conjunction with chest discomfort'
          : hasSpeechDifficulty
          ? 'Breathing difficulty with speech or sentence completion impairment'
          : hasSuddenOnset
          ? 'Acute or sudden-onset breathing difficulty'
          : 'Progressive or activity-worsening dyspnea reported'
      })
    } else {
      flags.push({
        code: 'BREATHING_REVIEW',
        label: 'Shortness of breath noted — review recommended',
        labelHindi: 'सांस की तकलीफ दर्ज — समीक्षा की सलाह',
        severity: 'medium',
        reason: 'Patient reported breathing symptoms without immediate high-risk indicators'
      })
    }
  }

  // -------------------------------------------------------------------------
  // 2. CHEST DISCOMFORT
  // -------------------------------------------------------------------------
  if (hasChestKeywords) {
    const chestFollowUp = followUpMap['chestPain'] || ''
    const hasRadiation = hasPositiveMatch(allText, [
      'arm', 'jaw', 'neck', 'shoulder', 'back', 'बांह', 'जबड़ा', 'कंधा'
    ]) || hasPositiveMatch(chestFollowUp, ['yes', 'arm', 'jaw', 'हाँ', 'हां'])

    const hasDiaphoresisOrSyncope = hasPositiveMatch(allText, [
      'sweat', 'sweating', 'faint', 'fainted', 'dizzy', 'dizziness', 'पसीना', 'चक्कर', 'बेहोश'
    ]) || hasPositiveMatch(chestFollowUp, ['sweat', 'sweating', 'faint', 'पसीना'])

    const isSevereChest = severityScore !== null && severityScore >= 7

    if (hasRadiation || hasDiaphoresisOrSyncope || (hasSuddenOnset && isSevereChest) || hasBreathingKeywords) {
      flags.push({
        code: 'CARDIAC_PATTERN_DISCOMFORT',
        label: 'Chest discomfort with high-risk screening pattern',
        labelHindi: 'उच्च जोखिम संकेतकों के साथ सीने में तकलीफ दर्ज',
        severity: 'high',
        reason: hasRadiation
          ? 'Chest discomfort radiating to arm, jaw, neck, or shoulder'
          : hasBreathingKeywords
          ? 'Chest discomfort accompanied by shortness of breath'
          : hasDiaphoresisOrSyncope
          ? 'Chest discomfort accompanied by sweating or faintness'
          : 'Sudden onset severe chest pain reported'
      })
    } else {
      flags.push({
        code: 'CHEST_DISCOMFORT_REVIEW',
        label: 'Chest discomfort noted — review recommended',
        labelHindi: 'सीने में तकलीफ दर्ज — समीक्षा की सलाह',
        severity: 'medium',
        reason: 'Isolated chest discomfort reported without radiation, diaphoresis, or dyspnea'
      })
    }
  }

  // -------------------------------------------------------------------------
  // 3. SUDDEN NEUROLOGICAL CHANGES
  // -------------------------------------------------------------------------
  const hasNeurologicalKeywords = hasPositiveMatch(allText, [
    'weakness', 'numbness', 'slurred', 'slurring', 'speech difficulty',
    'face drooping', 'facial droop', 'paralysis', 'vision loss', 'double vision',
    'loss of vision', 'blurred vision suddenly', 'unsteady', 'cannot walk',
    'कमजोरी', 'सुन्न', 'लड़खड़ाहट', 'लकवा', 'आँखों के आगे अंधेरा', 'दिखाई नहीं दे रहा'
  ])

  if (hasNeurologicalKeywords) {
    flags.push({
      code: 'SUDDEN_NEUROLOGICAL_CHANGE',
      label: 'Sudden neurological changes or weakness reported',
      labelHindi: 'अचानक न्यूरोलॉजिकल बदलाव या कमजोरी दर्ज',
      severity: 'high',
      reason: 'Focal weakness, numbness, speech slurring, acute vision change, or motor loss reported'
    })
  }

  // -------------------------------------------------------------------------
  // 4. SIGNIFICANT BLEEDING
  // -------------------------------------------------------------------------
  const hasBleedingKeywords = hasPositiveMatch(allText, [
    'bleeding', 'blood', 'hemorrhage', 'vomiting blood', 'blood in stool',
    'coughing blood', 'खून', 'रक्तस्राव', 'खून की उल्टी', 'खून बह रहा'
  ])

  if (hasBleedingKeywords) {
    const isContinuingOrSevere = hasPositiveMatch(allText, [
      'continue', 'continuing', 'heavy', 'profuse', 'gushing', 'not stopping',
      'faint', 'weak', 'लगातार', 'बहुत ज्यादा', 'रुक नहीं रहा', 'बेहोशी'
    ])

    if (isContinuingOrSevere) {
      flags.push({
        code: 'SIGNIFICANT_BLEEDING',
        label: 'Significant or active bleeding reported',
        labelHindi: 'गंभीर या सक्रिय रक्तस्राव दर्ज',
        severity: 'high',
        reason: 'Active continuing bleeding or bleeding accompanied by faintness/weakness'
      })
    } else {
      flags.push({
        code: 'BLEEDING_REVIEW',
        label: 'Bleeding noted — review recommended',
        labelHindi: 'रक्तस्राव दर्ज — समीक्षा की सलाह',
        severity: 'medium',
        reason: 'Reported bleeding without current systemic compromise or uncontrollable flow'
      })
    }
  }

  // -------------------------------------------------------------------------
  // 5. SEVERE ABDOMINAL SYMPTOMS
  // -------------------------------------------------------------------------
  const hasAbdominalKeywords = hasPositiveMatch(allText, [
    'stomach pain', 'abdominal pain', 'belly pain', 'stomach ache',
    'पेट दर्द', 'पेट में दर्द', 'पेट'
  ])

  if (hasAbdominalKeywords) {
    const hasVomiting = hasPositiveMatch(allText, [
      'vomit', 'vomiting', 'nausea and vomiting', 'उल्टी'
    ])
    const isSevereAbdomen = (severityScore !== null && severityScore >= 8) || hasPositiveMatch(allText, [
      'severe', 'unbearable', 'excruciating', 'बहुत तेज', 'असहनीय'
    ])

    if (isSevereAbdomen && (hasSuddenOnset || hasVomiting || hasWorsening)) {
      flags.push({
        code: 'SEVERE_ABDOMINAL_SYMPTOMS',
        label: 'Severe acute abdominal symptoms reported',
        labelHindi: 'गंभीर पेट दर्द लक्षण दर्ज',
        severity: 'high',
        reason: hasVomiting
          ? 'Severe abdominal pain accompanied by repeated vomiting'
          : hasSuddenOnset
          ? 'Sudden-onset severe abdominal pain reported'
          : 'Progressively worsening severe abdominal discomfort'
      })
    } else if (isSevereAbdomen || hasVomiting) {
      flags.push({
        code: 'ABDOMINAL_SYMPTOMS_REVIEW',
        label: 'Abdominal pain noted — review recommended',
        labelHindi: 'पेट में दर्द दर्ज — समीक्षा की सलाह',
        severity: 'medium',
        reason: 'Abdominal discomfort reported requiring standard physician examination'
      })
    }
  }

  // -------------------------------------------------------------------------
  // 6. POSSIBLE SEVERE ALLERGIC REACTION
  // -------------------------------------------------------------------------
  const hasAllergyKeywords = hasPositiveMatch(allText, [
    'allergy', 'allergic', 'reaction', 'एलर्जी'
  ])
  const hasAirwayOrSwelling = hasPositiveMatch(allText, [
    'lip swelling', 'lips swelling', 'tongue swelling', 'throat swelling',
    'face swelling', 'swollen face', 'throat closing', 'stridor', 'wheezing',
    'होटों पर सूजन', 'जीभ में सूजन', 'गले में सूजन', 'चेहरे पर सूजन'
  ])

  if (hasAllergyKeywords && (hasAirwayOrSwelling || hasBreathingKeywords)) {
    flags.push({
      code: 'SEVERE_ALLERGIC_REACTION',
      label: 'Possible severe allergic reaction involving airway or facial swelling',
      labelHindi: 'संभावित गंभीर एलर्जी प्रतिक्रिया दर्ज (श्वास/चेहरे की सूजन)',
      severity: 'high',
      reason: 'Allergic reaction with airway involvement or facial/lip/tongue swelling'
    })
  }

  // -------------------------------------------------------------------------
  // 7. ALTERED CONSCIOUSNESS / ACUTE CONFUSION
  // -------------------------------------------------------------------------
  const hasConsciousnessKeywords = hasPositiveMatch(allText, [
    'loss of consciousness', 'lost consciousness', 'passed out', 'blackout', 'black out',
    'syncope', 'unconscious', 'fainted', 'confused', 'confusion', 'disoriented',
    'cannot stay awake', 'unresponsive', 'बेहोश', 'बेहोशी', 'चक्कर खाकर गिर'
  ])

  if (hasConsciousnessKeywords) {
    flags.push({
      code: 'ALTERED_CONSCIOUSNESS',
      label: 'Altered consciousness, syncope, or acute confusion reported',
      labelHindi: 'बेहोशी, भ्रम या चेतना में बदलाव दर्ज',
      severity: 'high',
      reason: 'Recent loss of consciousness, syncope, acute disorientation, or lethargy reported'
    })
  }

  // -------------------------------------------------------------------------
  // 8. HIGH REPORTED SEVERITY (Without other specific emergency flags)
  // -------------------------------------------------------------------------
  if (severityScore !== null && severityScore >= 8) {
    const hasAlreadyHigh = flags.some((f) => f.severity === 'high')
    if (!hasAlreadyHigh && !flags.some((f) => f.code === 'HIGH_REPORTED_SEVERITY')) {
      flags.push({
        code: 'HIGH_REPORTED_SEVERITY',
        label: `High patient-reported severity (${severityScore}/10)`,
        labelHindi: `मरीज़ द्वारा उच्च गंभीरता दर्ज (${severityScore}/10)`,
        severity: 'medium',
        reason: `Patient rated discomfort severity at ${severityScore}/10 — review recommended`
      })
    }
  }

  // Deduplicate flags by code
  const uniqueFlags = []
  const seenCodes = new Set()
  for (const f of flags) {
    if (!seenCodes.has(f.code)) {
      seenCodes.add(f.code)
      uniqueFlags.push(f)
    }
  }

  // Determine overall priority
  let overallPriority = PRIORITY.ROUTINE
  if (uniqueFlags.some((f) => f.severity === 'high')) {
    overallPriority = PRIORITY.HIGH
  } else if (uniqueFlags.some((f) => f.severity === 'medium')) {
    overallPriority = PRIORITY.REVIEW
  }

  return {
    priority: overallPriority,
    flags: uniqueFlags
  }
}

