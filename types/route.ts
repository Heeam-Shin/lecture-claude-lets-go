export type TransportMode = 'walk' | 'subway' | 'bike'

export interface Segment {
  type: TransportMode
  minutes: number
  label: string
  subLabel?: string
  bikeAvailable?: boolean
}

export interface Route {
  totalMinutes: number
  segments: Segment[]
  isShortest: boolean
}

export interface SearchState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'empty'
  routes: Route[]
  error: string | null
}
