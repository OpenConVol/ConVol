import { queryMany } from '@/src/lib/db'
import CheckinPanel from './CheckinPanel'
export const dynamic = 'force-dynamic'

type ShiftRow = {
  id: string
  start_time: string
  end_time: string
  volunteers_needed: number
  shift_types: { name: string } | null
  locations: { name: string } | null
  departments: { name: string } | null
}

export default async function CheckinPage() {
  const shifts = await queryMany<ShiftRow>(`
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

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)]">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-1 block">← Home</a>
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">← Admin</a>
        </div>

        <CheckinPanel shifts={shifts} />

      </div>
    </main>
  )
}
