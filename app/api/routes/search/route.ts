import { NextResponse } from 'next/server'
import { calculateRoutes } from '@/services/routeCalculator'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: NO_STORE })
  }

  const b = body as Record<string, unknown>
  if (typeof b?.from !== 'string' || !b.from || typeof b?.to !== 'string' || !b.to) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: NO_STORE })
  }

  try {
    const routes = await calculateRoutes(b.from, b.to)
    return NextResponse.json({ routes }, { headers: NO_STORE })
  } catch {
    return NextResponse.json({ error: 'realtime_api_error' }, { status: 502, headers: NO_STORE })
  }
}
