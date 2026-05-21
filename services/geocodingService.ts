export interface GeocodeResult {
  lat: number
  lng: number
  placeName: string
}

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json'

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) throw new Error('KAKAO_REST_API_KEY is not set')

  const url = `${KAKAO_KEYWORD_URL}?query=${encodeURIComponent(query)}&size=1`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Kakao geocoding failed: ${res.status}`)

  const data = (await res.json()) as { documents?: Array<{ x: string; y: string; place_name?: string; address_name?: string }> }
  const doc = data.documents?.[0]
  if (!doc) throw new Error(`No geocoding result for: ${query}`)

  return {
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    placeName: doc.place_name || doc.address_name || query,
  }
}
