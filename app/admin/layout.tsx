import { redirect } from 'next/navigation'
import { getSessionStaff, staffCount } from '@/src/lib/auth'
import LogoutButton from './LogoutButton'

/**
 * Auth guard for the entire /admin subtree (issue #16).
 *
 * Every page under /admin renders inside this layout, so an unauthenticated
 * request never reaches admin content: it is redirected to /setup (if the
 * instance has no staff yet) or /login. The matching /api/admin/* route
 * handlers guard themselves independently — a layout cannot protect API calls.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getSessionStaff()

  if (!staff) {
    if ((await staffCount()) === 0) redirect('/setup')
    redirect('/login')
  }

  return (
    <div>
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            Signed in as <span className="text-white">{staff.email}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  )
}
