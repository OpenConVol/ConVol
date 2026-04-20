import { supabase } from '@/src/lib/supabase'

export default async function ShiftsPage() {
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      *,
      shift_types(name),
      locations(name),
      departments(name)
    `)
    .order('start_time')

  if (error) {
    console.error(error)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-4 block">
            ← Back
          </a>
          <h1 className="text-4xl font-bold text-white mb-2">Shifts</h1>
          <p className="text-gray-400">Browse and sign up for volunteer shifts</p>
        </div>

        {/* Shifts list */}
        {!shifts || shifts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-12 text-center">
            <div className="text-gray-500 text-lg">No shifts yet</div>
            <div className="text-gray-600 text-sm mt-2">
              Check back soon or ask your volunteer coordinator
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => (
              <div key={shift.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">
                      {shift.shift_types?.name}
                    </div>
                    <div className="text-indigo-400 text-sm mt-1">
                      {shift.locations?.name}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      {new Date(shift.start_time).toLocaleString()} —{' '}
                      {new Date(shift.end_time).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {shift.volunteers_needed} needed
                    </div>
                    <button className="mt-3 bg-indigo-600 hover:bg-indigo-500 
                      text-white text-sm px-4 py-2 rounded-lg transition-colors">
                      Sign up
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
