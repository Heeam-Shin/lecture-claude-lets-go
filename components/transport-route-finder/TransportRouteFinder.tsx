'use client'

import { useState } from 'react'
import { MapIcon, MapPinIcon, FlagIcon, ArrowRightIcon, WifiOffIcon, MapPinXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchForm } from './SearchForm'
import { RouteCard } from './RouteCard'
import { useRouteSearch } from '@/hooks/useRouteSearch'

type View = 'form' | 'results' | 'error' | 'empty'

export function TransportRouteFinder() {
  const { routes, status, search, reset } = useRouteSearch()
  const [lastQuery, setLastQuery] = useState<{ from: string; to: string } | null>(null)
  const [view, setView] = useState<View>('form')

  const handleSearch = async (from: string, to: string) => {
    setLastQuery({ from, to })
    await search(from, to)
  }

  // Derive view from status
  const currentView: View =
    status === 'success' ? 'results'
    : status === 'error' ? 'error'
    : status === 'empty' ? 'empty'
    : view

  const handleClear = () => {
    reset()
    setLastQuery(null)
    setView('form')
  }

  const handleEdit = () => {
    reset()
    setView('form')
  }

  const handleRetry = () => {
    if (lastQuery) {
      handleSearch(lastQuery.from, lastQuery.to)
    }
  }

  const showCompactBar = currentView === 'results' || currentView === 'error' || currentView === 'empty'

  return (
    <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <MapIcon className="size-4 text-foreground" />
        <div>
          <p className="text-sm font-bold">서울 교통 최적 경로</p>
          <p className="text-xs text-muted-foreground">도보 · 지하철 · 따릉이 조합 최단 시간</p>
        </div>
      </div>

      {showCompactBar ? (
        <div className="flex items-center gap-2 p-2 rounded-none border border-border bg-muted text-xs">
          <MapPinIcon className="size-3 text-muted-foreground shrink-0" />
          <span>{lastQuery?.from}</span>
          <ArrowRightIcon className="size-3 text-muted-foreground shrink-0" />
          <FlagIcon className="size-3 text-muted-foreground shrink-0" />
          <span className="flex-1">{lastQuery?.to}</span>
          <Button size="xs" variant="outline" onClick={handleEdit}>수정</Button>
          <Button size="xs" variant="outline" onClick={handleClear}>지우기</Button>
        </div>
      ) : (
        <SearchForm
          initialValues={lastQuery ?? undefined}
          onSearch={handleSearch}
          onClear={handleClear}
          isLoading={status === 'loading'}
        />
      )}

      {currentView === 'results' && routes.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">경로 {routes.length}개 · 전체 이동시간 오름차순</p>
          {routes.map((route, i) => (
            <RouteCard key={i} route={route} />
          ))}
        </div>
      )}

      {currentView === 'error' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <WifiOffIcon className="size-9 text-muted-foreground" />
          <p className="text-sm font-bold">실시간 데이터를 가져오지 못했습니다</p>
          <p className="text-xs text-muted-foreground">잠시 후 다시 시도해 주세요</p>
          <Button size="sm" variant="outline" onClick={handleRetry} className="mt-2">다시 검색</Button>
        </div>
      )}

      {currentView === 'empty' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MapPinXIcon className="size-9 text-muted-foreground" />
          <p className="text-sm font-bold">경로를 찾을 수 없습니다</p>
          <p className="text-xs text-muted-foreground">서울 서비스 범위 내 출발지·목적지를 입력해 주세요</p>
        </div>
      )}
    </div>
  )
}
