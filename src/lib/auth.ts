import 'server-only'
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { queryOne } from '@/src/lib/db'

/**
 * Staff authentication for ConVol.
 *
 * Implements docs/architecture/decisions.md Decision 1 (staff side): staff
 * accounts live in ConVol, authenticate with email + password, and carry a
 * `role` for future authorization. Volunteers do NOT use any of this — they
 * are identified by email against Sched and never log in.
 *
 * Design notes:
 *   - Passwords are hashed with scrypt (Node built-in, no native deps to build
 *     in the Docker image).
 *   - Sessions are stateless, signed cookies (HMAC-SHA256 over a small JSON
 *     payload) — no sessions table to maintain. Rotating SESSION_SECRET
 *     invalidates every session at once.
 *   - Everything here is server-only. Route handlers and server components
 *     call it; nothing reaches the browser.
 */

const COOKIE_NAME = 'convol_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const SCRYPT_KEYLEN = 64

export type Staff = { id: string; email: string; role: string }

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 16) {
    throw new Error(
      'SESSION_SECRET is unset or too short (min 16 chars). Refusing to sign sessions.'
    )
  }
  return s
}

// ---- password hashing (scrypt) -------------------------------------------

/** Returns `scrypt$<base64 salt>$<base64 hash>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

/** Constant-time verify against a value produced by {@link hashPassword}. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[1], 'base64')
  const expected = Buffer.from(parts[2], 'base64')
  if (expected.length === 0) return false
  const actual = scryptSync(password, salt, expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

// ---- signed session token -------------------------------------------------

function signPayload(payloadB64: string): string {
  return createHmac('sha256', sessionSecret()).update(payloadB64).digest('base64url')
}

export function createSessionToken(staffId: string): string {
  const now = Math.floor(Date.now() / 1000)
  const payload = { sub: staffId, iat: now, exp: now + SESSION_TTL_SECONDS }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${payloadB64}.${signPayload(payloadB64)}`
}

export function verifySessionToken(token: string | undefined): { sub: string } | null {
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const payloadB64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expectedSig = signPayload(payloadB64)
  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
      sub?: unknown
      exp?: unknown
    }
    if (typeof payload.sub !== 'string') return null
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    return { sub: payload.sub }
  } catch {
    return null
  }
}

// ---- cookie + staff lookup ------------------------------------------------

export async function setSessionCookie(staffId: string): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE_NAME, createSessionToken(staffId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

/** The signed-in staff member, or null. Verifies the cookie AND that the row still exists. */
export async function getSessionStaff(): Promise<Staff | null> {
  const jar = await cookies()
  const payload = verifySessionToken(jar.get(COOKIE_NAME)?.value)
  if (!payload) return null
  return queryOne<Staff>('SELECT id, email, role FROM staff WHERE id = $1', [payload.sub])
}

/** How many staff exist. 0 means the instance is unclaimed and /setup is open. */
export async function staffCount(): Promise<number> {
  const row = await queryOne<{ count: number }>('SELECT COUNT(*)::int AS count FROM staff')
  return row?.count ?? 0
}
