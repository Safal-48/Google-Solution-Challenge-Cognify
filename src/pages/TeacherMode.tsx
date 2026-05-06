import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateFeedback } from '../services/gemini'
import ReactMarkdown from 'react-markdown'
import { Skeleton } from '../components/Skeleton'
import Logo from '../components/Logo'
import { HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineBolt, HiOutlineSparkles } from 'react-icons/hi2'

const fadeUp: any = (delay: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } },
})

const students = [
  { name: 'Aarav Sharma', scores: [85, 92, 78, 95], topics: ['Physics', 'Biology', 'History', 'CS'], avg: 88, color: 'from-violet-500 to-purple-600' },
  { name: 'Priya Patel', scores: [72, 68, 80, 75], topics: ['Math', 'Chemistry', 'English', 'Geography'], avg: 74, color: 'from-blue-500 to-cyan-600' },
  { name: 'Rahul Kumar', scores: [95, 90, 88, 92], topics: ['Physics', 'Math', 'CS', 'Biology'], avg: 91, color: 'from-emerald-500 to-teal-600' },
  { name: 'Sneha Gupta', scores: [60, 65, 70, 72], topics: ['History', 'Geography', 'English', 'Hindi'], avg: 67, color: 'from-rose-500 to-orange-600' },
]

export default function TeacherMode() {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFeedback = async (idx: number) => {
    setSelectedStudent(idx)
    setFeedback('')
    setLoading(true)
    const s = students[idx]
    try {
      const result = await generateFeedback(s.name, s.scores, s.topics)
      setFeedback(result)
    } catch {
      setFeedback('Could not generate feedback. Please check your API key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-10 max-w-[1200px] mx-auto space-y-12">
      <motion.div variants={fadeUp(0)} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-2">
           <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-400 tracking-widest uppercase">Admin Dashboard</div>
           <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Monitoring
           </div>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
          <HiOutlineAcademicCap className="w-10 h-10 text-violet-500" /> Educator Intelligence
        </h1>
        <p className="text-[#8a8a9a] mt-2 text-lg font-medium">Monitor student growth and generate automated performance reports.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Student List */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-[10px] font-black text-[#5a5a6e] uppercase tracking-widest px-2 flex items-center gap-2">
            <HiOutlineUserGroup className="w-4 h-4" /> Active Cohort
          </h2>
          <div className="space-y-4">
            {students.map((s, i) => (
              <motion.div 
                key={s.name}
                variants={fadeUp(0.05 * (i + 1))}
                initial="hidden" animate="visible"
                whileHover={{ x: 8, scale: 1.01 }}
                onClick={() => handleFeedback(i)}
                className={`group rounded-3xl p-6 cursor-pointer border transition-all duration-300 relative overflow-hidden
                  ${selectedStudent === i
                    ? 'border-violet-500/30 bg-violet-500/10 shadow-[0_0_30px_rgba(124,58,237,0.15)]'
                    : 'border-white/5 bg-white/5 hover:bg-white/[0.08]'}`}
              >
                {selectedStudent === i && (
                  <motion.div layoutId="active-glow" className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-transparent pointer-events-none" />
                )}
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-sm font-black text-white shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    {s.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-white group-hover:text-violet-300 transition-colors">{s.name}</h3>
                    <p className="text-xs font-bold text-[#5a5a6e] uppercase tracking-tighter mt-0.5">{s.topics.length} Subjects Active</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-black ${s.avg >= 85 ? 'text-emerald-400' : s.avg >= 70 ? 'text-blue-400' : 'text-amber-400'}`}>
                      {s.avg}%
                    </div>
                    <p className="text-[10px] font-bold text-[#5a5a6e] uppercase tracking-widest">Mastery</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Feedback Engine */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedStudent === null ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 rounded-[2.5rem] bg-white/5 border border-dashed border-white/10"
              >
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-4xl mb-6">🔍</div>
                <h3 className="text-xl font-black text-white mb-2">Select a Student</h3>
                <p className="text-[#5a5a6e] text-center max-w-sm">Pick a student from the cohort to generate an AI-powered diagnostic report and study plan.</p>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedStudent}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Score Breakdown Card */}
                <div className="rounded-[2.5rem] p-8 bg-white/5 border border-white/10">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                       <HiOutlineBolt className="text-amber-400" /> Score Breakdown
                     </h3>
                     <span className="text-xs font-black text-[#5a5a6e] uppercase tracking-widest">Diagnostic Report</span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {students[selectedStudent].topics.map((topic, j) => (
                       <div key={topic} className="space-y-2">
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-black text-[#8a8a9a] uppercase tracking-tighter">{topic}</span>
                           <span className="text-sm font-black text-white">{students[selectedStudent].scores[j]}%</span>
                         </div>
                         <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                           <motion.div
                             initial={{ width: 0 }}
                             animate={{ width: `${students[selectedStudent].scores[j]}%` }}
                             transition={{ duration: 1, ease: "easeOut" }}
                             className="h-full rounded-full"
                             style={{
                               background: students[selectedStudent].scores[j] >= 90 ? '#10b981' : students[selectedStudent].scores[j] >= 75 ? '#3b82f6' : '#f59e0b',
                               boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                             }}
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* AI Feedback Report */}
                <div className="rounded-[2.5rem] p-8 bg-[#11111e] border border-violet-500/20 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <HiOutlineSparkles className="w-32 h-32 text-violet-500" />
                   </div>
                   
                   <div className="flex items-center gap-3 mb-8 relative z-10">
                     <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/20">
                       <HiOutlineSparkles className="w-5 h-5 text-violet-400" />
                     </div>
                     <h3 className="text-xl font-black text-white">AI Diagnostic Feedback</h3>
                   </div>

                   <div className="relative z-10">
                     {loading ? (
                       <div className="space-y-4">
                         <Skeleton className="h-6 w-3/4" />
                         <Skeleton className="h-24 w-full" />
                         <Skeleton className="h-24 w-full" />
                       </div>
                     ) : (
                       <div className="markdown-content">
                         <ReactMarkdown>{feedback}</ReactMarkdown>
                       </div>
                     )}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
