import { describe, it, expect } from 'vitest'
import { calculateRoutes } from './routeCalculator'

describe('calculateRoutes', () => {
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
})
