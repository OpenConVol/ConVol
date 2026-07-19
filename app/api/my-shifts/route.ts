import { queryOne, queryMany } from '@/src/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const volunteer = await queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM volunteers WHERE email = $1',
    [email]
  )

  if (!volunteer) {
    return NextResponse.json({ error: 'No volunteer found with that email.' }, { status: 404 })
  }

  const signups = await queryMany<{
    shift_id: string
    shifts: {
      id: string
      start_time: string
      end_time: string
      volunteers_needed: number
      shift_types: { name: string } | null
      locations: { name: string } | null
      departments: { name: string } | null
    } | null
  }>(
    `SELECT sg.shift_id,
      jsonb_build_object(
        'id', s.id,
        'start_time', s.start_time,
        'end_time', s.end_time,
        'volunteers_needed', s.volunteers_needed,
        'shift_types', jsonb_build_object('name', st.name),
        'locations', jsonb_build_object('name', l.name),
        'departments', jsonb_build_object('name', d.name)
      ) AS shifts
     FROM signups sg
     LEFT JOIN shifts s ON s.id = sg.shift_id
     LEFT JOIN shift_types st ON st.id = s.shift_type_id
     LEFT JOIN locations l ON l.id = s.location_id
     LEFT JOIN departments d ON d.id = s.department_id
     WHERE sg.volunteer_id = $1`,
    [volunteer.id]
  )

  const checkins = await queryMany<{ shift_id: string }>(
    'SELECT shift_id FROM checkins WHERE volunteer_id = $1',
    [volunteer.id]
  )
  const checkedInShifts = new Set(checkins.map(c => c.shift_id))

  const shifts = signups
    .map(s => (s.shifts ? { ...s.shifts, checked_in: checkedInShifts.has(s.shifts.id) } : null))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const ticketRow = await queryOne<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM raffle_tickets WHERE volunteer_id = $1',
    [volunteer.id]
  )

  return NextResponse.json({
    volunteer,
    shifts,
    ticketCount: ticketRow?.count ?? 0,
  })
}
