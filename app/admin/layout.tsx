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
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-4 text-sm">
            <a href="/admin" className="text-gray-300 hover:text-white transition-colors">Admin</a>
            <a href="/admin/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
            <a href="/admin/checkin" className="text-gray-300 hover:text-white transition-colors">Check-in</a>
            <a href="/admin/raffle" className="text-gray-300 hover:text-white transition-colors">Raffle</a>
            <a href="/admin/staff" className="text-gray-300 hover:text-white transition-colors">Staff</a>
          </nav>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-gray-500 text-sm hidden sm:inline">{staff.email}</span>
            <LogoutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
