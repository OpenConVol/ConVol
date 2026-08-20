import 'server-only'
import { pool } from '@/src/lib/db'
import { generateInviteToken } from '@/src/lib/auth'
import { sendEmail } from '@/src/lib/email'

export const INVITE_TTL_DAYS = 7

/** Email body for a staff invite. No em-dashes (goes to real people). */
function inviteContent(link: string, replyTo?: string) {
  const contact = replyTo ? `\n\nQuestions? Just reply to this email (${replyTo}).` : ''
  return {
    subject: 'Your ConVol invitation (JordanCon volunteer system)',
    text:
      `You've been invited to ConVol, an open-source volunteer management system built for JordanCon.\n\n` +
      `Set up your account and take a look: ${link}\n\n` +
      `This link is just for you and expires in ${INVITE_TTL_DAYS} days.${contact}`,
    html:
      `<p>You've been invited to <strong>ConVol</strong>, an open-source volunteer management system built for JordanCon.</p>` +
      `<p><a href="${link}">Set up your account and take a look</a></p>` +
      `<p style="color:#6b7280;font-size:13px">This link is just for you and expires in ${INVITE_TTL_DAYS} days.</p>` +
      (replyTo
        ? `<p style="color:#6b7280;font-size:13px">Questions? Just reply to this email (${replyTo}).</p>`
        : ''),
  }
}

/**
 * Create a staff invite and (by default) email the link to the invitee.
 * Returns the raw token/link too, so an admin UI can still show a copyable link.
 * Emailing is best-effort (never throws), matching the mailer's posture.
 */
export async function createInvite(opts: {
  email: string
  createdBy: string
  origin: string
  replyTo?: string
  sendMail?: boolean
}): Promise<{ id: string; token: string; link: string; expiresAt: string }> {
  const email = opts.email.trim().toLowerCase()
  const { token, tokenHash } = generateInviteToken()
  const { rows } = await pool.query<{ id: string; expires_at: string }>(
    `INSERT INTO staff_invites (email, token_hash, role, created_by, expires_at)
     VALUES ($1, $2, 'staff', $3, now() + ($4 || ' days')::interval)
     RETURNING id, expires_at`,
    [email, tokenHash, opts.createdBy, String(INVITE_TTL_DAYS)]
  )
  const link = `${opts.origin}/invite/${token}`
  if (opts.sendMail !== false) {
    await sendEmail({ to: email, replyTo: opts.replyTo, ...inviteContent(link, opts.replyTo) })
  }
  return { id: rows[0].id, token, link, expiresAt: rows[0].expires_at }
}
