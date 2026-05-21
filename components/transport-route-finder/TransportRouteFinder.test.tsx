import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransportRouteFinder } from './TransportRouteFinder'
import type { Route } from '@/types/route'

const mockRoutes: Route[] = [
  {
    totalMinutes: 28,
    isShortest: true,
    segments: [
      { type: 'walk', minutes: 3, label: '도보' },
      { type: 'subway', minutes: 20, label: '1호선' },
      { type: 'walk', minutes: 5, label: '도보' },
    ],
  },
  {
    totalMinutes: 34,
    isShortest: false,
    segments: [
      { type: 'walk', minutes: 4, label: '도보' },
      { type: 'bike', minutes: 25, label: '따릉이', bikeAvailable: false },
      { type: 'walk', minutes: 5, label: '도보' },
    ],
  },
  {
    totalMinutes: 41,
    isShortest: false,
    segments: [
      { type: 'walk', minutes: 3, label: '도보' },
      { type: 'subway', minutes: 30, label: '4호선' },
      { type: 'walk', minutes: 8, label: '도보' },
    ],
  },
]

async function doSearch(user: ReturnType<typeof userEvent.setup>, from = '서울역', to = '강남역') {
  await user.type(screen.getByPlaceholderText('출발지 입력'), from)
  await user.type(screen.getByPlaceholderText('목적지 입력'), to)
  await user.click(screen.getByRole('button', { name: '경로 검색' }))
}

function getRouteCardHeaders() {
  return screen.queryAllByText(/^\d+분$/).filter(
    (el) => el.tagName === 'SPAN' && el.className.includes('text-sm') && el.className.includes('font-bold')
  )
}

describe('TransportRouteFinder', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch')
    vi.clearAllMocks()
  })

  it('renders up to 3 route cards after successful search (Scenario 1)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: mockRoutes }), { status: 200 })
    )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)

    await waitFor(() => {
      expect(getRouteCardHeaders().length).toBe(3)
    })
  })

  it('clears route results after clear button click (Scenario 3)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: mockRoutes }), { status: 200 })
    )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)
    await waitFor(() => expect(getRouteCardHeaders().length).toBe(3))

    await user.click(screen.getByRole('button', { name: '지우기' }))

    expect(getRouteCardHeaders().length).toBe(0)
  })

  it('shows error message when API fails (Scenario 5)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'realtime_api_error' }), { status: 502 })
    )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)

    await waitFor(() => {
      expect(screen.getByText('실시간 데이터를 가져오지 못했습니다')).toBeInTheDocument()
    })
  })

  it('does not show previous route results on error (Scenario 5)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'realtime_api_error' }), { status: 502 })
    )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)

    await waitFor(() =>
      expect(screen.getByText('실시간 데이터를 가져오지 못했습니다')).toBeInTheDocument()
    )
    expect(getRouteCardHeaders().length).toBe(0)
  })

  it('shows empty route message when no routes found (Scenario 6)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: [] }), { status: 200 })
    )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)

    await waitFor(() => {
      expect(screen.getByText('경로를 찾을 수 없습니다')).toBeInTheDocument()
    })
  })

  it('does not show route cards when empty (Scenario 6)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: [] }), { status: 200 })
    )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)

    await waitFor(() => expect(screen.getByText('경로를 찾을 수 없습니다')).toBeInTheDocument())
    expect(getRouteCardHeaders().length).toBe(0)
  })

  it('shows search form with previous values after 수정 click', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ routes: mockRoutes }), { status: 200 })
    )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)
    await waitFor(() => expect(getRouteCardHeaders().length).toBe(3))

    await user.click(screen.getByRole('button', { name: '수정' }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('출발지 입력')).toBeInTheDocument()
      expect(screen.getByDisplayValue('서울역')).toBeInTheDocument()
    })
  })

  it('retries search with same query on 다시 검색 click', async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'realtime_api_error' }), { status: 502 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ routes: mockRoutes }), { status: 200 })
      )
    const user = userEvent.setup()
    render(<TransportRouteFinder />)

    await doSearch(user)
    await waitFor(() => expect(screen.getByText('실시간 데이터를 가져오지 못했습니다')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: '다시 검색' }))

    await waitFor(() => {
      expect(getRouteCardHeaders().length).toBe(3)
    })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
