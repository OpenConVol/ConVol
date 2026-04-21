import { supabase } from '@/src/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const apiKey = process.env.SCHED_API_KEY
  const eventUrl = process.env.SCHED_EVENT_URL

  if (!apiKey || !eventUrl) {
    return NextResponse.json({ error: 'Sched not configured' }, { status: 500 })
  }

  // Fetch sessions from Sched API
  const url = `https://${eventUrl}/api/session/list?api_key=${apiKey}&format=json&status=active`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ConVol/1.0' }
  })

  if (!res.ok) {
    return NextResponse.json({ error: `Sched API error: ${res.status}` }, { status: 500 })
  }

  const sessions = await res.json()

  if (!Array.isArray(sessions)) {
    return NextResponse.json({ error: 'Unexpected Sched response', data: sessions }, { status: 500 })
  }

  // Upsert into sched_events
  const records = sessions.map((s: any) => ({
    sched_id: s.id,
    title: s.name,
    description: s.description ?? '',
    location: s.venue ?? '',
    start_time: s.event_start ? new Date(s.event_start).toISOString() : null,
    end_time: s.event_end ? new Date(s.event_end).toISOString() : null,
    event_type: s.event_type ?? '',
    last_synced: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('sched_events')
    .upsert(records, { onConflict: 'sched_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    synced: records.length,
    sessions: records
  })
}
