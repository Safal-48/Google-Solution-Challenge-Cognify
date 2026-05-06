const mongoose = require('mongoose')

// ─── Stored question (server keeps correct answers hidden) ─────────────────
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // 0-based index
  explanation: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
})

// ─── A generated quiz (pending or submitted) ───────────────────────────────
const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topic: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    numQuestions: { type: Number, default: 5 },
    questions: [questionSchema],
    aiProvider: { type: String, enum: ['openai', 'gemini', 'unknown'], default: 'unknown' },

    // ── Submission state ──
    submitted: { type: Boolean, default: false },
    userAnswers: [{ type: Number }],          // user's selected option indices
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // seconds

    // ── Per-question result (populated after submit) ──
    results: [
      {
        questionIndex: Number,
        userAnswer: Number,
        correctAnswer: Number,
        isCorrect: Boolean,
      },
    ],

    // ── Gamification ──
    xpAwarded: { type: Number, default: 0 },
    badgesEarned: [{ id: String, name: String, icon: String }],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Quiz', quizSchema)
