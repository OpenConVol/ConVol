import { pool } from '@/src/lib/db'
import { getSessionStaff } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const { volunteerId } = body as { volunteerId?: string }

  if (!volunteerId) {
    return NextResponse.json({ error: 'volunteerId is required' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existing = await client.query<{ shift_id: string }>(
      'SELECT shift_id FROM raffle_tickets WHERE volunteer_id = $1',
      [volunteerId]
    )
    const ticketedShiftIds = new Set(existing.rows.map(r => r.shift_id))

    const checkins = await client.query<{ shift_id: string }>(
      'SELECT shift_id FROM checkins WHERE volunteer_id = $1',
      [volunteerId]
    )

    let awarded = 0
    for (const checkin of checkins.rows) {
      if (!ticketedShiftIds.has(checkin.shift_id)) {
        await client.query(
          `INSERT INTO raffle_tickets (volunteer_id, shift_id, awarded_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (shift_id, volunteer_id) DO NOTHING`,
          [volunteerId, checkin.shift_id, staff.email]
        )
        awarded++
      }
    }

    await client.query('COMMIT')
    return NextResponse.json({ awarded })
  } catch (err) {
    await client.query('ROLLBACK')
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    client.release()
  }
}
