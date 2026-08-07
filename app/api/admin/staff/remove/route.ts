import { pool } from '@/src/lib/db'
import { getSessionStaff } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Remove a staff account. Guards against the two lockout footguns: you cannot
 * remove yourself, and you cannot remove the last remaining staff account.
 */
export async function POST(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const staffId = typeof body.staffId === 'string' ? body.staffId : ''
  if (!staffId) {
    return NextResponse.json({ error: 'staffId is required' }, { status: 400 })
  }
  if (staffId === staff.id) {
    return NextResponse.json({ error: 'You cannot remove your own account.' }, { status: 400 })
  }

  const { rows } = await pool.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM staff')
  if ((rows[0]?.count ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot remove the last staff account.' }, { status: 400 })
  }

  const result = await pool.query('DELETE FROM staff WHERE id = $1', [staffId])
  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'No such staff account.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
