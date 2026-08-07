import { pool, queryOne } from '@/src/lib/db'
import { generateInviteToken, getSessionStaff } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const INVITE_TTL_DAYS = 7

/**
 * Create a staff invite. Returns a one-time token the caller turns into a link
 * (`/invite/<token>`). The token is shown only in this response — only its hash
 * is stored — so it cannot be retrieved again later; revoke and re-create if
 * it's lost.
 */
export async function POST(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM staff WHERE lower(email) = $1',
    [email]
  )
  if (existing) {
    return NextResponse.json(
      { error: 'A staff account with that email already exists.' },
      { status: 409 }
    )
  }

  const { token, tokenHash } = generateInviteToken()
  const { rows } = await pool.query<{ id: string; expires_at: string }>(
    `INSERT INTO staff_invites (email, token_hash, role, created_by, expires_at)
     VALUES ($1, $2, 'staff', $3, now() + ($4 || ' days')::interval)
     RETURNING id, expires_at`,
    [email, tokenHash, staff.email, String(INVITE_TTL_DAYS)]
  )

  return NextResponse.json(
    { id: rows[0].id, email, token, expiresAt: rows[0].expires_at },
    { status: 201 }
  )
}
