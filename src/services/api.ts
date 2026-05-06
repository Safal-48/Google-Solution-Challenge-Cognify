// ─── Cognify Backend API Service ───────────────────────────────────────────
// Handles all JWT-authenticated calls to the Express backend

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// ─── Token Management ──────────────────────────────────────────────────────
export const tokenStorage = {
  get: () => localStorage.getItem('cognify_token'),
  set: (token: string) => localStorage.setItem('cognify_token', token),
  remove: () => localStorage.removeItem('cognify_token'),
}

export const userStorage = {
  get: () => {
    try {
      const raw = localStorage.getItem('cognify_user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  },
  set: (user: object) => localStorage.setItem('cognify_user', JSON.stringify(user)),
  remove: () => localStorage.removeItem('cognify_user'),
}

// ─── Base Fetch Wrapper ────────────────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    // Handle token expiry
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      tokenStorage.remove()
      userStorage.remove()
      window.location.href = '/auth'
    }
    throw new Error(data.error || `Request failed: ${response.status}`)
  }

  return data as T
}

// ─── Auth Types ────────────────────────────────────────────────────────────
export interface JWTUser {
  _id: string
  name: string
  email: string
  role: 'student' | 'teacher'
  xp: number
  level: number
  streak: number
  badges: Array<{ id: string; name: string; icon: string; earnedAt: string }>
  onboardingComplete: boolean
  createdAt: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token: string
  user: JWTUser
}

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    tokenStorage.set(data.token)
    userStorage.set(data.user)
    return data
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    tokenStorage.set(data.token)
    userStorage.set(data.user)
    return data
  },

  getMe: async (): Promise<{ success: boolean; user: JWTUser }> => {
    return apiFetch('/auth/me')
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      tokenStorage.remove()
      userStorage.remove()
    }
  },
}

// ─── User API ──────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => apiFetch<{ success: boolean; user: JWTUser }>('/user/profile'),

  updateProfile: (data: Partial<JWTUser>) =>
    apiFetch<{ success: boolean; user: JWTUser }>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  completeOnboarding: (data: {
    learningGoal: string
    preferredSubjects: string[]
    currentLevel: string
  }) => apiFetch('/user/onboarding', { method: 'POST', body: JSON.stringify(data) }),

  getStats: () =>
    apiFetch<{ success: boolean; stats: Record<string, unknown> }>('/user/stats'),
}

// ─── Chat API ──────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'model'
  text: string
  timestamp?: string
}

export interface ChatSession {
  _id: string
  title: string
  messageCount: number
  lastMessage: string
  lastMessageRole: 'user' | 'model'
  createdAt: string
  updatedAt: string
}

export interface ChatFullSession {
  _id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatSendResponse {
  success: boolean
  sessionId: string
  reply: string
  provider: 'openai' | 'gemini'
  xpGained: number
  messageCount: number
}

export const chatAPI = {
  // Check AI provider status
  getStatus: (): Promise<{ success: boolean; aiProvider: string | null; available: boolean; message: string }> =>
    apiFetch('/chat/status'),

  // Send message → receive AI reply
  sendMessage: (message: string, sessionId?: string): Promise<ChatSendResponse> =>
    apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),

  // Get all session summaries
  getHistory: (): Promise<{ success: boolean; sessions: ChatSession[] }> =>
    apiFetch('/chat/history'),

  // Get full session with all messages
  getSession: (sessionId: string): Promise<{ success: boolean; session: ChatFullSession }> =>
    apiFetch(`/chat/session/${sessionId}`),

  // Delete a single session
  deleteSession: (sessionId: string): Promise<{ success: boolean; message: string }> =>
    apiFetch(`/chat/session/${sessionId}`, { method: 'DELETE' }),

  // Clear all sessions
  clearAll: (): Promise<{ success: boolean; message: string }> =>
    apiFetch('/chat/sessions', { method: 'DELETE' }),
}

// ─── Quiz API ──────────────────────────────────────────────────────────────
export interface QuizClientQuestion {
  index: number
  question: string
  options: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuizResultQuestion {
  question: string
  options: string[]
  correctAnswer: number
  userAnswer: number
  isCorrect: boolean
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface GeneratedQuiz {
  quizId: string
  topic: string
  difficulty: string
  aiProvider: 'openai' | 'gemini'
  questions: QuizClientQuestion[]
  createdAt: string
}

export interface QuizSubmitResult {
  quizId: string
  topic: string
  difficulty: string
  score: number
  total: number
  percentage: number
  timeTaken: number
  xpGained: number
  badgesEarned: Array<{ id: string; name: string; icon: string }>
  questions: QuizResultQuestion[]
  weakAreas: string[]
  newLevel: number
  newXP: number
}

export interface QuizHistoryItem {
  _id: string
  topic: string
  difficulty: string
  score: number
  total: number
  percentage: number
  timeTaken: number
  createdAt: string
  aiProvider: string
}

export const quizAPI = {
  generate: (topic: string, numQuestions: number, difficulty: string): Promise<{ success: boolean; quiz: GeneratedQuiz }> =>
    apiFetch('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, numQuestions, difficulty }),
    }),

  submit: (quizId: string, userAnswers: number[], timeTaken: number): Promise<{ success: boolean; result: QuizSubmitResult }> =>
    apiFetch('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ quizId, userAnswers, timeTaken }),
    }),

  getHistory: (): Promise<{ success: boolean; results: QuizHistoryItem[] }> =>
    apiFetch('/quiz/history'),

  getRecommendations: (): Promise<{ success: boolean; recommendations: Record<string, unknown> }> =>
    apiFetch('/quiz/recommendations'),

  getById: (quizId: string) =>
    apiFetch(`/quiz/${quizId}`),
}

// ─── Progress API ──────────────────────────────────────────────────────────
export const progressAPI = {
  get: () =>
    apiFetch<{ success: boolean; progress: Record<string, unknown> }>('/progress'),

  trackNote: (topic: string) =>
    apiFetch('/progress/track-note', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    }),
}

// ─── Analytics Types ────────────────────────────────────────────────────────
export interface TopicAccuracy {
  topic: string
  attempts: number
  avgScore: number
  accuracy: number
  lastAttempt: string
  trend: number
  bestScore: number
  avgTime: number
}

export interface WeakTopic {
  topic: string
  accuracy: number
  avgScore: number
  attempts: number
  priority: 'high' | 'medium'
  trend: number
}

export interface ScoreTrendPoint {
  label: string
  score: number
  topic: string
  date: string
  timeTaken: number
}

export interface WeeklyTrendPoint {
  label: string
  quizzes: number
  avgScore: number
  studyTime: number
}

export interface HeatmapDay {
  date: string
  count: number
  avgScore: number
}

export interface DifficultyBreakdown {
  name: string
  count: number
  avgScore: number
}

export interface MonthComparison {
  thisMonth: number
  lastMonth: number
  thisMonthAvg: number
  lastMonthAvg: number
}

export interface AnalyticsSummary {
  totalQuizzes: number
  avgScore: number
  bestScore: number
  overallAccuracy: number
  perfectScores: number
  improvementRate: number
  streak: number
  xp: number
  level: number
  notesGenerated: number
  topicsCount: number
  badges: Array<{ id: string; name: string; icon: string; earnedAt: string }>
  totalStudyMinutes: number
  avgTimePerQuiz: number
  consistencyScore: number
  monthComparison: MonthComparison
}

export interface AnalyticsData {
  summary: AnalyticsSummary
  topicAccuracy: TopicAccuracy[]
  weakTopics: WeakTopic[]
  strongTopics: TopicAccuracy[]
  scoreTrend: ScoreTrendPoint[]
  weeklyTrend: WeeklyTrendPoint[]
  heatmapData: HeatmapDay[]
  difficultyBreakdown: DifficultyBreakdown[]
}

// ─── Analytics API ──────────────────────────────────────────────────────────
export const analyticsAPI = {
  getOverview: () =>
    apiFetch<{ success: boolean; analytics: AnalyticsData; cached: boolean }>('/analytics/overview'),

  getTopicDrilldown: (topic: string) =>
    apiFetch<{
      success: boolean
      topic: string
      attempts: number
      avgScore: number
      bestScore: number
      trend: number
      scoreHistory: Array<{ attempt: number; score: number; date: string; timeTaken: number }>
      questionBreakdown: Array<{ question: string; accuracy: number; attempts: number }>
    }>(`/analytics/topic/${encodeURIComponent(topic)}`),

  bustCache: () =>
    apiFetch<{ success: boolean }>('/analytics/bust-cache', { method: 'POST' }),
}

// ─── Recommendations Types ─────────────────────────────────────────────────
export interface StudyPlanItem {
  topic: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  estimatedTime: string
  subtopics: string[]
  studyTips: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  resources?: string[]
}

export interface RecommendationInsight {
  type: 'achievement' | 'gap' | 'pattern' | 'tip'
  text: string
}

export interface RecommendationData {
  studyPlan: StudyPlanItem[]
  nextTopics: string[]
  motivationalMessage: string
  weeklyGoal: string
  focusArea: string
  source: string
  aiPowered: boolean
  insights?: RecommendationInsight[]
  topicStats: Array<{ topic: string; accuracy: number; avgScore: number; attempts: number; trend: number }>
  weakTopics: Array<{ topic: string; accuracy: number; avgScore: number; attempts: number; trend: number }>
  strongTopics: Array<{ topic: string; accuracy: number; avgScore: number; attempts: number }>
}

// ─── Recommendations API ───────────────────────────────────────────────────
export const recommendationsAPI = {
  get: () =>
    apiFetch<{ success: boolean; recommendations: RecommendationData; cached: boolean }>('/recommendations'),
  refresh: () =>
    apiFetch<{ success: boolean; recommendations: RecommendationData }>('/recommendations/refresh', { method: 'POST' }),
}

// ─── Health Check ──────────────────────────────────────────────────────────
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}

