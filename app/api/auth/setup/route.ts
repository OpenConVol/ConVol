import { pool } from '@/src/lib/db'
import { hashPassword, setSessionCookie, staffCount } from '@/src/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * First-run setup: create the very first staff account.
 *
 * Only works while zero staff exist — once the instance is claimed, this
 * route is closed (403). If CONVOL_ROOT_ADMIN_EMAIL is set, only that email
 * may claim the root account (see docs/architecture/decisions.md Decision 1,
 * "bootstrap root-admin email").
 */
export async function POST(request: NextRequest) {
  if ((await staffCount()) > 0) {
    return NextResponse.json({ error: 'Setup already completed.' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const rootEmail = process.env.CONVOL_ROOT_ADMIN_EMAIL?.trim().toLowerCase()
  if (rootEmail && email !== rootEmail) {
    return NextResponse.json(
      { error: 'This instance is configured to accept a specific root admin email.' },
      { status: 403 }
    )
  }

  try {
    const { rows } = await pool.query<{ id: string }>(
      'INSERT INTO staff (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
      [email, hashPassword(password), 'staff']
    )
    await setSessionCookie(rows[0].id)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    // 23505 = unique_violation: someone claimed it between the count and insert.
    if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Setup already completed.' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Could not create the account.' }, { status: 500 })
  }
}
