import 'server-only'

/**
 * Email delivery via the Resend HTTP API.
 *
 * Same posture as the chores mailer: email is best-effort and must never be
 * fatal. If RESEND_API_KEY / EMAIL_FROM are unset, we log the message to the
 * server console (so a reset link is still recoverable from `docker logs`)
 * rather than throwing. Uses `fetch` only, so there is no new dependency.
 *
 * Configure in prod (.env.production):
 *   RESEND_API_KEY=...            (a Resend API key; same account chores uses)
 *   EMAIL_FROM=ConVol <no-reply@your-verified-domain>
 */

export type EmailMessage = { to: string; subject: string; html: string; text?: string }

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!key || !from) {
    console.info(
      `[mail:console] (RESEND_API_KEY/EMAIL_FROM unset, not sent) to=${msg.to} subject=${JSON.stringify(msg.subject)}`
    )
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        ...(msg.text ? { text: msg.text } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[mail:resend] send failed HTTP ${res.status}: ${body.slice(0, 300)}`)
    }
  } catch (err) {
    console.error('[mail:resend] error', err instanceof Error ? err.message : String(err))
  }
}
