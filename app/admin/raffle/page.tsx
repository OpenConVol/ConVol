import { supabase } from '@/src/lib/supabase'
import RafflePanel from './RafflePanel'

export default async function RafflePage() {
  const { data: volunteers } = await supabase
    .from('volunteers')
    .select('*')
    .order('name')

  const { data: tickets } = await supabase
    .from('raffle_tickets')
    .select('*, shifts(shift_types(name))')
    .order('awarded_at', { ascending: false })

  const { data: checkins } = await supabase
    .from('checkins')
    .select('volunteer_id, shift_id, shifts(shift_types(name))')

  // Count tickets per volunteer
  const ticketCounts: Record<string, number> = {}
  tickets?.forEach(t => {
    ticketCounts[t.volunteer_id] = (ticketCounts[t.volunteer_id] ?? 0) + 1
  })

  // Find shifts each volunteer checked into but hasn't received tickets for
  const ticketedShifts = new Set(tickets?.map(t => `${t.volunteer_id}-${t.shift_id}`))

  const volunteersWithData = volunteers?.map(v => ({
    ...v,
    ticketCount: ticketCounts[v.id] ?? 0,
    checkins: checkins?.filter(c => c.volunteer_id === v.id) ?? [],
    pendingTickets: checkins
      ?.filter(c => c.volunteer_id === v.id && !ticketedShifts.has(`${v.id}-${c.shift_id}`))
      .length ?? 0
  })) ?? []

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">
            ← Back to admin
          </a>
          <h1 className="text-4xl font-bold text-white mb-2">Raffle Tickets</h1>
          <p className="text-gray-400">Track and award raffle tickets per volunteer shift</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-3xl font-bold text-white mb-1">
              {tickets?.length ?? 0}
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
