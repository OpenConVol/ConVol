import { pool } from '@/src/lib/db'
import { getSessionStaff } from '@/src/lib/auth'
import { getSchedConfig } from '@/src/lib/sched'
import { NextResponse } from 'next/server'

export async function POST() {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sched = getSchedConfig()
  if (!sched) {
    return NextResponse.json({ error: 'Sched not configured' }, { status: 500 })
  }

  // Fetch sessions from Sched API
  const url = `https://${sched.url}/api/session/list?api_key=${sched.token}&format=json&status=active`

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

  try {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const r of records) {
        await client.query(
          `INSERT INTO sched_events (sched_id, title, description, location, start_time, end_time, event_type, last_synced)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (sched_id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             location = EXCLUDED.location,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             event_type = EXCLUDED.event_type,
             last_synced = EXCLUDED.last_synced`,
          [
            r.sched_id,
            r.title,
            r.description,
            r.location,
            r.start_time,
            r.end_time,
            r.event_type,
            r.last_synced,
          ]
        )
      }
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    synced: records.length,
    sessions: records
  })
}
