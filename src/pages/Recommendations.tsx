import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { recommendationsAPI, type RecommendationData, type StudyPlanItem, type RecommendationInsight } from '../services/api'
import { useAuth } from '../context/AuthContext'

const fadeUp = (d = 0) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: d, ease: [0.16, 1, 0.3, 1] } },
})

const PRIORITY_CONFIG = {
  high: { 
    label: 'Immediate Action', 
    color: 'text-red-400', 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/20', 
    dot: 'bg-red-400', 
    badge: 'bg-red-500/20 text-red-300',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]'
  },
  medium: { 
    label: 'Growth Area', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20', 
    dot: 'bg-amber-400', 
    badge: 'bg-amber-500/20 text-amber-300',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
  },
  low: { 
    label: 'Fine Tuning', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20', 
    dot: 'bg-emerald-400', 
    badge: 'bg-emerald-500/20 text-emerald-300',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
  },
}

function PlanCard({ item, index }: { item: StudyPlanItem; index: number }) {
  const [expanded, setExpanded] = useState(index === 0) // Expand first item by default
  const p = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium

  return (
    <motion.div
      variants={fadeUp(0.1 + index * 0.1)}
      className={`rounded-3xl border p-6 transition-all cursor-pointer ${p.bg} ${p.border} ${p.glow} hover:scale-[1.01] relative overflow-hidden`}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Decorative accent */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${p.dot}`} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${p.badge}`}>
                {p.label}
              </span>
              <span className="text-xs text-[#5a5a6e] font-bold uppercase tracking-widest">
                ⏱ {item.estimatedTime}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2 leading-tight">{item.topic}</h3>
            <p className="text-sm text-[#a0a0b8] leading-relaxed max-w-2xl">{item.reason}</p>
          </div>
          <div className="text-right flex-shrink-0">
             <div className={`px-3 py-2 rounded-xl bg-black/20 border border-white/5 text-[10px] font-bold text-white uppercase tracking-widest`}>
               {item.difficulty}
             </div>
          </div>
        </div>

        {/* Subtopics preview in collapsed state */}
        {!expanded && item.subtopics?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {item.subtopics.slice(0, 3).map((st) => (
              <span key={st} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-black/20 text-[#8a8a9a] uppercase tracking-tighter">
                {st}
              </span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 mt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Subtopics */}
                <div>
                  <p className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest mb-4">Mastery Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {item.subtopics.map((st) => (
                      <span key={st} className="text-xs font-bold px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-300">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tips & Strategy */}
                <div>
                  <p className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest mb-4">Strategic Advice</p>
                  <ul className="space-y-3">
                    {item.studyTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#a0a0b8]">
                        <span className="w-5 h-5 rounded-lg bg-violet-600/10 flex items-center justify-center text-[10px] text-violet-400 font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources if available */}
                {item.resources && item.resources.length > 0 && (
                   <div className="md:col-span-2">
                     <p className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest mb-4">Recommended Resources</p>
                     <div className="flex flex-wrap gap-3">
                        {item.resources.map((res, i) => (
                          <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#c0c0d8] font-medium">
                            <span className="text-base">📑</span> {res}
                          </div>
                        ))}
                     </div>
                   </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function InsightPill({ insight }: { insight: RecommendationInsight }) {
  const config = {
    achievement: { icon: '🏆', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    gap: { icon: '🔎', color: 'text-red-400', bg: 'bg-red-500/10' },
    pattern: { icon: '📊', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    tip: { icon: '💡', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  }
  const c = config[insight.type] || config.tip

  return (
    <div className={`p-4 rounded-2xl border border-white/5 flex items-start gap-4 ${c.bg}`}>
      <span className="text-xl shrink-0">{c.icon}</span>
      <p className="text-xs font-bold text-white/90 leading-relaxed">{insight.text}</p>
    </div>
  )
}

export default function Recommendations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const isJWT = user?.authMode === 'jwt'

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      const fn = isRefresh ? recommendationsAPI.refresh : recommendationsAPI.get
      const r = await fn()
      setData(r.recommendations)
    } catch (err) {
      console.error('Recommendations failed', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!isJWT) { setLoading(false); return }
    loadData()
  }, [isJWT, loadData])

  if (!isJWT) return (
    <div className="p-10 max-w-[1200px] mx-auto min-h-[80vh] flex flex-col justify-center text-center">
      <div className="w-24 h-24 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-violet-500/20">
        <span className="text-5xl">🤖</span>
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-4">AI Mentorship Engine</h1>
      <p className="text-[#8a8a9a] mb-10 text-lg max-w-xl mx-auto">
        Sign in to unlock personalized study plans, weakness analysis, and AI-driven growth suggestions tailored to your performance.
      </p>
      <button onClick={() => navigate('/auth')} className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all shadow-xl max-w-xs mx-auto w-full">
        Unlock AI Insights
      </button>
    </div>
  )

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-12">
      {/* Header */}
      <motion.div variants={fadeUp(0)} initial="hidden" animate="visible" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 tracking-widest uppercase">AI Learning Coach</div>
             {data?.aiPowered && (
               <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 tracking-widest uppercase">Neural Engine Active</div>
             )}
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Your Strategic Plan</h1>
          <p className="text-[#8a8a9a] mt-2 text-lg">Personalized roadmap generated from your recent quiz performance.</p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-black transition-all shadow-lg"
          >
            {refreshing ? <span className="animate-spin">🔄</span> : '✨'}
            {refreshing ? 'Analyzing...' : 'Regenerate Plan'}
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />)}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Plan Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* AI Summary Banner */}
            <motion.div variants={fadeUp(0.05)} initial="hidden" animate="visible"
              className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-violet-600/30 via-blue-600/10 to-transparent border border-white/10 shadow-2xl">
              <div className="relative z-10 flex gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-3xl shrink-0">
                  ⚡
                </div>
                <div>
                  <p className="text-xl font-bold text-white mb-3 leading-relaxed">
                    {data.motivationalMessage}
                  </p>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="px-3 py-1.5 rounded-xl bg-black/20 border border-white/5 text-xs font-bold text-violet-300">
                      🎯 Weekly Goal: {data.weeklyGoal}
                    </div>
                    {data.focusArea && (
                      <div className="px-3 py-1.5 rounded-xl bg-black/20 border border-white/5 text-xs font-bold text-blue-300">
                        🔥 Main Focus: {data.focusArea}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Study Plan List */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="p-2 bg-white/5 rounded-xl">📋</span>
                Execution Strategy
              </h2>
              {data.studyPlan.length > 0 ? (
                data.studyPlan.map((item, i) => <PlanCard key={item.topic} item={item} index={i} />)
              ) : (
                <div className="p-16 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <span className="text-5xl mb-4 block">🏆</span>
                  <h3 className="text-xl font-bold text-white mb-2">Maximum Mastery Reached</h3>
                  <p className="text-[#5a5a6e]">You have no significant weak areas. Keep exploring new topics!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* Data Insights */}
            {data.insights && data.insights.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2">Cognitive Insights</h3>
                <div className="space-y-3">
                  {data.insights.map((ins, i) => <InsightPill key={i} insight={ins} />)}
                </div>
              </section>
            )}

            {/* Next Recommendations */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2">Knowledge Expansion</h3>
              <div className="bg-[#11111e] rounded-3xl border border-white/5 overflow-hidden">
                {data.nextTopics.map((topic, i) => (
                  <button
                    key={topic}
                    onClick={() => navigate(`/quiz?topic=${encodeURIComponent(topic)}`)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-[#8a8a9a] group-hover:bg-violet-600/20 group-hover:text-violet-400 transition-all">
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold text-white/80 group-hover:text-white">{topic}</span>
                    </div>
                    <span className="text-xs font-black text-violet-500 opacity-0 group-hover:opacity-100 transition-all">START →</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Topic Comparison */}
            <section className="space-y-4">
               <h3 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2">Topic Mastery Comparison</h3>
               <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                 <div className="space-y-5">
                   {data.topicStats.slice(0, 5).map((t, i) => (
                     <div key={t.topic}>
                       <div className="flex justify-between text-[11px] font-bold mb-2">
                         <span className="text-[#8a8a9a] uppercase truncate max-w-[150px]">{t.topic}</span>
                         <span className={t.accuracy >= 75 ? 'text-emerald-400' : t.accuracy >= 50 ? 'text-amber-400' : 'text-red-400'}>
                           {t.accuracy}%
                         </span>
                       </div>
                       <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${t.accuracy}%` }}
                           transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                           className="h-full rounded-full"
                           style={{ background: t.accuracy >= 75 ? '#10b981' : t.accuracy >= 50 ? '#f59e0b' : '#ef4444' }}
                         />
                       </div>
                     </div>
                   ))}
                 </div>
                 <button onClick={() => navigate('/progress')} className="w-full mt-8 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest transition-all">
                   Deep Analytics Module →
                 </button>
               </div>
            </section>

          </div>
        </div>
      ) : null}
    </div>
  )
}
