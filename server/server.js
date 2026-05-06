require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

// Route imports
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const chatRoutes = require('./routes/chat')
const quizRoutes = require('./routes/quiz')
const progressRoutes = require('./routes/progress')
const analyticsRoutes = require('./routes/analytics')
const recommendationRoutes = require('./routes/recommendations')

const app = express()

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' },
})

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/user', apiLimiter, userRoutes)
app.use('/api/chat', apiLimiter, chatRoutes)
app.use('/api/quiz', apiLimiter, quizRoutes)
app.use('/api/progress', apiLimiter, progressRoutes)
app.use('/api/analytics', apiLimiter, analyticsRoutes)
app.use('/api/recommendations', apiLimiter, recommendationRoutes)

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Cognify API is running',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
})

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('❌ Error:', err.message)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ─── Database + Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cognify'

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', MONGO_URI)
    app.listen(PORT, () => {
      console.log(`🚀 Cognify Server running on http://localhost:${PORT}`)
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    console.log('💡 Make sure MongoDB is running: mongod --dbpath /data/db')
    process.exit(1)
  })
