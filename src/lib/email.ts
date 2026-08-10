import 'server-only'

/**
 * Email delivery via the Brevo transactional email HTTP API.
 *
 * Same posture as the chores mailer: email is best-effort and must never be
 * fatal. If BREVO_API_KEY / EMAIL_FROM are unset, we log the message (including
 * any reset link) to the server console rather than throwing. Uses `fetch`
 * only, so there is no new dependency.
 *
 * Configure in prod (.env.production):
 *   BREVO_API_KEY=...                        (a Brevo API v3 key)
 *   EMAIL_FROM=ConVol <noreply@yourdomain>   (sender must be verified in Brevo)
 */

export type EmailMessage = { to: string; subject: string; html: string; text?: string }

export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM)
}

/** Parse `EMAIL_FROM` ("Name <email>" or "email") into Brevo's sender object. */
function parseSender(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (m) return { name: m[1] || 'ConVol', email: m[2].trim() }
  return { name: 'ConVol', email: from.trim() }
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const key = process.env.BREVO_API_KEY
  const from = process.env.EMAIL_FROM

  if (!key || !from) {
    console.info(
      `[mail:console] (BREVO_API_KEY/EMAIL_FROM unset, not sent) to=${msg.to} subject=${JSON.stringify(msg.subject)}`
    )
    return
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: parseSender(from),
        to: [{ email: msg.to }],
        subject: msg.subject,
        htmlContent: msg.html,
        ...(msg.text ? { textContent: msg.text } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[mail:brevo] send failed HTTP ${res.status}: ${body.slice(0, 300)}`)
    }
  } catch (err) {
    console.error('[mail:brevo] error', err instanceof Error ? err.message : String(err))
  }
}
