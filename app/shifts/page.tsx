export const dynamic = 'force-dynamic'
import { queryMany } from '@/src/lib/db'
import ShiftsList from './ShiftsList'

export default async function ShiftsPage() {
  const shifts = await queryMany(`
    SELECT s.*,
      jsonb_build_object('name', st.name) AS shift_types,
      jsonb_build_object('name', l.name) AS locations,
      jsonb_build_object('id', d.id, 'name', d.name) AS departments
    FROM shifts s
    LEFT JOIN shift_types st ON st.id = s.shift_type_id
    LEFT JOIN locations l ON l.id = s.location_id
    LEFT JOIN departments d ON d.id = s.department_id
    ORDER BY s.start_time
  `)

  const signups = await queryMany<{ shift_id: string }>('SELECT shift_id FROM signups')

  const signupCounts: Record<string, number> = {}
  signups.forEach(s => {
    signupCounts[s.shift_id] = (signupCounts[s.shift_id] ?? 0) + 1
  })

  const shiftsWithCounts = shifts.map(s => ({
    ...s,
    signup_count: signupCounts[s.id] ?? 0
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-4 block">← Home</a>
          <h1 className="text-4xl font-bold text-[var(--app-text)] mb-2">Shifts</h1>
          <p className="text-gray-400">Browse and sign up for volunteer shifts</p>
        </div>
        <ShiftsList shifts={shiftsWithCounts} />
      </div>
    </main>
  )
}
