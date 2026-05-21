export interface SubwayStation {
  name: string
  lat: number
  lng: number
  lines: string[]
  distance: number
}

const KAKAO_CATEGORY_URL = 'https://dapi.kakao.com/v2/local/search/category.json'

const LINE_PATTERNS = [
  /수도권(\d+호선)/,
  /(\d+호선)/,
  /(신분당선|수인분당선|분당선|경의중앙선|경춘선|공항철도|우이신설선|김포골드라인|서해선|에버라인|신림선|GTX-?[A-Z])/,
]

function extractLine(text: string | undefined): string | null {
  if (!text) return null
  for (const pattern of LINE_PATTERNS) {
    const m = text.match(pattern)
    if (m) return m[1]
  }
  return null
}

function baseStationName(placeName: string): string {
  return placeName
    .replace(/\s*\d+호선.*$/, '')
    .replace(/\s*(신분당선|수인분당선|분당선|경의중앙선|경춘선|공항철도|우이신설선|김포골드라인|서해선|에버라인|신림선|GTX-?[A-Z]).*$/, '')
    .trim()
}

interface KakaoSubwayDoc {
  place_name: string
  category_name?: string
  x: string
  y: string
  distance: string
}

export async function findNearestSubwayStations(
  lat: number,
  lng: number,
  radiusMeters: number = 1500
): Promise<SubwayStation[]> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) throw new Error('KAKAO_REST_API_KEY is not set')

  const url = `${KAKAO_CATEGORY_URL}?category_group_code=SW8&x=${lng}&y=${lat}&radius=${radiusMeters}&sort=distance&size=15`
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Kakao subway search failed: ${res.status}`)

  const data = (await res.json()) as { documents?: KakaoSubwayDoc[] }
  const docs = data.documents ?? []

  const merged = new Map<string, SubwayStation>()
  for (const doc of docs) {
    const name = baseStationName(doc.place_name)
    if (!name) continue
    const line = extractLine(doc.category_name) ?? extractLine(doc.place_name)
    const entry = merged.get(name) ?? {
      name,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      lines: [],
      distance: parseInt(doc.distance, 10),
    }
    if (line && !entry.lines.includes(line)) entry.lines.push(line)
    if (parseInt(doc.distance, 10) < entry.distance) {
      entry.distance = parseInt(doc.distance, 10)
      entry.lat = parseFloat(doc.y)
      entry.lng = parseFloat(doc.x)
    }
    merged.set(name, entry)
  }

  return Array.from(merged.values()).sort((a, b) => a.distance - b.distance)
}
