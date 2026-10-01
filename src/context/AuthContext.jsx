import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { USERS } from '../data/seed'
import { getRoleInfo } from '../data/accessControl'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const STORAGE_KEY = 'bpk-dashboard-auth'
const USERS_KEY = 'bpk-dashboard-users'
const LAST_LOGIN_KEY = 'bpk-dashboard-last-login'

export function getRememberedLogin() {
  if (typeof window === 'undefined') return { username: '', password: '' }
  try {
    const raw = localStorage.getItem(LAST_LOGIN_KEY)
    if (!raw) return { username: '', password: '' }
    const parsed = JSON.parse(raw)
    return {
      username: typeof parsed.username === 'string' ? parsed.username : '',
      password: typeof parsed.password === 'string' ? parsed.password : ''
    }
  } catch {
    return { username: '', password: '' }
  }
}

function rememberLogin(username, password) {
  localStorage.setItem(
    LAST_LOGIN_KEY,
    JSON.stringify({
      username: username.trim(),
      password
    })
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSupabaseConfigured) {
      let active = true
      const loadSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (active) setUser(profile ? { ...profile, division: profile.division_id, email: session.user.email } : { id: session.user.id, email: session.user.email })
        }
        if (active) setLoading(false)
      }
      loadSession()
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session?.user) {
          if (active) setUser(null)
          return
        }
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (active) setUser(profile ? { ...profile, division: profile.division_id, email: session.user.email } : { id: session.user.id, email: session.user.email })
      })
      return () => {
        active = false
        listener.subscription.unsubscribe()
      }
    }

    const savedUsers = localStorage.getItem(USERS_KEY)
    setUsers(savedUsers ? JSON.parse(savedUsers) : USERS)

    const savedUser = localStorage.getItem(STORAGE_KEY)
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (users.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
  }, [users])

  const login = useCallback(
    async (username, password) => {
      if (isSupabaseConfigured) {
        const email = username.includes('@') ? username.trim() : `${username.trim()}@jembatan.local`
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error || !data.user) return { success: false, message: error?.message || 'Login gagal.' }
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        const safeUser = profile ? { ...profile, division: profile.division_id, email: data.user.email } : { id: data.user.id, email: data.user.email }
        rememberLogin(username, password)
        setUser(safeUser)
        return { success: true }
      }

      const found = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      )
      if (!found) {
        return { success: false, message: 'Invalid username or password.' }
      }
      const { password: _pw, ...safeUser } = found
      rememberLogin(username, password)
      setUser(safeUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser))
      return { success: true }
    },
    [users]
  )

  const logout = useCallback(() => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut()
      setUser(null)
      return
    }
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return
      if (isSupabaseConfigured) {
        const { data: updatedProfile, error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', user.id).select('*').single()
        if (error) throw error
        const updated = { ...updatedProfile, division: updatedProfile.division_id }
        setUser(updated)
        return updated
      }
      const updated = { ...user, ...updates }
      setUser(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updates } : u)))
    },
    [user]
  )

  const canAccessDivision = useCallback(
    (divisionId) => {
      return Boolean(user && divisionId)
    },
    [user]
  )

  const canUploadToDivision = useCallback(
    (divisionId) => {
      if (!user) return false
      return user.role === 'admin' || user.division === divisionId
    },
    [user]
  )

  const canUploadDocuments = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'employee'
  }, [user?.role])

  const canManageDocument = useCallback(
    (document) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return user.role === 'employee' && document.uploadedBy === user.name
    },
    [user]
  )

  const canReviewDocuments = useCallback(() => {
    return user?.role === 'admin'
  }, [user?.role])

  const value = {
    user,
    roleInfo: getRoleInfo(user?.role),
    users,
    loading,
    login,
    logout,
    updateProfile,
    canAccessDivision,
    canUploadToDivision,
    canUploadDocuments,
    canManageDocument,
    canReviewDocuments,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    isViewer: user?.role === 'viewer'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
