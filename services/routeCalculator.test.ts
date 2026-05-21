import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./geocodingService', () => ({
  geocodeAddress: vi.fn(),
}))

import { calculateRoutes } from './routeCalculator'
import { geocodeAddress } from './geocodingService'

const SEOUL_STATION = { lat: 37.5547, lng: 126.9707, placeName: '서울역' }
const GANGNAM_STATION = { lat: 37.4979, lng: 127.0276, placeName: '강남역' }

describe('calculateRoutes', () => {
  beforeEach(() => {
    vi.mocked(geocodeAddress).mockImplementation(async (q: string) => {
      if (q === '서울역') return SEOUL_STATION
      if (q === '강남역') return GANGNAM_STATION
      throw new Error(`unmocked query: ${q}`)
    })
  })

  it('returns 3 routes', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    expect(routes).toHaveLength(3)
  })

  it('returns routes sorted by totalMinutes ascending', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    for (let i = 0; i < routes.length - 1; i++) {
      expect(routes[i].totalMinutes).toBeLessThanOrEqual(routes[i + 1].totalMinutes)
    }
  })

  it('contains walk, subway, and bike segment types across all routes', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    const allTypes = routes.flatMap((r) => r.segments.map((s) => s.type))
    expect(allTypes).toContain('walk')
    expect(allTypes).toContain('subway')
    expect(allTypes).toContain('bike')
  })

  it('has at least one route with bikeAvailable: false', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    const hasUnavailableBike = routes.some((r) =>
      r.segments.some((s) => s.type === 'bike' && s.bikeAvailable === false)
    )
    expect(hasUnavailableBike).toBe(true)
  })

  it('marks the fastest route as isShortest', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    expect(routes[0].isShortest).toBe(true)
    expect(routes.slice(1).every((r) => !r.isShortest)).toBe(true)
  })

  it('calls geocodeAddress for both from and to', async () => {
    await calculateRoutes('서울역', '강남역')
    expect(geocodeAddress).toHaveBeenCalledWith('서울역')
    expect(geocodeAddress).toHaveBeenCalledWith('강남역')
  })

  it('propagates geocoding errors', async () => {
    vi.mocked(geocodeAddress).mockRejectedValueOnce(new Error('No geocoding result'))
    await expect(calculateRoutes('asdf', '강남역')).rejects.toThrow(/No geocoding result/)
  })
})
