import { motion } from 'framer-motion'

export default function Logo({ className = "", size = "md", onClick }: { className?: string, size?: "sm" | "md" | "lg" | "xl", onClick?: () => void }) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16"
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <svg 
        viewBox="0 0 240 60" 
        className={sizes[size]} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cognify Text */}
        <text 
          x="0" 
          y="45" 
          fontFamily="Inter, sans-serif" 
          fontWeight="900" 
          fontSize="48" 
          fill="white"
          letterSpacing="-0.05em"
        >
          C
        </text>
        
        {/* The "o" Toggle Icon */}
        <rect 
          x="35" 
          y="15" 
          width="45" 
          height="24" 
          rx="12" 
          fill="white" 
          fillOpacity="0.1"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <motion.circle 
          cx="62" 
          cy="27" 
          r="8" 
          fill="#7c3aed"
          animate={{ cx: [45, 62, 45] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="62" cy="27" r="10" stroke="#7c3aed" strokeOpacity="0.3" strokeWidth="2" />

        <text 
          x="88" 
          y="45" 
          fontFamily="Inter, sans-serif" 
          fontWeight="900" 
          fontSize="48" 
          fill="white"
          letterSpacing="-0.05em"
        >
          gnify
        </text>
        
        {/* Glow effect for the dot */}
        <defs>
          <filter id="glow" x="0" y="0" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
    </motion.div>
  )
}
