import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const headers = new Headers(init?.headers)
      headers.set('Content-Type', 'application/json')
      return new Response(JSON.stringify(data), { ...init, headers })
    },
  },
}))

vi.mock('@/services/routeCalculator')

import { POST } from './route'
import { calculateRoutes } from '@/services/routeCalculator'
import type { Route } from '@/types/route'

const mockRoutes: Route[] = [
  {
    totalMinutes: 28,
    isShortest: true,
    segments: [
      { type: 'walk', minutes: 3, label: '도보' },
      { type: 'subway', minutes: 20, label: '1호선' },
      { type: 'walk', minutes: 5, label: '도보' },
    ],
  },
  {
    totalMinutes: 34,
    isShortest: false,
    segments: [
      { type: 'walk', minutes: 4, label: '도보' },
      { type: 'bike', minutes: 25, label: '따릉이', bikeAvailable: false },
      { type: 'walk', minutes: 5, label: '도보' },
    ],
  },
  {
    totalMinutes: 41,
    isShortest: false,
    segments: [
      { type: 'walk', minutes: 3, label: '도보' },
      { type: 'subway', minutes: 28, label: '4호선' },
      { type: 'walk', minutes: 10, label: '도보' },
    ],
  },
]

describe('POST /api/routes/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with routes array of 3 items', async () => {
    vi.mocked(calculateRoutes).mockResolvedValue(mockRoutes)

    const req = new Request('http://localhost/api/routes/search', {
      method: 'POST',
      body: JSON.stringify({ from: '서울역', to: '강남역' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.routes).toHaveLength(3)
  })

  it('includes Cache-Control: no-store header', async () => {
    vi.mocked(calculateRoutes).mockResolvedValue(mockRoutes)

    const req = new Request('http://localhost/api/routes/search', {
      method: 'POST',
      body: JSON.stringify({ from: '서울역', to: '강남역' }),
    })

    const res = await POST(req)

    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('returns 200 with empty routes when calculateRoutes returns empty array', async () => {
    vi.mocked(calculateRoutes).mockResolvedValue([])

    const req = new Request('http://localhost/api/routes/search', {
      method: 'POST',
      body: JSON.stringify({ from: '알수없는곳', to: '더알수없는곳' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.routes).toHaveLength(0)
  })

  it('returns 502 when calculateRoutes throws', async () => {
    vi.mocked(calculateRoutes).mockRejectedValue(new Error('External API error'))

    const req = new Request('http://localhost/api/routes/search', {
      method: 'POST',
      body: JSON.stringify({ from: '서울역', to: '강남역' }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(502)
    expect(data.error).toBe('realtime_api_error')
  })
})
