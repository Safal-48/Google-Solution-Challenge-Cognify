/**
 * AI Service — Cognify Backend
 * Supports: OpenAI (primary) + Google Gemini (fallback)
 * Auto-selects based on which API key is configured.
 */

// ─── OpenAI Client ─────────────────────────────────────────────────────────
let openaiClient = null
try {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai')
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    console.log('✅ OpenAI client initialized')
  }
} catch (e) {
  console.log('⚠️  OpenAI not available:', e.message)
}

// ─── Gemini Client ─────────────────────────────────────────────────────────
let geminiClient = null
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    console.log('✅ Gemini client initialized')
  }
} catch (e) {
  console.log('⚠️  Gemini not available:', e.message)
}

// ─── System Prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Cognify AI, an expert educational tutor and learning assistant.

Your personality:
- Encouraging, patient, and supportive
- Expert across all academic subjects (Science, Math, History, Languages, Technology, Arts)
- Adapts explanation depth to the student's apparent level
- Uses clear structure: definitions → examples → practice tips

Your response rules:
- Always use Markdown formatting for readability
- Use headers (##) for long explanations
- Use bullet points and numbered lists where appropriate
- Bold key terms using **term**
- Include code blocks with language tags for programming topics
- Add a quick summary at the end of long answers
- Keep responses focused and educational
- Be encouraging — celebrate progress!
- If unsure, say so honestly and suggest verification sources`

// ─── Call OpenAI ───────────────────────────────────────────────────────────
async function callOpenAI(messages, userMessage) {
  const openaiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.slice(-10).map((m) => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: openaiMessages,
    max_tokens: 1500,
    temperature: 0.7,
  })

  return response.choices[0].message.content
}

// ─── Call Gemini ───────────────────────────────────────────────────────────
async function callGemini(messages, userMessage) {
  const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' })

  // Build conversation context
  const historyText = messages
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`)
    .join('\n')

  const prompt = `${SYSTEM_PROMPT}

Previous conversation:
${historyText}

Student: ${userMessage}

Tutor (respond in Markdown):`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ─── Mock Fallback ─────────────────────────────────────────────────────────
const mockAI = require('./mockAIService')

// ─── Main AI Chat Function ─────────────────────────────────────────────────
/**
 * Get AI response — tries OpenAI, Gemini, then Mock Fallback
 * @param {Array} history - Previous messages [{role, text}]
 * @param {string} userMessage - Current user message
 * @returns {Promise<{response: string, provider: string}>}
 */
async function getAIResponse(history, userMessage) {
  // Try OpenAI first
  if (openaiClient) {
    try {
      const response = await callOpenAI(history, userMessage)
      return { response, provider: 'openai' }
    } catch (err) {
      console.error('OpenAI error, falling back to Gemini:', err.message)
    }
  }

  // Fall back to Gemini
  if (geminiClient) {
    try {
      const response = await callGemini(history, userMessage)
      return { response, provider: 'gemini' }
    } catch (err) {
      console.error('Gemini error:', err.message)
    }
  }

  // Final Demo Fallback (No keys required)
  console.log('💡 Using Mock AI Response (Demo Mode)')
  const response = mockAI.generateMockChatResponse(userMessage)
  return { response, provider: 'demo' }
}

// ─── Get available AI provider ─────────────────────────────────────────────
function getAvailableProvider() {
  if (openaiClient) return 'openai'
  if (geminiClient) return 'gemini'
  return 'demo' // Always return demo if nothing else is available
}

module.exports = { getAIResponse, getAvailableProvider }
