import { pool } from '@/src/lib/db'
import { getSessionStaff } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const { volunteerId, shiftId } = body as { volunteerId?: string; shiftId?: string }

  if (!volunteerId || !shiftId) {
    return NextResponse.json({ error: 'volunteerId and shiftId are required' }, { status: 400 })
  }

  await pool.query(
    `INSERT INTO raffle_tickets (volunteer_id, shift_id, awarded_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (shift_id, volunteer_id) DO NOTHING`,
    [volunteerId, shiftId, staff.email]
  )

  return NextResponse.json({ success: true }, { status: 201 })
}
