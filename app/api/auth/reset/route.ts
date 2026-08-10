import { pool, queryOne } from '@/src/lib/db'
import { hashInviteToken, hashPassword, setSessionCookie } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Complete a password reset: validate the one-time token, set the new
 * password, and sign the staff member in. Public route (the unguessable token
 * is the credential). The token is claimed (marked used) in the same statement
 * that checks it, so it can't be replayed.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token) {
    return NextResponse.json({ error: 'Invalid reset link.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Claim the token: only succeeds if unused and unexpired.
    const claim = await client.query<{ email: string }>(
      `UPDATE password_resets SET used_at = now()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       RETURNING email`,
      [hashInviteToken(token)]
    )
    if (claim.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
    }

    const email = claim.rows[0].email
    const updated = await client.query<{ id: string }>(
      'UPDATE staff SET password_hash = $1 WHERE lower(email) = lower($2) RETURNING id',
      [hashPassword(password), email]
    )
    if (updated.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'No account found for this reset.' }, { status: 400 })
    }

    await client.query('COMMIT')
    await setSessionCookie(updated.rows[0].id)
    return NextResponse.json({ ok: true })
  } catch {
    await client.query('ROLLBACK')
    return NextResponse.json({ error: 'Could not reset the password.' }, { status: 500 })
  } finally {
    client.release()
  }
}
