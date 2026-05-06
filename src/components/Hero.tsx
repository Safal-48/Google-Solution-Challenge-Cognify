import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

const stats = [
  { value: '10K+', label: 'Students' },
  { value: '95%', label: 'Accuracy' },
  { value: '4.9★', label: 'Rating' },
]

export default function Hero() {
  return (
    <section className="hero-section" id="hero">
      {/* Background effects */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg-orb hero-bg-orb--1" />
        <div className="hero-bg-orb hero-bg-orb--2" />
        <div className="hero-bg-orb hero-bg-orb--3" />
        <div className="hero-grid" />
      </div>

      {/* Content */}
      <div className="hero-content">
        {/* Badge */}
        <motion.div
          className="hero-badge"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <span className="hero-badge-dot" />
          Powered by Google Gemini AI
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="hero-headline"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
        >
          Learn Smarter.<br />
          Learn Better.<br />
          <span className="hero-headline-gradient">With AI.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="hero-subtext"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          Cognify uses advanced AI to generate personalized notes, adaptive quizzes,
          and intelligent tutoring — so you can study smarter, not harder.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="hero-cta-group"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
        >
          <motion.a
            href="#"
            className="btn btn-primary"
            id="hero-get-started-btn"
            whileHover={{ scale: 1.05, boxShadow: '0 12px 50px rgba(124, 58, 237, 0.5)' }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started
            <span className="btn-icon">→</span>
          </motion.a>

          <motion.a
            href="#"
            className="btn btn-secondary"
            id="hero-try-demo-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="btn-icon">✦</span>
            Try AI Demo
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="hero-stats"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.45}
        >
          {stats.map((stat) => (
            <div className="hero-stat" key={stat.label}>
              <span className="hero-stat-value">{stat.value}</span>
              <span className="hero-stat-label">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
