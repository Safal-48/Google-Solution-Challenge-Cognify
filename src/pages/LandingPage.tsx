import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { 
  HiOutlineSparkles, 
  HiOutlineBolt, 
  HiOutlineAcademicCap, 
  HiOutlineChartBar,
  HiChevronRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBeaker
} from 'react-icons/hi2'
import Logo from '../components/Logo'
import ThreeBackground from '../components/ThreeBackground'

const fadeUp: any = (d = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: d, ease: [0.16, 1, 0.3, 1] } }
})

function FeatureCard({ icon: Icon, title, desc, delay }: any) {
  return (
    <motion.div
      variants={fadeUp(delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
      className="p-8 rounded-[2.5rem] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] backdrop-blur-xl group cursor-default gradient-border"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/10 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-7 h-7 text-violet-400 group-hover:text-white transition-colors" />
      </div>
      <h3 className="text-xl font-black text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-[#8a8a9a] leading-relaxed text-sm font-medium">{desc}</p>
    </motion.div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const targetRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: targetRef })
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div className="min-h-screen bg-[#08080f] selection:bg-violet-500/30 selection:text-white overflow-hidden">
      
      {/* ── 3D Background ── */}
      {/* <ThreeBackground /> */}
      <div className="fixed inset-0 z-0 bg-[#08080f]" />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-8 px-8 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl pointer-events-auto shadow-2xl"
        >
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="sm" />
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-[#8a8a9a] uppercase tracking-widest">
             <a href="#features" className="hover:text-white transition-colors">Features</a>
             <a href="#about" className="hover:text-white transition-colors">Intelligent Learning</a>
          </div>
          <button onClick={() => navigate('/auth')} className="px-5 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-[#d0d0d0] transition-all">
            Get Started
          </button>
        </motion.div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto text-center min-h-[90vh] flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/10 border border-violet-500/20 text-[10px] font-black text-violet-400 tracking-[0.2em] uppercase mb-10"
        >
          <HiOutlineSparkles className="w-3 h-3" /> Future of Education is AI
        </motion.div>

        <motion.h1 
          variants={fadeUp(0.1)}
          initial="hidden"
          animate="visible"
          className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 text-glow"
        >
          Learn <span className="gradient-text">Smarter</span>.<br />
          Not Harder.
        </motion.h1>

        <motion.p 
          variants={fadeUp(0.2)}
          initial="hidden"
          animate="visible"
          className="text-lg md:text-xl text-[#8a8a9a] max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
        >
          Harness the power of AI to generate notes, quizzes, and personalized learning paths.
          The all-in-one platform for modern students.
        </motion.p>

        <motion.div 
          variants={fadeUp(0.3)}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full max-w-md mx-auto"
        >
          <button 
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-[0_20px_40px_rgba(124,58,237,0.3)] flex items-center justify-center gap-3 group"
          >
            Start Learning Free <HiChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest transition-all">
            See Demo
          </button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 relative max-w-5xl mx-auto rounded-[3rem] p-4 bg-white/5 border border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden"
        >
           <div className="absolute inset-0 bg-gradient-to-t from-[#08080f] to-transparent z-10 pointer-events-none" />
           <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
            alt="Dashboard Preview" 
            className="rounded-[2.5rem] w-full object-cover opacity-60 mix-blend-overlay scale-110 grayscale"
           />
        </motion.div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Powerful AI Modules</h2>
          <p className="text-[#8a8a9a] text-lg font-medium">Everything you need to master any subject in record time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={HiOutlineBolt} 
            title="Instant AI Notes" 
            desc="Generate structured, detailed study notes for any topic in English or Hindi instantly." 
            delay={0.1}
          />
          <FeatureCard 
            icon={HiOutlineBeaker} 
            title="Adaptive Quizzes" 
            desc="Test your knowledge with AI-generated quizzes that adapt to your mastery level." 
            delay={0.2}
          />
          <FeatureCard 
            icon={HiOutlineChatBubbleLeftRight} 
            title="24/7 AI Tutor" 
            desc="Ask complex questions and get human-like explanations from our specialized AI models." 
            delay={0.3}
          />
          <FeatureCard 
            icon={HiOutlineChartBar} 
            title="Deep Analytics" 
            desc="Track your progress with activity heatmaps, skill radars, and trend analysis." 
            delay={0.4}
          />
          <FeatureCard 
            icon={HiOutlineSparkles} 
            title="Smart Recs" 
            desc="Get daily study plans and topic suggestions based on your weak areas." 
            delay={0.5}
          />
          <FeatureCard 
            icon={HiOutlineAcademicCap} 
            title="Teacher Mode" 
            desc="Advanced tools for educators to generate content and monitor student growth." 
            delay={0.6}
          />
        </div>
      </section>

      {/* ── Stats CTA ── */}
      <section className="relative z-10 py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto rounded-[3.5rem] p-12 lg:p-20 bg-gradient-to-br from-violet-600 to-blue-700 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 max-w-4xl mx-auto">
              Ready to revolutionize your learning experience?
            </h2>
            <button 
              onClick={() => navigate('/auth')}
              className="px-12 py-6 rounded-2xl bg-white text-black font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
            >
              Join 10,000+ Students
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Logo size="md" />
        </div>
        <p className="text-[#5a5a6e] text-xs font-bold uppercase tracking-[0.2em]">© 2026 Cognify AI Platform. Built for Excellence.</p>
      </footer>
    </div>
  )
}
