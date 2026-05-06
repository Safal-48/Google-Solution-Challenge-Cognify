import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThreeBackground from './ThreeBackground'

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const isChat = pathname === '/chat'
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="h-screen flex overflow-hidden bg-[#08080f] relative">
      <ThreeBackground />
      
      {/* Mouse Glow Effect */}
      <div 
        className="pointer-events-none fixed inset-0 z-1"
        style={{
          background: `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, rgba(124, 58, 237, 0.08), transparent 80%)`
        }}
      />

      <Sidebar />
      <main className={`flex-1 overflow-y-auto relative z-10 ${isChat ? 'overflow-hidden' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
