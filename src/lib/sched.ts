import 'server-only'

/**
 * Sched integration config, per docs/architecture/decisions.md Decision 4
 * (Sched-dependent features).
 *
 * Reads `SCHED_URL` / `SCHED_TOKEN` — the names actually provisioned in the
 * deployment environment. Older code read `SCHED_EVENT_URL` / `SCHED_API_KEY`;
 * those are accepted as a fallback so nothing breaks during the rename.
 *
 * Returns null when Sched is not configured. Callers MUST treat null as
 * "Sched features are inert" and degrade gracefully — never throw. Without
 * these vars set, ConVol still runs; it just cannot pull schedule data.
 */
export function getSchedConfig(): { url: string; token: string } | null {
  const url = process.env.SCHED_URL || process.env.SCHED_EVENT_URL
  const token = process.env.SCHED_TOKEN || process.env.SCHED_API_KEY
  if (!url || !token) return null
  return { url, token }
}

/**
 * Fetches the sessions a Sched user (identified by email) is going to.
 *
 * Returns an array of raw Sched session objects, or null if Sched is
 * unconfigured, the user is unknown to Sched ("ERR..." responses), or the
 * request fails. A non-null (even empty) array means Sched positively
 * recognized the email — which is what the volunteer auto-provision flow uses
 * to decide whether an email belongs to a real attendee.
 */
export async function fetchSchedGoing(email: string): Promise<unknown[] | null> {
  const cfg = getSchedConfig()
  if (!cfg) return null

  const url = `https://${cfg.url}/api/going/list?api_key=${cfg.token}&username=${encodeURIComponent(
    email
  )}&format=json`

  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'ConVol/1.0' } })
    const text = await res.text()
    // Sched returns error strings like "ERR: ..." when a user is not found.
    if (text.startsWith('ERR') || text.startsWith('err')) return null
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}
