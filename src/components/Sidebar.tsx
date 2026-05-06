import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineLightBulb,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChartBar,
  HiOutlineAcademicCap,
  HiOutlineArrowRightOnRectangle,
  HiOutlineSparkles,
  HiOutlineBeaker,
  HiChevronRight
} from 'react-icons/hi2'
import Logo from './Logo'

const studentLinks = [
  { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/notes', icon: HiOutlineDocumentText, label: 'AI Notes' },
  { to: '/quiz', icon: HiOutlineLightBulb, label: 'Quiz' },
  { to: '/chat', icon: HiOutlineChatBubbleLeftRight, label: 'AI Chat' },
  { to: '/progress', icon: HiOutlineChartBar, label: 'Progress' },
  { to: '/recommendations', icon: HiOutlineBeaker, label: 'Recommendations' },
]

const teacherLinks = [
  { to: '/dashboard', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/teacher', icon: HiOutlineAcademicCap, label: 'Teacher Mode' },
  { to: '/notes', icon: HiOutlineDocumentText, label: 'AI Notes' },
  { to: '/chat', icon: HiOutlineChatBubbleLeftRight, label: 'AI Chat' },
]

export default function Sidebar() {
  const { user, logout, userRole, setUserRole } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const links = userRole === 'teacher' ? teacherLinks : studentLinks
  const isChat = pathname === '/chat'

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, mass: 1 }}
      className="w-64 h-screen z-50 flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#08080f]/90 backdrop-blur-2xl shrink-0"
    >
      {/* Brand Section */}
      <div className="p-8 mb-2">
        <Logo size="md" className="cursor-pointer" onClick={() => navigate('/dashboard')} />
      </div>

      {/* Progress Card */}
      {user && (
        <div className="px-6 mb-8">
          <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/10 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-600/20">
                    <HiOutlineSparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Level {user.level}</span>
                </div>
                <span className="text-[10px] font-bold text-[#5a5a6e]">{user.xp} XP</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(user.xp % 500) / 5}%` }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                  className="h-full rounded-full btn-gradient shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                />
              </div>
              <p className="text-[9px] font-bold text-[#5a5a6e] uppercase tracking-tighter text-right">
                {500 - (user.xp % 500)} XP to next level
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Role Switcher */}
      <div className="px-6 mb-6">
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
          <button
            onClick={() => setUserRole('student')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border-none cursor-pointer
              ${userRole === 'student' ? 'bg-violet-600 text-white shadow-lg' : 'bg-transparent text-[#5a5a6e] hover:text-[#8a8a9a]'}`}
          >Student</button>
          <button
            onClick={() => setUserRole('teacher')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border-none cursor-pointer
              ${userRole === 'teacher' ? 'bg-violet-600 text-white shadow-lg' : 'bg-transparent text-[#5a5a6e] hover:text-[#8a8a9a]'}`}
          >Teacher</button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all relative group
               ${isActive
                 ? 'bg-violet-600/10 text-white border border-violet-500/20'
                 : 'text-[#8a8a9a] hover:text-white hover:bg-white/5 border border-transparent'
               }`
            }
          >
            <div className="flex items-center gap-4">
              <link.icon className={`w-5 h-5 transition-colors duration-300 ${pathname === link.to ? 'text-violet-400' : 'group-hover:text-white'}`} />
              <span className="tracking-tight">{link.label}</span>
            </div>
            {pathname === link.to && (
               <motion.div layoutId="sidebar-active-indicator">
                 <HiChevronRight className="w-4 h-4 text-violet-500" />
               </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-6 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-4 mb-5 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm font-black text-white shrink-0 shadow-xl group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'Guest User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className={`w-1.5 h-1.5 rounded-full ${user?.authMode === 'jwt' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-blue-400'}`} />
               <p className="text-[10px] font-bold text-[#5a5a6e] uppercase tracking-widest">{user?.authMode === 'jwt' ? 'Verified' : 'Google Auth'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-[#5a5a6e] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer bg-transparent"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
          Logout System
        </button>
      </div>
    </motion.aside>
  )
}
