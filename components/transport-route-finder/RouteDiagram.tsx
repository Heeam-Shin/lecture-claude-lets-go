import { cn } from '@/lib/utils'
import type { Segment } from '@/types/route'
import { TRANSPORT_ICON_MAP } from './transportIcons'

interface RouteDiagramProps {
  segments: Segment[]
}

export function RouteDiagram({ segments }: RouteDiagramProps) {
  return (
    <div className="flex items-end gap-0 overflow-x-auto pb-1">
      {segments.map((seg, i) => {
        const Icon = TRANSPORT_ICON_MAP[seg.type]
        return (
          <div key={i} className="flex items-end gap-0">
            <div className="flex flex-col items-center text-xs min-w-11 text-center">
              <div
                data-testid="route-diagram-segment"
                className={cn(
                  'size-8 rounded-full border border-border bg-muted flex items-center justify-center mb-1',
                  seg.type === 'bike' && seg.bikeAvailable === false && 'border-dashed'
                )}
              >
                <Icon className="size-3.5 text-foreground" />
              </div>
              <span className={cn('text-muted-foreground', seg.type !== 'walk' && 'text-foreground')}>
                {seg.label}
              </span>
              <span className="text-muted-foreground">{seg.minutes}분</span>
            </div>
            {i < segments.length - 1 && (
              <div className="flex-1 h-px bg-border self-center mb-5 min-w-2.5 relative mx-0.5">
                <span className="absolute -right-1.5 -top-2.5 text-muted-foreground text-sm">›</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
