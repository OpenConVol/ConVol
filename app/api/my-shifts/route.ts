import { queryOne, queryMany } from '@/src/lib/db'
import { fetchSchedGoing } from '@/src/lib/sched'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Derives a display name from an email local-part, e.g.
 * "jane.doe@x.com" -> "Jane Doe". A placeholder until the volunteer edits it.
 */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? email
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || email
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawEmail = searchParams.get('email')

  if (!rawEmail) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }
  const email = rawEmail.trim().toLowerCase()

  let volunteer = await queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM volunteers WHERE lower(email) = $1',
    [email]
  )

  // Auto-provision from Sched: if this email isn't a volunteer yet but Sched
  // recognizes it as a real attendee, create the volunteer record instead of
  // turning them away (docs/architecture/decisions.md Decision 1). When Sched
  // is unconfigured, fetchSchedGoing returns null and behavior is unchanged.
  if (!volunteer) {
    const going = await fetchSchedGoing(email)
    if (going === null) {
      return NextResponse.json({ error: 'No volunteer found with that email.' }, { status: 404 })
    }
    volunteer = await queryOne<{ id: string; name: string }>(
      `INSERT INTO volunteers (name, email) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id, name`,
      [nameFromEmail(email), email]
    )
    if (!volunteer) {
      return NextResponse.json({ error: 'Could not look up that email.' }, { status: 500 })
    }
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
