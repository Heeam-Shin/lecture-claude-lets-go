import { FootprintsIcon, TrainIcon, BikeIcon } from 'lucide-react'
import type { TransportMode } from '@/types/route'

export const TRANSPORT_ICON_MAP: Record<TransportMode, typeof FootprintsIcon> = {
  walk: FootprintsIcon,
  subway: TrainIcon,
  bike: BikeIcon,
}
