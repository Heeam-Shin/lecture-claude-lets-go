import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./geocodingService', () => ({
  geocodeAddress: vi.fn(),
}))

vi.mock('./ddareungApi', async () => {
  const actual = await vi.importActual<typeof import('./ddareungApi')>('./ddareungApi')
  return {
    ...actual,
    getAllBikeStations: vi.fn(),
  }
})

vi.mock('./subwayStationFinder', () => ({
  findNearestSubwayStations: vi.fn(),
}))

import { calculateRoutes } from './routeCalculator'
import { geocodeAddress } from './geocodingService'
import { getAllBikeStations, type BikeStation } from './ddareungApi'
import { findNearestSubwayStations, type SubwayStation } from './subwayStationFinder'

const SEOUL_STATION_GEO = { lat: 37.5547, lng: 126.9707, placeName: '서울역' }
const GANGNAM_STATION_GEO = { lat: 37.4979, lng: 127.0276, placeName: '강남역' }
const SICHEONG_GEO = { lat: 37.5641, lng: 126.9779, placeName: '시청' }
const JONGGAK_GEO = { lat: 37.5701, lng: 126.9826, placeName: '종각' }

const SEOUL_SUBWAY: SubwayStation = {
  name: '서울역',
  lat: 37.5547,
  lng: 126.9707,
  lines: ['1호선', '4호선', '경의중앙선', '공항철도'],
  distance: 30,
}
const GANGNAM_SUBWAY: SubwayStation = {
  name: '강남역',
  lat: 37.4979,
  lng: 127.0276,
  lines: ['2호선', '신분당선'],
  distance: 40,
}
const SICHEONG_SUBWAY: SubwayStation = {
  name: '시청',
  lat: 37.5641,
  lng: 126.9779,
  lines: ['1호선', '2호선'],
  distance: 20,
}
const JONGGAK_SUBWAY: SubwayStation = {
  name: '종각',
  lat: 37.5701,
  lng: 126.9826,
  lines: ['1호선'],
  distance: 15,
}

const SEOUL_BIKE_NEAR_ORIGIN: BikeStation = {
  id: 'ST-101',
  name: '서울역광장',
  lat: 37.5550,
  lng: 126.9710,
  availableBikes: 5,
}
const SEOUL_BIKE_NEAR_STATION: BikeStation = {
  id: 'ST-102',
  name: '서울역2번출구',
  lat: 37.5560,
  lng: 126.9720,
  availableBikes: 3,
}
const GANGNAM_BIKE_NEAR_ORIGIN: BikeStation = {
  id: 'ST-201',
  name: '강남역사거리',
  lat: 37.4975,
  lng: 127.0270,
  availableBikes: 0,
}
const GANGNAM_BIKE_NEAR_STATION: BikeStation = {
  id: 'ST-202',
  name: '강남역4번출구',
  lat: 37.4985,
  lng: 127.0285,
  availableBikes: 2,
}

const ALL_BIKES: BikeStation[] = [
  SEOUL_BIKE_NEAR_ORIGIN,
  SEOUL_BIKE_NEAR_STATION,
  GANGNAM_BIKE_NEAR_ORIGIN,
  GANGNAM_BIKE_NEAR_STATION,
]

describe('calculateRoutes', () => {
  beforeEach(() => {
    vi.mocked(geocodeAddress).mockImplementation(async (q: string) => {
      if (q === '서울역') return SEOUL_STATION_GEO
      if (q === '강남역') return GANGNAM_STATION_GEO
      if (q === '시청') return SICHEONG_GEO
      if (q === '종각') return JONGGAK_GEO
      throw new Error(`unmocked query: ${q}`)
    })
    vi.mocked(getAllBikeStations).mockResolvedValue(ALL_BIKES)
    vi.mocked(findNearestSubwayStations).mockImplementation(async (lat: number) => {
      if (lat === SEOUL_STATION_GEO.lat) return [SEOUL_SUBWAY]
      if (lat === GANGNAM_STATION_GEO.lat) return [GANGNAM_SUBWAY]
      if (lat === SICHEONG_GEO.lat) return [SICHEONG_SUBWAY]
      if (lat === JONGGAK_GEO.lat) return [JONGGAK_SUBWAY]
      return []
    })
  })

  it('returns routes sorted by totalMinutes ascending', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    for (let i = 0; i < routes.length - 1; i++) {
      expect(routes[i].totalMinutes).toBeLessThanOrEqual(routes[i + 1].totalMinutes)
    }
  })

  it('marks the fastest route as isShortest', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    expect(routes[0].isShortest).toBe(true)
    expect(routes.slice(1).every((r) => !r.isShortest)).toBe(true)
  })

  it('uses the actual line name from subway station, not a hardcoded value', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    const subwayLabels = routes
      .flatMap((r) => r.segments)
      .filter((s) => s.type === 'subway')
      .map((s) => s.label)
    // origin and dest share no line → primary = 1호선 (서울역 first), transfer = 2호선 (강남역 first)
    expect(subwayLabels.some((l) => l === '1호선')).toBe(true)
    expect(subwayLabels.some((l) => l === '1호선 → 2호선')).toBe(true)
  })

  it('does not include a transfer route when origin and dest share a line', async () => {
    // 시청(1·2호선) → 종각(1호선) — both share 1호선
    const routes = await calculateRoutes('시청', '종각')
    const transferLabels = routes
      .flatMap((r) => r.segments)
      .filter((s) => s.type === 'subway')
      .map((s) => s.label)
    expect(transferLabels.every((l) => !l.includes('→'))).toBe(true)
    expect(transferLabels).toContain('1호선')
  })

  it('embeds bike station id and name in bike segment subLabel', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    const bikeSegments = routes.flatMap((r) => r.segments).filter((s) => s.type === 'bike')
    expect(bikeSegments.length).toBeGreaterThan(0)
    for (const seg of bikeSegments) {
      expect(seg.subLabel).toMatch(/ST-\d+\s+\S+\s+→\s+ST-\d+\s+\S+/)
    }
  })

  it('reflects real availableBikes in bikeAvailable flag', async () => {
    const routes = await calculateRoutes('서울역', '강남역')
    const allBike = routes.flatMap((r) => r.segments).filter((s) => s.type === 'bike')
    // standalone bike route uses originBike = SEOUL_BIKE_NEAR_ORIGIN (5 bikes) → true
    expect(allBike.some((s) => s.bikeAvailable === true)).toBe(true)
  })

  it('keeps walk as single segment when walk time is below 1 minute', async () => {
    // 시청 → 종각 are very close (~700m apart); walk to/from same-named subway station is ~0m
    const routes = await calculateRoutes('시청', '종각')
    const subwayRoute = routes.find((r) => r.segments.some((s) => s.type === 'subway'))!
    // walks at the start/end (origin→station and station→dest) should be near-zero — no bike augmentation
    const walkSegments = subwayRoute.segments.filter((s) => s.type === 'walk')
    const bikeSegments = subwayRoute.segments.filter((s) => s.type === 'bike')
    expect(walkSegments.length).toBeGreaterThanOrEqual(2)
    expect(bikeSegments.length).toBe(0)
  })

  it('propagates geocoding errors', async () => {
    vi.mocked(geocodeAddress).mockRejectedValueOnce(new Error('No geocoding result'))
    await expect(calculateRoutes('asdf', '강남역')).rejects.toThrow(/No geocoding result/)
  })

  it('propagates subway finder errors', async () => {
    vi.mocked(findNearestSubwayStations).mockRejectedValueOnce(new Error('Kakao subway search failed: 401'))
    await expect(calculateRoutes('서울역', '강남역')).rejects.toThrow(/Kakao subway search failed/)
  })

  it('propagates bike API errors', async () => {
    vi.mocked(getAllBikeStations).mockRejectedValueOnce(new Error('SEOUL_API_KEY is not set'))
    await expect(calculateRoutes('서울역', '강남역')).rejects.toThrow(/SEOUL_API_KEY/)
  })

  it('calls geocodeAddress for both from and to', async () => {
    await calculateRoutes('서울역', '강남역')
    expect(geocodeAddress).toHaveBeenCalledWith('서울역')
    expect(geocodeAddress).toHaveBeenCalledWith('강남역')
  })
})
