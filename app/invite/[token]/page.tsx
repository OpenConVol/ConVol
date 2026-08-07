import { hashInviteToken } from '@/src/lib/auth'
import { queryOne } from '@/src/lib/db'
import AcceptInviteForm from './AcceptInviteForm'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const invite = await queryOne<{ email: string }>(
    `SELECT email FROM staff_invites
     WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > now()`,
    [hashInviteToken(token)]
  )

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {!invite ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">Invite unavailable</h1>
            <p className="text-gray-400 text-sm mb-8">
              This invite link is invalid, has already been used, or has expired. Ask a
              coordinator to send you a new one.
            </p>
            <a href="/login" className="text-indigo-400 hover:underline text-sm">
              Go to sign in
            </a>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Set up your account</h1>
            <p className="text-gray-400 text-sm mb-8">
              Create a password for <span className="text-[var(--app-text)]">{invite.email}</span>.
            </p>
            <AcceptInviteForm token={token} email={invite.email} />
          </>
        )}
      </div>
    </main>
  )
}
