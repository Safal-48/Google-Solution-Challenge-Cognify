import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThreeBackground from './ThreeBackground'
import { HiBars3BottomLeft, HiXMark } from 'react-icons/hi2'

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const isChat = pathname === '/chat'
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="h-screen flex overflow-hidden bg-[#08080f] relative">
      <ThreeBackground />
      
      {/* Mouse Glow Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-1 hidden lg:block"
        style={{
          background: `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, rgba(124, 58, 237, 0.08), transparent 80%)`
        }}
      />

      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-[60] p-3 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400"
      >
        <HiBars3BottomLeft className="w-6 h-6" />
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-[80] transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-6 right-6 z-[90] p-2 text-[#5a5a6e]"
        >
          <HiXMark className="w-6 h-6" />
        </button>
        <Sidebar />
      </div>

      <main className={`flex-1 overflow-y-auto relative z-10 ${isChat ? 'overflow-hidden' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
