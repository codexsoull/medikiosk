import Groq from 'groq-sdk'

/**
 * AI Service for MediKiosk
 * Provides real conversational patient intake using Groq API
 */

let groqClient = null

/**
 * Get or initialize Groq SDK client instance
 */
export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || !apiKey.trim()) {
    throw new Error('GROQ_API_KEY is not configured')
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: apiKey.trim() })
  }
  return groqClient
}

/**
 * Controlled system instructions for MediKiosk OPD intake assistant
 */
const SYSTEM_INSTRUCTIONS = {
  en: `You are an empathetic, professional patient-history intake assistant for MediKiosk, an outpatient department (OPD) hospital kiosk in India.
Your goal is to elicit a standardized, focused medical history from the patient before they see the doctor.
Rules:
- Ask ONE concise, clear question at a time.
- Use simple, friendly Indian English. Avoid complex medical jargon.
- DO NOT diagnose the patient.
- DO NOT prescribe medication or suggest medical treatments.
- DO NOT invent patient symptoms or facts.
- Avoid repeating questions the patient has already answered.
- Keep your question brief (1 to 2 sentences) because this is a kiosk interface.
- Respond ONLY in valid JSON format: {"reply": "Your question here"}`,

  hi: `आप भारत के एक अस्पताल के ओपीडी कियोस्क (MediKiosk) के लिए मरीज़-इतिहास इनटेक सहायक हैं।
आपका कार्य डॉक्टर के देखने से पहले मरीज़ से उनके स्वास्थ्य की जानकारी लेना है।
नियम:
- एक बार में केवल एक संक्षिप्त और स्पष्ट प्रश्न पूछें।
- सरल, स्वाभाविक और विनम्र हिंदी का प्रयोग करें। जटिल चिकित्सीय शब्दों से बचें।
- कोई बीमारी या निदान (diagnosis) न बताएं।
- कोई दवा या उपचार न सुझाएं।
- अपनी ओर से कोई झूठी जानकारी न जोड़ें।
- जिन बातों का उत्तर मरीज़ पहले दे चुका है, उन्हें दोबारा न पूछें।
- प्रश्न छोटा (1-2 वाक्य) रखें क्योंकि यह कियोस्क स्क्रीन पर पढ़ा जाएगा।
- केवल मान्य JSON प्रारूप में उत्तर दें: {"reply": "यहाँ आपका प्रश्न"}`
}

const SECTION_PROMPT_GUIDANCE = {
  en: {
    chiefComplaint: 'CURRENT SECTION: Chief Complaint. Ask what main problem or symptom brought the patient to the clinic today.',
    hpi: 'CURRENT SECTION: History of Present Illness (HPI). Ask about when the symptom started, its severity (1 to 10 scale), or any associated symptoms.',
    pastMedicalHistory: 'CURRENT SECTION: Past Medical History. Ask if the patient has any past illnesses or chronic conditions like diabetes, high BP, thyroid, or asthma.',
    medications: 'CURRENT SECTION: Medications. Ask if the patient is currently taking any regular medications or treatments.',
    allergies: 'CURRENT SECTION: Allergies. Ask if the patient has any known allergies to medicines, foods, or anything else.',
    familyHistory: 'CURRENT SECTION: Family History. Ask if anyone in their immediate family has medical conditions like diabetes, high BP, or heart disease.',
    personalHistory: 'CURRENT SECTION: Personal History. Ask about their lifestyle habits such as diet, sleep, and whether they use tobacco or drink alcohol.',
    reviewOfSystems: 'CURRENT SECTION: Review of Systems. Ask if they are experiencing any other general systemic symptoms such as fever, chills, dizziness, or weakness.'
  },
  hi: {
    chiefComplaint: 'वर्तमान खंड: मुख्य शिकायत (Chief Complaint)। पूछें कि आज मरीज़ किस मुख्य समस्या या लक्षण के कारण अस्पताल आए हैं।',
    hpi: 'वर्तमान खंड: वर्तमान बीमारी का इतिहास (HPI)। पूछें कि समस्या कब शुरू हुई, 1 से 10 के पैमाने पर कितनी गंभीर है, या कोई अन्य लक्षण साथ में हैं।',
    pastMedicalHistory: 'वर्तमान खंड: पिछला चिकित्सीय इतिहास (Past Medical History)। पूछें कि क्या मरीज़ को पहले से कोई बीमारी है, जैसे शुगर, बीपी, थायरॉयड या दमा।',
    medications: 'वर्तमान खंड: दवाइयां (Medications)। पूछें कि क्या मरीज़ वर्तमान में कोई नियमित दवा ले रहे हैं।',
    allergies: 'वर्तमान खंड: एलर्जी (Allergies)। पूछें कि क्या मरीज़ को किसी दवा, भोजन या अन्य चीज़ से कोई एलर्जी है।',
    familyHistory: 'वर्तमान खंड: पारिवारिक इतिहास (Family History)। पूछें कि क्या परिवार में किसी को शुगर, बीपी या दिल की बीमारी जैसी कोई समस्या है।',
    personalHistory: 'वर्तमान खंड: व्यक्तिगत आदतें (Personal History)। पूछें कि उनका खान-पान, नींद कैसी है और क्या वे तंबाकू या शराब का सेवन करते हैं।',
    reviewOfSystems: 'वर्तमान खंड: अन्य लक्षण समीक्षा (Review of Systems)। पूछें कि क्या उन्हें बुखार, ठंड, चक्कर या कमजोरी जैसा कोई अन्य लक्षण महसूस हो रहा है।'
  }
}

/**
 * Cleanly extract and normalize the reply from Groq model output
 * @param {string} rawContent
 * @returns {string} normalized question text
 */
function parseReply(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('Empty response received from AI provider')
  }

  const trimmed = rawContent.trim()

  // 1. Try direct JSON parsing
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed.reply === 'string' && parsed.reply.trim()) {
      return parsed.reply.trim()
    }
  } catch {
    // Continue to fallback parsing
  }

  // 2. Try extracting JSON object from markdown code fence or text block
  const jsonMatch = trimmed.match(/\{[\s\S]*?"reply"\s*:\s*"([\s\S]*?)"[\s\S]*?\}/)
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].replace(/\\"/g, '"').trim()
  }

  // 3. Fallback: If returned as clean plain text without JSON wrapper
  const stripped = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  if (stripped) {
    return stripped
  }

  throw new Error('Could not parse valid reply from AI provider response')
}

/**
 * Generate a conversational clinical intake response using Groq
 * @param {Object} params
 * @param {string} params.message - Latest patient message
 * @param {string} [params.language='en'] - 'en' or 'hi'
 * @param {Array<Object>} [params.conversation=[]] - Prior conversation messages
 * @param {string} [params.currentSection] - Currently active clinical section
 * @returns {Promise<{ reply: string, language: string }>}
 */
export async function generateInterviewResponse({ message, language = 'en', conversation = [], currentSection }) {
  const provider = process.env.AI_PROVIDER || 'groq'
  const model = process.env.AI_MODEL || 'openai/gpt-oss-120b'
  const activeLang = language === 'hi' ? 'hi' : 'en'

  if (provider !== 'groq') {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`)
  }

  const groq = getGroqClient()

  // Build system prompt with section guidance if currentSection provided
  let systemPrompt = SYSTEM_INSTRUCTIONS[activeLang] || SYSTEM_INSTRUCTIONS.en
  if (currentSection && SECTION_PROMPT_GUIDANCE[activeLang]?.[currentSection]) {
    const guidance = SECTION_PROMPT_GUIDANCE[activeLang][currentSection]
    const sectionDirective = activeLang === 'hi'
      ? `\n\nलक्ष्य निर्देश:\n${guidance}\n- वर्तमान खंड (${currentSection}) से संबंधित केवल एक संक्षिप्त, विनम्र प्रश्न पूछें।\n- इस खंड को न छोड़ें।`
      : `\n\nTARGET INSTRUCTION:\n${guidance}\n- Ask exactly one concise question that collects information for the CURRENT SECTION (${currentSection}).\n- Do not skip the current section.\n- Do not ask about a different section unless the patient's answer naturally provides information for it.`
    systemPrompt += sectionDirective
  }

  const messages = [{ role: 'system', content: systemPrompt }]

  // Sanitize and bound conversation history (limit to last 10 messages to prevent token bloat)
  if (Array.isArray(conversation)) {
    const boundedHistory = conversation.slice(-10)
    for (const msg of boundedHistory) {
      if (!msg || typeof msg !== 'object') continue
      const role = msg.role === 'assistant' ? 'assistant' : 'user'
      const content = typeof msg.content === 'string' ? msg.content.trim() : ''
      if (content) {
        messages.push({ role, content })
      }
    }
  }

  // Ensure current message is the final user prompt if not already present
  const lastMsg = messages[messages.length - 1]
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== message.trim()) {
    messages.push({ role: 'user', content: message.trim() })
  }

  // Call Groq chat completions
  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 600
  })

  const rawContent = completion.choices?.[0]?.message?.content
  const reply = parseReply(rawContent)

  return {
    reply,
    language: activeLang
  }
}

