const express = require('express')
const { getRecommendations, refreshRecommendations } = require('../controllers/recommendationController')
const { protect } = require('../middleware/auth')

const router = express.Router()
router.use(protect)

// GET  /api/recommendations          → AI-powered personalized recommendations
router.get('/', getRecommendations)

// POST /api/recommendations/refresh  → Force regenerate recommendations
router.post('/refresh', refreshRecommendations)

module.exports = router
