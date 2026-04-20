import { supabase } from '@/src/lib/supabase'
import SignUpForm from './SignUpForm'
export default async function ShiftPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const { data: shift } = await supabase
    .from('shifts')
    .select(`
      *,
      shift_types(name, description),
      locations(name),
      departments(name)
    `)
    .eq('id', id)
    .single()

  const { data: signups } = await supabase
    .from('signups')
    .select('*, volunteers(name)')
    .eq('shift_id', id)

  if (!shift) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center 
        justify-center">
        <div className="text-gray-400">Shift not found</div>
      </main>
    )
  }

  const spotsLeft = shift.volunteers_needed - (signups?.length ?? 0)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <a href="/shifts" className="text-indigo-400 text-sm mb-8 block">
          ← Back to shifts
        </a>

        {/* Shift details */}
        <div className="bg-gray-900 rounded-xl p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {shift.shift_types?.name}
          </h1>
          <div className="text-indigo-400 mb-1">{shift.locations?.name}</div>
          <div className="text-gray-400 mb-1">
            {shift.departments?.name}
          </div>
          <div className="text-gray-400 text-sm mt-4">
            {new Date(shift.start_time).toLocaleString()} —{' '}
            {new Date(shift.end_time).toLocaleTimeString()}
          </div>
          {shift.description && (
            <div className="text-gray-300 mt-4 text-sm">
              {shift.description}
            </div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${
              spotsLeft === 0 
                ? 'bg-red-900 text-red-300' 
                : spotsLeft <= 2 
                  ? 'bg-yellow-900 text-yellow-300'
                  : 'bg-green-900 text-green-300'
            }`}>
              {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
            </div>
            <div className="text-gray-500 text-sm">
              {shift.volunteers_needed} total needed
            </div>
          </div>
        </div>

        {/* Sign up form */}
        {spotsLeft > 0 && (
          <SignUpForm shiftId={shift.id} />
        )}

        {/* Current signups */}
        {signups && signups.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4 text-gray-300">
              Signed up ({signups.length})
            </h2>
            <div className="space-y-2">
              {signups.map((signup) => (
                <div key={signup.id} 
                  className="bg-gray-900 rounded-lg px-4 py-3 text-gray-300 text-sm">
                  {signup.volunteers?.name}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
