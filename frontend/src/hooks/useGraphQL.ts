import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface UseGraphQLOptions {
  query: string
  variables?: Record<string, unknown>
  skip?: boolean
}

interface UseGraphQLResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGraphQL<T = unknown>(options: UseGraphQLOptions): UseGraphQLResult<T> {
  const { session, nhost } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!options.skip)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const varsKey = JSON.stringify(options.variables)

  const fetchData = useCallback(async () => {
    if (options.skip) return
    const token = session?.accessToken
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const { data: result, error: gqlError } = await nhost.graphql.request<T>(
        { query: options.query, variables: options.variables },
        token,
        true
      )
      if (!mountedRef.current) return
      if (gqlError?.length) {
        setError(gqlError[0].message)
      } else {
        setData(result)
      }
    } catch (err) {
      if (!mountedRef.current) return
      setError((err as Error).message)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [options.query, varsKey, options.skip, session?.accessToken, nhost])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => { mountedRef.current = false }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

interface UseLazyGraphQLResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (variables?: Record<string, unknown>) => Promise<T | null>
}

export function useLazyGraphQL<T = unknown>(query: string): UseLazyGraphQLResult<T> {
  const { session, nhost } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (variables?: Record<string, unknown>) => {
    const token = session?.accessToken
    if (!token) return null

    setLoading(true)
    setError(null)

    try {
      const { data: result, error: gqlError } = await nhost.graphql.request<T>(
        { query, variables },
        token,
        true
      )
      if (gqlError?.length) {
        setError(gqlError[0].message)
        return null
      }
      setData(result)
      return result
    } catch (err) {
      setError((err as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }, [query, session?.accessToken, nhost])

  return { data, loading, error, execute }
}
