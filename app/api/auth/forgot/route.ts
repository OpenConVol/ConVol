import { pool, queryOne } from '@/src/lib/db'
import { generateInviteToken } from '@/src/lib/auth'
import { sendEmail } from '@/src/lib/email'
import { NextRequest, NextResponse } from 'next/server'

const RESET_TTL_MINUTES = 60

/**
 * Start a password reset. Public. Always responds { ok: true } regardless of
 * whether the email matches a staff account, so it can't be used to discover
 * which addresses have logins. When it does match, we store a hashed one-time
 * token and email the reset link (via Resend; logs to console if unconfigured).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (email && email.includes('@')) {
    const staff = await queryOne<{ id: string; email: string }>(
      'SELECT id, email FROM staff WHERE lower(email) = $1',
      [email]
    )
    if (staff) {
      const { token, tokenHash } = generateInviteToken()
      await pool.query(
        `INSERT INTO password_resets (email, token_hash, expires_at)
         VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
        [staff.email, tokenHash, String(RESET_TTL_MINUTES)]
      )
      const link = `${request.nextUrl.origin}/reset/${token}`
      await sendEmail({
        to: staff.email,
        subject: 'Reset your ConVol password',
        text: `Reset your ConVol password: ${link}\n\nThis link expires in ${RESET_TTL_MINUTES} minutes. If you didn't request it, you can ignore this email.`,
        html: `<p>Someone (hopefully you) asked to reset your ConVol password.</p>
<p><a href="${link}">Choose a new password</a></p>
<p style="color:#6b7280;font-size:13px">This link expires in ${RESET_TTL_MINUTES} minutes. If you didn't request it, you can ignore this email and your password stays the same.</p>`,
      })
    }
  }

  // Same response either way.
  return NextResponse.json({ ok: true })
}
