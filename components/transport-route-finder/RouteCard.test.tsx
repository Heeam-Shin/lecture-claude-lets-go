import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouteCard } from './RouteCard'
import type { Route } from '@/types/route'

const baseRoute: Route = {
  totalMinutes: 28,
  isShortest: true,
  segments: [
    { type: 'walk', minutes: 3, label: '도보', subLabel: '서울역까지' },
    { type: 'subway', minutes: 20, label: '1호선', subLabel: '서울역 → 강남역' },
    { type: 'walk', minutes: 5, label: '도보', subLabel: '목적지까지' },
  ],
}

const bikeRoute: Route = {
  totalMinutes: 34,
  isShortest: false,
  segments: [
    { type: 'walk', minutes: 4, label: '도보', subLabel: '서울역광장 대여소까지' },
    {
      type: 'bike',
      minutes: 25,
      label: '따릉이',
      subLabel: '서울역광장 대여소 → 강남역 대여소',
      bikeAvailable: false,
    },
    { type: 'walk', minutes: 5, label: '도보', subLabel: '목적지까지' },
  ],
}

describe('RouteCard', () => {
  it('displays total travel time in minutes', () => {
    render(<RouteCard route={baseRoute} />)
    expect(screen.getByText('28분')).toBeInTheDocument()
  })

  it('displays segment labels and travel times', () => {
    render(<RouteCard route={baseRoute} />)
    expect(screen.getAllByText('1호선').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('20분').length).toBeGreaterThanOrEqual(1)
  })

  it('renders transport icons for each segment in the diagram', () => {
    render(<RouteCard route={baseRoute} />)
    // 3 segments in the diagram
    expect(screen.getAllByTestId('route-diagram-segment').length).toBe(3)
  })

  it('displays subway line name', () => {
    render(<RouteCard route={baseRoute} />)
    expect(screen.getAllByText('1호선').length).toBeGreaterThanOrEqual(1)
  })

  it('displays bike station name in subLabel', () => {
    render(<RouteCard route={bikeRoute} />)
    expect(screen.getByText(/서울역광장 대여소 → 강남역 대여소/)).toBeInTheDocument()
  })

  it('renders segments in left-to-right order in diagram', () => {
    render(<RouteCard route={baseRoute} />)
    const segmentNodes = screen.getAllByTestId('route-diagram-segment')
    expect(segmentNodes.length).toBe(3)
  })

  it('renders route card when bike segment has bikeAvailable: false', () => {
    render(<RouteCard route={bikeRoute} />)
    expect(screen.getByText('34분')).toBeInTheDocument()
  })

  it('shows 대여 불가 badge when bikeAvailable is false', () => {
    render(<RouteCard route={bikeRoute} />)
    expect(screen.getByText('대여 불가')).toBeInTheDocument()
  })
})
