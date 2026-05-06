import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

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

export default function CtaSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="cta-section" id="cta" ref={ref}>
      <div className="cta-content">
        <motion.h2
          className="cta-title"
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          custom={0}
        >
          Ready to transform how you learn?
        </motion.h2>

        <motion.p
          className="cta-subtitle"
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          custom={0.1}
        >
          Join thousands of students already using Cognify to study smarter.
          Start for free — no credit card required.
        </motion.p>

        <motion.div
          className="hero-cta-group"
          variants={fadeUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          custom={0.2}
        >
          <motion.a
            href="#"
            className="btn btn-primary"
            id="cta-get-started-btn"
            whileHover={{ scale: 1.05, boxShadow: '0 12px 50px rgba(124, 58, 237, 0.5)' }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started Free
            <span className="btn-icon">→</span>
          </motion.a>
          <motion.a
            href="#"
            className="btn btn-secondary"
            id="cta-demo-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Watch Demo
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
