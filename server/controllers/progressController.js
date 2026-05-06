const User = require('../models/User')
const QuizResult = require('../models/QuizResult')

// ─── GET /api/progress ─────────────────────────────────────────────────────
const getProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const quizHistory = await QuizResult.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)

    // Weekly study data (last 7 days mock + real)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toISOString().split('T')[0],
        quizzes: 0,
        hours: 0,
      }
    })

    // Count quizzes per day
    quizHistory.forEach((q) => {
      const date = q.createdAt.toISOString().split('T')[0]
      const dayEntry = last7Days.find((d) => d.date === date)
      if (dayEntry) {
        dayEntry.quizzes += 1
        dayEntry.hours += Math.round((q.timeTaken || 300) / 3600 * 10) / 10
      }
    })

    // Topic breakdown
    const topicMap = {}
    quizHistory.forEach((q) => {
      if (!topicMap[q.topic]) topicMap[q.topic] = { count: 0, totalScore: 0 }
      topicMap[q.topic].count++
      topicMap[q.topic].totalScore += q.percentage
    })

    const topicBreakdown = Object.entries(topicMap)
      .map(([topic, data]) => ({
        name: topic,
        value: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    // Score trend (last 10 quizzes)
    const scoreTrend = quizHistory
      .slice(0, 10)
      .reverse()
      .map((q, i) => ({ week: `Q${i + 1}`, score: q.percentage, topic: q.topic }))

    // Quiz scores for bar chart
    const quizScores = quizHistory.slice(0, 8).map((q) => ({
      quiz: q.topic.slice(0, 12),
      score: q.percentage,
    }))

    // Weak topics (< 70%)
    const weakTopics = quizHistory
      .filter((q) => q.percentage < 70)
      .map((q) => q.topic)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5)

    // Overall stats
    const allScores = quizHistory.map((q) => q.percentage)
    const avgScore = allScores.length
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0

    res.json({
      success: true,
      progress: {
        weeklyData: last7Days,
        topicBreakdown,
        scoreTrend,
        quizScores,
        weakTopics,
        stats: {
          totalQuizzes: quizHistory.length,
          avgScore,
          streak: user.streak,
          studyHours: user.studyHours,
          notesGenerated: user.notesGenerated,
          xp: user.xp,
          level: user.level,
          badges: user.badges,
          topicsCount: topicBreakdown.length,
        },
      },
    })
  } catch (err) {
    console.error('GetProgress error:', err)
    res.status(500).json({ error: 'Failed to fetch progress data.' })
  }
}

// ─── POST /api/progress/track-note ────────────────────────────────────────
const trackNote = async (req, res) => {
  try {
    const { topic } = req.body
    if (!topic) return res.status(400).json({ error: 'Topic is required.' })

    const user = await User.findById(req.user._id)
    user.topicsStudied.push({ topic, studiedAt: new Date() })
    user.notesGenerated += 1
    user.addXP(15)

    // Badge: First note
    if (user.notesGenerated === 1 && !user.badges.find((b) => b.id === 'first_note')) {
      user.badges.push({ id: 'first_note', name: 'Note Taker', icon: '📝' })
    }
    // Badge: 10 notes
    if (user.notesGenerated >= 10 && !user.badges.find((b) => b.id === 'note_master')) {
      user.badges.push({ id: 'note_master', name: 'Note Master', icon: '📚' })
    }

    await user.save()
    res.json({ success: true, xpGained: 15, notesGenerated: user.notesGenerated })
  } catch (err) {
    console.error('TrackNote error:', err)
    res.status(500).json({ error: 'Failed to track note.' })
  }
}

module.exports = { getProgress, trackNote }
