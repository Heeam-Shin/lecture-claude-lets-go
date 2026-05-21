import { FootprintsIcon, TrainIcon, BikeIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RouteDiagram } from './RouteDiagram'
import type { Route } from '@/types/route'

const ICON_MAP = {
  walk: FootprintsIcon,
  subway: TrainIcon,
  bike: BikeIcon,
} as const

interface RouteCardProps {
  route: Route
}

export function RouteCard({ route }: RouteCardProps) {
  return (
    <div className="border border-border rounded-none bg-background p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold">{route.totalMinutes}분</span>
        {route.isShortest && (
          <Badge variant="secondary">최단</Badge>
        )}
      </div>

      <RouteDiagram segments={route.segments} />

      <div className="flex flex-col gap-1.5 text-xs border-t border-border pt-2 mt-2">
        {route.segments.map((seg, i) => {
          const Icon = ICON_MAP[seg.type]
          return (
            <div key={i} className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Icon className="size-3 shrink-0" />
                {seg.label}
                {seg.subLabel && (
                  <span className="text-muted-foreground"> · {seg.subLabel}</span>
                )}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {seg.type === 'bike' && seg.bikeAvailable === false && (
                  <Badge variant="outline">대여 불가</Badge>
                )}
                <span className="text-muted-foreground">{seg.minutes}분</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
