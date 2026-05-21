import { describe, it, expect, vi, afterEach } from 'vitest'
import { getAllBikeStations, findNearestStation } from './ddareungApi'

function makeRow(id: string, name: string, lat: number, lng: number, bikes: number) {
  return {
    stationId: id,
    stationName: name,
    stationLatitude: lat.toFixed(8),
    stationLongitude: lng.toFixed(8),
    parkingBikeTotCnt: String(bikes),
    rackTotCnt: '10',
    shared: '50',
  }
}

function makeResponse(rows: ReturnType<typeof makeRow>[]) {
  return {
    rentBikeStatus: {
      list_total_count: rows.length,
      RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다' },
      row: rows,
    },
  }
}

describe('getAllBikeStations', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('fetches 3 pages in parallel and returns combined stations', async () => {
    vi.stubEnv('SEOUL_API_KEY', 'TEST_KEY')
    const fetchMock = vi.fn()
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeResponse([makeRow('ST-1', 'Station A', 37.5, 126.9, 5)]),
    })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeResponse([makeRow('ST-2', 'Station B', 37.6, 127.0, 0)]),
    })
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => makeResponse([]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const stations = await getAllBikeStations()
    expect(stations).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('parses station fields correctly', async () => {
    vi.stubEnv('SEOUL_API_KEY', 'TEST_KEY')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          makeResponse([makeRow('ST-10', '강남역 대여소', 37.4979, 127.0276, 3)]),
      })
    )

    const stations = await getAllBikeStations()
    expect(stations[0]).toEqual({
      id: 'ST-10',
      name: '강남역 대여소',
      lat: 37.4979,
      lng: 127.0276,
      availableBikes: 3,
    })
  })

  it('throws when SEOUL_API_KEY is not set', async () => {
    vi.stubEnv('SEOUL_API_KEY', '')
    await expect(getAllBikeStations()).rejects.toThrow(/SEOUL_API_KEY/)
  })

  it('throws on HTTP error', async () => {
    vi.stubEnv('SEOUL_API_KEY', 'TEST_KEY')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    await expect(getAllBikeStations()).rejects.toThrow(/503/)
  })
})

describe('findNearestStation', () => {
  it('returns null for empty station list', () => {
    expect(findNearestStation([], 37.5, 127.0)).toBeNull()
  })

  it('returns the nearest station by haversine distance', () => {
    const stations = [
      { id: 'ST-1', name: 'Far', lat: 37.6, lng: 127.0, availableBikes: 2 },
      { id: 'ST-2', name: 'Near', lat: 37.5005, lng: 127.0005, availableBikes: 1 },
      { id: 'ST-3', name: 'Medium', lat: 37.55, lng: 127.0, availableBikes: 0 },
    ]
    const result = findNearestStation(stations, 37.5, 127.0)
    expect(result?.id).toBe('ST-2')
  })

  it('returns the only station when list has one item', () => {
    const stations = [{ id: 'ST-1', name: 'Only', lat: 37.5, lng: 127.0, availableBikes: 5 }]
    expect(findNearestStation(stations, 37.4, 126.9)?.id).toBe('ST-1')
  })
})
