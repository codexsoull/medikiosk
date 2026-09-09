import fs from 'fs'
const envContent = fs.readFileSync('backend/.env', 'utf8')
const match = envContent.match(/GEMINI_API_KEY=(.*)/)
const apiKey = match ? match[1].trim() : ''
console.log('Testing models with API Key starting with:', apiKey.slice(0, 8))

const modelsToTest = [
  'gemini-3.6-flash',
  'gemini-2.5-flash'
]

for (const model of modelsToTest) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Respond with OK' }] }]
      }),
      signal: controller.signal
    })
    clearTimeout(timer)

    console.log(`Model [${model}] status:`, res.status)
    if (res.ok) {
      const data = await res.json()
      console.log(`✓ Model [${model}] SUCCESS:`, data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim())
      break
    } else {
      const err = await res.json().catch(() => ({}))
      console.log(`✗ Model [${model}] error:`, err?.error?.message || res.statusText)
    }
  } catch (err) {
    console.log(`✗ Model [${model}] fetch error:`, err.message)
  }
}
