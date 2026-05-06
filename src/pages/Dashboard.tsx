import {
  HiOutlineDocumentText,
  HiOutlineLightBulb,
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
  HiOutlineFire,
  HiOutlineTrophy,
  HiOutlineClock,
  HiOutlineBeaker,
  HiOutlineChevronRight,
} from 'react-icons/hi2'

import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { userAPI, analyticsAPI, type AnalyticsData } from '../services/api'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

const fadeUp: any = (delay: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } },
})

const quickActions = [
  { icon: HiOutlineDocumentText, title: 'AI Notes', desc: 'Synthesize study material', to: '/notes', color: 'from-violet-600 to-indigo-600' },
  { icon: HiOutlineLightBulb, title: 'Adaptive Quiz', desc: 'Validate knowledge depth', to: '/quiz', color: 'from-blue-600 to-cyan-600' },
  { icon: HiOutlineChatBubbleLeftRight, title: 'AI Mentor', desc: 'Interactive guided learning', to: '/chat', color: 'from-emerald-600 to-teal-600' },
  { icon: HiOutlineBeaker, title: 'Growth Plan', desc: 'AI-driven study roadmap', to: '/recommendations', color: 'from-pink-600 to-rose-600' },
]

interface Stats {
  xp: number
  level: number
  xpProgress: number
  streak: number
  totalQuizzes: number
  avgScore: number
  notesGenerated: number
  studyHours: number
  topicsCount: number
  badgesCount: number
  recentActivity: Array<{ type: string; text: string; time: string | Date }>
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  const firstName = user?.name?.split(' ')[0] || 'Learner'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (user?.authMode === 'jwt') {
      userAPI.getStats()
        .then(({ stats: s }) => setStats(s as any as Stats))
        .catch(() => setStats(null))
        .finally(() => setStatsLoading(false))
      analyticsAPI.getOverview()
        .then(r => setAnalytics(r.analytics))
        .catch(() => {})
    } else {
      setStatsLoading(false)
    }
  }, [user])

  const statsCards = [
    {
      icon: HiOutlineFire,
      label: 'Study Streak',
      value: statsLoading ? '—' : `${stats?.streak ?? user?.streak ?? 0} Days`,
      change: 'Momentum active',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20'
    },
    {
      icon: HiOutlineTrophy,
      label: 'Success Rate',
      value: statsLoading ? '—' : `${stats?.avgScore ?? 0}%`,
      change: `${stats?.totalQuizzes ?? 0} assessments`,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20'
    },
    {
      icon: HiOutlineSparkles,
      label: 'Intelligence',
      value: statsLoading ? '—' : `${stats?.notesGenerated ?? 0}`,
      change: `${stats?.topicsCount ?? 0} topics`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      icon: HiOutlineClock,
      label: 'Progression',
      value: statsLoading ? '—' : `Lvl ${stats?.level ?? user?.level ?? 1}`,
      change: `${stats?.xp ?? user?.xp ?? 0} Total XP`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
  ]

  return (
    <div className="p-10 max-w-[1300px] mx-auto space-y-12">
      
      {/* ── Header ── */}
      <motion.div variants={fadeUp(0)} initial="hidden" animate="visible" className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 tracking-widest uppercase">System Overview</div>
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#5a5a6e] uppercase tracking-widest">
               <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" /> Real-time Data
             </div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
            {greeting}, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="text-[#8a8a9a] mt-4 text-lg font-medium max-w-xl">
            Welcome back to your cognitive workspace. Your performance metrics and next strategic actions are ready.
          </p>
        </div>

        {/* Progress Summary Card */}
        {user && (
          <motion.div variants={fadeUp(0.1)} className="rounded-3xl p-6 bg-[#11111e] border border-white/5 shadow-2xl min-w-[280px]">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest">Growth Phase</span>
               <span className="text-xs font-black text-violet-400">{(user.xp % 500) / 5}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 mb-2 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${(user.xp % 500) / 5}%` }}
                 transition={{ duration: 1.5, delay: 0.5 }}
                 className="h-full rounded-full btn-gradient shadow-[0_0_15px_rgba(124,58,237,0.4)]"
               />
            </div>
            <p className="text-[10px] font-bold text-[#5a5a6e] uppercase tracking-tighter text-center">
              Next Rank in {500 - (user.xp % 500)} XP
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Core Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            variants={fadeUp(0.05 * (i + 1))}
            initial="hidden" animate="visible"
            whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            className={`rounded-[2.5rem] p-8 border transition-all duration-300 relative overflow-hidden bg-[#11111e]/80 backdrop-blur-xl group ${card.border}`}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative z-10 ${card.bg}`}>
              <card.icon className={`w-7 h-7 ${card.color} group-hover:scale-110 transition-transform`} />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black text-white mb-1 tracking-tighter">{card.value}</p>
              <p className="text-xs font-black text-[#5a5a6e] uppercase tracking-widest mb-4">{card.label}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
                 <span className={`text-[10px] font-black uppercase tracking-tighter ${card.color}`}>{card.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Action Matrix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Quick Actions */}
        <div className="lg:col-span-8 space-y-6">
           <h2 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2">Primary Operations</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.title}
                  variants={fadeUp(0.1 + i * 0.05)}
                  initial="hidden" animate="visible"
                  whileHover={{ y: -6, scale: 1.01, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.to)}
                  className="rounded-[2.5rem] p-8 bg-[#11111e]/60 border border-white/5 text-left group relative overflow-hidden backdrop-blur-xl gradient-border"
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 blur-[80px] transition-all duration-700`} />
                  
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${action.color} mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative z-10`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <h3 className="text-xl font-black text-white tracking-tight group-hover:text-glow transition-all">{action.title}</h3>
                    <HiOutlineChevronRight className="w-5 h-5 text-[#3a3a4e] group-hover:text-white transition-all group-hover:translate-x-2" />
                  </div>
                  <p className="text-[#8a8a9a] text-sm font-medium leading-relaxed group-hover:text-[#c0c0d8] transition-colors relative z-10">{action.desc}</p>
                </motion.button>
              ))}
           </div>
        </div>

        {/* Mini Insights */}
        <div className="lg:col-span-4 space-y-6">
           <h2 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2">Knowledge Pulse</h2>
           <div className="rounded-[2.5rem] p-8 bg-[#11111e] border border-white/5 space-y-8 h-full">
              {analytics ? (
                <>
                  <div>
                    <div className="flex justify-between items-end mb-4">
                       <div>
                         <p className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest mb-1">Score Velocity</p>
                         <p className="text-3xl font-black text-white">{analytics.summary.overallAccuracy}%</p>
                       </div>
                       <div className="px-2 py-1 rounded-lg bg-emerald-500/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                         Optimal
                       </div>
                    </div>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={analytics.scoreTrend.slice(-10)}>
                        <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={3} dot={false} animationDuration={2000}/>
                        <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, fontSize: 10, fontWeight: 'bold', color: '#fff' }}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-4">
                     <p className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest">Quick Drilldown</p>
                     {analytics.weakTopics.slice(0, 2).map(t => (
                       <div key={t.topic} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                         <span className="text-xs font-bold text-[#8a8a9a] truncate max-w-[120px]">{t.topic}</span>
                         <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Needs Review</span>
                       </div>
                     ))}
                     <button onClick={() => navigate('/progress')} className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-white uppercase tracking-widest transition-all">
                       Full Diagnostic Report →
                     </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-4">📉</div>
                   <p className="text-xs font-bold text-[#5a5a6e] uppercase tracking-widest leading-loose">Waiting for session data to generate real-time insights.</p>
                </div>
              )}
           </div>
        </div>

      </div>

      {/* ── Gamification Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Events */}
        <div className="lg:col-span-8 space-y-6">
           <h2 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2">Operational Log</h2>
           <div className="rounded-[2.5rem] bg-white/5 border border-white/5 overflow-hidden">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {stats.recentActivity.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center gap-6 px-8 py-5 group hover:bg-white/[0.02] transition-all">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-lg shadow-lg
                        ${item.type === 'notes' ? 'bg-violet-600/10 text-violet-400' :
                          item.type === 'quiz' ? 'bg-blue-600/10 text-blue-400' :
                          'bg-emerald-600/10 text-emerald-400'}`}>
                        {item.type === 'notes' ? '📝' : item.type === 'quiz' ? '🧠' : '💬'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">{item.text}</p>
                        <p className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest mt-1">
                          {new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all">
                         <HiOutlineChevronRight className="w-4 h-4 text-violet-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-8 py-16 text-center">
                  <p className="text-sm font-bold text-[#5a5a6e] uppercase tracking-widest">No activity data logged in this cycle.</p>
                </div>
              )}
           </div>
        </div>

        {/* Badges */}
        <div className="lg:col-span-4 space-y-6">
           <h2 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2">Achievements</h2>
           <div className="rounded-[2.5rem] p-8 bg-white/5 border border-white/5">
              {user?.badges && user.badges.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {user.badges.map((b, i) => (
                    <motion.div
                      key={b.id}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
                      className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all cursor-default"
                      title={b.name}
                    >
                      <span className="text-3xl drop-shadow-[0_0_10px_rgba(124,58,237,0.3)]">{b.icon}</span>
                      <span className="text-[9px] font-black text-[#5a5a6e] uppercase tracking-tighter text-center leading-none">{b.name}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl mb-4 grayscale">🏅</div>
                   <p className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest leading-loose">Complete assessments to unlock cognitive milestones.</p>
                </div>
              )}
           </div>
        </div>

      </div>

    </div>
  )
}
