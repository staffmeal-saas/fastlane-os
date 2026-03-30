import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import nhost from '../lib/nhost'

const AuthContext = createContext(null)

const SESSION_KEY = 'fastlane_session'

function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId, accessToken) => {
    try {
      const { data } = await nhost.graphql.request({
        query: `
          query GetUserProfile($userId: uuid!) {
            user_profiles(where: { user_id: { _eq: $userId } }) {
              id
              platform_role
              display_name
              phone
              avatar_url
            }
            client_members(where: { user_id: { _eq: $userId } }) {
              client_id
              role
              client {
                id
                name
                status
                offer {
                  name
                  is_sprint
                }
                wallet {
                  id
                  balance
                  reserved
                  carried_over
                }
              }
            }
          }
        `,
        variables: { userId }
      }, accessToken)

      if (data?.user_profiles?.[0]) {
        setProfile({
          ...data.user_profiles[0],
          clientMemberships: data.client_members || []
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }, [])

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = loadSession()
    if (stored?.accessToken && stored?.user) {
      setSession(stored)
      setUser(stored.user)
      fetchProfile(stored.user.id, stored.accessToken)
    }
    setLoading(false)
  }, [fetchProfile])

  const signIn = async (email, password) => {
    const { session: newSession, error } = await nhost.auth.signInEmailPassword(email, password)
    if (error) return { error }
    if (newSession) {
      setSession(newSession)
      setUser(newSession.user)
      saveSession(newSession)
      fetchProfile(newSession.user.id, newSession.accessToken)
    }
    return { error: null }
  }

  const signUp = async (email, password, displayName) => {
    const { session: newSession, error } = await nhost.auth.signUpEmailPassword(email, password, displayName)
    if (error) return { error }
    if (newSession) {
      setSession(newSession)
      setUser(newSession.user)
      saveSession(newSession)
    }
    return { error: null }
  }

  const signOut = async () => {
    if (session?.refreshToken) {
      await nhost.auth.signOut(session.refreshToken)
    }
    setUser(null)
    setProfile(null)
    setSession(null)
    saveSession(null)
  }

  const isAdmin = profile?.platform_role &&
    ['super_admin', 'admin_ops', 'account_manager', 'sprint_manager', 'finance_admin'].includes(profile.platform_role)

  const isClient = profile?.platform_role &&
    ['client_owner', 'client_collaborator', 'prospect_sprint'].includes(profile.platform_role)

  const currentClient = profile?.clientMemberships?.[0]?.client || null
  const currentWallet = currentClient?.wallet || null

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isClient,
      currentClient,
      currentWallet,
      nhost
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
