import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateQuiz } from '../services/gemini'
import { quizAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { QuizSkeleton } from '../components/Skeleton'
import { HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineClock, HiOutlineAcademicCap } from 'react-icons/hi2'

interface Question {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuizResult {
  score: number
  total: number
  percentage: number
  xpGained: number
  weakAreas: string[]
}

export default function QuizGenerator() {
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [backendResult, setBackendResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [answered, setAnswered] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  const { user } = useAuth()

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setQuestions([])
    setShowResult(false)
    setCurrent(0)
    setScore(0)
    setUserAnswers([])
    setBackendResult(null)
    startTimeRef.current = Date.now()
    
    try {
      if (user?.authMode === 'jwt') {
        try {
          // Use backend API for authenticated users (saves to DB)
          const res = await quizAPI.generate(topic, numQuestions, 'Intermediate')
          setQuestions(res.quiz.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: -1, // Hidden until submission
            explanation: ''     // Hidden until submission
          })))
          // Store the quizId for submission
          ;(window as any).currentQuizId = res.quiz.quizId
        } catch (backendErr) {
          console.warn('Backend quiz generation failed, falling back to direct AI:', backendErr)
          // Fallback to direct Gemini call if backend fails
          const q = await generateQuiz(topic, numQuestions)
          setQuestions(q)
        }
      } else {
        // Fallback to direct Gemini call for demo/guests
        const q = await generateQuiz(topic, numQuestions)
        setQuestions(q)
      }
    } catch (err: any) {
      console.error('Quiz generation error:', err)
      setError('AI service is temporarily unavailable. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (idx === questions[current].correctAnswer) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = async () => {
    const newAnswers = [...userAnswers, selected ?? -1]
    setUserAnswers(newAnswers)

    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      // Submit to backend
      setSubmitting(true)
      setShowResult(true)
      if (user?.authMode === 'jwt') {
        try {
          const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)
          const quizId = (window as any).currentQuizId
          
          if (quizId) {
            const res = await quizAPI.submit(quizId, newAnswers, timeTaken)
            setBackendResult(res.result)
            // Show full results from backend
            setQuestions(res.result.questions.map(q => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation
            })))
          }
        } catch (err) {
          console.error('Submission error:', err)
        }
      }
      setSubmitting(false)
    }
  }

  const handleRestart = () => {
    setQuestions([])
    setShowResult(false)
    setCurrent(0)
    setScore(0)
    setSelected(null)
    setAnswered(false)
    setUserAnswers([])
    setBackendResult(null)
    setTopic('')
  }

  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0
  const displayPct = backendResult?.percentage ?? pct

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight flex items-center gap-2">🧠 AI Quiz Generator</h1>
        <p className="text-sm text-[#8a8a9a] mb-8">Test your knowledge with AI-generated quizzes.</p>
      </motion.div>

      {/* Input */}
      {questions.length === 0 && !showResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 glass-card border border-[rgba(255,255,255,0.08)]">
          <label className="text-xs font-medium text-[#8a8a9a] uppercase tracking-wider mb-2 block">Topic</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Solar System, JavaScript, Cell Biology..."
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#5a5a6e]
              border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]
              focus:outline-none focus:border-[rgba(124,58,237,0.5)] transition-all mb-4"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} />

          <label className="text-xs font-medium text-[#8a8a9a] uppercase tracking-wider mb-2 block">
            Number of Questions: <span className="text-[#a78bfa]">{numQuestions}</span>
          </label>
          <input type="range" min={3} max={10} value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full mb-4 accent-purple-500" />

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleGenerate} disabled={loading || !topic.trim()}
            className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white btn-gradient cursor-pointer border-none disabled:opacity-40 shadow-xl transition-all">
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white thinking-dot" />
                  <span className="w-2 h-2 rounded-full bg-white thinking-dot" />
                  <span className="w-2 h-2 rounded-full bg-white thinking-dot" />
                </span>
                Synthesizing Assessment...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <HiOutlineSparkles className="w-4 h-4" /> Initialize Quiz
              </span>
            )}
          </motion.button>
          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
        </motion.div>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
          <QuizSkeleton />
        </motion.div>
      )}

      {/* Quiz */}
      <AnimatePresence mode="wait">
        {questions.length > 0 && !showResult && (
          <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}
            className="rounded-2xl p-6 glass-card border border-[rgba(255,255,255,0.08)]">

            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a5a6e] mb-1">Knowledge Check</span>
                <span className="text-sm font-bold text-white">Question {current + 1} of {questions.length}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20">
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Score: {score}</span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 mb-8">
              <motion.div className="h-full rounded-full btn-gradient shadow-[0_0_10px_rgba(124,58,237,0.3)]" initial={{ width: 0 }}
                animate={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>

            <h2 className="text-lg font-semibold text-white mb-5 leading-relaxed">{questions[current].question}</h2>

            <div className="space-y-3 mb-5">
              {questions[current].options.map((opt, i) => {
                const isCorrect = i === questions[current].correctAnswer
                const isSelected = i === selected
                let borderColor = 'border-[rgba(255,255,255,0.08)]'
                let bgColor = 'bg-[rgba(255,255,255,0.02)]'
                if (answered) {
                  if (isCorrect) { borderColor = 'border-emerald-500/50'; bgColor = 'bg-emerald-500/10' }
                  else if (isSelected) { borderColor = 'border-red-500/50'; bgColor = 'bg-red-500/10' }
                }
                return (
                  <motion.button key={i} whileHover={!answered ? { scale: 1.01 } : {}}
                    whileTap={!answered ? { scale: 0.99 } : {}}
                    onClick={() => handleAnswer(i)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium
                      border ${borderColor} ${bgColor} transition-all cursor-pointer
                      ${!answered ? 'hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)]' : ''}
                      ${answered && isCorrect ? 'text-emerald-300' : answered && isSelected ? 'text-red-300' : 'text-white'}`}>
                    <span className="mr-3 text-[#5a5a6e]">{String.fromCharCode(65 + i)}.</span>{opt}
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence>
              {answered && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mb-5 px-4 py-3 rounded-xl bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.15)]">
                  <p className="text-xs text-[#a78bfa] font-medium mb-1">Explanation</p>
                  <p className="text-sm text-[#8a8a9a]">{questions[current].explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {answered && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white btn-gradient cursor-pointer border-none">
                {current < questions.length - 1 ? 'Next Question →' : 'See Results 🎉'}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {showResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 glass-card border border-[rgba(255,255,255,0.08)] text-center">
            {submitting ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] thinking-dot" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] thinking-dot" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] thinking-dot" />
                </div>
                <p className="text-sm text-[#8a8a9a]">Saving results...</p>
              </div>
            ) : (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="text-6xl mb-4">
                  {displayPct >= 80 ? '🏆' : displayPct >= 50 ? '👍' : '📚'}
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {displayPct >= 80 ? 'Excellent!' : displayPct >= 50 ? 'Good Job!' : 'Keep Learning!'}
                </h2>
                <p className="text-4xl font-bold gradient-text mb-2">{score}/{questions.length}</p>
                <p className="text-sm text-[#8a8a9a] mb-4">You scored {displayPct}% on {topic}</p>

                {/* XP earned badge */}
                {backendResult?.xpGained && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4
                      bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)]">
                    <span className="text-[#a78bfa] font-semibold text-sm">+{backendResult.xpGained} XP</span>
                    <span className="text-[#5a5a6e] text-xs">earned!</span>
                  </motion.div>
                )}

                {/* Weak areas */}
                {backendResult?.weakAreas && backendResult.weakAreas.length > 0 && (
                  <div className="mb-5 text-left">
                    <p className="text-xs text-[#5a5a6e] mb-2">Areas to review:</p>
                    <div className="space-y-1.5">
                      {backendResult.weakAreas.slice(0, 3).map((area, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(244,63,94,0.06)] border border-[rgba(244,63,94,0.1)]">
                          <span className="text-xs">⚠️</span>
                          <span className="text-xs text-[#8a8a9a] truncate">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleRestart}
                  className="px-8 py-3 rounded-xl text-sm font-semibold text-white btn-gradient cursor-pointer border-none">
                  Try Another Quiz
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
