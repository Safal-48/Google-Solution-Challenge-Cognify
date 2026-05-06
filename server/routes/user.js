const express = require('express')
const { body } = require('express-validator')
const { getProfile, updateProfile, completeOnboarding, getStats } = require('../controllers/userController')
const { protect } = require('../middleware/auth')

const router = express.Router()

// All user routes require authentication
router.use(protect)

// GET /api/user/profile
router.get('/profile', getProfile)

// PATCH /api/user/profile
router.patch('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('currentLevel').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
  body('role').optional().isIn(['student', 'teacher']).withMessage('Invalid role'),
], updateProfile)

// POST /api/user/onboarding
router.post('/onboarding', completeOnboarding)

// GET /api/user/stats
router.get('/stats', getStats)

module.exports = router
