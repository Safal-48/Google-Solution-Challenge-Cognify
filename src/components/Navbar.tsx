import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar-inner">
        {/* Logo */}
        <a href="#" className="navbar-logo" id="navbar-logo">
          <div className="navbar-logo-icon">C</div>
          <span className="navbar-logo-text">Cognify</span>
        </a>

        {/* Nav links */}
        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#docs">Docs</a></li>
        </ul>

        {/* CTA */}
        <div className="navbar-cta">
          <motion.a
            href="#"
            className="btn btn-secondary btn-sm"
            id="navbar-login-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Log in
          </motion.a>
          <motion.a
            href="#"
            className="btn btn-primary btn-sm"
            id="navbar-signup-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Sign up
          </motion.a>
        </div>
      </div>
    </motion.nav>
  )
}
