import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateNotes } from '../services/gemini'
import { progressAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ReactMarkdown from 'react-markdown'
import { NotesSkeleton } from '../components/Skeleton'
import { HiOutlineDownload, HiOutlineRefresh, HiOutlineSparkles } from 'react-icons/hi'

export default function NotesGenerator() {
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner')
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedToBackend, setSavedToBackend] = useState(false)

  const { user } = useAuth()

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError('')
    setNotes('')
    setSavedToBackend(false)
    try {
      const result = await generateNotes(topic, difficulty, language)
      setNotes(result)

      // Track note generation in backend (JWT users only)
      if (user?.authMode === 'jwt') {
        progressAPI.trackNote(topic)
          .then(() => setSavedToBackend(true))
          .catch(() => { /* silently fail */ })
      }
    } catch {
      setError('Failed to generate notes. Please check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.replace(/\s+/g, '_')}_notes.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const difficultyOptions: Array<'Beginner' | 'Intermediate' | 'Advanced'> = ['Beginner', 'Intermediate', 'Advanced']

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight flex items-center gap-2">📝 AI Notes Generator</h1>
        <p className="text-sm text-[#8a8a9a] mb-8">Enter a topic and let AI create structured study notes for you.</p>
      </motion.div>

      {/* Input Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-2xl p-6 glass-card border border-[rgba(255,255,255,0.08)] mb-6">

        <div className="mb-4">
          <label className="text-xs font-medium text-[#8a8a9a] uppercase tracking-wider mb-2 block">Topic</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Quantum Physics, Machine Learning, World War II..."
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#5a5a6e]
              border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]
              focus:outline-none focus:border-[rgba(124,58,237,0.5)] transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium text-[#8a8a9a] uppercase tracking-wider mb-2 block">Difficulty</label>
            <div className="flex rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
              {difficultyOptions.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-all cursor-pointer border-none
                    ${difficulty === d ? 'bg-[rgba(124,58,237,0.2)] text-[#a78bfa]' : 'bg-transparent text-[#5a5a6e] hover:text-[#8a8a9a]'}`}
                >{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8a8a9a] uppercase tracking-wider mb-2 block">Language</label>
            <div className="flex rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)]">
              {(['English', 'Hindi'] as const).map((l) => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-all cursor-pointer border-none
                    ${language === l ? 'bg-[rgba(124,58,237,0.2)] text-[#a78bfa]' : 'bg-transparent text-[#5a5a6e] hover:text-[#8a8a9a]'}`}
                >{l}</button>
              ))}
            </div>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleGenerate} disabled={loading || !topic.trim()}
          className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white btn-gradient cursor-pointer border-none disabled:opacity-40 transition-all shadow-xl">
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white thinking-dot" />
                <span className="w-2 h-2 rounded-full bg-white thinking-dot" />
                <span className="w-2 h-2 rounded-full bg-white thinking-dot" />
              </span>
              Neural Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <HiOutlineSparkles className="w-4 h-4" /> Generate Intelligence
            </span>
          )}
        </motion.button>
      </motion.div>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
          <NotesSkeleton />
        </motion.div>
      )}

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-xs text-red-400 bg-red-400/10 px-4 py-3 rounded-xl mb-6">{error}</motion.p>
      )}

      {/* Output */}
      <AnimatePresence>
        {notes && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 glass-card border border-[rgba(255,255,255,0.08)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center text-xl">📝</div>
                <div>
                   <h2 className="text-xl font-black text-white tracking-tight">Intelligence Report</h2>
                   <div className="flex items-center gap-2 mt-1">
                      {savedToBackend && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                          ✓ Saved (+15 XP)
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#5a5a6e]">{difficulty} • {language}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setNotes(''); setTopic('') }}
                  className="p-3 rounded-xl text-[#8a8a9a] hover:text-white hover:bg-white/5 transition-all bg-transparent border border-white/5">
                  <HiOutlineRefresh className="w-5 h-5" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-violet-400 border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 transition-all">
                  <HiOutlineDownload className="w-4 h-4" /> Export MD
                </motion.button>
              </div>
            </div>
            <div className="markdown-content">
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
