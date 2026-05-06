import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatAPI, type ChatMessage, type ChatSession } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { chatWithAI } from '../services/gemini'
import ReactMarkdown from 'react-markdown'

const SUGGESTED = [
  'Explain Newton\'s Laws of Motion',
  'How does machine learning work?',
  'What is photosynthesis?',
  'Explain the French Revolution',
  'How do I solve quadratic equations?',
]

const WELCOME: ChatMessage = {
  role: 'model',
  text: "Hi! I'm **Cognify AI** 🤖 — your personal learning tutor.\n\nI can help you with **any subject** — Science, Math, History, Programming, Languages, and more.\n\nWhat would you like to learn today?",
  timestamp: new Date().toISOString(),
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-5 py-3.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#7c3aed]"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ msg, isLast }: { msg: ChatMessage; isLast: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg border border-white/10
        ${isUser ? 'bg-gradient-to-br from-violet-600 to-blue-600' : 'btn-gradient'}`}>
        {isUser ? 'U' : 'C'}
      </div>
      <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 shadow-2xl relative
        ${isUser
          ? 'bg-violet-600/10 text-white border border-violet-500/20 rounded-tr-sm'
          : 'bg-white/5 text-[#e2e2f0] border border-white/5 rounded-tl-sm'
        }`}>
        <div className="markdown-content">
          <ReactMarkdown>{msg.text}</ReactMarkdown>
        </div>
        {msg.timestamp && (
          <p className="text-[9px] font-black uppercase tracking-widest text-[#5a5a6e] mt-3 opacity-60">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function AIChatbot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [aiProvider, setAiProvider] = useState<string | null>(null)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isJWT = user?.authMode === 'jwt'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Check AI status on mount (JWT users)
  useEffect(() => {
    if (isJWT) {
      chatAPI.getStatus().then((s) => setAiProvider(s.aiProvider)).catch(() => {})
      chatAPI.getHistory().then((r) => setSessions(r.sessions)).catch(() => {})
    }
  }, [isJWT])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const userMsg: ChatMessage = { role: 'user', text: msg, timestamp: new Date().toISOString() }
    setMessages((p) => [...p, userMsg])
    setLoading(true)

    try {
      let reply: string
      let newSessionId = sessionId

      if (isJWT) {
        try {
          // Route through backend — real AI with DB persistence
          const res = await chatAPI.sendMessage(msg, sessionId)
          reply = res.reply
          newSessionId = res.sessionId
          setSessionId(newSessionId)
        } catch (err) {
          console.warn('Backend chat failed, falling back to direct AI:', err)
          // Fallback to direct frontend AI if backend fails
          reply = await chatWithAI(msg, messages.slice(-8).map((m) => ({ role: m.role, text: m.text })))
        }
      } else {
        // Fallback: call Gemini directly on frontend (no persistence)
        reply = await chatWithAI(msg, messages.slice(-8).map((m) => ({ role: m.role, text: m.text })))
      }

      setMessages((p) => [...p, { role: 'model', text: reply, timestamp: new Date().toISOString() }])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get AI response.'
      setError(errMsg)
      setMessages((p) => [...p, {
        role: 'model',
        text: `⚠️ ${errMsg}\n\nPlease check that the backend server is running and an AI API key is configured.`,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, sessionId, isJWT])

  const loadSession = async (sid: string) => {
    try {
      const res = await chatAPI.getSession(sid)
      setMessages([WELCOME, ...res.session.messages])
      setSessionId(sid)
      setShowHistory(false)
    } catch { setError('Failed to load session.') }
  }

  const startNewChat = () => {
    setMessages([WELCOME])
    setSessionId(undefined)
    setError('')
    setShowHistory(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex h-screen" style={{ background: '#08080f' }}>

      {/* ── Sidebar: Chat History ────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="shrink-0 h-full border-r border-[rgba(255,255,255,0.06)] overflow-hidden flex flex-col"
            style={{ background: 'rgba(10,10,20,0.95)' }}
          >
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Chat History</h3>
              <button onClick={startNewChat}
                className="text-xs text-[#a78bfa] hover:text-white transition-colors cursor-pointer bg-transparent border-none px-2 py-1 rounded-lg hover:bg-[rgba(124,58,237,0.1)]">
                + New
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-[#5a5a6e] text-center py-8">No past conversations yet.</p>
              ) : sessions.map((s) => (
                <button key={s._id} onClick={() => loadSession(s._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-all border-none
                    ${sessionId === s._id
                      ? 'bg-[rgba(124,58,237,0.15)] border border-[rgba(124,58,237,0.2)]'
                      : 'bg-transparent hover:bg-[rgba(255,255,255,0.04)]'}`}>
                  <p className="text-xs font-medium text-white truncate">{s.title}</p>
                  <p className="text-[10px] text-[#5a5a6e] mt-0.5 truncate">{s.lastMessage}</p>
                  <p className="text-[10px] text-[#3a3a4e] mt-0.5">
                    {s.messageCount} messages · {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0"
          style={{ background: 'rgba(8,8,15,0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            {isJWT && (
              <button onClick={() => setShowHistory((p) => !p)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a8a9a] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer border-none bg-transparent text-base">
                ☰
              </button>
            )}
            <div className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-xs font-bold text-white">C</div>
            <div>
              <h1 className="text-sm font-bold text-white">Cognify AI Tutor</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-[#5a5a6e]">
                  {aiProvider === 'openai' ? 'Powered by OpenAI GPT'
                    : aiProvider === 'gemini' ? 'Powered by Google Gemini'
                    : isJWT ? 'Backend connected' : 'Gemini (frontend)'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isJWT && (
              <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">
                ⚠ Login for full features
              </span>
            )}
            <button onClick={startNewChat}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#8a8a9a] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all cursor-pointer border border-[rgba(255,255,255,0.06)] bg-transparent">
              New Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isLast={i === messages.length - 1} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-xs font-bold text-white shrink-0">C</div>
              <div className="rounded-2xl rounded-tl-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)]">
                <TypingDots />
              </div>
            </motion.div>
          )}

          {/* Suggested prompts (only at start) */}
          {messages.length === 1 && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="pt-4">
              <p className="text-xs text-[#5a5a6e] mb-3 text-center">Try asking...</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED.map((s) => (
                  <motion.button key={s} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(s)}
                    className="px-4 py-2 rounded-full text-xs font-medium text-[#a78bfa] cursor-pointer transition-all
                      border border-[rgba(124,58,237,0.2)] bg-[rgba(124,58,237,0.06)] hover:bg-[rgba(124,58,237,0.12)]">
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ELI5 shortcut */}
          {messages.length > 2 && !loading && (
            <div className="flex justify-center">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const last = [...messages].reverse().find((m) => m.role === 'user')
                  if (last) sendMessage(`Explain like I'm 10 years old: ${last.text}`)
                }}
                className="px-4 py-1.5 rounded-full text-xs font-medium text-[#8a8a9a] cursor-pointer
                  border border-[rgba(255,255,255,0.06)] bg-transparent hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all">
                🧒 Explain Simpler
              </motion.button>
            </div>
          )}

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-xs text-red-400 bg-red-400/10 px-4 py-2 rounded-lg mx-auto max-w-sm">
              {error}
            </motion.p>
          )}

          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-3
              focus-within:border-[rgba(124,58,237,0.4)] focus-within:bg-[rgba(124,58,237,0.04)] transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px` }}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about any subject..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#5a5a6e] resize-none outline-none
                  leading-relaxed disabled:opacity-50 min-h-[24px] max-h-[140px]"
                style={{ height: '24px' }}
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[#3a3a4e] hidden sm:block">⏎ Send</span>
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center cursor-pointer border-none disabled:opacity-40 shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </div>
            </div>
            <p className="text-[10px] text-[#3a3a4e] text-center mt-2">
              {isJWT ? 'Chat history saved to your account · ' : 'Login for saved history · '}
              Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
