import type { GraphQLResponse, NhostSession, NhostError } from '../types'

const NHOST_AUTH_URL = 'http://localhost:4000/v1'
const NHOST_GRAPHQL_URL = 'http://localhost:8080/v1/graphql'
const NHOST_STORAGE_URL = 'http://localhost:5005/v1'

interface AuthSignInResponse {
  session?: NhostSession
  error?: NhostError | null
}

interface AuthSignUpResponse {
  session?: NhostSession
  error?: NhostError | null
}

class NhostAuthClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async signInEmailPassword(email: string, password: string): Promise<{ session: NhostSession | null; error: NhostError | null }> {
    try {
      const res = await fetch(`${this.baseUrl}/signin/email-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) return { session: null, error: data }
      return { session: data.session, error: null }
    } catch (err) {
      return { session: null, error: { message: (err as Error).message } }
    }
  }

  async signUpEmailPassword(email: string, password: string, displayName: string): Promise<{ session: NhostSession | null; error: NhostError | null }> {
    try {
      const res = await fetch(`${this.baseUrl}/signup/email-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, options: { displayName } })
      })
      const data = await res.json()
      if (!res.ok) return { session: null, error: data }
      return { session: data.session, error: null }
    } catch (err) {
      return { session: null, error: { message: (err as Error).message } }
    }
  }

  async signOut(refreshToken: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/signout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
    } catch (err) {
      console.warn('Sign-out failed:', err)
    }
  }

  async refreshToken(refreshToken: string): Promise<NhostSession | null> {
    try {
      const res = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }
}

class NhostGraphqlClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async request<T = unknown>(
    { query, variables }: { query: string; variables?: Record<string, unknown> },
    accessToken: string | null = null,
    useAdminSecret: boolean = false
  ): Promise<GraphQLResponse<T>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (useAdminSecret) {
      headers['x-hasura-admin-secret'] = 'fastlane-admin-secret-2026'
    } else if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables })
      })
      const json = await res.json()
      return { data: json.data || null, error: json.errors || null }
    } catch (err) {
      return { data: null, error: [{ message: (err as Error).message }] }
    }
  }
}

interface UploadResult {
  id: string
  name: string
  size: number
  mimeType: string
}

class NhostStorageClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async upload(file: File, accessToken: string, bucketId = 'default'): Promise<{ data: UploadResult | null; error: NhostError | null }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucketId', bucketId)
    try {
      const res = await fetch(`${this.baseUrl}/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      })
      const json = await res.json()
      if (!res.ok) return { data: null, error: json.error || { message: 'Upload failed' } }
      return { data: json, error: null }
    } catch (err) {
      return { data: null, error: { message: (err as Error).message } }
    }
  }

  getSignedUrl(fileId: string, accessToken: string): string {
    return `${this.baseUrl}/files/${fileId}?token=${accessToken}`
  }

  async delete(fileId: string, accessToken: string): Promise<{ error: NhostError | null }> {
    try {
      const res = await fetch(`${this.baseUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) {
        const json = await res.json()
        return { error: json.error || { message: 'Delete failed' } }
      }
      return { error: null }
    } catch (err) {
      return { error: { message: (err as Error).message } }
    }
  }
}

const nhost = {
  auth: new NhostAuthClient(NHOST_AUTH_URL),
  graphql: new NhostGraphqlClient(NHOST_GRAPHQL_URL),
  storage: new NhostStorageClient(NHOST_STORAGE_URL),
  storageUrl: NHOST_STORAGE_URL,
}

export default nhost
