import { supabase } from '@/src/lib/supabase'

export default async function AdminPage() {
  const { data: shifts } = await supabase
    .from('shifts')
    .select(`*, shift_types(name), locations(name), departments(name)`)
    .order('start_time')

  const { data: volunteers } = await supabase
    .from('volunteers')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')

  const { data: signups } = await supabase
    .from('signups')
    .select('*')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-4 block">
            ← Back
          </a>
          <h1 className="text-4xl font-bold text-white mb-2">Admin</h1>
          <p className="text-gray-400">Manage shifts, volunteers, and check-ins</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {shifts?.length ?? 0}
            </div>
            <div className="text-gray-400 text-sm">Shifts</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {volunteers?.length ?? 0}
            </div>
            <div className="text-gray-400 text-sm">Volunteers</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {signups?.length ?? 0}
            </div>
            <div className="text-gray-400 text-sm">Sign-ups</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {checkins?.length ?? 0}
            </div>
            <div className="text-gray-400 text-sm">Check-ins</div>
          </div>
        </div>
{/* Quick links */}
<div className="grid grid-cols-3 gap-4 mb-12">
  <a href="/admin/checkin"
    className="bg-indigo-600 hover:bg-indigo-500 rounded-xl p-6 transition-colors">
    <div className="font-bold text-lg mb-1">Check-in</div>
    <div className="text-indigo-200 text-sm">Mark volunteers as arrived</div>
  </a>
  <a href="/admin/dashboard"
    className="bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition-colors">
    <div className="font-bold text-lg mb-1">Dashboard</div>
    <div className="text-gray-400 text-sm">Real-time shift fill rates</div>
  </a>
  <a href="/admin/raffle"
    className="bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition-colors">
    <div className="font-bold text-lg mb-1">Raffle Tickets</div>
    <div className="text-gray-400 text-sm">Track and award volunteer tickets</div>
  </a>
</div>

        {/* Shifts table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Shifts</h2>
          {!shifts || shifts.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
              No shifts yet
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">Role</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">Location</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">Start</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">End</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">Needed</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="border-b border-gray-800 
                      hover:bg-gray-800 transition-colors">
                      <td className="p-4 text-white">
                        {shift.shift_types?.name}
                      </td>
                      <td className="p-4 text-indigo-400">
                        {shift.locations?.name}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(shift.start_time).toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(shift.end_time).toLocaleTimeString()}
                      </td>
                      <td className="p-4 text-gray-400">
                        {shift.volunteers_needed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Volunteers table */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Volunteers</h2>
          {!volunteers || volunteers.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
              No volunteers yet
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">Name</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">Email</th>
                    <th className="text-left p-4 text-gray-400 text-sm font-medium">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((volunteer) => (
                    <tr key={volunteer.id} className="border-b border-gray-800 
                      hover:bg-gray-800 transition-colors">
                      <td className="p-4 text-white">{volunteer.name}</td>
                      <td className="p-4 text-gray-400">{volunteer.email}</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(volunteer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
