const express = require('express')
const { body } = require('express-validator')
const { register, login, getMe, logout } = require('../controllers/authController')
const { protect } = require('../middleware/auth')

const router = express.Router()

// ─── Validation Rules ──────────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
]

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
]

// ─── Routes ────────────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', registerValidation, register)

// POST /api/auth/login
router.post('/login', loginValidation, login)

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe)

// POST /api/auth/logout (protected)
router.post('/logout', protect, logout)

module.exports = router
