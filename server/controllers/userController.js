const User = require('../models/User')
const { validationResult } = require('express-validator')

// ─── GET /api/user/profile ─────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'User not found.' })

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        topicsStudied: user.topicsStudied,
        quizResults: user.quizResults,
        studyHours: user.studyHours,
        notesGenerated: user.notesGenerated,
        onboardingComplete: user.onboardingComplete,
        learningGoal: user.learningGoal,
        preferredSubjects: user.preferredSubjects,
        currentLevel: user.currentLevel,
        createdAt: user.createdAt,
        lastActiveDate: user.lastActiveDate,
      },
    })
  } catch (err) {
    console.error('GetProfile error:', err)
    res.status(500).json({ error: 'Failed to fetch profile.' })
  }
}

// ─── PATCH /api/user/profile ───────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      })
    }

    const { name, learningGoal, preferredSubjects, currentLevel, role } = req.body

    const updateData = {}
    if (name) updateData.name = name.trim()
    if (learningGoal !== undefined) updateData.learningGoal = learningGoal
    if (preferredSubjects !== undefined) updateData.preferredSubjects = preferredSubjects
    if (currentLevel) updateData.currentLevel = currentLevel
    if (role && ['student', 'teacher'].includes(role)) updateData.role = role

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })

    res.json({ success: true, message: 'Profile updated.', user: user.toSafeObject() })
  } catch (err) {
    console.error('UpdateProfile error:', err)
    res.status(500).json({ error: 'Failed to update profile.' })
  }
}

// ─── POST /api/user/onboarding ─────────────────────────────────────────────
const completeOnboarding = async (req, res) => {
  try {
    const { learningGoal, preferredSubjects, currentLevel } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        learningGoal,
        preferredSubjects,
        currentLevel,
        onboardingComplete: true,
      },
      { new: true }
    )

    // Award XP for completing onboarding
    user.addXP(100)
    if (!user.badges.find((b) => b.id === 'onboarded')) {
      user.badges.push({ id: 'onboarded', name: 'Ready to Learn!', icon: '🚀' })
    }
    await user.save()

    res.json({
      success: true,
      message: 'Onboarding complete! +100 XP',
      user: user.toSafeObject(),
    })
  } catch (err) {
    console.error('Onboarding error:', err)
    res.status(500).json({ error: 'Failed to complete onboarding.' })
  }
}

// ─── GET /api/user/stats ───────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const quizScores = user.quizResults.map((q) => q.percentage)
    const avgScore = quizScores.length
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0

    // XP needed for next level
    const xpForNextLevel = user.level * 500
    const xpProgress = ((user.xp % 500) / 500) * 100

    res.json({
      success: true,
      stats: {
        xp: user.xp,
        level: user.level,
        xpForNextLevel,
        xpProgress: Math.round(xpProgress),
        streak: user.streak,
        totalQuizzes: user.quizResults.length,
        avgScore,
        notesGenerated: user.notesGenerated,
        studyHours: user.studyHours,
        topicsCount: user.topicsStudied.length,
        badgesCount: user.badges.length,
        recentActivity: [
          ...user.quizResults.slice(-3).map((q) => ({
            type: 'quiz',
            text: `Scored ${q.percentage}% on ${q.topic}`,
            time: q.takenAt,
          })),
          ...user.topicsStudied.slice(-3).map((t) => ({
            type: 'notes',
            text: `Generated notes on "${t.topic}"`,
            time: t.studiedAt,
          })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5),
      },
    })
  } catch (err) {
    console.error('GetStats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats.' })
  }
}

module.exports = { getProfile, updateProfile, completeOnboarding, getStats }
