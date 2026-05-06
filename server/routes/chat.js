const express = require('express')
const {
  sendMessage,
  getChatHistory,
  getSession,
  deleteSession,
  clearAllSessions,
  getStatus,
} = require('../controllers/chatController')
const { protect } = require('../middleware/auth')

const router = express.Router()

// All chat routes require authentication
router.use(protect)

// GET  /api/chat/status       → AI provider status
router.get('/status', getStatus)

// POST /api/chat              → Send message + get AI reply
router.post('/', sendMessage)

// GET  /api/chat/history      → All session summaries
router.get('/history', getChatHistory)

// GET  /api/chat/session/:id  → Full session with messages
router.get('/session/:sessionId', getSession)

// DELETE /api/chat/session/:id → Delete a session
router.delete('/session/:sessionId', deleteSession)

// DELETE /api/chat/sessions   → Clear ALL sessions
router.delete('/sessions', clearAllSessions)

module.exports = router
