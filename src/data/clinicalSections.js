/**
 * MediKiosk Clinical Section Tracking & Guidance Engine
 * Authoritative deterministic state machine for clinical history intake.
 */

export const CLINICAL_SECTIONS = [
  'chiefComplaint',
  'hpi',
  'pastMedicalHistory',
  'medications',
  'allergies',
  'familyHistory',
  'personalHistory',
  'reviewOfSystems'
]

export const SECTION_METADATA = {
  chiefComplaint: {
    index: 0,
    label: 'Chief Complaint',
    labelHindi: 'मुख्य शिकायत'
  },
  hpi: {
    index: 1,
    label: 'History of Present Illness',
    labelHindi: 'वर्तमान बीमारी का इतिहास'
  },
  pastMedicalHistory: {
    index: 4,
    label: 'Past Medical History',
    labelHindi: 'पिछला चिकित्सीय इतिहास'
  },
  medications: {
    index: 5,
    label: 'Medications',
    labelHindi: 'वर्तमान दवाइयां'
  },
  allergies: {
    index: 6,
    label: 'Allergies',
    labelHindi: 'एलर्जी'
  },
  familyHistory: {
    index: 7,
    label: 'Family History',
    labelHindi: 'पारिवारिक इतिहास'
  },
  personalHistory: {
    index: 8,
    label: 'Personal History',
    labelHindi: 'व्यक्तिगत इतिहास और आदतें'
  },
  reviewOfSystems: {
    index: 9,
    label: 'Review of Systems',
    labelHindi: 'अन्य लक्षण समीक्षा'
  }
}

export const SECTION_FALLBACK_QUESTIONS = {
  chiefComplaint: {
    English: 'What brings you to the hospital today?',
    Hindi: 'आज आप अस्पताल किस तकलीफ के कारण आए हैं?'
  },
  hpi: {
    English: 'When did this problem begin and how severe is it on a scale of 1 to 10?',
    Hindi: 'यह समस्या कब शुरू हुई और 1 से 10 के पैमाने पर यह कितनी गंभीर है?'
  },
  pastMedicalHistory: {
    English: 'Do you have any previous medical conditions such as diabetes, high blood pressure, or asthma?',
    Hindi: 'क्या आपको पहले से कोई बीमारी है, जैसे मधुमेह (शुगर), बीपी या दमा?'
  },
  medications: {
    English: 'Are you currently taking any regular medications or treatments?',
    Hindi: 'क्या आप वर्तमान में कोई नियमित दवाइयां ले रहे हैं?'
  },
  allergies: {
    English: 'Do you have any allergies to medicines, foods, or anything else?',
    Hindi: 'क्या आपको किसी दवा, भोजन या अन्य चीज़ से कोई एलर्जी है?'
  },
  familyHistory: {
    English: 'Does anyone in your immediate family have medical conditions like diabetes, high blood pressure, or heart disease?',
    Hindi: 'क्या आपके परिवार में किसी को मधुमेह (शुगर), उच्च रक्तचाप (बीपी) या दिल की बीमारी जैसी कोई समस्या है?'
  },
  personalHistory: {
    English: 'Could you tell us about your daily habits such as diet, sleep, and whether you smoke or drink alcohol?',
    Hindi: 'क्या आप अपने खान-पान, नींद, और क्या आप धूम्रपान या शराब का सेवन करते हैं, इसके बारे में बता सकते हैं?'
  },
  reviewOfSystems: {
    English: 'Are you experiencing any other issues like fever, chills, dizziness, or stomach troubles?',
    Hindi: 'क्या आपको बुखार, ठंड लगना, चक्कर आना या पेट से जुड़ी कोई अन्य समस्या भी महसूस हो रही है?'
  }
}

export const SECTION_QUICK_SUGGESTIONS = {
  chiefComplaint: {
    English: ['Headache', 'Fever', 'Stomach Pain', 'Chest Discomfort', 'Cough & Cold', 'Joint Pain'],
    Hindi: ['सिरदर्द', 'बुखार', 'पेट दर्द', 'सीने में तकलीफ', 'खांसी-जुकाम', 'जोड़ों का दर्द']
  },
  hpi: {
    English: ['Today, Mild (2-3)', 'Yesterday, Moderate (5-6)', 'Few days ago, Severe (8/10)', 'Ongoing for weeks'],
    Hindi: ['आज से, हल्का दर्द', 'कल से, मध्यम दर्द', 'कुछ दिनों से, तेज दर्द', 'लंबे समय से']
  },
  pastMedicalHistory: {
    English: ['None / Healthy', 'Diabetes (Sugar)', 'Hypertension (BP)', 'Asthma / Breathing', 'Thyroid'],
    Hindi: ['कोई बीमारी नहीं', 'मधुमेह (शुगर)', 'उच्च रक्तचाप (बीपी)', 'दमा / सांस की तकलीफ', 'थायरॉयड']
  },
  medications: {
    English: ['No regular medications', 'Painkillers (Paracetamol)', 'Blood Pressure Meds', 'Diabetes Meds', 'Antacids'],
    Hindi: ['कोई दवा नहीं', 'दर्द निवारक (पैरासिटामोल)', 'बीपी की दवा', 'शुगर की दवा', 'एंटासिड']
  },
  allergies: {
    English: ['No known allergies', 'Penicillin allergy', 'Sulfa drugs', 'Dust / Pollen allergy', 'Food allergy'],
    Hindi: ['कोई ज्ञात एलर्जी नहीं', 'पेनिसिलिन से एलर्जी', 'सल्फा दवाओं से', 'धूल / पराग से', 'भोजन से एलर्जी']
  },
  familyHistory: {
    English: ['No major family illness', 'Diabetes in family', 'Hypertension (BP)', 'Heart disease in family', 'Asthma in family'],
    Hindi: ['परिवार में कोई बड़ी बीमारी नहीं', 'परिवार में शुगर/डायबिटीज', 'हाई बीपी', 'हृदय रोग', 'अस्थमा']
  },
  personalHistory: {
    English: ['Vegetarian, non-smoker', 'Non-vegetarian, non-smoker', 'Occasional smoking', 'Occasional alcohol', 'Normal sleep & diet'],
    Hindi: ['शाकाहारी, धूम्रपान नहीं', 'मांसाहारी, धूम्रपान नहीं', 'धूम्रपान करते हैं', 'शराब का सेवन करते हैं', 'सामान्य खान-पान और नींद']
  },
  reviewOfSystems: {
    English: ['None / No other issues', 'Mild fever/chills', 'Dizziness', 'Stomach upset', 'Fatigue/Weakness'],
    Hindi: ['कोई अन्य समस्या नहीं', 'हल्का बुखार/ठंड', 'चक्कर आना', 'पेट में तकलीफ', 'कमजोरी/थकान']
  }
}

/**
 * Keyword matchers for intent detection when a patient answers
 */
const INTENT_PATTERNS = {
  allergies: /(?:allerg|allergi|एलर्जी|nkda|penicillin|sulfa|no known allerg|no allerg|कोई.*एलर्जी.*नहीं)/i,
  familyHistory: /(?:family|father|mother|parent|brother|sister|माता|पिता|परिवार|खानदान|hereditary|genetic|परिवार में कोई)/i,
  personalHistory: /(?:diet|vegetarian|non-veg|smoke|smoking|tobacco|alcohol|drink|drinking|sleep|शाकाहारी|मांसाहारी|धूम्रपान|सिगरेट|शराब|दारू|नींद|lifestyle)/i,
  pastMedicalHistory: /(?:diabetes|sugar|hypertension|bp|pressure|asthma|thyroid|chronic|illness|disease|hospital|surgery|बीमारी|दमा|थायरॉयड)/i,
  medications: /(?:medication|medicine|tablet|pill|syrup|paracetamol|insulin|antacid|bp meds|दवा|दवाई|गोली)/i
}

/**
 * Maps legacy questionIndex to clinical section
 */
export function mapIndexToSection(idx) {
  if (idx === 0) return 'chiefComplaint'
  if (idx >= 1 && idx <= 3) return 'hpi'
  if (idx === 4) return 'pastMedicalHistory'
  if (idx === 5) return 'medications'
  if (idx === 6) return 'allergies'
  if (idx === 7) return 'familyHistory'
  if (idx === 8) return 'personalHistory'
  if (idx >= 9) return 'reviewOfSystems'
  return null
}

/**
 * Evaluates conversation history and returns comprehensive section status
 * @param {Array<Object>} conversation
 * @returns {{ completedSections: Set<string>, sectionAnswers: Object, nextIncomplete: string|null, isComplete: boolean }}
 */
export function getInterviewSectionStatus(conversation = []) {
  const completedSections = new Set()
  const sectionAnswers = {}

  let lastTargetedSection = null

  conversation.forEach((msg) => {
    if (!msg || !msg.text) return

    if (msg.sender === 'ai') {
      if (msg.section && CLINICAL_SECTIONS.includes(msg.section)) {
        lastTargetedSection = msg.section
      } else if (typeof msg.questionIndex === 'number') {
        lastTargetedSection = mapIndexToSection(msg.questionIndex)
      } else if (msg.type === 'greeting') {
        lastTargetedSection = 'chiefComplaint'
      }
    } else if (msg.sender === 'patient') {
      const text = msg.text.trim()
      if (!text) return

      // Direct section tagging on message
      if (msg.section && CLINICAL_SECTIONS.includes(msg.section)) {
        completedSections.add(msg.section)
        sectionAnswers[msg.section] = text
      }

      // Legacy answerIndex tagging
      if (typeof msg.answerIndex === 'number') {
        const mapped = mapIndexToSection(msg.answerIndex)
        if (mapped) {
          completedSections.add(mapped)
          sectionAnswers[mapped] = text
        }
      }

      // Response to previously targeted AI question
      if (lastTargetedSection && !msg.followUpKey) {
        completedSections.add(lastTargetedSection)
        sectionAnswers[lastTargetedSection] = text
      }

      // Natural intent detection: check if response explicitly answers other sections
      for (const [sec, pattern] of Object.entries(INTENT_PATTERNS)) {
        if (!completedSections.has(sec) && pattern.test(text)) {
          completedSections.add(sec)
          sectionAnswers[sec] = text
        }
      }
    }
  })

  // Check if all required sections are completed
  const nextIncomplete = CLINICAL_SECTIONS.find((s) => !completedSections.has(s)) || null
  const isComplete = nextIncomplete === null

  return {
    completedSections,
    sectionAnswers,
    nextIncomplete,
    isComplete
  }
}

/**
 * Checks if a specific clinical section has been adequately answered
 * @param {string} section
 * @param {Array<Object>} conversation
 * @returns {boolean}
 */
export function isSectionCompleted(section, conversation = []) {
  const status = getInterviewSectionStatus(conversation)
  return status.completedSections.has(section)
}

/**
 * Returns the next incomplete clinical section in priority order, or null if all complete
 * @param {Array<Object>} conversation
 * @returns {string|null}
 */
export function getNextIncompleteSection(conversation = []) {
  const status = getInterviewSectionStatus(conversation)
  return status.nextIncomplete
}

/**
 * Returns the deterministic fallback question for a section
 * @param {string} section
 * @param {string} [language='English']
 * @returns {string}
 */
export function getFallbackQuestionForSection(section, language = 'English') {
  const langKey = language === 'Hindi' || language === 'hi' ? 'Hindi' : 'English'
  const cfg = SECTION_FALLBACK_QUESTIONS[section] || SECTION_FALLBACK_QUESTIONS.chiefComplaint
  return cfg[langKey] || cfg.English
}

/**
 * Returns quick suggestions for a section
 * @param {string} section
 * @param {string} [language='English']
 * @returns {Array<string>}
 */
export function getQuickSuggestionsForSection(section, language = 'English') {
  const langKey = language === 'Hindi' || language === 'hi' ? 'Hindi' : 'English'
  const cfg = SECTION_QUICK_SUGGESTIONS[section] || SECTION_QUICK_SUGGESTIONS.chiefComplaint
  return cfg[langKey] || cfg.English || []
}
