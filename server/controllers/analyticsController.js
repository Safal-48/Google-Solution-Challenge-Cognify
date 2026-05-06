const User = require('../models/User')
const QuizResult = require('../models/QuizResult')

// ─── Simple in-memory cache (per-user, 5-minute TTL) ──────────────────────
const _cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function cacheGet(key) {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null }
  return entry.data
}
function cacheSet(key, data) { _cache.set(key, { data, ts: Date.now() }) }
function cacheBust(userId) {
  for (const k of _cache.keys()) { if (k.startsWith(userId)) _cache.delete(k) }
}

// ─── Shared helper: build full analytics from quiz history ─────────────────
function buildAnalytics(quizHistory, user) {
  // ── 1. Topic Accuracy Map ──────────────────────────────────────────────
  const topicMap = {}
  quizHistory.forEach((q) => {
    if (!topicMap[q.topic]) {
      topicMap[q.topic] = {
        topic: q.topic,
        attempts: 0,
        totalScore: 0,
        correct: 0,
        total: 0,
        lastAttempt: null,
        scores: [],
        times: [],
      }
    }
    const t = topicMap[q.topic]
    t.attempts++
    t.totalScore += q.percentage
    t.scores.push(q.percentage)
    if (q.timeTaken) t.times.push(q.timeTaken)
    if (q.questions?.length) {
      t.correct += q.questions.filter((qq) => qq.isCorrect).length
      t.total += q.questions.length
    } else {
      t.correct += q.score || 0
      t.total += q.total || 1
    }
    t.lastAttempt = q.createdAt
  })

  const topicAccuracy = Object.values(topicMap)
    .map((t) => ({
      topic: t.topic,
      attempts: t.attempts,
      avgScore: Math.round(t.totalScore / t.attempts),
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      lastAttempt: t.lastAttempt,
      trend: t.scores.length >= 2 ? t.scores[t.scores.length - 1] - t.scores[0] : 0,
      avgTime: t.times.length ? Math.round(t.times.reduce((a, b) => a + b, 0) / t.times.length) : 0,
      bestScore: t.scores.length ? Math.max(...t.scores) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts)

  // ── 2. Score Trend (last 20 quizzes) ─────────────────────────────────
  const scoreTrend = quizHistory.slice(-20).map((q, i) => ({
    label: `#${i + 1}`,
    score: q.percentage,
    topic: q.topic,
    date: new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timeTaken: q.timeTaken || 0,
  }))

  // ── 3. Weekly Activity (last 8 weeks) ──────────────────────────────────
  const weeks = Array.from({ length: 8 }, (_, w) => {
    const start = new Date()
    start.setDate(start.getDate() - (7 - w) * 7 - 6)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    const label = `W${w + 1}`
    return { label, start, end, quizzes: 0, avgScore: 0, scores: [], totalTime: 0 }
  })

  quizHistory.forEach((q) => {
    const d = new Date(q.createdAt)
    const week = weeks.find((w) => d >= w.start && d <= w.end)
    if (week) {
      week.quizzes++
      week.scores.push(q.percentage)
      week.totalTime += q.timeTaken || 0
    }
  })

  const weeklyTrend = weeks.map((w) => ({
    label: w.label,
    quizzes: w.quizzes,
    avgScore: w.scores.length ? Math.round(w.scores.reduce((a, b) => a + b, 0) / w.scores.length) : 0,
    studyTime: Math.round(w.totalTime / 60), // minutes
  }))

  // ── 4. Daily Activity Heatmap (last 35 days) ──────────────────────────
  const heatmap = {}
  const today = new Date()
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    heatmap[key] = { date: key, count: 0, avgScore: 0, scores: [] }
  }

  quizHistory.forEach((q) => {
    const key = new Date(q.createdAt).toISOString().split('T')[0]
    if (heatmap[key]) {
      heatmap[key].count++
      heatmap[key].scores.push(q.percentage)
    }
  })

  const heatmapData = Object.values(heatmap).map((d) => ({
    date: d.date,
    count: d.count,
    avgScore: d.scores.length ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
  }))

  // ── 5. Performance Buckets ────────────────────────────────────────────
  const diffMap = {
    'Needs Work': { count: 0, total: 0 },
    'Developing': { count: 0, total: 0 },
    'Proficient': { count: 0, total: 0 },
    'Mastery': { count: 0, total: 0 },
  }
  quizHistory.forEach((q) => {
    const bucket = q.percentage < 40 ? 'Needs Work'
      : q.percentage < 65 ? 'Developing'
      : q.percentage < 85 ? 'Proficient'
      : 'Mastery'
    diffMap[bucket].count++
    diffMap[bucket].total += q.percentage
  })
  const difficultyBreakdown = Object.entries(diffMap)
    .filter(([, v]) => v.count > 0)
    .map(([name, v]) => ({
      name,
      count: v.count,
      avgScore: Math.round(v.total / v.count),
    }))

  // ── 6. Weak Areas ────────────────────────────────────────────────────
  const weakTopics = topicAccuracy
    .filter((t) => t.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 6)
    .map((t) => ({
      topic: t.topic,
      accuracy: t.accuracy,
      avgScore: t.avgScore,
      attempts: t.attempts,
      priority: t.accuracy < 50 ? 'high' : 'medium',
      trend: t.trend,
    }))

  // ── 7. Strong Areas ────────────────────────────────────────────────────
  const strongTopics = topicAccuracy
    .filter((t) => t.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 4)

  // ── 8. Overall accuracy ───────────────────────────────────────────────
  let totalQs = 0, correctQs = 0
  quizHistory.forEach((q) => {
    if (q.questions?.length) {
      totalQs += q.questions.length
      correctQs += q.questions.filter((qq) => qq.isCorrect).length
    }
  })
  const overallAccuracy = totalQs > 0 ? Math.round((correctQs / totalQs) * 100) : 0

  // ── 9. Improvement Rate ────────────────────────────────────────────────
  let improvementRate = 0
  if (quizHistory.length >= 5) {
    const first5 = quizHistory.slice(0, 5).map((q) => q.percentage)
    const last5 = quizHistory.slice(-5).map((q) => q.percentage)
    improvementRate = Math.round(
      last5.reduce((a, b) => a + b, 0) / 5 - first5.reduce((a, b) => a + b, 0) / 5
    )
  }

  // ── 10. Summary Stats ──────────────────────────────────────────────────
  const allScores = quizHistory.map((q) => q.percentage)
  const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
  const bestScore = allScores.length ? Math.max(...allScores) : 0
  const perfectScores = allScores.filter((s) => s === 100).length

  // ── 11. Study Time ─────────────────────────────────────────────────────
  const totalStudySeconds = quizHistory.reduce((s, q) => s + (q.timeTaken || 0), 0)
  const avgTimePerQuiz = quizHistory.length ? Math.round(totalStudySeconds / quizHistory.length) : 0

  // ── 12. Consistency score (0-100) ──────────────────────────────────────
  const activeDays = Object.values(heatmap).filter((d) => d.count > 0).length
  const consistencyScore = Math.round((activeDays / 35) * 100)

  // ── 13. Month-over-month comparison ───────────────────────────────────
  const now = new Date()
  const thisMonth = quizHistory.filter((q) => {
    const d = new Date(q.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const lastMonth = quizHistory.filter((q) => {
    const d = new Date(q.createdAt)
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
  })
  const monthComparison = {
    thisMonth: thisMonth.length,
    lastMonth: lastMonth.length,
    thisMonthAvg: thisMonth.length ? Math.round(thisMonth.reduce((a, q) => a + q.percentage, 0) / thisMonth.length) : 0,
    lastMonthAvg: lastMonth.length ? Math.round(lastMonth.reduce((a, q) => a + q.percentage, 0) / lastMonth.length) : 0,
  }

  return {
    summary: {
      totalQuizzes: quizHistory.length,
      avgScore,
      bestScore,
      overallAccuracy,
      perfectScores,
      improvementRate,
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      notesGenerated: user.notesGenerated,
      topicsCount: topicAccuracy.length,
      badges: user.badges,
      totalStudyMinutes: Math.round(totalStudySeconds / 60),
      avgTimePerQuiz,
      consistencyScore,
      monthComparison,
    },
    topicAccuracy,
    weakTopics,
    strongTopics,
    scoreTrend,
    weeklyTrend,
    heatmapData,
    difficultyBreakdown,
  }
}

// ─── GET /api/analytics/overview ──────────────────────────────────────────
const getAnalyticsOverview = async (req, res) => {
  try {
    const userId = req.user._id.toString()
    const cacheKey = `${userId}:overview`

    const cached = cacheGet(cacheKey)
    if (cached) return res.json({ success: true, analytics: cached, cached: true })

    const user = await User.findById(userId)
    const quizHistory = await QuizResult.find({ userId }).sort({ createdAt: 1 }).lean()

    const analytics = buildAnalytics(quizHistory, user)
    cacheSet(cacheKey, analytics)

    res.json({ success: true, analytics, cached: false })
  } catch (err) {
    console.error('Analytics overview error:', err)
    res.status(500).json({ error: 'Failed to fetch analytics.' })
  }
}

// ─── GET /api/analytics/topic/:topic ──────────────────────────────────────
const getTopicAnalytics = async (req, res) => {
  try {
    const userId = req.user._id
    const topic = decodeURIComponent(req.params.topic)

    const results = await QuizResult.find({ userId, topic })
      .sort({ createdAt: 1 })
      .lean()

    if (!results.length) {
      return res.status(404).json({ error: 'No results found for this topic.' })
    }

    const questionMap = {}
    results.forEach((r) => {
      if (r.questions?.length) {
        r.questions.forEach((q) => {
          const key = q.question?.slice(0, 60) || 'Unknown'
          if (!questionMap[key]) questionMap[key] = { correct: 0, total: 0, question: key }
          questionMap[key].total++
          if (q.isCorrect) questionMap[key].correct++
        })
      }
    })

    const questionBreakdown = Object.values(questionMap)
      .map((q) => ({
        question: q.question,
        accuracy: Math.round((q.correct / q.total) * 100),
        attempts: q.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10)

    const scoreHistory = results.map((r, i) => ({
      attempt: i + 1,
      score: r.percentage,
      date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timeTaken: r.timeTaken || 0,
    }))

    const scores = results.map((r) => r.percentage)
    const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0

    res.json({
      success: true,
      topic,
      attempts: results.length,
      avgScore: Math.round(results.reduce((a, b) => a + b.percentage, 0) / results.length),
      bestScore: Math.max(...scores),
      trend,
      scoreHistory,
      questionBreakdown,
    })
  } catch (err) {
    console.error('Topic analytics error:', err)
    res.status(500).json({ error: 'Failed to fetch topic analytics.' })
  }
}

// ─── POST /api/analytics/bust-cache ───────────────────────────────────────
const bustCache = async (req, res) => {
  try {
    cacheBust(req.user._id.toString())
    res.json({ success: true, message: 'Cache cleared.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to bust cache.' })
  }
}

// ─── Export bust function for use by quiz controller ──────────────────────
module.exports = { getAnalyticsOverview, getTopicAnalytics, bustCache, cacheBust }
