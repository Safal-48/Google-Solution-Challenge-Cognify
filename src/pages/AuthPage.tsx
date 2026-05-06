import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import ThreeBackground from '../components/ThreeBackground'

// ─── Validation ────────────────────────────────────────────────────────────
interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

function validateForm(
  isLogin: boolean,
  name: string,
  email: string,
  password: string,
  confirm: string
): FormErrors {
  const errors: FormErrors = {}

  if (!isLogin && name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!emailRegex.test(email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  } else if (!/\d/.test(password)) {
    errors.password = 'Password must contain at least one number'
  }

  if (!isLogin && password !== confirm) {
    errors.confirm = 'Passwords do not match'
  }

  return errors
}

// ─── Strength Indicator ────────────────────────────────────────────────────
function getPasswordStrength(pw: string) {
  if (!pw) return { label: '', color: '', width: '0%' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/\d/.test(pw)) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: '#f43f5e', width: '25%' }
  if (score <= 2) return { label: 'Fair', color: '#f59e0b', width: '50%' }
  if (score <= 3) return { label: 'Good', color: '#3b82f6', width: '75%' }
  return { label: 'Strong', color: '#34d399', width: '100%' }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { login, signup, loginWithGoogle, serverOnline } = useAuth()
  const navigate = useNavigate()

  const strength = getPasswordStrength(password)

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setConfirm('')
    setFieldErrors({}); setServerError('')
  }

  const switchMode = (toLogin: boolean) => {
    setIsLogin(toLogin)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    // Client-side validation
    const errors = validateForm(isLogin, name, email, password, confirm)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await signup(name, email, password)
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setServerError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      // Note: Redirect will happen, so navigate might not be needed immediately
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed'
      setServerError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim())
      setGoogleLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setEmail('testuser@chatverse.com')
    setPassword('password')
    setServerError('')
    setLoading(true)
    try {
      await login('testuser@chatverse.com', 'password')
      navigate('/dashboard')
    } catch (err: unknown) {
      setServerError('Demo account not found. Please Sign Up instead.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = `w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#5a5a6e]
    border bg-[rgba(255,255,255,0.04)] transition-all outline-none`
  const inputNormal = `${inputBase} border-[rgba(255,255,255,0.08)] focus:border-[rgba(124,58,237,0.5)] focus:ring-1 focus:ring-[rgba(124,58,237,0.2)]`
  const inputError = `${inputBase} border-[rgba(244,63,94,0.5)] focus:border-[rgba(244,63,94,0.7)]`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#08080f]">
      <ThreeBackground />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <a href="/" className="inline-flex flex-col items-center gap-2.5 mb-5 no-underline group">
            <Logo size="lg" />
          </a>
          <p className="text-sm text-[#8a8a9a]">
            {isLogin ? 'Welcome back! Sign in to continue learning.' : 'Create your account and start learning smarter.'}
          </p>
        </div>

        {/* Server status banner */}
        <AnimatePresence>
          {!serverOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2"
            >
              <span className="text-amber-400 text-sm">⚠️</span>
              <p className="text-xs text-amber-300">
                Backend server offline. Start the server to use email/password auth. Google Sign-In still works.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-[rgba(255,255,255,0.08)]"
          style={{ background: 'rgba(14,14,26,0.85)', backdropFilter: 'blur(20px)' }}>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] mb-6">
            {[{ label: 'Sign In', login: true }, { label: 'Sign Up', login: false }].map((tab) => (
              <button
                key={tab.label}
                onClick={() => switchMode(tab.login)}
                className={`flex-1 py-2.5 text-sm font-medium transition-all cursor-pointer border-none
                  ${isLogin === tab.login
                    ? 'bg-[rgba(124,58,237,0.2)] text-[#a78bfa]'
                    : 'bg-transparent text-[#5a5a6e] hover:text-[#8a8a9a]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Google Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl text-sm font-medium text-white cursor-pointer
              border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]
              hover:bg-[rgba(255,255,255,0.07)] transition-all flex items-center justify-center gap-3 mb-5
              disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white thinking-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-white thinking-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-white thinking-dot" />
              </span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>

          <div className="flex items-center gap-3 mb-5">
            <span className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
            <span className="text-xs text-[#5a5a6e]">or with email</span>
            <span className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name field (signup only) */}
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })) }}
                      className={fieldErrors.name ? inputError : inputNormal}
                      autoComplete="name"
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.name}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
                className={fieldErrors.email ? inputError : inputNormal}
                autoComplete="email"
                disabled={!serverOnline && isLogin}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                  className={`${fieldErrors.password ? inputError : inputNormal} pr-12`}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={!serverOnline && isLogin}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a6e] hover:text-[#8a8a9a] transition-colors cursor-pointer bg-transparent border-none text-lg"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.password}</p>
              )}
              {/* Password strength bar (signup only) */}
              {!isLogin && password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#5a5a6e]">Password strength</span>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-[rgba(255,255,255,0.06)]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: strength.color }}
                      initial={{ width: 0 }}
                      animate={{ width: strength.width }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password (signup only) */}
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="confirm-field"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })) }}
                      className={fieldErrors.confirm ? inputError : inputNormal}
                      autoComplete="new-password"
                    />
                    {fieldErrors.confirm && (
                      <p className="text-xs text-red-400 mt-1 ml-1">{fieldErrors.confirm}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <span className="text-red-400 text-sm shrink-0">⚠</span>
                  <p className="text-xs text-red-300">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Server offline notice for email auth */}
            {!serverOnline && isLogin && (
              <p className="text-xs text-[#5a5a6e] text-center">
                Start the backend server to use email/password login.
              </p>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || (!serverOnline && isLogin)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white btn-gradient
                cursor-pointer border-none disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white thinking-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white thinking-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white thinking-dot" />
                  </span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? '→  Sign In' : '✦  Create Account'
              )}
            </motion.button>

            {/* Quick Demo Button */}
            {isLogin && serverOnline && (
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full mt-4 py-2 text-[10px] font-black text-[#a78bfa] uppercase tracking-widest hover:text-white transition-all cursor-pointer border border-[rgba(124,58,237,0.2)] rounded-xl bg-[rgba(124,58,237,0.05)]"
              >
                🚀 Quick Demo Account
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-[#5a5a6e] mt-6">
          <a href="/" className="hover:text-[#8a8a9a] transition-colors no-underline">← Back to home</a>
        </p>
      </motion.div>
    </div>
  )
}
