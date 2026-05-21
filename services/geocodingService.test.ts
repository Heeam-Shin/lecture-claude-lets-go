import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { geocodeAddress } from './geocodingService'

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.stubEnv('KAKAO_REST_API_KEY', 'test-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns lat/lng/placeName parsed from Kakao response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          documents: [
            {
              x: '126.97041',
              y: '37.55474',
              place_name: '서울역',
              address_name: '서울 중구 봉래동2가',
            },
          ],
        }),
      })
    )

    const result = await geocodeAddress('서울역')

    expect(result.lat).toBeCloseTo(37.55474)
    expect(result.lng).toBeCloseTo(126.97041)
    expect(result.placeName).toBe('서울역')
  })

  it('sends KakaoAK Authorization header with the key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [{ x: '0', y: '0', place_name: 'x' }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await geocodeAddress('foo')

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('KakaoAK test-key')
  })

  it('passes cache: no-store to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [{ x: '0', y: '0', place_name: 'x' }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await geocodeAddress('foo')

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.cache).toBe('no-store')
  })

  it('throws when KAKAO_REST_API_KEY is not set', async () => {
    vi.stubEnv('KAKAO_REST_API_KEY', '')

    await expect(geocodeAddress('foo')).rejects.toThrow(/KAKAO_REST_API_KEY/)
  })

  it('throws when Kakao responds with non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))

    await expect(geocodeAddress('foo')).rejects.toThrow(/401/)
  })

  it('throws when Kakao returns zero documents', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ documents: [] }) })
    )

    await expect(geocodeAddress('알수없는장소')).rejects.toThrow(/알수없는장소/)
  })
})
