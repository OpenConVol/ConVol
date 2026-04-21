import { supabase } from '@/src/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  // Find volunteer
  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('id, name')
    .eq('email', email)
    .single()

  if (!volunteer) {
    return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
  }

  // Get their signups
  const { data: signups } = await supabase
    .from('signups')
    .select(`
      shift_id,
      shifts(
        start_time,
        end_time,
        description,
        shift_types(name),
        locations(name),
        departments(name)
      )
    `)
    .eq('volunteer_id', volunteer.id)

  // Build iCal
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ConVol//Volunteer Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${volunteer.name} - Volunteer Shifts`,
  ]

  signups?.forEach(signup => {
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
