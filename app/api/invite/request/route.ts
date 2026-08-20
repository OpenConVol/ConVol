import { queryOne } from '@/src/lib/db'
import { createInvite } from '@/src/lib/invite'
import { sendEmail } from '@/src/lib/email'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Self-service "request a new invite link" (for when the original expired).
 *
 * Public, but deliberately NOT an open signup: a fresh invite is only issued to
 * an email that an admin previously invited. That keeps this from becoming a
 * way for anyone to mint themselves an admin account. Always responds ok so it
 * can't be used to probe which emails are known.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (email && email.includes('@')) {
    const staff = await queryOne<{ id: string }>('SELECT id FROM staff WHERE lower(email) = $1', [email])
    if (staff) {
      // Already has an account: point them at sign-in / reset, don't re-invite.
      await sendEmail({
        to: email,
        subject: 'You already have a ConVol account',
        text: `You already have a ConVol staff account. Sign in at ${request.nextUrl.origin}/login, or use "Forgot your password?" if you need to reset it.`,
        html: `<p>You already have a ConVol staff account.</p><p><a href="${request.nextUrl.origin}/login">Sign in</a>, or use "Forgot your password?" if you need to reset it.</p>`,
      })
    } else {
      const priorInvite = await queryOne<{ id: string }>(
        'SELECT id FROM staff_invites WHERE lower(email) = $1 LIMIT 1',
        [email]
      )
      if (priorInvite) {
        await createInvite({
          email,
          createdBy: 'self-request',
          origin: request.nextUrl.origin,
          sendMail: true,
        })
      }
      // If never invited: silently do nothing (no open signup).
    }
  }

  return NextResponse.json({ ok: true })
}
