const express = require('express')
const { getAnalyticsOverview, getTopicAnalytics, bustCache } = require('../controllers/analyticsController')
const { protect } = require('../middleware/auth')

const router = express.Router()

// All analytics routes require auth
router.use(protect)

// GET  /api/analytics/overview          → Full analytics dashboard data
router.get('/overview', getAnalyticsOverview)

// GET  /api/analytics/topic/:topic      → Drill-down for a specific topic
router.get('/topic/:topic', getTopicAnalytics)

// POST /api/analytics/bust-cache        → Invalidate cached analytics
router.post('/bust-cache', bustCache)

module.exports = router
