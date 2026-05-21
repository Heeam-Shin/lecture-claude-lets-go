import type { Route } from '@/types/route'

export async function calculateRoutes(_from: string, _to: string): Promise<Route[]> {
  const routes: Route[] = [
    {
      totalMinutes: 28,
      isShortest: true,
      segments: [
        { type: 'walk', minutes: 3, label: '도보', subLabel: '서울역까지' },
        { type: 'subway', minutes: 20, label: '1호선', subLabel: '서울역 → 강남역' },
        { type: 'walk', minutes: 5, label: '도보', subLabel: '목적지까지' },
      ],
    },
    {
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
    },
    {
      totalMinutes: 41,
      isShortest: false,
      segments: [
        { type: 'walk', minutes: 3, label: '도보', subLabel: '서울역까지' },
        { type: 'subway', minutes: 28, label: '4호선', subLabel: '서울역 → 강남역' },
        { type: 'walk', minutes: 10, label: '도보', subLabel: '목적지까지' },
      ],
    },
  ]

  return routes.sort((a, b) => a.totalMinutes - b.totalMinutes)
}
