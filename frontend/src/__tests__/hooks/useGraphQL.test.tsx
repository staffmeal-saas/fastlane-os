import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { useGraphQL, useLazyGraphQL } from '../../hooks/useGraphQL'
import AuthContext from '../../contexts/AuthContext'
import type { AuthContextValue } from '../../types'

// Mock nhost module
vi.mock('../../lib/nhost', () => ({
  default: {
    auth: {
      signInEmailPassword: vi.fn(),
      signUpEmailPassword: vi.fn(),
      signOut: vi.fn(),
      refreshToken: vi.fn(),
    },
    graphql: {
      request: vi.fn(),
    },
    storage: {
      upload: vi.fn(),
      getSignedUrl: vi.fn(() => 'http://localhost:5005/v1/files/test'),
      delete: vi.fn(),
    },
    storageUrl: 'http://localhost:5005/v1',
  }
}))

import nhost from '../../lib/nhost'

const mockAuthContext: AuthContextValue = {
  user: { id: 'test-user', email: 'test@test.com', displayName: 'Test', avatarUrl: '', locale: 'fr', defaultRole: 'user', roles: ['user'] },
  profile: null,
  session: {
    accessToken: 'test-access-token',
    accessTokenExpiresIn: 3600,
    refreshToken: 'test-refresh-token',
    user: { id: 'test-user', email: 'test@test.com', displayName: 'Test', avatarUrl: '', locale: 'fr', defaultRole: 'user', roles: ['user'] }
  },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  isAdmin: false,
  isClient: true,
  currentClient: null,
  currentWallet: null,
  nhost: nhost as unknown as AuthContextValue['nhost']
}

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={mockAuthContext}>
        {children}
      </AuthContext.Provider>
    )
  }
}

describe('useGraphQL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('returns loading=true initially', () => {
    vi.mocked(nhost.graphql.request).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useGraphQL({ query: 'query { test }' }), { wrapper: createWrapper() })
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('returns data on successful fetch', async () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: { test: 'hello' },
      error: null
    })
    const { result } = renderHook(() => useGraphQL({ query: 'query { test }' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ test: 'hello' })
    expect(result.current.error).toBe(null)
  })

  it('returns error on GraphQL error', async () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: null,
      error: [{ message: 'Something went wrong' }]
    })
    const { result } = renderHook(() => useGraphQL({ query: 'query { test }' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Something went wrong')
    expect(result.current.data).toBe(null)
  })

  it('returns error on network error', async () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: null,
      error: [{ message: 'Network error' }]
    })
    const { result } = renderHook(() => useGraphQL({ query: 'query { test }' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('does not fetch when skip=true', () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: { test: 'hello' },
      error: null
    })
    const { result } = renderHook(() => useGraphQL({ query: 'query { test }', skip: true }), { wrapper: createWrapper() })

    expect(result.current.loading).toBe(false)
    expect(nhost.graphql.request).not.toHaveBeenCalled()
  })

  it('provides refetch function that re-fetches data', async () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: { test: 'first' },
      error: null
    })
    const { result } = renderHook(() => useGraphQL({ query: 'query { test }' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.data).toEqual({ test: 'first' })
    })

    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: { test: 'second' },
      error: null
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toEqual({ test: 'second' })
  })
})

describe('useLazyGraphQL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('does not fetch on mount', () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: { result: true },
      error: null
    })
    const { result } = renderHook(() => useLazyGraphQL('mutation { test }'), { wrapper: createWrapper() })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(nhost.graphql.request).not.toHaveBeenCalled()
  })

  it('fetches on execute call', async () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: { insert_test_one: { id: '123' } },
      error: null
    })
    const { result } = renderHook(() => useLazyGraphQL('mutation($obj: test!) { insert_test_one(object: $obj) { id } }'), { wrapper: createWrapper() })

    let res: unknown
    await act(async () => {
      res = await result.current.execute({ obj: { name: 'test' } })
    })

    expect(res).toEqual({ insert_test_one: { id: '123' } })
    expect(result.current.data).toEqual({ insert_test_one: { id: '123' } })
    expect(result.current.loading).toBe(false)
  })

  it('returns null on error', async () => {
    vi.mocked(nhost.graphql.request).mockResolvedValue({
      data: null,
      error: [{ message: 'Mutation failed' }]
    })
    const { result } = renderHook(() => useLazyGraphQL('mutation { fail }'), { wrapper: createWrapper() })

    let res: unknown
    await act(async () => {
      res = await result.current.execute()
    })

    expect(res).toBe(null)
    expect(result.current.error).toBe('Mutation failed')
  })
})
