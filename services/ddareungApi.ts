export interface BikeStation {
  id: string
  name: string
  lat: number
  lng: number
  availableBikes: number
}

const BIKE_API_BASE = 'http://openAPI.seoul.go.kr:8088'
const PAGES = [
  [1, 1000],
  [1001, 2000],
  [2001, 3000],
] as const

interface BikeApiRow {
  stationId: string
  stationName: string
  stationLatitude: string
  stationLongitude: string
  parkingBikeTotCnt: string
}

interface BikeApiResponse {
  rentBikeStatus?: {
    row?: BikeApiRow[]
    RESULT?: { CODE: string }
  }
}

function toRad(d: number): number {
  return (d * Math.PI) / 180
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function getAllBikeStations(): Promise<BikeStation[]> {
  const key = process.env.SEOUL_API_KEY
  if (!key) throw new Error('SEOUL_API_KEY is not set')

  const pages = await Promise.all(
    PAGES.map(async ([start, end]) => {
      const url = `${BIKE_API_BASE}/${key}/json/bikeList/${start}/${end}/`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Ddareung API failed: ${res.status}`)
      const data = (await res.json()) as BikeApiResponse
      const rows = data.rentBikeStatus?.row ?? []
      return rows.map<BikeStation>((r) => ({
        id: r.stationId,
        name: r.stationName,
        lat: parseFloat(r.stationLatitude),
        lng: parseFloat(r.stationLongitude),
        availableBikes: parseInt(r.parkingBikeTotCnt, 10),
      }))
    })
  )

  return pages.flat()
}

export function findNearestStation(
  stations: BikeStation[],
  lat: number,
  lng: number
): BikeStation | null {
  if (stations.length === 0) return null
  let nearest = stations[0]
  let minDist = haversineKm(lat, lng, nearest.lat, nearest.lng)
  for (let i = 1; i < stations.length; i++) {
    const dist = haversineKm(lat, lng, stations[i].lat, stations[i].lng)
    if (dist < minDist) {
      minDist = dist
      nearest = stations[i]
    }
  }
  return nearest
}
