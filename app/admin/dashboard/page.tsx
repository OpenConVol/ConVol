export const dynamic = 'force-dynamic'
import { queryMany } from '@/src/lib/db'
import DashboardView from './DashboardView'

export default async function DashboardPage() {
  const shifts = await queryMany(`
    SELECT s.*,
      jsonb_build_object('name', st.name) AS shift_types,
      jsonb_build_object('name', l.name) AS locations,
      jsonb_build_object('name', d.name) AS departments
    FROM shifts s
    LEFT JOIN shift_types st ON st.id = s.shift_type_id
    LEFT JOIN locations l ON l.id = s.location_id
    LEFT JOIN departments d ON d.id = s.department_id
    ORDER BY s.start_time
  `)

  const signups = await queryMany<{ shift_id: string }>('SELECT shift_id FROM signups')
  const checkins = await queryMany<{ shift_id: string }>('SELECT shift_id FROM checkins')

  const signupCounts: Record<string, number> = {}
  const checkinCounts: Record<string, number> = {}
  signups.forEach(s => { signupCounts[s.shift_id] = (signupCounts[s.shift_id] ?? 0) + 1 })
  checkins.forEach(c => { checkinCounts[c.shift_id] = (checkinCounts[c.shift_id] ?? 0) + 1 })

  const now = new Date()

  const categorized = shifts.map(shift => {
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

    return {
      id: shift.id,
      shift_types: shift.shift_types,
      locations: shift.locations,
      departments: shift.departments,
      start_time: new Date(shift.start_time).toISOString(),
      signed, checked, needed, status, fillRate, checkinRate,
    }
  })

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-1 block">← Home</a>
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">← Admin</a>
          <h1 className="text-4xl font-bold text-[var(--app-text)] mb-2">Dashboard</h1>
          <p className="text-gray-400">Real-time shift fill rates and check-in status</p>
        </div>
        <DashboardView shifts={categorized} />
      </div>
    </main>
  )
}
