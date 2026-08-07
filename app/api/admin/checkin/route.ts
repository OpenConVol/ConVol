import { pool } from '@/src/lib/db'
import { getSessionStaff } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const { shiftId, volunteerId } = body as { shiftId?: string; volunteerId?: string }

  if (!shiftId || !volunteerId) {
    return NextResponse.json({ error: 'shiftId and volunteerId are required' }, { status: 400 })
  }

  try {
    await pool.query(
      'INSERT INTO checkins (shift_id, volunteer_id, checked_in_by) VALUES ($1, $2, $3)',
      [shiftId, volunteerId, staff.email]
    )
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'already_checked_in' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const { shiftId, volunteerId } = body as { shiftId?: string; volunteerId?: string }

  if (!shiftId || !volunteerId) {
    return NextResponse.json({ error: 'shiftId and volunteerId are required' }, { status: 400 })
  }

  await pool.query(
    'DELETE FROM checkins WHERE shift_id = $1 AND volunteer_id = $2',
    [shiftId, volunteerId]
  )

  return NextResponse.json({ success: true })
}
