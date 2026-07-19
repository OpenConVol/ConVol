import { pool } from '@/src/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { shiftId, name, email } = body as { shiftId?: string; name?: string; email?: string }

  if (!shiftId || !name || !email) {
    return NextResponse.json({ error: 'shiftId, name, and email are required' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const volunteerResult = await client.query<{ id: string }>(
      `INSERT INTO volunteers (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name, email]
    )
    const volunteerId = volunteerResult.rows[0].id

    await client.query(
      'INSERT INTO signups (shift_id, volunteer_id) VALUES ($1, $2)',
      [shiftId, volunteerId]
    )

    return NextResponse.json({ volunteerId }, { status: 201 })
  } catch (err: any) {
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'already_signed_up' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  } finally {
    client.release()
  }
}
