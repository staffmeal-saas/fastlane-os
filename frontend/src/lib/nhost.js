/**
 * Nhost Client — lightweight wrapper for Nhost Auth, GraphQL, and Storage APIs.
 * Compatible with self-hosted Nhost (Docker Compose) and @nhost/nhost-js v4.
 */

const NHOST_AUTH_URL = 'http://localhost:4000/v1'
const NHOST_GRAPHQL_URL = 'http://localhost:8080/v1/graphql'
const NHOST_STORAGE_URL = 'http://localhost:5005/v1'

class NhostAuthClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async signInEmailPassword(email, password) {
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
      return { session: null, error: { message: err.message } }
    }
  }

  async signUpEmailPassword(email, password, displayName) {
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
      return { session: null, error: { message: err.message } }
    }
  }

  async signOut(refreshToken) {
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

  async refreshToken(refreshToken) {
    try {
      const res = await fetch(`${this.baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      if (!res.ok) return null
      return await res.json()
    } catch (err) {
      return null
    }
  }
}

class NhostGraphqlClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
  }

  async request({ query, variables = {} }, accessToken = null) {
    const headers = { 'Content-Type': 'application/json' }
    if (accessToken) {
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
      return { data: null, error: [{ message: err.message }] }
    }
  }
}

const nhost = {
  auth: new NhostAuthClient(NHOST_AUTH_URL),
  graphql: new NhostGraphqlClient(NHOST_GRAPHQL_URL),
  storageUrl: NHOST_STORAGE_URL,
}

export default nhost
