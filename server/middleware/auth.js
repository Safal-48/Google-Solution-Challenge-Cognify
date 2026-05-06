const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * Protect middleware — validates JWT token from Authorization header
 * Usage: router.get('/protected', protect, controller)
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      })
    }

    const token = authHeader.split(' ')[1]

    // 2. Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        })
      }
      return res.status(401).json({
        error: 'Invalid token.',
        code: 'INVALID_TOKEN',
      })
    }

    // 3. Find user and attach to request
    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return res.status(401).json({
        error: 'User not found. Token is invalid.',
        code: 'USER_NOT_FOUND',
      })
    }

    // 4. Update streak on each authenticated request
    user.updateStreak()
    await user.save()

    req.user = user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    res.status(500).json({ error: 'Authentication error' })
  }
}

/**
 * Restrict to specific roles
 * Usage: router.get('/teacher-only', protect, restrictTo('teacher'), controller)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This route is restricted to: ${roles.join(', ')}`,
        code: 'FORBIDDEN',
      })
    }
    next()
  }
}

/**
 * Generate a signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

module.exports = { protect, restrictTo, generateToken }
