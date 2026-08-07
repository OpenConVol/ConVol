import { queryOne } from '@/src/lib/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Public raffle lookup by email — returns only the caller's own count.
 *
 * This replaces the previous /raffle page, which rendered every volunteer's
 * name and ticket count to any anonymous visitor. Volunteers identify by the
 * same email they use elsewhere (docs/architecture/decisions.md Decision 1);
 * the full roster now lives only in the auth-protected /admin/raffle.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const volunteer = await queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM volunteers WHERE lower(email) = $1',
    [email]
  )

  if (!volunteer) {
    return NextResponse.json({ error: 'No volunteer found with that email.' }, { status: 404 })
  }

  const row = await queryOne<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM raffle_tickets WHERE volunteer_id = $1',
    [volunteer.id]
  )

  return NextResponse.json({ name: volunteer.name, ticketCount: row?.count ?? 0 })
}
