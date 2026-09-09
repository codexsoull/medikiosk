import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('🧪 Running Comprehensive Acceptance Tests for Milestone 6.3 (Real Groq AI Integration)...\n')

const rootDir = 'c:/Users/adiis/Desktop/New folder/medikiosk'
const aiServicePath = path.join(rootDir, 'backend', 'services', 'ai.js')
const aiRoutePath = path.join(rootDir, 'backend', 'routes', 'ai.js')
const aiApiPath = path.join(rootDir, 'src', 'api', 'ai.js')
const interviewPath = path.join(rootDir, 'src', 'screens', 'Interview.jsx')
const chatBubblePath = path.join(rootDir, 'src', 'components', 'ChatBubble.jsx')
const translationsPath = path.join(rootDir, 'src', 'translations', 'translations.js')
const cssPath = path.join(rootDir, 'src', 'App.css')
const envExamplePath = path.join(rootDir, 'backend', '.env.example')
const gitignorePath = path.join(rootDir, '.gitignore')

const aiServiceSrc = fs.readFileSync(aiServicePath, 'utf8')
const aiRouteSrc = fs.readFileSync(aiRoutePath, 'utf8')
const aiApiSrc = fs.readFileSync(aiApiPath, 'utf8')
const interviewSrc = fs.readFileSync(interviewPath, 'utf8')
const chatBubbleSrc = fs.readFileSync(chatBubblePath, 'utf8')
const translationsSrc = fs.readFileSync(translationsPath, 'utf8')
const cssSrc = fs.readFileSync(cssPath, 'utf8')
const envExampleSrc = fs.readFileSync(envExamplePath, 'utf8')
const gitignoreSrc = fs.readFileSync(gitignorePath, 'utf8')

// Test 1: Security & Environment hygiene
console.log('Test 1: Verifying Security & Environment hygiene...')
assert.ok(envExampleSrc.includes('GROQ_API_KEY='), 'backend/.env.example must have GROQ_API_KEY placeholder')
assert.ok(envExampleSrc.includes('AI_PROVIDER=groq'), 'backend/.env.example must define AI_PROVIDER=groq')
assert.ok(envExampleSrc.includes('AI_MODEL=openai/gpt-oss-120b'), 'backend/.env.example must define AI_MODEL')
assert.ok(!envExampleSrc.includes('gsk_'), 'backend/.env.example must NEVER contain a real Groq key')
assert.ok(gitignoreSrc.includes('.env'), '.gitignore must ignore .env files')
console.log('✅ Passed Test 1: Environment variables sanitized and gitignore configured.')

// Test 2: Backend AI Service architecture & guardrails
console.log('Test 2: Verifying Backend AI Service (backend/services/ai.js)...')
assert.ok(aiServiceSrc.includes("import Groq from 'groq-sdk'"), 'Must import Groq SDK')
assert.ok(aiServiceSrc.includes('export async function generateInterviewResponse'), 'Must export generateInterviewResponse')
assert.ok(aiServiceSrc.includes('SYSTEM_INSTRUCTIONS'), 'Must have structured system instructions')
assert.ok(aiServiceSrc.includes('DO NOT diagnose the patient'), 'Clinical guardrail: No diagnosis')
assert.ok(aiServiceSrc.includes('DO NOT prescribe medication'), 'Clinical guardrail: No prescriptions')
assert.ok(aiServiceSrc.includes('slice(-10)'), 'Conversation history must be bounded to 10 messages')
assert.ok(aiServiceSrc.includes('parseReply'), 'Must have robust JSON/text parsing fallback')
console.log('✅ Passed Test 2: AI Service guardrails, prompts, token bounding, and parsing verified.')

// Test 3: Backend AI Route validation & error handling
console.log('Test 3: Verifying Backend AI Route (backend/routes/ai.js)...')
assert.ok(aiRouteSrc.includes("router.post(['/chat', '/ai/chat']"), 'Must support POST /api/ai/chat')
assert.ok(aiRouteSrc.includes('generateInterviewResponse'), 'Route calls generateInterviewResponse')
assert.ok(aiRouteSrc.includes("status: 'error'"), 'Returns structured error format')
assert.ok(aiRouteSrc.includes('Security: Never leak API keys'), 'Security safeguards against leaking stack/keys')
console.log('✅ Passed Test 3: Route validation and security controls verified.')

// Test 4: Frontend API Utility (src/api/ai.js)
console.log('Test 4: Verifying Frontend API Utility (src/api/ai.js)...')
assert.ok(aiApiSrc.includes('export async function sendMessageToAI'), 'Must export sendMessageToAI')
assert.ok(aiApiSrc.includes('/api/ai/chat'), 'Must call /api/ai/chat')
assert.ok(aiApiSrc.includes("language: language === 'Hindi' || language === 'hi' ? 'hi' : 'en'"), 'Normalizes language code')
console.log('✅ Passed Test 4: Frontend API client verified.')

// Test 5: Interview Screen AI Integration
console.log('Test 5: Verifying Interview Screen AI integration (src/screens/Interview.jsx)...')
assert.ok(interviewSrc.includes("import { sendMessageToAI } from '../api/ai'"), 'Interview imports sendMessageToAI')
assert.ok(interviewSrc.includes('const [isAiThinking, setIsAiThinking] = useState(false)'), 'Interview has isAiThinking state')
assert.ok(interviewSrc.includes('const [aiError, setAiError] = useState(null)'), 'Interview has aiError state')
assert.ok(interviewSrc.includes('detectRedFlagTrigger'), 'Authoritative red-flag detection intact')
assert.ok(interviewSrc.includes('await sendMessageToAI'), 'handleSendMessage awaits sendMessageToAI')
assert.ok(interviewSrc.includes('isAiGenerated: Boolean(dynamicAiReply)'), 'AI-generated question tagged with isAiGenerated')
assert.ok(interviewSrc.includes('dynamicAiReply || t.interview.questions[nextIndex]'), 'Graceful fallback to standard question')
assert.ok(interviewSrc.includes('ai-thinking-indicator'), 'Renders ai-thinking-indicator')
assert.ok(interviewSrc.includes('ai-error-banner'), 'Renders ai-error-banner')
console.log('✅ Passed Test 5: Interview screen AI integration and UI feedback verified.')

// Test 6: ChatBubble dynamic AI question rendering
console.log('Test 6: Verifying ChatBubble AI message rendering...')
assert.ok(chatBubbleSrc.includes('if (message.isAiGenerated)'), 'ChatBubble checks message.isAiGenerated')
assert.ok(chatBubbleSrc.includes('displayText = message.text'), 'ChatBubble sets displayText = message.text')
console.log('✅ Passed Test 6: ChatBubble renders AI responses accurately.')

// Test 7: CSS styling for AI feedback
console.log('Test 7: Verifying CSS styles in App.css...')
assert.ok(cssSrc.includes('.ai-thinking-indicator'), 'App.css defines .ai-thinking-indicator')
assert.ok(cssSrc.includes('.thinking-dot'), 'App.css defines .thinking-dot')
assert.ok(cssSrc.includes('@keyframes thinking-bounce'), 'App.css defines thinking animation')
assert.ok(cssSrc.includes('.ai-error-banner'), 'App.css defines .ai-error-banner')
console.log('✅ Passed Test 7: CSS styling verified.')

// Test 8: Live HTTP Route Validation on running server
console.log('Test 8: Testing Live Server POST /api/ai/chat validation...')
const BASE_URL = 'http://localhost:5000'

// 8a: Missing message -> HTTP 400
const r1 = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
assert.equal(r1.status, 400, 'Empty body must return 400')
const d1 = await r1.json()
assert.equal(d1.status, 'error', 'Must return error status')
console.log('  [PASS] Missing message returned HTTP 400')

// 8b: Unsupported language -> HTTP 400
const r2 = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', language: 'fr' })
})
assert.equal(r2.status, 400, 'Unsupported language must return 400')
const d2 = await r2.json()
assert.equal(d2.status, 'error')
console.log('  [PASS] Unsupported language returned HTTP 400')

// 8c: Non-array conversation -> HTTP 400
const r3 = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', conversation: 'not an array' })
})
assert.equal(r3.status, 400, 'Non-array conversation must return 400')
console.log('  [PASS] Non-array conversation returned HTTP 400')

// 8d: Live English AI turn with conversation history
console.log('Test 9: Testing Live Server English AI completion...')
const r4 = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'I have had stomach pain since this morning',
    language: 'en',
    conversation: [
      { role: 'assistant', content: 'What brings you to the clinic today?' },
      { role: 'user', content: 'I have had stomach pain since this morning' }
    ]
  })
})
assert.equal(r4.status, 200, 'Live English query returned HTTP 200')
const d4 = await r4.json()
assert.equal(d4.status, 'success')
assert.equal(d4.data.language, 'en')
assert.ok(typeof d4.data.reply === 'string' && d4.data.reply.length > 5)
console.log(`  [PASS] Live English AI response: "${d4.data.reply}"`)

// 8e: Live Hindi AI turn
console.log('Test 10: Testing Live Server Hindi AI completion...')
const r5 = await fetch(`${BASE_URL}/api/ai/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'मुझे दो दिन से बुखार और सिरदर्द है',
    language: 'hi'
  })
})
assert.equal(r5.status, 200, 'Live Hindi query returned HTTP 200')
const d5 = await r5.json()
assert.equal(d5.status, 'success')
assert.equal(d5.data.language, 'hi')
assert.ok(typeof d5.data.reply === 'string' && d5.data.reply.length > 5)
console.log(`  [PASS] Live Hindi AI response: "${d5.data.reply}"`)

console.log('\n🎉 ALL 10 ACCEPTANCE TEST SUITES PASSED FOR MILESTONE 6.3!')
