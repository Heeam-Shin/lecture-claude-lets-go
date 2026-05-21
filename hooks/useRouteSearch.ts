'use client'

import { useState, useCallback } from 'react'
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

  const search = useCallback(async (from: string, to: string) => {
    setState({ status: 'loading', routes: [], error: null })

    try {
      const res = await fetch('/api/routes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
        cache: 'no-store',
      })

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
    } catch {
      setState({ status: 'error', routes: [], error: 'network_error' })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', routes: [], error: null })
  }, [])

  return { routes: state.routes, status: state.status, error: state.error, search, reset }
}
