import { hashInviteToken } from '@/src/lib/auth'
import { queryOne } from '@/src/lib/db'
import AcceptInviteForm from './AcceptInviteForm'
import RequestInviteForm from './RequestInviteForm'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Validate AND record the view in one step: the row only updates if the
  // invite is still valid (unaccepted, unexpired). Note: some mail systems
  // pre-fetch links to scan them, so a view can be a scanner, not a human.
  const invite = await queryOne<{ email: string }>(
    `UPDATE staff_invites
       SET viewed_at = COALESCE(viewed_at, now()),
           last_viewed_at = now(),
           view_count = view_count + 1
     WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > now()
     RETURNING email`,
    [hashInviteToken(token)]
  )

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {!invite ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3">Invite unavailable</h1>
              <p className="text-gray-400 text-sm">
                This invite link is invalid, has already been used, or has expired. If you were
                invited, request a fresh link below and we&apos;ll email it to you.
              </p>
            </div>
            <RequestInviteForm />
            <a href="/login" className="text-gray-500 hover:text-[var(--app-text)] text-sm mt-8 block text-center">
              Already set up? Sign in
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
