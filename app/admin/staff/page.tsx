import { getSessionStaff } from '@/src/lib/auth'
import { queryMany } from '@/src/lib/db'
import StaffManager from './StaffManager'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  // The admin layout already guards this subtree; re-read for the current id
  // so the UI can disable "remove" on your own row.
  const me = await getSessionStaff()

  const staff = await queryMany<{
    id: string
    email: string
    role: string
    created_at: string
    last_login_at: string | null
  }>('SELECT id, email, role, created_at, last_login_at FROM staff ORDER BY created_at')

  const invites = await queryMany<{
    id: string
    email: string
    created_at: string
    expires_at: string
  }>(
    `SELECT id, email, created_at, expires_at FROM staff_invites
     WHERE accepted_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">← Admin</a>
          <h1 className="text-4xl font-bold text-white mb-2">Staff</h1>
          <p className="text-gray-400">Invite coordinators and manage who can sign in.</p>
        </div>
        <StaffManager
          currentStaffId={me?.id ?? ''}
          initialStaff={staff}
          initialInvites={invites}
        />
      </div>
    </main>
  )
}
