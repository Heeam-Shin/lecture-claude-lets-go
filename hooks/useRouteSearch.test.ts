import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRouteSearch } from './useRouteSearch'
import type { Route } from '@/types/route'

const mockRoute = (totalMinutes: number): Route => ({
  totalMinutes,
  isShortest: totalMinutes === 28,
  segments: [
    { type: 'walk', minutes: 3, label: '도보' },
    { type: 'subway', minutes: totalMinutes - 8, label: '1호선' },
    { type: 'walk', minutes: 5, label: '도보' },
  ],
})

const mockRoutes: Route[] = [mockRoute(28), mockRoute(34), mockRoute(41)]

describe('useRouteSearch', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
    vi.clearAllMocks()
  })

  it('sets status to success after search', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: mockRoutes }), { status: 200 })
    )

    const { result } = renderHook(() => useRouteSearch())

    await act(async () => {
      await result.current.search('서울역', '강남역')
    })

    expect(result.current.status).toBe('success')
  })

  it('routes are sorted by totalMinutes ascending after search', async () => {
    const unsortedRoutes = [mockRoute(41), mockRoute(28), mockRoute(34)]
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: unsortedRoutes }), { status: 200 })
    )

    const { result } = renderHook(() => useRouteSearch())

    await act(async () => {
      await result.current.search('서울역', '강남역')
    })

    const minutes = result.current.routes.map((r) => r.totalMinutes)
    for (let i = 0; i < minutes.length - 1; i++) {
      expect(minutes[i]).toBeLessThanOrEqual(minutes[i + 1])
    }
  })

  it('sets status to error when fetch fails', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useRouteSearch())

    await act(async () => {
      await result.current.search('서울역', '강남역')
    })

    expect(result.current.status).toBe('error')
  })

  it('sets status to empty when routes array is empty', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: [] }), { status: 200 })
    )

    const { result } = renderHook(() => useRouteSearch())

    await act(async () => {
      await result.current.search('알수없는곳', '더알수없는곳')
    })

    expect(result.current.status).toBe('empty')
  })

  it('sends a new fetch request on each consecutive search call', async () => {
    fetchSpy
      .mockResolvedValueOnce(new Response(JSON.stringify({ routes: mockRoutes }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ routes: mockRoutes }), { status: 200 }))

    const { result } = renderHook(() => useRouteSearch())

    await act(async () => {
      await result.current.search('서울역', '강남역')
    })
    await act(async () => {
      await result.current.search('서울역', '강남역')
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
