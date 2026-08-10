import { hashInviteToken } from '@/src/lib/auth'
import { queryOne } from '@/src/lib/db'
import ResetForm from './ResetForm'

export const dynamic = 'force-dynamic'

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const row = await queryOne<{ email: string }>(
    `SELECT email FROM password_resets
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [hashInviteToken(token)]
  )

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {!row ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Link unavailable</h1>
            <p className="text-gray-400 text-sm mb-8">
              This reset link is invalid, has already been used, or has expired. You can request a
              new one.
            </p>
            <a href="/forgot" className="text-indigo-400 hover:underline text-sm">
              Request a new link
            </a>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Choose a new password</h1>
            <p className="text-gray-400 text-sm mb-8">
              Setting a new password for <span className="text-[var(--app-text)]">{row.email}</span>.
            </p>
            <ResetForm token={token} />
          </>
        )}
      </div>
    </main>
  )
}
