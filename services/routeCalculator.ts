import type { Route } from '@/types/route'
import { geocodeAddress, type GeocodeResult } from './geocodingService'

const WALK_KMH = 5
const BIKE_KMH = 15
const SUBWAY_KMH = 30
const SUBWAY_TRANSFER_MIN = 5
const MIN_TRANSIT_MIN = 5

function haversineKm(a: GeocodeResult, b: GeocodeResult): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

const transitMin = (km: number, kmh: number) =>
  Math.max(MIN_TRANSIT_MIN, Math.round((km / kmh) * 60))

export async function calculateRoutes(from: string, to: string): Promise<Route[]> {
  const [origin, dest] = await Promise.all([geocodeAddress(from), geocodeAddress(to)])
  const km = haversineKm(origin, dest)

  const subwayMin = transitMin(km, SUBWAY_KMH)
  const bikeMin = transitMin(km, BIKE_KMH)

  const routes: Route[] = [
    {
      totalMinutes: 0,
      isShortest: false,
      segments: [
        { type: 'walk', minutes: 3, label: '도보', subLabel: `${origin.placeName}까지` },
        {
          type: 'subway',
          minutes: subwayMin,
          label: '1호선',
          subLabel: `${origin.placeName} → ${dest.placeName}`,
        },
        { type: 'walk', minutes: 5, label: '도보', subLabel: '목적지까지' },
      ],
    },
    {
      totalMinutes: 0,
      isShortest: false,
      segments: [
        { type: 'walk', minutes: 3, label: '도보', subLabel: '대여소까지' },
        {
          type: 'bike',
          minutes: bikeMin,
          label: '따릉이',
          subLabel: `${origin.placeName} 대여소 → ${dest.placeName} 대여소`,
          bikeAvailable: false,
        },
        { type: 'walk', minutes: 4, label: '도보', subLabel: '목적지까지' },
      ],
    },
    {
      totalMinutes: 0,
      isShortest: false,
      segments: [
        { type: 'walk', minutes: 4, label: '도보', subLabel: `${origin.placeName}까지` },
        {
          type: 'subway',
          minutes: subwayMin + SUBWAY_TRANSFER_MIN,
          label: '4호선',
          subLabel: `${origin.placeName} → ${dest.placeName}`,
        },
        { type: 'walk', minutes: 8, label: '도보', subLabel: '목적지까지' },
      ],
    },
  ]

  for (const r of routes) {
    r.totalMinutes = r.segments.reduce((sum, s) => sum + s.minutes, 0)
  }

  routes.sort((a, b) => a.totalMinutes - b.totalMinutes)
  routes[0].isShortest = true

  return routes
}
