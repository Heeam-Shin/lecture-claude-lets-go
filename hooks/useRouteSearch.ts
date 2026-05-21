'use client'

import { useState, useCallback, useRef } from 'react'
import type { Route, SearchState } from '@/types/route'

interface UseRouteSearchReturn {
  routes: Route[]
  status: SearchState['status']
  error: string | null
  search: (from: string, to: string) => Promise<void>
  reset: () => void
}

export function useRouteSearch(): UseRouteSearchReturn {
  const [state, setState] = useState<SearchState>({
    status: 'idle',
    routes: [],
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback(async (from: string, to: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({ status: 'loading', routes: [], error: null })

    try {
      const res = await fetch('/api/routes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
        cache: 'no-store',
        signal: controller.signal,
      })

      if (controller.signal.aborted) return

      if (!res.ok) {
        setState({ status: 'error', routes: [], error: 'realtime_api_error' })
        return
      }

      const data = (await res.json()) as { routes: Route[] }
      if (data.routes.length === 0) {
        setState({ status: 'empty', routes: [], error: null })
      } else {
        const sorted = [...data.routes].sort((a, b) => a.totalMinutes - b.totalMinutes)
        setState({ status: 'success', routes: sorted, error: null })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setState({ status: 'error', routes: [], error: 'network_error' })
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ status: 'idle', routes: [], error: null })
  }, [])

  return { routes: state.routes, status: state.status, error: state.error, search, reset }
}
