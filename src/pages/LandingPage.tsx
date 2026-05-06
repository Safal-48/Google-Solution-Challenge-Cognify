import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import ThreeBackground from '../components/ThreeBackground'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#08080f] selection:bg-violet-500/30 text-white overflow-hidden flex flex-col items-center justify-center relative">
      <ThreeBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center px-6"
      >
        <div className="flex justify-center mb-12">
          <Logo size="lg" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
          Learn <span className="gradient-text">Smarter</span>.
        </h1>
        
        <p className="text-lg md:text-xl text-[#8a8a9a] max-w-2xl mx-auto mb-10 font-medium">
          The AI-powered platform for modern students. Notes, Quizzes, and personalized tutoring.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/auth')}
            className="px-10 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-black uppercase tracking-widest transition-all shadow-xl"
          >
            Get Started Free
          </button>
          <button 
            onClick={() => navigate('/auth')}
            className="px-10 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-black uppercase tracking-widest transition-all"
          >
            Log In
          </button>
        </div>
      </motion.div>

      <footer className="absolute bottom-8 left-0 right-0 text-center text-[#5a5a6e] text-[10px] font-bold uppercase tracking-widest">
        © 2026 Cognify AI Platform
      </footer>
    </div>
  )
}
