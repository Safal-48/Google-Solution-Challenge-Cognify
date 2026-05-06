const Quiz = require('../models/Quiz')
const QuizResult = require('../models/QuizResult')
const User = require('../models/User')
const { getAIResponse, getAvailableProvider } = require('../services/aiService')

// ─── AI: Build quiz generation prompt ─────────────────────────────────────
function buildQuizPrompt(topic, numQuestions, difficulty) {
  return `You are an expert educator. Generate exactly ${numQuestions} high-quality multiple-choice questions about "${topic}" at ${difficulty} level.

IMPORTANT: Return ONLY a valid JSON array. No markdown, no code blocks, no extra text.

Required format:
[
  {
    "question": "Clear, specific question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Concise explanation of why the answer is correct and why others are wrong.",
    "difficulty": "medium"
  }
]

Rules:
- correctAnswer is the 0-based index (0, 1, 2, or 3)
- Each question must have exactly 4 distinct options
- Options should be plausible (no obviously wrong answers)
- Mix difficulty: easy (30%), medium (50%), hard (20%)
- difficulty field must be one of: "easy", "medium", "hard"
- Explanations should be educational and concise (1-2 sentences)
- Questions must be clear and unambiguous
- Progress from foundational to advanced concepts`
}

// ─── POST /api/quiz/generate ───────────────────────────────────────────────
// Generate quiz using AI and store in DB (answers hidden from client)
const generateQuiz = async (req, res) => {
  try {
    const {
      topic,
      numQuestions = 5,
      difficulty = 'Intermediate',
    } = req.body

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Topic is required.' })
    }
    if (numQuestions < 3 || numQuestions > 15) {
      return res.status(400).json({ error: 'Number of questions must be between 3 and 15.' })
    }

    const provider = getAvailableProvider()
    
    let sanitized = []
    
    if (provider === 'demo') {
      const mockAI = require('../services/mockAIService')
      sanitized = mockAI.generateMockQuiz(topic.trim(), numQuestions)
    } else {
      // Build prompt and call AI
      const prompt = buildQuizPrompt(topic.trim(), numQuestions, difficulty)
      let rawText

      try {
        const result = await getAIResponse([], prompt)
        rawText = result.response
      } catch (aiErr) {
        console.error('AI quiz generation failed:', aiErr.message)
        return res.status(502).json({
          error: 'AI generation failed. Please try again.',
          code: 'AI_ERROR',
        })
      }

      // Parse AI response — strip any markdown fences
      let questions
      try {
        const cleaned = rawText
          .replace(/```json\n?/gi, '')
          .replace(/```\n?/g, '')
          .trim()

        // Extract JSON array from response
        const arrayStart = cleaned.indexOf('[')
        const arrayEnd = cleaned.lastIndexOf(']')
        if (arrayStart === -1 || arrayEnd === -1) throw new Error('No JSON array found in response')

        questions = JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1))
      } catch (parseErr) {
        console.error('Failed to parse AI quiz response:', parseErr.message)
        console.error('Raw AI response:', rawText?.slice(0, 300))
        return res.status(502).json({
          error: 'Failed to parse AI response. Please try again.',
          code: 'PARSE_ERROR',
        })
      }

      // Validate parsed questions
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(502).json({ error: 'AI returned invalid quiz data. Please try again.' })
      }

      // Sanitize each question
      sanitized = questions
        .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctAnswer === 'number')
        .slice(0, numQuestions)
        .map((q) => ({
          question: String(q.question).trim(),
          options: q.options.map((o) => String(o).trim()),
          correctAnswer: Math.min(Math.max(Math.round(q.correctAnswer), 0), 3),
          explanation: String(q.explanation || 'No explanation provided.').trim(),
          difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        }))
    }

    if (sanitized.length < 2) {
      return res.status(502).json({ error: 'AI returned too few valid questions. Please try again.' })
    }

    // Save quiz to MongoDB (correct answers stored server-side)
    const quiz = await Quiz.create({
      userId: req.user._id,
      topic: topic.trim(),
      difficulty,
      numQuestions: sanitized.length,
      questions: sanitized,
      aiProvider: provider,
      submitted: false,
    })

    // Return quiz WITHOUT correct answers (security)
    const clientQuiz = {
      quizId: quiz._id,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      aiProvider: provider,
      questions: sanitized.map((q, i) => ({
        index: i,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
        // ✗ No correctAnswer or explanation sent to client yet
      })),
      createdAt: quiz.createdAt,
    }

    console.log(`✅ Quiz generated [${provider.toUpperCase()}]: "${topic}" (${sanitized.length} questions) for ${req.user.email}`)

    res.json({ success: true, quiz: clientQuiz })
  } catch (err) {
    console.error('generateQuiz error:', err)
    res.status(500).json({ error: 'Failed to generate quiz.' })
  }
}

// ─── POST /api/quiz/submit ─────────────────────────────────────────────────
// Submit answers → server scores → returns full results with explanations
const submitQuiz = async (req, res) => {
  try {
    const { quizId, userAnswers, timeTaken = 0 } = req.body

    if (!quizId || !Array.isArray(userAnswers)) {
      return res.status(400).json({ error: 'quizId and userAnswers are required.' })
    }

    // Fetch the quiz from DB
    const quiz = await Quiz.findOne({ _id: quizId, userId: req.user._id })
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' })
    }
    if (quiz.submitted) {
      return res.status(409).json({ error: 'Quiz already submitted.', quizId: quiz._id })
    }

    // Validate answer count
    if (userAnswers.length !== quiz.questions.length) {
      return res.status(400).json({
        error: `Expected ${quiz.questions.length} answers, got ${userAnswers.length}.`,
      })
    }

    // Score calculation (server-side — authoritative)
    let score = 0
    const results = quiz.questions.map((q, i) => {
      const userAnswer = typeof userAnswers[i] === 'number' ? userAnswers[i] : -1
      const isCorrect = userAnswer === q.correctAnswer
      if (isCorrect) score++
      return {
        questionIndex: i,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      }
    })

    const total = quiz.questions.length
    const percentage = Math.round((score / total) * 100)
    const xpGained = Math.max(10, Math.round(percentage / 10) * 5 + 10) // 15–60 XP

    // Update quiz document as submitted
    quiz.submitted = true
    quiz.userAnswers = userAnswers
    quiz.score = score
    quiz.percentage = percentage
    quiz.timeTaken = timeTaken
    quiz.results = results
    quiz.xpAwarded = xpGained

    // ── Badge logic ──
    const earnedBadges = []
    const user = await User.findById(req.user._id)

    if (percentage === 100 && !user.badges.find((b) => b.id === 'perfect_score')) {
      earnedBadges.push({ id: 'perfect_score', name: 'Perfect Score!', icon: '💯' })
      user.badges.push(...earnedBadges)
    }
    // First quiz badge
    const totalQuizzes = (user.quizResults?.length || 0) + 1
    if (totalQuizzes === 1 && !user.badges.find((b) => b.id === 'first_quiz')) {
      const badge = { id: 'first_quiz', name: 'Quiz Starter', icon: '🎯' }
      earnedBadges.push(badge)
      user.badges.push(badge)
    }
    if (totalQuizzes >= 10 && !user.badges.find((b) => b.id === 'quiz_master')) {
      const badge = { id: 'quiz_master', name: 'Quiz Master', icon: '🧠' }
      earnedBadges.push(badge)
      user.badges.push(badge)
    }

    quiz.badgesEarned = earnedBadges

    // Update user stats
    user.quizResults = user.quizResults || []
    user.quizResults.push({
      topic: quiz.topic,
      score,
      total,
      percentage,
      takenAt: new Date(),
    })
    user.addXP(xpGained)
    user.updateStreak?.()
    await user.save()
    await quiz.save()

    // Also create a QuizResult record for progress analytics
    await QuizResult.create({
      userId: req.user._id,
      topic: quiz.topic,
      questions: quiz.questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: results[i].userAnswer,
        isCorrect: results[i].isCorrect,
        explanation: q.explanation,
      })),
      score,
      total,
      percentage,
      timeTaken,
    })

    // Build full result response (now reveal correct answers + explanations)
    const detailedResults = quiz.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: results[i].userAnswer,
      isCorrect: results[i].isCorrect,
      explanation: q.explanation,
      difficulty: q.difficulty,
    }))

    const weakAreas = detailedResults
      .filter((q) => !q.isCorrect)
      .map((q) => q.question.slice(0, 100))

    res.json({
      success: true,
      result: {
        quizId: quiz._id,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        score,
        total,
        percentage,
        timeTaken,
        xpGained,
        badgesEarned: earnedBadges,
        questions: detailedResults,
        weakAreas,
        newLevel: user.level,
        newXP: user.xp,
      },
    })
  } catch (err) {
    console.error('submitQuiz error:', err)
    res.status(500).json({ error: 'Failed to submit quiz.' })
  }
}

// ─── GET /api/quiz/history ─────────────────────────────────────────────────
const getQuizHistory = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user._id, submitted: true })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('topic difficulty score total percentage timeTaken createdAt updatedAt aiProvider')

    res.json({ success: true, results: quizzes })
  } catch (err) {
    console.error('getQuizHistory error:', err)
    res.status(500).json({ error: 'Failed to fetch quiz history.' })
  }
}

// ─── GET /api/quiz/:quizId ─────────────────────────────────────────────────
// Returns submitted quiz with full results + explanations
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, userId: req.user._id })
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' })

    if (!quiz.submitted) {
      // Return quiz without answers for active session
      return res.json({
        success: true,
        quiz: {
          quizId: quiz._id,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          submitted: false,
          questions: quiz.questions.map((q, i) => ({
            index: i,
            question: q.question,
            options: q.options,
            difficulty: q.difficulty,
          })),
        },
      })
    }

    // Return full results for reviewed quiz
    res.json({
      success: true,
      quiz: {
        quizId: quiz._id,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        submitted: true,
        score: quiz.score,
        total: quiz.numQuestions,
        percentage: quiz.percentage,
        timeTaken: quiz.timeTaken,
        xpAwarded: quiz.xpAwarded,
        questions: quiz.questions.map((q, i) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userAnswer: quiz.userAnswers[i],
          isCorrect: quiz.results[i]?.isCorrect,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
      },
    })
  } catch (err) {
    console.error('getQuizById error:', err)
    res.status(500).json({ error: 'Failed to fetch quiz.' })
  }
}

// ─── GET /api/quiz/recommendations ────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const quizResults = user.quizResults || []

    const weakTopics = quizResults
      .filter((q) => q.percentage < 70)
      .map((q) => q.topic)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5)

    const strongTopics = quizResults
      .filter((q) => q.percentage >= 85)
      .map((q) => q.topic)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3)

    res.json({
      success: true,
      recommendations: {
        weakTopics,
        strongTopics,
        suggestedTopics: weakTopics.length ? weakTopics : (user.preferredSubjects || []),
        message: weakTopics.length
          ? `Focus on: ${weakTopics.slice(0, 2).join(', ')}`
          : 'Keep it up! Try some new topics.',
      },
    })
  } catch (err) {
    console.error('getRecommendations error:', err)
    res.status(500).json({ error: 'Failed to get recommendations.' })
  }
}

module.exports = { generateQuiz, submitQuiz, getQuizHistory, getQuizById, getRecommendations }
