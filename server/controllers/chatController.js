const ChatSession = require('../models/ChatSession')
const User = require('../models/User')
const { getAIResponse, getAvailableProvider } = require('../services/aiService')

// ─── POST /api/chat ────────────────────────────────────────────────────────
// Full AI chat: receive message → call AI → store both messages → return AI reply
const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required.' })
    }

    // Check AI provider is available
    const provider = getAvailableProvider()
    if (!provider) {
      return res.status(503).json({
        error: 'No AI provider configured.',
        hint: 'Set OPENAI_API_KEY or GEMINI_API_KEY in server/.env',
        code: 'NO_AI_PROVIDER',
      })
    }

    // ── Find or create chat session ──────────────────────────────────────
    let session
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id })
    }
    if (!session) {
      // Auto-generate title from first message
      const title = message.length > 60 ? message.slice(0, 57) + '...' : message
      session = await ChatSession.create({
        userId: req.user._id,
        title,
        messages: [],
      })
    }

    // ── Store user message ───────────────────────────────────────────────
    session.messages.push({ role: 'user', text: message.trim(), timestamp: new Date() })

    // ── Call AI with conversation history ────────────────────────────────
    // Pass previous messages (before the new one) as context
    const history = session.messages.slice(0, -1) // exclude just-added user msg

    let aiResponse
    try {
      const result = await getAIResponse(history, message.trim())
      aiResponse = result.response
      console.log(`💬 [${provider.toUpperCase()}] Responded for user: ${req.user.email}`)
    } catch (aiErr) {
      // Demo mode should never fail, but if real AI fails, fallback is already in getAIResponse
      session.messages.pop()
      await session.save()
      console.error('AI generation failed:', aiErr.message)
      return res.status(502).json({
        error: aiErr.message,
        code: 'AI_ERROR',
      })
    }

    // ── Store AI response ────────────────────────────────────────────────
    session.messages.push({
      role: 'model',
      text: aiResponse,
      timestamp: new Date(),
    })
    await session.save()

    // ── Award XP to user ─────────────────────────────────────────────────
    const user = await User.findById(req.user._id)
    user.addXP(5)
    user.updateStreak()
    await user.save()

    // ── Return full response ─────────────────────────────────────────────
    res.json({
      success: true,
      sessionId: session._id,
      reply: aiResponse,
      provider,
      xpGained: 5,
      messageCount: session.messages.length,
    })
  } catch (err) {
    console.error('Chat sendMessage error:', err)
    res.status(500).json({ error: 'Failed to process chat message.' })
  }
}

// ─── GET /api/chat/history ─────────────────────────────────────────────────
// Return all sessions (summaries only — no full message content for performance)
const getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('title createdAt updatedAt messages')
      .lean()

    // Return sessions with message count and last message preview
    const summaries = sessions.map((s) => ({
      _id: s._id,
      title: s.title,
      messageCount: s.messages.length,
      lastMessage: s.messages[s.messages.length - 1]?.text?.slice(0, 80) || '',
      lastMessageRole: s.messages[s.messages.length - 1]?.role || 'user',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }))

    res.json({ success: true, sessions: summaries })
  } catch (err) {
    console.error('GetChatHistory error:', err)
    res.status(500).json({ error: 'Failed to fetch chat history.' })
  }
}

// ─── GET /api/chat/session/:sessionId ─────────────────────────────────────
// Return a specific full session with all messages
const getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
    })
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found.' })
    }
    res.json({ success: true, session })
  } catch (err) {
    console.error('GetSession error:', err)
    res.status(500).json({ error: 'Failed to fetch session.' })
  }
}

// ─── DELETE /api/chat/session/:sessionId ──────────────────────────────────
const deleteSession = async (req, res) => {
  try {
    const result = await ChatSession.findOneAndDelete({
      _id: req.params.sessionId,
      userId: req.user._id,
    })
    if (!result) {
      return res.status(404).json({ error: 'Session not found.' })
    }
    res.json({ success: true, message: 'Chat session deleted.' })
  } catch (err) {
    console.error('DeleteSession error:', err)
    res.status(500).json({ error: 'Failed to delete session.' })
  }
}

// ─── DELETE /api/chat/sessions ────────────────────────────────────────────
// Clear ALL sessions for the user
const clearAllSessions = async (req, res) => {
  try {
    const result = await ChatSession.deleteMany({ userId: req.user._id })
    res.json({ success: true, message: `Deleted ${result.deletedCount} sessions.` })
  } catch (err) {
    console.error('ClearAll error:', err)
    res.status(500).json({ error: 'Failed to clear chat history.' })
  }
}

// ─── GET /api/chat/status ─────────────────────────────────────────────────
// Check which AI provider is active
const getStatus = async (req, res) => {
  const provider = getAvailableProvider()
  res.json({
    success: true,
    aiProvider: provider,
    available: true,
    message: provider === 'demo' 
      ? 'Cognify Demo AI (Limited Mode)'
      : `AI powered by ${provider === 'openai' ? 'OpenAI GPT' : 'Google Gemini'}`,
  })
}

module.exports = {
  sendMessage,
  getChatHistory,
  getSession,
  deleteSession,
  clearAllSessions,
  getStatus,
}
