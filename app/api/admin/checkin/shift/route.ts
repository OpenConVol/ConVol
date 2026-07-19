// TODO(#16): protect this route behind staff auth
import { queryMany } from '@/src/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const shiftId = searchParams.get('shiftId')

  if (!shiftId) {
    return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
  }

  const signups = await queryMany(
    `SELECT sg.*,
      jsonb_build_object('id', v.id, 'name', v.name, 'email', v.email) AS volunteers
     FROM signups sg
     LEFT JOIN volunteers v ON v.id = sg.volunteer_id
     WHERE sg.shift_id = $1`,
    [shiftId]
  )

  const checkins = await queryMany<{ volunteer_id: string }>(
    'SELECT volunteer_id FROM checkins WHERE shift_id = $1',
    [shiftId]
  )

  return NextResponse.json({ signups, checkins })
}
