import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  authAPI,
  tokenStorage,
  userStorage,
  type JWTUser,
  checkServerHealth,
} from '../services/api'

// ─── Types ─────────────────────────────────────────────────────────────────
export type AuthMode = 'jwt' | 'google'

export interface CognifyUser {
  uid: string
  name: string
  email: string
  role: 'student' | 'teacher'
  xp: number
  level: number
  streak: number
  badges: Array<{ id: string; name: string; icon: string; earnedAt?: string }>
  onboardingComplete: boolean
  authMode: AuthMode
}

interface AuthContextType {
  user: CognifyUser | null
  loading: boolean
  serverOnline: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  userRole: 'student' | 'teacher'
  setUserRole: (role: 'student' | 'teacher') => void
  refreshUser: () => Promise<void>
}

// ─── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function jwtUserToCognify(u: JWTUser): CognifyUser {
  return {
    uid: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    xp: u.xp ?? 0,
    level: u.level ?? 1,
    streak: u.streak ?? 0,
    badges: u.badges ?? [],
    onboardingComplete: u.onboardingComplete ?? false,
    authMode: 'jwt',
  }
}

function firebaseUserToCognify(u: FirebaseUser): CognifyUser {
  return {
    uid: u.uid,
    name: u.displayName || 'User',
    email: u.email || '',
    role: 'student',
    xp: 0,
    level: 1,
    streak: 0,
    badges: [],
    onboardingComplete: false,
    authMode: 'google',
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CognifyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [serverOnline, setServerOnline] = useState(false)
  const [userRole, setUserRoleState] = useState<'student' | 'teacher'>('student')

  // Check server health on mount
  useEffect(() => {
    checkServerHealth().then(setServerOnline)
  }, [])

  // ── Restore JWT session on mount ──────────────────────────────────────
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    // Handle Google Redirect Result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const cognifyUser = firebaseUserToCognify(result.user)
          setUser(cognifyUser)
          setUserRoleState('student')
        }
      })
      .catch((err) => console.error('Google Redirect Error:', err))

    const token = tokenStorage.get()
    const stored = userStorage.get()

    if (token && stored) {
      // Optimistically restore user from storage
      const cognifyUser = jwtUserToCognify(stored as JWTUser)
      setUser(cognifyUser)
      setUserRoleState(cognifyUser.role)

      // Validate token with server in background
      authAPI.getMe()
        .then(({ user: freshUser }) => {
          const updated = jwtUserToCognify(freshUser)
          setUser(updated)
          setUserRoleState(updated.role)
          userStorage.set(freshUser)
        })
        .catch(() => {
          tokenStorage.remove()
          userStorage.remove()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else if (auth) {
      // No JWT — listen for Firebase Google session
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const cognifyUser = firebaseUserToCognify(firebaseUser)
          setUser(cognifyUser)
          setUserRoleState('student')
        } else {
          setUser(null)
        }
        setLoading(false)
      })
      return () => unsubscribe()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── JWT Login ─────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const { user: jwtUser } = await authAPI.login(email, password)
    const cognifyUser = jwtUserToCognify(jwtUser)
    setUser(cognifyUser)
    setUserRoleState(cognifyUser.role)
  }

  // ── JWT Register ──────────────────────────────────────────────────────
  const signup = async (name: string, email: string, password: string) => {
    const { user: jwtUser } = await authAPI.register(name, email, password)
    const cognifyUser = jwtUserToCognify(jwtUser)
    setUser(cognifyUser)
    setUserRoleState(cognifyUser.role)
  }

  // ── Google OAuth (Firebase) ───────────────────────────────────────────
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    // Use Redirect instead of Popup for better reliability on localhost/mobile
    return signInWithRedirect(auth, provider)
  }

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = async () => {
    if (user?.authMode === 'jwt') {
      await authAPI.logout()
    } else {
      await signOut(auth)
    }
    tokenStorage.remove()
    userStorage.remove()
    setUser(null)
  }

  // ── Refresh User from Server ──────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (user?.authMode !== 'jwt') return
    try {
      const { user: fresh } = await authAPI.getMe()
      const updated = jwtUserToCognify(fresh)
      setUser(updated)
      setUserRoleState(updated.role)
      userStorage.set(fresh)
    } catch {
      // Silently fail
    }
  }, [user?.authMode])

  // ── Role Setter ───────────────────────────────────────────────────────
  const setUserRole = (role: 'student' | 'teacher') => {
    setUserRoleState(role)
    if (user) setUser({ ...user, role })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        serverOnline,
        login,
        signup,
        loginWithGoogle,
        logout,
        userRole,
        setUserRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
