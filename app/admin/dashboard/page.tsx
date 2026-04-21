export const dynamic = 'force-dynamic'
import { supabase } from '@/src/lib/supabase'

export default async function DashboardPage() {
  const { data: shifts } = await supabase
    .from('shifts')
    .select(`*, shift_types(name), locations(name), departments(name)`)
    .order('start_time')

  const { data: signups } = await supabase
    .from('signups')
    .select('shift_id')

  const { data: checkins } = await supabase
    .from('checkins')
    .select('shift_id')

  const signupCounts: Record<string, number> = {}
  const checkinCounts: Record<string, number> = {}

  signups?.forEach(s => {
    signupCounts[s.shift_id] = (signupCounts[s.shift_id] ?? 0) + 1
  })
  checkins?.forEach(c => {
    checkinCounts[c.shift_id] = (checkinCounts[c.shift_id] ?? 0) + 1
  })

  const now = new Date()

  const categorized = shifts?.map(shift => {
    const needed = shift.volunteers_needed
    const signed = signupCounts[shift.id] ?? 0
    const checked = checkinCounts[shift.id] ?? 0
    const shiftStart = new Date(shift.start_time)
    const shiftEnd = new Date(shift.end_time)
    const isActive = shiftStart <= now && now <= shiftEnd
    const isPast = shiftEnd < now
    const fillRate = needed > 0 ? signed / needed : 1
    const checkinRate = needed > 0 ? checked / needed : 1

    let status: 'critical' | 'warning' | 'good' | 'active' | 'past'
    if (isPast) status = 'past'
    else if (isActive && checked < needed * 0.5) status = 'critical'
    else if (isActive) status = 'active'
    else if (fillRate < 0.5) status = 'critical'
    else if (fillRate < 1) status = 'warning'
    else status = 'good'

    return { ...shift, signed, checked, status, fillRate, checkinRate, needed }
  }) ?? []

  const critical = categorized.filter(s => s.status === 'critical')
  const warning = categorized.filter(s => s.status === 'warning')
  const active = categorized.filter(s => s.status === 'active')
  const good = categorized.filter(s => s.status === 'good')
  const past = categorized.filter(s => s.status === 'past')

  const statusColor = {
    critical: 'bg-red-900 border border-red-700',
    warning: 'bg-yellow-900 border border-yellow-700',
    good: 'bg-gray-900',
    active: 'bg-indigo-900 border border-indigo-700',
    past: 'bg-gray-900 border border-gray-800 opacity-60'
  }

  const statusLabel = {
    critical: 'text-red-400',
    warning: 'text-yellow-400',
    good: 'text-green-400',
    active: 'text-indigo-400',
    past: 'text-gray-500'
  }

  function ShiftCard({ shift }: { shift: typeof categorized[0] & { status: 'critical' | 'warning' | 'good' | 'active' | 'past' } }) {
    const isPast = shift.status === 'past'
    return (
      <div className={`rounded-xl p-5 ${statusColor[shift.status as keyof typeof statusColor]}`}>
        <div className="flex justify-between items-start">
          <div>
            <div className={`font-bold ${isPast ? 'text-gray-400' : 'text-white'}`}>
              {shift.shift_types?.name}
            </div>
            <div className="text-gray-500 text-sm mt-1">
              {shift.locations?.name} · {shift.departments?.name}
            </div>
            <div className="text-gray-600 text-xs mt-1">
              {new Date(shift.start_time).toLocaleString('en-US', {
                timeZone: 'America/New_York',
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit'
              })}
            </div>
          </div>
          <div className="text-right">
            {isPast ? (
              <div>
                <div className="text-sm font-bold text-gray-400">
                  {shift.checked}/{shift.needed} showed up
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {shift.signed}/{shift.needed} signed up
                </div>
              </div>
            ) : (
              <div>
                <div className={`text-sm font-bold ${statusLabel[shift.status as keyof typeof statusLabel]}`}>
                  {shift.signed}/{shift.needed} signed up
                </div>
                {shift.status === 'active' || shift.status === 'critical' ? (
                  <div className="text-xs text-gray-400 mt-1">
                    {shift.checked} checked in
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              isPast
                ? shift.checkinRate >= 1 ? 'bg-green-600' : shift.checkinRate >= 0.5 ? 'bg-yellow-600' : 'bg-red-600'
                : shift.status === 'critical' ? 'bg-red-500' :
                  shift.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((isPast ? shift.checkinRate : shift.fillRate) * 100, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-1 block">← Home</a>
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">← Admin</a>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Real-time shift fill rates and check-in status</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-12">
          <div className="bg-red-900 border border-red-700 rounded-xl p-5">
            <div className="text-3xl font-bold text-red-300">{critical.length}</div>
            <div className="text-red-400 text-sm">Critical</div>
          </div>
          <div className="bg-yellow-900 border border-yellow-700 rounded-xl p-5">
            <div className="text-3xl font-bold text-yellow-300">{warning.length}</div>
            <div className="text-yellow-400 text-sm">Understaffed</div>
          </div>
          <div className="bg-indigo-900 border border-indigo-700 rounded-xl p-5">
            <div className="text-3xl font-bold text-indigo-300">{active.length}</div>
            <div className="text-indigo-400 text-sm">Active now</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="text-3xl font-bold text-green-300">{good.length}</div>
            <div className="text-green-400 text-sm">Fully staffed</div>
          </div>
        </div>

        {critical.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-red-400 mb-4">🚨 Critical</h2>
            <div className="space-y-3">
              {critical.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
            </div>
          </div>
        )}

        {warning.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Understaffed</h2>
            <div className="space-y-3">
              {warning.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
            </div>
          </div>
        )}

        {active.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-indigo-400 mb-4">▶ Active now</h2>
            <div className="space-y-3">
              {active.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
            </div>
          </div>
        )}

        {good.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-green-400 mb-4">✓ Fully staffed</h2>
            <div className="space-y-3">
              {good.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-500 mb-4">🕐 Completed</h2>
            <div className="space-y-3">
              {past.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
