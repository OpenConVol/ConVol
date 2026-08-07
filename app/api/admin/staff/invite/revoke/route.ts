import { pool } from '@/src/lib/db'
import { getSessionStaff } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/** Revoke a pending (unaccepted) staff invite. */
export async function POST(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const inviteId = typeof body.inviteId === 'string' ? body.inviteId : ''
  if (!inviteId) {
    return NextResponse.json({ error: 'inviteId is required' }, { status: 400 })
  }

  await pool.query('DELETE FROM staff_invites WHERE id = $1 AND accepted_at IS NULL', [inviteId])
  return NextResponse.json({ ok: true })
}
