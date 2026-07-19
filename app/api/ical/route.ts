import { queryOne, queryMany } from '@/src/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  // Find volunteer
  const volunteer = await queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM volunteers WHERE email = $1',
    [email]
  )

  if (!volunteer) {
    return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
  }

  // Get their signups
  const signups = await queryMany<{
    shift_id: string
    shifts: {
      start_time: string
      end_time: string
      description: string | null
      shift_types: { name: string } | null
      locations: { name: string } | null
      departments: { name: string } | null
    } | null
  }>(
    `SELECT sg.shift_id,
      jsonb_build_object(
        'start_time', s.start_time,
        'end_time', s.end_time,
        'description', s.description,
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

  // Build iCal
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ConVol//Volunteer Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${volunteer.name} - Volunteer Shifts`,
  ]

  signups.forEach(signup => {
    const shift = signup.shifts as any
    if (!shift) return

    const start = new Date(shift.start_time)
    const end = new Date(shift.end_time)

    const formatDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    lines.push('BEGIN:VEVENT')
    lines.push(`DTSTART:${formatDate(start)}`)
    lines.push(`DTEND:${formatDate(end)}`)
    lines.push(`SUMMARY:${shift.shift_types?.name} - Volunteer Shift`)
    lines.push(`LOCATION:${shift.locations?.name}`)
    lines.push(`DESCRIPTION:Department: ${shift.departments?.name}${shift.description ? '\\n' + shift.description : ''}`)
    lines.push(`UID:convol-${signup.shift_id}-${volunteer.id}@convol`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="volunteer-schedule.ics"`,
    },
  })
}
