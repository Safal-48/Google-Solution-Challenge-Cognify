import { Navigate, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Logo size="lg" />
          </motion.div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#7c3aed] thinking-dot" />
            <div className="w-2 h-2 rounded-full bg-[#3b82f6] thinking-dot" />
            <div className="w-2 h-2 rounded-full bg-[#06b6d4] thinking-dot" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
