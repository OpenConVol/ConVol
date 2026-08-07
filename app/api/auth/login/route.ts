import { pool } from '@/src/lib/db'
import { setSessionCookie, verifyPassword } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const { rows } = await pool.query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM staff WHERE email = $1',
    [email]
  )
  const staff = rows[0]

  // Same response whether the email is unknown or the password is wrong.
  if (!staff || !verifyPassword(password, staff.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  await pool.query('UPDATE staff SET last_login_at = now() WHERE id = $1', [staff.id])
  await setSessionCookie(staff.id)
  return NextResponse.json({ ok: true })
}
