import { queryMany } from '@/src/lib/db'
import RafflePanel from './RafflePanel'
export const dynamic = 'force-dynamic'
export default async function RafflePage() {
  const volunteers = await queryMany('SELECT * FROM volunteers ORDER BY name')

  const tickets = await queryMany<{ volunteer_id: string; shift_id: string }>(`
    SELECT rt.*,
      jsonb_build_object('shift_types', jsonb_build_object('name', st.name)) AS shifts
    FROM raffle_tickets rt
    LEFT JOIN shifts s ON s.id = rt.shift_id
    LEFT JOIN shift_types st ON st.id = s.shift_type_id
    ORDER BY rt.awarded_at DESC
  `)

  const checkins = await queryMany<{
    volunteer_id: string
    shift_id: string
    shifts: { shift_types: { name: string } | null } | null
  }>(`
    SELECT c.volunteer_id, c.shift_id,
      jsonb_build_object('shift_types', jsonb_build_object('name', st.name)) AS shifts
    FROM checkins c
    LEFT JOIN shifts s ON s.id = c.shift_id
    LEFT JOIN shift_types st ON st.id = s.shift_type_id
  `)

  // Count tickets per volunteer
  const ticketCounts: Record<string, number> = {}
  tickets.forEach(t => {
    ticketCounts[t.volunteer_id] = (ticketCounts[t.volunteer_id] ?? 0) + 1
  })

  // Find shifts each volunteer checked into but hasn't received tickets for
  const ticketedShifts = new Set(tickets.map(t => `${t.volunteer_id}-${t.shift_id}`))

  const volunteersWithData = volunteers.map(v => ({
    ...v,
    ticketCount: ticketCounts[v.id] ?? 0,
    checkins: checkins.filter(c => c.volunteer_id === v.id),
    pendingTickets: checkins
      .filter(c => c.volunteer_id === v.id && !ticketedShifts.has(`${v.id}-${c.shift_id}`))
      .length
  }))

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-1 block">← Home</a>
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">← Admin</a>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {tickets.length}
            </div>
            <div className="text-gray-400 text-sm">Total tickets awarded</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {volunteersWithData.filter(v => v.ticketCount > 0).length}
            </div>
            <div className="text-gray-400 text-sm">Volunteers with tickets</div>
          </div>
          <div className="bg-yellow-900 border border-yellow-700 rounded-xl p-6">
            <div className="text-3xl font-bold text-yellow-300 mb-1">
              {volunteersWithData.reduce((sum, v) => sum + v.pendingTickets, 0)}
            </div>
            <div className="text-yellow-400 text-sm">Pending tickets</div>
          </div>
        </div>

        <RafflePanel volunteers={volunteersWithData} />

      </div>
    </main>
  )
}
