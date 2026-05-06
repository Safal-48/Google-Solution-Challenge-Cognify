const express = require('express')
const { generateQuiz, submitQuiz, getQuizHistory, getQuizById, getRecommendations } = require('../controllers/quizController')
const { protect } = require('../middleware/auth')

const router = express.Router()

// All quiz routes require auth
router.use(protect)

// POST /api/quiz/generate    → AI generates quiz, stores in DB, returns questions (no answers)
router.post('/generate', generateQuiz)

// POST /api/quiz/submit      → Submit answers, server scores, returns results + explanations
router.post('/submit', submitQuiz)

// GET  /api/quiz/history     → Past completed quizzes
router.get('/history', getQuizHistory)

// GET  /api/quiz/recommendations → Personalized topic suggestions
router.get('/recommendations', getRecommendations)

// GET  /api/quiz/:quizId     → Specific quiz (active: no answers; submitted: full review)
router.get('/:quizId', getQuizById)

module.exports = router
