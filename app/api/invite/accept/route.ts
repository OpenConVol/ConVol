import { pool, queryOne } from '@/src/lib/db'
import { hashInviteToken, hashPassword, setSessionCookie } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Accept a staff invite: the invitee sets their password, which creates their
 * staff account and signs them in. Public route — the unguessable token is the
 * credential. Valid only while the invite is unaccepted and unexpired.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!token) {
    return NextResponse.json({ error: 'Invalid invite.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const invite = await queryOne<{ id: string; email: string; role: string }>(
    `SELECT id, email, role FROM staff_invites
     WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > now()`,
    [hashInviteToken(token)]
  )
  if (!invite) {
    return NextResponse.json({ error: 'This invite is invalid or has expired.' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Mark accepted first; the WHERE clause makes concurrent double-accept a no-op.
    const claim = await client.query(
      'UPDATE staff_invites SET accepted_at = now() WHERE id = $1 AND accepted_at IS NULL',
      [invite.id]
    )
    if (claim.rowCount === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'This invite was already used.' }, { status: 409 })
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO staff (email, password_hash, role) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [invite.email, hashPassword(password), invite.role]
    )
    if (inserted.rows.length === 0) {
      // A staff account with this email already existed.
      await client.query('COMMIT')
      return NextResponse.json(
        { error: 'An account for that email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    await client.query('COMMIT')
    await setSessionCookie(inserted.rows[0].id)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    await client.query('ROLLBACK')
    return NextResponse.json({ error: 'Could not accept the invite.' }, { status: 500 })
  } finally {
    client.release()
  }
}
