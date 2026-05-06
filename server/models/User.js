const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      default: 'student',
    },
    // ─── Gamification ───────────────────────────────────────────────
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    badges: [
      {
        id: String,
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    // ─── Learning Data ───────────────────────────────────────────────
    topicsStudied: [
      {
        topic: String,
        studiedAt: { type: Date, default: Date.now },
      },
    ],
    quizResults: [
      {
        topic: String,
        score: Number,
        total: Number,
        percentage: Number,
        takenAt: { type: Date, default: Date.now },
      },
    ],
    studyHours: {
      type: Number,
      default: 0,
    },
    notesGenerated: {
      type: Number,
      default: 0,
    },
    // ─── Onboarding ──────────────────────────────────────────────────
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    learningGoal: {
      type: String,
      default: '',
    },
    preferredSubjects: [String],
    currentLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
)

// ─── Hash password before saving ──────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// ─── Instance method: compare passwords ────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// ─── Instance method: update streak ────────────────────────────────────────
userSchema.methods.updateStreak = function () {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!this.lastActiveDate) {
    this.streak = 1
  } else {
    const last = new Date(this.lastActiveDate)
    last.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Already active today
    } else if (diffDays === 1) {
      this.streak += 1
    } else {
      this.streak = 1 // Reset streak
    }
  }
  this.lastActiveDate = new Date()
}

// ─── Instance method: add XP ────────────────────────────────────────────────
userSchema.methods.addXP = function (amount) {
  this.xp += amount
  // Level up every 500 XP
  this.level = Math.floor(this.xp / 500) + 1
}

// ─── Virtual: safe profile (no password) ──────────────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

const User = mongoose.model('User', userSchema)
module.exports = User
