import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import nhost from '../lib/nhost'
import type {
  NhostUser, NhostSession, NhostError, UserProfile,
  ClientMembership, Client, Wallet, AuthContextValue
} from '../types'

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'fastlane_session'
const REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

interface StoredSession {
  accessToken: string
  refreshToken: string
  user: NhostUser
}

function saveSession(session: StoredSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface ProfileData {
  user_profiles: Array<UserProfile>
  client_members: Array<ClientMembership>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NhostUser | null>(null)
  const [profile, setProfile] = useState<(UserProfile & { clientMemberships: ClientMembership[] }) | null>(null)
  const [session, setSession] = useState<NhostSession | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProfile = useCallback(async (userId: string, accessToken: string) => {
    try {
      const { data } = await nhost.graphql.request<ProfileData>({
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
      }, accessToken, true)

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

  const handleSessionUpdate = useCallback((newSession: NhostSession) => {
    setSession(newSession)
    setUser(newSession.user)
    saveSession({
      accessToken: newSession.accessToken,
      refreshToken: newSession.refreshToken,
      user: newSession.user
    })
  }, [])

  // Token refresh
  const refreshToken = useCallback(async (refreshTokenValue: string) => {
    try {
      const newSession = await nhost.auth.refreshToken(refreshTokenValue)
      if (newSession) {
        handleSessionUpdate(newSession)
      } else {
        // Refresh failed - sign out
        setSession(null)
        setUser(null)
        setProfile(null)
        saveSession(null)
      }
    } catch {
      // Silent fail - user will be prompted on next API call
      console.warn('Token refresh failed')
    }
  }, [handleSessionUpdate])

  // Setup refresh interval when session exists
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    if (session?.refreshToken) {
      const scheduleRefresh = () => {
        refreshTimerRef.current = setTimeout(async () => {
          await refreshToken(session.refreshToken)
          scheduleRefresh()
        }, REFRESH_INTERVAL_MS)
      }
      scheduleRefresh()
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [session?.refreshToken, refreshToken])

  // Restore session on mount
  useEffect(() => {
    const stored = loadSession()
    if (stored?.accessToken && stored?.user) {
      const restoredSession: NhostSession = {
        accessToken: stored.accessToken,
        accessTokenExpiresIn: 0,
        refreshToken: stored.refreshToken,
        user: stored.user
      }
      setSession(restoredSession)
      setUser(stored.user)
      fetchProfile(stored.user.id, stored.accessToken)
    }
    setLoading(false)
  }, [fetchProfile])

  const signIn = async (email: string, password: string): Promise<{ error: NhostError | null }> => {
    const { session: newSession, error } = await nhost.auth.signInEmailPassword(email, password)
    if (error) return { error }
    if (newSession) {
      handleSessionUpdate(newSession)
      fetchProfile(newSession.user.id, newSession.accessToken)
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string, displayName: string): Promise<{ error: NhostError | null }> => {
    const { session: newSession, error } = await nhost.auth.signUpEmailPassword(email, password, displayName)
    if (error) return { error }
    if (newSession) {
      handleSessionUpdate(newSession)
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

  const isAdmin = profile?.platform_role
    ? ['super_admin', 'admin_ops', 'account_manager', 'sprint_manager', 'finance_admin'].includes(profile.platform_role)
    : false

  const isClient = profile?.platform_role
    ? ['client_owner', 'client_collaborator', 'prospect_sprint'].includes(profile.platform_role)
    : false

  const currentClient: Client | null = profile?.clientMemberships?.[0]?.client || null
  const currentWallet: Wallet | null = currentClient?.wallet || null

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
