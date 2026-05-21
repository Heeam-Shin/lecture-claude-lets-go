import { NextResponse } from 'next/server'
import { calculateRoutes } from '@/services/routeCalculator'

export async function POST(request: Request) {
  const body = await request.json()
  const { from, to } = body as { from: string; to: string }

  try {
    const routes = await calculateRoutes(from, to)
    return NextResponse.json(
      { routes },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      { error: 'realtime_api_error' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
