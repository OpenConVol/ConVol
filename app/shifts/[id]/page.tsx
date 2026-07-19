import { queryOne, queryMany } from '@/src/lib/db'
import SignUpForm from './SignUpForm'
import ShiftQRCode from '@/app/components/ShiftQRCode'

export default async function ShiftPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const shift = await queryOne(`
    SELECT s.*,
      jsonb_build_object('name', st.name, 'description', st.description) AS shift_types,
      jsonb_build_object('name', l.name) AS locations,
      jsonb_build_object('name', d.name) AS departments
    FROM shifts s
    LEFT JOIN shift_types st ON st.id = s.shift_type_id
    LEFT JOIN locations l ON l.id = s.location_id
    LEFT JOIN departments d ON d.id = s.department_id
    WHERE s.id = $1
  `, [id])

  const signups = await queryMany(`
    SELECT sg.*,
      jsonb_build_object('name', v.name) AS volunteers
    FROM signups sg
    LEFT JOIN volunteers v ON v.id = sg.volunteer_id
    WHERE sg.shift_id = $1
  `, [id])

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
            {/* TODO: pull timezone from convention settings */}
            {new Date(shift.start_time).toLocaleString('en-US', { timeZone: 'America/New_York' })} —{' '}
            {new Date(shift.end_time).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}
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

        {/* QR Code */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-2 text-gray-300">Shift QR Code</h2>
          <p className="text-gray-500 text-sm mb-4">
            Post this at your shift location for walk-up sign-ups
          </p>
          <ShiftQRCode 
            shiftId={shift.id} 
            baseUrl="http://192.168.0.22:3000"
          />
        </div>

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
