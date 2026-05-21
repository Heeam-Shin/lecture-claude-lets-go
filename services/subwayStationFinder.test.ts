import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { findNearestSubwayStations } from './subwayStationFinder'

const ORIGINAL_KEY = process.env.KAKAO_REST_API_KEY

function mockFetchOnce(body: unknown, ok: boolean = true, status: number = 200) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  }) as unknown as typeof fetch
}

describe('findNearestSubwayStations', () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = 'test-key'
  })

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.KAKAO_REST_API_KEY
    else process.env.KAKAO_REST_API_KEY = ORIGINAL_KEY
    vi.restoreAllMocks()
  })

  it('merges same station across different line rows into one entry with both lines', async () => {
    mockFetchOnce({
      documents: [
        {
          place_name: '강남역 2호선',
          category_name: '교통,수송 > 지하철,전철 > 수도권2호선',
          x: '127.0280',
          y: '37.4980',
          distance: '40',
        },
        {
          place_name: '강남역 신분당선',
          category_name: '교통,수송 > 지하철,전철 > 신분당선',
          x: '127.0281',
          y: '37.4967',
          distance: '135',
        },
      ],
    })

    const stations = await findNearestSubwayStations(37.4979, 127.0276)
    expect(stations).toHaveLength(1)
    expect(stations[0].name).toBe('강남역')
    expect(stations[0].lines).toEqual(expect.arrayContaining(['2호선', '신분당선']))
    expect(stations[0].distance).toBe(40)
  })

  it('strips "수도권" prefix from line names', async () => {
    mockFetchOnce({
      documents: [
        {
          place_name: '서울역 1호선',
          category_name: '교통,수송 > 지하철,전철 > 수도권1호선',
          x: '126.9707',
          y: '37.5547',
          distance: '50',
        },
      ],
    })

    const stations = await findNearestSubwayStations(37.5547, 126.9707)
    expect(stations[0].lines).toEqual(['1호선'])
  })

  it('sorts result by ascending distance', async () => {
    mockFetchOnce({
      documents: [
        {
          place_name: '시청역 2호선',
          category_name: '교통,수송 > 지하철,전철 > 수도권2호선',
          x: '126.97',
          y: '37.56',
          distance: '300',
        },
        {
          place_name: '종각역 1호선',
          category_name: '교통,수송 > 지하철,전철 > 수도권1호선',
          x: '126.98',
          y: '37.57',
          distance: '120',
        },
      ],
    })

    const stations = await findNearestSubwayStations(37.5547, 126.9707)
    expect(stations.map((s) => s.name)).toEqual(['종각역', '시청역'])
  })

  it('throws when KAKAO_REST_API_KEY is missing', async () => {
    delete process.env.KAKAO_REST_API_KEY
    await expect(findNearestSubwayStations(37.5, 127.0)).rejects.toThrow(/KAKAO_REST_API_KEY/)
  })

  it('throws when Kakao API returns non-OK status', async () => {
    mockFetchOnce({}, false, 500)
    await expect(findNearestSubwayStations(37.5, 127.0)).rejects.toThrow(/Kakao subway search failed/)
  })

  it('returns empty array when documents is missing', async () => {
    mockFetchOnce({})
    const stations = await findNearestSubwayStations(37.5, 127.0)
    expect(stations).toEqual([])
  })
})
