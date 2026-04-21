import { supabase } from '@/src/lib/supabase'
import RaffleLookup from './RaffleLookup'

export default async function RafflePublicPage() {
  const { data: volunteers } = await supabase
    .from('volunteers')
    .select('id, name')
    .order('name')

  const { data: tickets } = await supabase
    .from('raffle_tickets')
    .select('volunteer_id')

  const ticketCounts: Record<string, number> = {}
  tickets?.forEach(t => {
    ticketCounts[t.volunteer_id] = (ticketCounts[t.volunteer_id] ?? 0) + 1
  })

  const volunteersWithCounts = volunteers?.map(v => ({
    ...v,
    ticketCount: ticketCounts[v.id] ?? 0
  })) ?? []

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Raffle Lookup</h1>
          <p className="text-gray-400">Find your raffle ticket count</p>
        </div>
        <RaffleLookup volunteers={volunteersWithCounts} />
      </div>
    </main>
  )
}
