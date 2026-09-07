import Groq from 'groq-sdk'

/**
 * AI Service for MediKiosk
 * Provides real conversational patient intake using Groq API
 */

let groqClient = null

/**
 * Get or initialize Groq SDK client instance
 */
function getGroqClient() {
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
 * @returns {Promise<{ reply: string, language: string }>}
 */
export async function generateInterviewResponse({ message, language = 'en', conversation = [] }) {
  const provider = process.env.AI_PROVIDER || 'groq'
  const model = process.env.AI_MODEL || 'openai/gpt-oss-120b'
  const activeLang = language === 'hi' ? 'hi' : 'en'

  if (provider !== 'groq') {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`)
  }

  const groq = getGroqClient()

  // Build system prompt
  const systemPrompt = SYSTEM_INSTRUCTIONS[activeLang] || SYSTEM_INSTRUCTIONS.en
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

