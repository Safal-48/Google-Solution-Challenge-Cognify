const { validationResult } = require('express-validator')
const User = require('../models/User')
const { generateToken } = require('../middleware/auth')

// ─── Helper: send token response ──────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id)
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    badges: user.badges,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
  }

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: safeUser,
  })
}

// ─── POST /api/auth/register ───────────────────────────────────────────────
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      })
    }

    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        code: 'EMAIL_EXISTS',
      })
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    })

    // Award initial XP and badge
    user.addXP(50)
    user.badges.push({ id: 'welcome', name: 'Welcome!', icon: '🎉' })
    user.updateStreak()
    await user.save()

    console.log(`✅ New user registered: ${user.email}`)
    sendTokenResponse(user, 201, res, 'Account created successfully!')
  } catch (err) {
    console.error('Register error:', err)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already in use.' })
    }
    res.status(500).json({ error: 'Server error during registration.' })
  }
}

// ─── POST /api/auth/login ──────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      })
    }

    const { email, password } = req.body

    // Find user (explicitly select password since it's hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      })
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      })
    }

    // Update streak on login
    user.updateStreak()
    await user.save()

    console.log(`✅ User logged in: ${user.email}`)
    sendTokenResponse(user, 200, res, 'Logged in successfully!')
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error during login.' })
  }
}

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }
    res.json({ success: true, user: user.toSafeObject() })
  } catch (err) {
    console.error('GetMe error:', err)
    res.status(500).json({ error: 'Failed to fetch user profile.' })
  }
}

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
const logout = async (req, res) => {
  // JWT is stateless – client should remove the token
  // Optionally implement a token blacklist here for production
  res.json({ success: true, message: 'Logged out successfully.' })
}

module.exports = { register, login, getMe, logout }
