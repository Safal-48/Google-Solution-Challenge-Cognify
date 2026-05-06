const express = require('express')
const { getProgress, trackNote } = require('../controllers/progressController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

// GET /api/progress
router.get('/', getProgress)

// POST /api/progress/track-note
router.post('/track-note', trackNote)

module.exports = router
