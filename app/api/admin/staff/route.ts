import { queryOne } from '@/src/lib/db'
import { getSessionStaff } from '@/src/lib/auth'
import { createInvite } from '@/src/lib/invite'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Create a staff invite. Emails the link to the invitee (Reply-To the inviting
 * staff member) and also returns the one-time token so the admin UI can show a
 * copyable link as a fallback. Only the token hash is stored, so the link can't
 * be retrieved later; revoke and re-create (or have them request a new one) if
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

  const invite = await createInvite({
    email,
    createdBy: staff.email,
    origin: request.nextUrl.origin,
    replyTo: staff.email,
    sendMail: true,
  })

  return NextResponse.json(
    { id: invite.id, email, token: invite.token, expiresAt: invite.expiresAt, emailed: true },
    { status: 201 }
  )
}
