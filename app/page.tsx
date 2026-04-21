import { supabase } from '@/src/lib/supabase'
export const dynamic = 'force-dynamic'
export default async function Home() {
  const { count: shiftCount } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })

  const { count: volunteerCount } = await supabase
    .from('volunteers')
    .select('*', { count: 'exact', head: true })

  const { count: checkinCount } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">ConVol</h1>
          <p className="text-xl text-indigo-400">
            Volunteer management for fan conventions
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">{shiftCount ?? 0}</div>
            <div className="text-gray-400 text-sm">Shifts</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">{volunteerCount ?? 0}</div>
            <div className="text-gray-400 text-sm">Volunteers</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">{checkinCount ?? 0}</div>
            <div className="text-gray-400 text-sm">Check-ins</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <a href="/shifts" className="bg-indigo-600 hover:bg-indigo-500 rounded-xl p-8 transition-colors">
            <div className="text-2xl font-bold mb-2">Shifts</div>
            <div className="text-indigo-200 text-sm">Browse and sign up for volunteer shifts</div>
          </a>
          <a href="/my-shifts" className="bg-gray-900 hover:bg-gray-800 rounded-xl p-8 transition-colors">
            <div className="text-2xl font-bold mb-2">My Shifts</div>
            <div className="text-gray-400 text-sm">View your personal volunteer schedule</div>
          </a>
          <a href="/schedule" className="bg-purple-900 hover:bg-purple-800 rounded-xl p-8 transition-colors">
            <div className="text-2xl font-bold mb-2">Schedule</div>
            <div className="text-purple-300 text-sm">Full schedule — shifts and programming together</div>
          </a>
          <a href="/admin" className="bg-gray-900 hover:bg-gray-800 rounded-xl p-8 transition-colors">
            <div className="text-2xl font-bold mb-2">Admin</div>
            <div className="text-gray-400 text-sm">Manage shifts, volunteers, and check-ins</div>
          </a>
        </div>

      </div>
    </main>
  )
}
