const User = require('../models/User')
const QuizResult = require('../models/QuizResult')
const { getAIResponse, getAvailableProvider } = require('../services/aiService')

// ─── In-memory recommendation cache (per-user, 10-minute TTL) ─────────────
const _recCache = new Map()
const REC_TTL = 10 * 60 * 1000

function recCacheGet(key) {
  const entry = _recCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > REC_TTL) { _recCache.delete(key); return null }
  return entry.data
}
function recCacheSet(key, data) { _recCache.set(key, { data, ts: Date.now() }) }
function recCacheBust(userId) {
  for (const k of _recCache.keys()) { if (k.startsWith(userId)) _recCache.delete(k) }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function buildRecommendationPrompt(profile) {
  const weakSummary = profile.weakTopics.length
    ? profile.weakTopics.map(t => `  • "${t.topic}": ${t.accuracy}% accuracy, ${t.attempts} attempts, avg ${t.avgScore}%${t.trend !== 0 ? `, trend ${t.trend > 0 ? '+' : ''}${Math.round(t.trend)}` : ''}`).join('\n')
    : '  None identified yet'

  const strongSummary = profile.strongTopics.length
    ? profile.strongTopics.map(t => `  • "${t.topic}": ${t.accuracy}% accuracy`).join('\n')
    : '  None yet'

  const incorrectSample = profile.incorrectQuestions.length
    ? profile.incorrectQuestions.map(q => `  • [${q.topic}] "${q.question}"`).join('\n')
    : '  No data yet'

  return `You are an expert AI learning coach for the Cognify platform. Analyze this student's real quiz performance data and generate a highly personalized, actionable learning plan.

═══════════════════ STUDENT PROFILE ═══════════════════
Name: ${profile.name || 'Student'}
Level: ${profile.level} | XP: ${profile.xp}
Study streak: ${profile.streak} days
Total quizzes: ${profile.totalQuizzes}
Overall avg score: ${profile.avgScore}%
Overall accuracy: ${profile.overallAccuracy}%
Consistency (last 35 days): ${profile.consistencyScore}%
Preferred subjects: ${profile.preferredSubjects?.join(', ') || 'Not specified'}

WEAK TOPICS (accuracy < 70% — needs improvement):
${weakSummary}

STRONG TOPICS (accuracy ≥ 80% — can build on):
${strongSummary}

RECENT INCORRECT QUESTIONS (pattern analysis):
${incorrectSample}

MONTH COMPARISON: ${profile.monthComparison.lastMonth} quizzes last month (avg ${profile.monthComparison.lastMonthAvg}%) → ${profile.monthComparison.thisMonth} this month (avg ${profile.monthComparison.thisMonthAvg}%)
═══════════════════════════════════════════════════════

Generate a JSON response ONLY (no markdown, no prose, just valid JSON):
{
  "studyPlan": [
    {
      "topic": "exact topic name from student data",
      "priority": "high|medium|low",
      "reason": "1-2 specific sentences referencing their actual score/accuracy",
      "estimatedTime": "e.g. 45 minutes",
      "subtopics": ["specific subtopic 1", "specific subtopic 2", "specific subtopic 3"],
      "studyTips": ["concrete, actionable tip 1", "concrete, actionable tip 2"],
      "difficulty": "Beginner|Intermediate|Advanced",
      "resources": ["type of resource to consult", "practice approach"]
    }
  ],
  "nextTopics": ["topic to explore next 1", "topic to explore next 2", "topic to explore next 3"],
  "motivationalMessage": "2-3 sentences, directly address the student, reference specific achievements or gaps, be encouraging but realistic",
  "weeklyGoal": "specific, measurable weekly goal (e.g. 'Complete 5 quizzes on X, aiming for 75%+')",
  "focusArea": "The single highest-impact action right now — 1 specific sentence",
  "insights": [
    { "type": "achievement|gap|pattern|tip", "text": "1 specific insight from their data" },
    { "type": "achievement|gap|pattern|tip", "text": "1 more specific insight" }
  ]
}

Rules:
- studyPlan: 3-5 items, ordered by urgency. Reference actual scores.
- If no weak topics, suggest advanced extensions of their strong areas.
- nextTopics: logical progressions based on their strengths.
- insights: 2-4 items, specific data-driven observations.
- Keep subtopics and resources to 3 items max per topic.
- Be specific, not generic. Reference actual topic names from the data.`
}

// ─── Rule-based fallback ────────────────────────────────────────────────────
function buildFallback(profile) {
  const { weakTopics, strongTopics, quizHistory, user, avgScore } = profile._raw

  const ruleBasedPlan = weakTopics.slice(0, 3).map((t) => ({
    topic: t.topic,
    priority: t.accuracy < 50 ? 'high' : 'medium',
    reason: `Your accuracy on "${t.topic}" is ${t.accuracy}%. ${t.trend < 0 ? 'Your scores have been declining — it\'s time to revisit the fundamentals.' : 'Consistent practice will build stronger recall and confidence.'}`,
    estimatedTime: t.accuracy < 50 ? '45 minutes' : '30 minutes',
    subtopics: [],
    studyTips: [
      `Review your ${t.attempts} previous quiz mistakes on ${t.topic}`,
      'Start with the core concepts before attempting harder questions',
    ],
    difficulty: t.avgScore < 50 ? 'Beginner' : 'Intermediate',
    resources: ['Review textbook fundamentals', 'Practice with easier questions first'],
  }))

  const ruleNextTopics = strongTopics.slice(0, 3).map((t) => `Advanced ${t.topic}`)

  const hasData = quizHistory.length > 0
  const motivationBase = hasData
    ? `You've completed ${quizHistory.length} quiz${quizHistory.length !== 1 ? 'zes' : ''} with an average of ${avgScore}%.`
    : "Welcome to Cognify! Your personalized learning journey starts now."

  return {
    studyPlan: ruleBasedPlan.length
      ? ruleBasedPlan
      : [{
          topic: user.preferredSubjects?.[0] || 'General Knowledge',
          priority: 'medium',
          reason: 'Build a solid baseline by taking your first quizzes to unlock AI-powered recommendations.',
          estimatedTime: '20 minutes',
          subtopics: [],
          studyTips: ['Take at least 3 quizzes to unlock personalized recommendations'],
          difficulty: 'Beginner',
          resources: [],
        }],
    nextTopics: ruleNextTopics.length
      ? ruleNextTopics
      : (user.preferredSubjects?.slice(0, 3) || ['Mathematics', 'Science', 'History']),
    motivationalMessage: hasData
      ? `${motivationBase} ${weakTopics.length ? `Focus on your ${weakTopics.length} weak area(s) to level up fast — you're ${100 - avgScore}% away from excellence!` : 'Keep up the stellar work!'}`
      : "Welcome to Cognify! Take your first quiz to unlock AI-powered personalized recommendations tailored just for you.",
    weeklyGoal: `Complete ${Math.max(3, Math.ceil(quizHistory.length / 4) + 1)} quizzes this week${weakTopics.length ? `, with focus on "${weakTopics[0]?.topic}"` : ''}`,
    focusArea: weakTopics.length
      ? `Strengthen "${weakTopics[0].topic}" — it's your most critical gap at ${weakTopics[0].accuracy}% accuracy.`
      : 'Explore new advanced topics to keep your momentum going.',
    insights: hasData
      ? [
          { type: weakTopics.length > 0 ? 'gap' : 'achievement', text: weakTopics.length > 0 ? `${weakTopics.length} topic(s) below 70% accuracy need focused practice.` : 'All studied topics are above 70% accuracy — great consistency!' },
          { type: 'pattern', text: `Your best performance streak: ${user.streak} day(s). Keep it alive!` },
        ]
      : [
          { type: 'tip', text: 'Complete at least 5 quizzes to unlock in-depth AI analysis of your learning patterns.' },
        ],
    source: 'rule-based',
  }
}

// ─── GET /api/recommendations ──────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id.toString()
    const cacheKey = `${userId}:recs`

    const cached = recCacheGet(cacheKey)
    if (cached) return res.json({ success: true, recommendations: cached, cached: true })

    const user = await User.findById(userId)
    const quizHistory = await QuizResult.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    // ── Build topic accuracy map ─────────────────────────────────────────
    const topicMap = {}
    quizHistory.forEach((q) => {
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = { topic: q.topic, correct: 0, total: 0, attempts: 0, totalScore: 0, scores: [] }
      }
      const t = topicMap[q.topic]
      t.attempts++
      t.totalScore += q.percentage
      t.scores.push(q.percentage)
      if (q.questions?.length) {
        t.correct += q.questions.filter((qq) => qq.isCorrect).length
        t.total += q.questions.length
      } else {
        t.correct += q.score || 0
        t.total += q.total || 1
      }
    })

    const topicStats = Object.values(topicMap).map((t) => ({
      topic: t.topic,
      accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
      avgScore: Math.round(t.totalScore / t.attempts),
      attempts: t.attempts,
      trend: t.scores.length >= 2 ? t.scores[t.scores.length - 1] - t.scores[0] : 0,
    }))

    const weakTopics = topicStats.filter((t) => t.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy).slice(0, 6)
    const strongTopics = topicStats.filter((t) => t.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy).slice(0, 4)

    // ── Extract incorrect questions ──────────────────────────────────────
    const incorrectQuestions = []
    quizHistory.slice(0, 20).forEach((q) => {
      if (q.questions?.length) {
        q.questions
          .filter((qq) => !qq.isCorrect && qq.question)
          .slice(0, 2)
          .forEach((qq) => incorrectQuestions.push({ topic: q.topic, question: qq.question?.slice(0, 120) }))
      }
    })

    // ── Overall stats ────────────────────────────────────────────────────
    const allScores = quizHistory.map((q) => q.percentage)
    const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
    let totalCorrect = 0, totalQs = 0
    quizHistory.forEach((q) => {
      if (q.questions?.length) {
        totalQs += q.questions.length
        totalCorrect += q.questions.filter((qq) => qq.isCorrect).length
      }
    })
    const overallAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0

    // Month comparison
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

    // Consistency
    const heatmap = {}
    for (let i = 34; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      heatmap[d.toISOString().split('T')[0]] = 0
    }
    quizHistory.forEach((q) => {
      const key = new Date(q.createdAt).toISOString().split('T')[0]
      if (key in heatmap) heatmap[key]++
    })
    const consistencyScore = Math.round((Object.values(heatmap).filter(v => v > 0).length / 35) * 100)

    // ── Build profile for AI ─────────────────────────────────────────────
    const profile = {
      name: user.name,
      totalQuizzes: quizHistory.length,
      avgScore,
      overallAccuracy,
      streak: user.streak,
      level: user.level,
      xp: user.xp,
      preferredSubjects: user.preferredSubjects,
      weakTopics,
      strongTopics,
      incorrectQuestions: incorrectQuestions.slice(0, 8),
      consistencyScore,
      monthComparison: {
        thisMonth: thisMonth.length,
        lastMonth: lastMonth.length,
        thisMonthAvg: thisMonth.length ? Math.round(thisMonth.reduce((a, q) => a + q.percentage, 0) / thisMonth.length) : 0,
        lastMonthAvg: lastMonth.length ? Math.round(lastMonth.reduce((a, q) => a + q.percentage, 0) / lastMonth.length) : 0,
      },
      _raw: { weakTopics, strongTopics, quizHistory, user, avgScore },
    }

    const fallback = buildFallback(profile)

    // ── Try AI-powered recommendations ───────────────────────────────────
    const provider = getAvailableProvider()
    if (!provider || quizHistory.length === 0) {
      const result = { ...fallback, topicStats, weakTopics, strongTopics, aiPowered: false }
      recCacheSet(cacheKey, result)
      return res.json({ success: true, recommendations: result })
    }

    let aiResult = null
    try {
      const prompt = buildRecommendationPrompt(profile)
      const { response } = await getAIResponse([], prompt)

      const cleaned = response.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
      const jsonStart = cleaned.indexOf('{')
      const jsonEnd = cleaned.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        aiResult = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1))
      }
    } catch (aiErr) {
      console.warn('AI recommendation failed, using rule-based fallback:', aiErr.message)
    }

    const recommendations = aiResult
      ? { ...aiResult, source: provider, topicStats, weakTopics, strongTopics, aiPowered: true }
      : { ...fallback, topicStats, weakTopics, strongTopics, aiPowered: false }

    recCacheSet(cacheKey, recommendations)
    res.json({ success: true, recommendations })
  } catch (err) {
    console.error('getRecommendations error:', err)
    res.status(500).json({ error: 'Failed to generate recommendations.' })
  }
}

// ─── POST /api/recommendations/refresh ────────────────────────────────────
const refreshRecommendations = async (req, res) => {
  recCacheBust(req.user._id.toString())
  return getRecommendations(req, res)
}

module.exports = { getRecommendations, refreshRecommendations, recCacheBust }
