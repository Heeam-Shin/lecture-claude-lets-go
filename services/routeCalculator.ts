import type { Route, Segment } from '@/types/route'
import { geocodeAddress } from './geocodingService'
import { findNearestStation, getAllBikeStations, type BikeStation } from './ddareungApi'
import { findNearestSubwayStations, type SubwayStation } from './subwayStationFinder'

const WALK_KMH = 5
const BIKE_KMH = 15
const SUBWAY_KMH = 30
const SUBWAY_TRANSFER_MIN = 5
const MIN_TRANSIT_MIN = 1
const MIN_SUBWAY_MIN = 5
const WALK_BIKE_THRESHOLD_MIN = 1

interface LatLng {
  lat: number
  lng: number
}

function haversineKm(a: LatLng, b: LatLng): number {
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

const walkMin = (km: number) => Math.max(MIN_TRANSIT_MIN, Math.round((km / WALK_KMH) * 60))
const bikeMin = (km: number) => Math.max(MIN_TRANSIT_MIN, Math.round((km / BIKE_KMH) * 60))
const subwayMin = (km: number) => Math.max(MIN_SUBWAY_MIN, Math.round((km / SUBWAY_KMH) * 60))

function bikeSubLabel(station: BikeStation): string {
  return `${station.id} ${station.name}`
}

function buildWalkLeg(
  start: LatLng,
  end: LatLng,
  endLabel: string,
  bikeStations: BikeStation[]
): Segment[] {
  const km = haversineKm(start, end)
  const totalWalkMin = walkMin(km)
  const single: Segment = {
    type: 'walk',
    minutes: totalWalkMin,
    label: '도보',
    subLabel: `${endLabel}까지`,
  }
  if (totalWalkMin <= WALK_BIKE_THRESHOLD_MIN) return [single]

  const pickup = findNearestStation(bikeStations, start.lat, start.lng)
  const dropoff = findNearestStation(bikeStations, end.lat, end.lng)
  if (!pickup || !dropoff || pickup.id === dropoff.id) return [single]

  return [
    {
      type: 'walk',
      minutes: walkMin(haversineKm(start, pickup)),
      label: '도보',
      subLabel: `${bikeSubLabel(pickup)}까지`,
    },
    {
      type: 'bike',
      minutes: bikeMin(haversineKm(pickup, dropoff)),
      label: '따릉이',
      subLabel: `${bikeSubLabel(pickup)} → ${bikeSubLabel(dropoff)}`,
      bikeAvailable: pickup.availableBikes > 0,
    },
    {
      type: 'walk',
      minutes: walkMin(haversineKm(dropoff, end)),
      label: '도보',
      subLabel: `${endLabel}까지`,
    },
  ]
}

function pickLines(originStation: SubwayStation | undefined, destStation: SubwayStation | undefined) {
  if (!originStation || !destStation) return { primary: undefined, transfer: undefined }
  const shared = originStation.lines.find((l) => destStation.lines.includes(l))
  if (shared) return { primary: shared, transfer: undefined }
  return { primary: originStation.lines[0], transfer: destStation.lines[0] }
}

export async function calculateRoutes(from: string, to: string): Promise<Route[]> {
  const [origin, dest] = await Promise.all([geocodeAddress(from), geocodeAddress(to)])

  const [bikeStations, originSubways, destSubways] = await Promise.all([
    getAllBikeStations(),
    findNearestSubwayStations(origin.lat, origin.lng),
    findNearestSubwayStations(dest.lat, dest.lng),
  ])

  const originStation = originSubways[0]
  const destStation = destSubways[0]
  const { primary, transfer } = pickLines(originStation, destStation)

  const routes: Route[] = []

  if (originStation && destStation && primary) {
    routes.push({
      totalMinutes: 0,
      isShortest: false,
      segments: [
        ...buildWalkLeg(origin, originStation, originStation.name, bikeStations),
        {
          type: 'subway',
          minutes: subwayMin(haversineKm(originStation, destStation)),
          label: primary,
          subLabel: `${originStation.name} → ${destStation.name}`,
        },
        ...buildWalkLeg(destStation, dest, '목적지', bikeStations),
      ],
    })
  }

  const originBike = findNearestStation(bikeStations, origin.lat, origin.lng)
  const destBike = findNearestStation(bikeStations, dest.lat, dest.lng)
  if (originBike && destBike && originBike.id !== destBike.id) {
    routes.push({
      totalMinutes: 0,
      isShortest: false,
      segments: [
        {
          type: 'walk',
          minutes: walkMin(haversineKm(origin, originBike)),
          label: '도보',
          subLabel: `${bikeSubLabel(originBike)}까지`,
        },
        {
          type: 'bike',
          minutes: bikeMin(haversineKm(originBike, destBike)),
          label: '따릉이',
          subLabel: `${bikeSubLabel(originBike)} → ${bikeSubLabel(destBike)}`,
          bikeAvailable: originBike.availableBikes > 0,
        },
        {
          type: 'walk',
          minutes: walkMin(haversineKm(destBike, dest)),
          label: '도보',
          subLabel: '목적지까지',
        },
      ],
    })
  }

  if (originStation && destStation && primary && transfer && primary !== transfer) {
    routes.push({
      totalMinutes: 0,
      isShortest: false,
      segments: [
        ...buildWalkLeg(origin, originStation, originStation.name, bikeStations),
        {
          type: 'subway',
          minutes: subwayMin(haversineKm(originStation, destStation)) + SUBWAY_TRANSFER_MIN,
          label: `${primary} → ${transfer}`,
          subLabel: `${originStation.name} → ${destStation.name}`,
        },
        ...buildWalkLeg(destStation, dest, '목적지', bikeStations),
      ],
    })
  }

  for (const r of routes) r.totalMinutes = r.segments.reduce((s, seg) => s + seg.minutes, 0)
  routes.sort((a, b) => a.totalMinutes - b.totalMinutes)
  if (routes.length > 0) routes[0].isShortest = true

  return routes
}
