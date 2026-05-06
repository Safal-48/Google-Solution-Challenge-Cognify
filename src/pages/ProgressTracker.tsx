import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, AreaChart, Area,
  LineChart, Line, CartesianGrid
} from 'recharts'
import { analyticsAPI, type AnalyticsData } from '../services/api'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1']
const fadeUp: any = (d: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: d, ease: [0.16, 1, 0.3, 1] } }
})

function GlassCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-[rgba(13,13,26,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, sub, trend, colorClass }: { icon: string; label: string; value: string | number; sub?: string; trend?: number; colorClass: string }) {
  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-2xl`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-[#5a5a6e] uppercase tracking-widest mb-1">{label}</p>
      <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
      {sub && <p className="text-xs text-[#4a4a5e] mt-2 font-medium">{sub}</p>}
    </GlassCard>
  )
}

function CustomTooltip({ active, payload, label, unit = '%' }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f1a] border border-[rgba(255,255,255,0.1)] p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-widest text-[#5a5a6e] mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-sm font-bold text-white">
              {entry.name}: {entry.value}{unit}
            </p>
          </div>
        ))}
        {payload[0]?.payload?.topic && (
          <p className="text-[11px] text-[#8a8a9a] mt-1 italic">"{payload[0].payload.topic}"</p>
        )}
      </div>
    )
  }
  return null
}

export default function ProgressTracker() {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'overview' | 'trends' | 'drilldown'>('overview')
  const isJWT = user?.authMode === 'jwt'

  const fetchData = async () => {
    try {
      const r = await analyticsAPI.getOverview()
      setData(r.analytics)
    } catch (err) {
      console.error('Failed to load analytics', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isJWT) { setLoading(false); return }
    fetchData()
  }, [isJWT])

  const handleBustCache = async () => {
    setRefreshing(true)
    try {
      await analyticsAPI.bustCache()
      await fetchData()
    } catch (e) {
      setRefreshing(false)
    }
  }

  if (loading) return (
    <div className="p-8 max-w-[1250px] mx-auto space-y-8">
      <div className="animate-pulse space-y-8">
        <div className="h-10 bg-[rgba(255,255,255,0.05)] rounded-2xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-[rgba(255,255,255,0.03)] rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-[400px] bg-[rgba(255,255,255,0.02)] rounded-3xl" />)}
        </div>
      </div>
    </div>
  )

  if (!isJWT) return (
    <div className="p-10 max-w-[1250px] mx-auto min-h-[80vh] flex flex-col justify-center">
      <motion.div variants={fadeUp(0)} initial="hidden" animate="visible" className="text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-violet-500/20">
          <span className="text-5xl">📊</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Visualize Your Growth</h1>
        <p className="text-[#8a8a9a] mb-10 text-lg leading-relaxed">
          Unlock deep insights, activity heatmaps, and AI-powered progress tracking by signing in with your email account.
        </p>
        <button onClick={() => window.location.href = '/auth'} className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all shadow-[0_10px_40px_rgba(124,58,237,0.3)]">
          Sign In to Unlock
        </button>
      </motion.div>
    </div>
  )

  const s = data?.summary
  const noData = !data || s?.totalQuizzes === 0

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-10">
      {/* ── Header Section ── */}
      <motion.div variants={fadeUp(0)} initial="hidden" animate="visible" className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 tracking-widest uppercase">Performance Dashboard</div>
             {data?.summary && (
               <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Live Engine</div>
             )}
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Learning Analytics</h1>
          <p className="text-[#8a8a9a] mt-2 text-lg">Real-time breakdown of your academic progress and topic mastery.</p>
        </div>

        <div className="flex items-center gap-4">
          {s && (
            <div className="flex -space-x-2 mr-2">
              {s.badges.slice(0, 3).map((b, i) => (
                <div key={b.id} title={b.name} className="w-10 h-10 rounded-full bg-[#1a1a2e] border-2 border-[#0d0d1a] flex items-center justify-center text-xl shadow-xl">
                  {b.icon}
                </div>
              ))}
              {s.badges.length > 3 && (
                <div className="w-10 h-10 rounded-full bg-[#2a2a4a] border-2 border-[#0d0d1a] flex items-center justify-center text-xs font-bold text-white shadow-xl">
                  +{s.badges.length - 3}
                </div>
              )}
            </div>
          )}
          <button 
            onClick={handleBustCache}
            disabled={refreshing}
            className={`p-3 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.08)] transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            🔄
          </button>
        </div>
      </motion.div>

      {/* ── Metric Grid ── */}
      {s && (
        <motion.div variants={fadeUp(0.1)} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon="⚡" label="Mastery Score" value={`${s.avgScore}%`} colorClass="text-violet-400" trend={s.improvementRate} sub={`Across ${s.totalQuizzes} evaluations`} />
          <StatCard icon="🎯" label="Global Accuracy" value={`${s.overallAccuracy}%`} colorClass="text-blue-400" sub={`${s.perfectScores} perfect completions`} />
          <StatCard icon="⏱️" label="Time Invested" value={`${s.totalStudyMinutes}m`} colorClass="text-amber-400" sub={`~${s.avgTimePerQuiz}m per session`} />
          <StatCard icon="🔥" label="Consistency" value={`${s.consistencyScore}%`} colorClass="text-emerald-400" sub={`${s.streak} day active streak`} />
        </motion.div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="flex border-b border-[rgba(255,255,255,0.06)] pb-px">
        {(['overview', 'trends', 'drilldown'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-8 py-4 text-sm font-bold tracking-wide uppercase transition-all relative ${tab === t ? 'text-white' : 'text-[#5a5a6e] hover:text-[#8a8a9a]'}`}
          >
            {t}
            {tab === t && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500 rounded-full" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Primary Chart: Master Area Chart */}
              <GlassCard className="lg:col-span-8 p-8">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Performance Trajectory</h3>
                    <p className="text-xs text-[#5a5a6e] font-medium uppercase tracking-widest">Real-time score evolution</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                        <span className="text-xs text-[#8a8a9a] font-semibold">Current Session</span>
                     </div>
                  </div>
                </div>
                <div className="h-[350px]">
                  {data?.scoreTrend && data.scoreTrend.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.scoreTrend}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#5a5a6e', fontSize: 11, fontWeight: 600 }}
                          tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5a5a6e', fontSize: 11, fontWeight: 600 }} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8b5cf6" 
                          strokeWidth={4} 
                          fill="url(#scoreGrad)" 
                          animationDuration={2000}
                          dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0d0d1a' }}
                          activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#5a5a6e] bg-[rgba(255,255,255,0.01)] rounded-3xl border border-dashed border-[rgba(255,255,255,0.05)]">
                      <span className="text-4xl mb-4">📈</span>
                      <p className="font-semibold">Insufficient data for trend analysis</p>
                      <p className="text-xs mt-2">Complete at least 3 quizzes to unlock.</p>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Sidebar: Mastery Radar */}
              <GlassCard className="lg:col-span-4 p-8">
                <h3 className="text-xl font-bold text-white mb-1">Skill Distribution</h3>
                <p className="text-xs text-[#5a5a6e] font-medium uppercase tracking-widest mb-8">Subject balance overview</p>
                <div className="h-[280px]">
                  {data?.topicAccuracy && data.topicAccuracy.length >= 3 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.topicAccuracy.slice(0, 6)}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="topic" tick={{ fill: '#8a8a9a', fontSize: 9, fontWeight: 700 }} />
                        <Radar
                          name="Accuracy"
                          dataKey="accuracy"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.5}
                          animationDuration={1500}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#5a5a6e]">
                      <span className="text-3xl mb-3">🕸️</span>
                      <p className="text-xs text-center font-medium">Diversify your topics to<br/>populate skill radar.</p>
                    </div>
                  )}
                </div>
                {data?.topicAccuracy && data.topicAccuracy.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5a5a6e] font-bold uppercase tracking-wider">Top Subject</span>
                      <span className="text-emerald-400 font-bold">{data.strongTopics[0]?.topic || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5a5a6e] font-bold uppercase tracking-wider">Focus Needed</span>
                      <span className="text-red-400 font-bold">{data.weakTopics[0]?.topic || 'None'}</span>
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Activity Heatmap Row */}
              <GlassCard className="lg:col-span-12 p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Active Learning Streak</h3>
                    <p className="text-xs text-[#5a5a6e] font-medium uppercase tracking-widest">35-day consistency tracker</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-xs text-white font-bold">
                         {s?.monthComparison.thisMonth} quizzes this month
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-between">
                  {data?.heatmapData.map((d, i) => {
                    const intensity = d.count === 0 ? 0 : d.count === 1 ? 0.3 : d.count === 2 ? 0.6 : 1
                    return (
                      <motion.div 
                        key={d.date}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="flex-1 min-w-[24px] aspect-square rounded-lg cursor-help group relative"
                        style={{ background: intensity === 0 ? 'rgba(255,255,255,0.03)' : `rgba(139, 92, 246, ${intensity})` }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0d0d1a] border border-[rgba(255,255,255,0.1)] rounded-xl text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-2xl">
                          <p className="font-bold mb-1">{new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                          <p className="text-violet-300">{d.count} Quizzes · {d.avgScore}% Avg</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                <div className="mt-6 flex items-center gap-4 text-[10px] font-bold text-[#5a5a6e] uppercase tracking-widest">
                  <span>Less Intensity</span>
                  <div className="flex gap-1.5">
                    {[0.03, 0.3, 0.6, 1].map(o => (
                      <div key={o} className="w-4 h-4 rounded-md" style={{ background: `rgba(139, 92, 246, ${o})` }} />
                    ))}
                  </div>
                  <span>High Intensity</span>
                </div>
              </GlassCard>
            </div>
          )}

          {/* ── TRENDS TAB ── */}
          {tab === 'trends' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Growth */}
                <GlassCard className="p-8">
                  <h3 className="text-xl font-bold text-white mb-8">Weekly Volume & Success</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.weeklyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#5a5a6e', fontSize: 11, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5a5a6e', fontSize: 11, fontWeight: 700 }} />
                        <Tooltip content={<CustomTooltip unit=" Qs" />} />
                        <Bar dataKey="quizzes" radius={[8, 8, 0, 0]} barSize={40} animationDuration={1500}>
                          {data?.weeklyTrend.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                        </Bar>
                        <Line type="monotone" dataKey="avgScore" stroke="#fff" strokeWidth={3} dot={{ fill: '#fff', r: 4 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                {/* Performance Buckets */}
                <GlassCard className="p-8">
                  <h3 className="text-xl font-bold text-white mb-8">Score Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.difficultyBreakdown}
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="count"
                          animationDuration={1500}
                        >
                          {data?.difficultyBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                     {data?.difficultyBreakdown.map((d, i) => (
                       <div key={d.name} className="text-center">
                         <p className="text-[10px] font-bold text-[#5a5a6e] uppercase mb-1">{d.name}</p>
                         <p className="text-sm font-extrabold" style={{ color: COLORS[i % COLORS.length] }}>{d.count} ({d.avgScore}%)</p>
                       </div>
                     ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* ── DRILLDOWN TAB ── */}
          {tab === 'drilldown' && (
            <GlassCard className="overflow-hidden">
               <div className="p-8 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)]">
                 <h3 className="text-xl font-bold text-white">Granular Mastery List</h3>
                 <p className="text-xs text-[#5a5a6e] font-medium uppercase tracking-widest mt-1">Detailed accuracy by topic</p>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-[10px] font-bold text-[#5a5a6e] uppercase tracking-widest bg-[rgba(255,255,255,0.02)]">
                       <th className="px-8 py-5">Subject</th>
                       <th className="px-8 py-5 text-center">Attempts</th>
                       <th className="px-8 py-5 text-center">Avg Score</th>
                       <th className="px-8 py-5 text-center">Accuracy</th>
                       <th className="px-8 py-5">Visual Mastery</th>
                       <th className="px-8 py-5 text-right">Trend</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                     {data?.topicAccuracy.map((t, i) => (
                       <tr key={t.topic} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center font-bold text-white group-hover:border-violet-500/50 transition-colors">
                               {t.topic.charAt(0)}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-white mb-0.5">{t.topic}</p>
                               <p className="text-[10px] text-[#5a5a6e] font-semibold uppercase">Last: {new Date(t.lastAttempt).toLocaleDateString()}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-center text-sm font-medium text-[#8a8a9a]">{t.attempts}</td>
                         <td className="px-8 py-6 text-center text-sm font-bold text-white">{t.avgScore}%</td>
                         <td className="px-8 py-6 text-center">
                            <span className={`text-sm font-black ${t.accuracy >= 80 ? 'text-emerald-400' : t.accuracy >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {t.accuracy}%
                            </span>
                         </td>
                         <td className="px-8 py-6 w-[200px]">
                            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${t.accuracy}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="h-full rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                style={{ background: t.accuracy >= 80 ? '#10b981' : t.accuracy >= 50 ? '#f59e0b' : '#ef4444' }}
                              />
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                           <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold ${t.trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                             {t.trend >= 0 ? '▲' : '▼'} {Math.abs(Math.round(t.trend))}%
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
