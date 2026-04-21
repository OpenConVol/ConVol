'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'next/navigation'

type Volunteer = {
  id: string
  name: string
  email: string
  ticketCount: number
  pendingTickets: number
  checkins: { shift_id: string; shifts: { shift_types: { name: string } | null } | null }[]
}

export default function RafflePanel({ volunteers }: { volunteers: Volunteer[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = volunteers.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  )

  async function awardTicket(volunteerId: string, shiftId: string) {
    setLoading(volunteerId)
    await supabase
      .from('raffle_tickets')
      .insert({ volunteer_id: volunteerId, shift_id: shiftId })
    setLoading(null)
    router.refresh()
  }

  async function awardAllPending(volunteer: Volunteer) {
    setLoading(volunteer.id)
    const { data: existing } = await supabase
      .from('raffle_tickets')
      .select('shift_id')
      .eq('volunteer_id', volunteer.id)

    const ticketedShiftIds = new Set(existing?.map(t => t.shift_id))

    for (const checkin of volunteer.checkins) {
      if (!ticketedShiftIds.has(checkin.shift_id)) {
        await supabase
          .from('raffle_tickets')
          .insert({ volunteer_id: volunteer.id, shift_id: checkin.shift_id })
      }
    }
    setLoading(null)
    router.refresh()
  }

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search volunteers..."
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-6"
      />

      {filtered.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
          No volunteers found
        </div>
      )}

      <div className="space-y-4">
        {filtered.map(volunteer => (
          <div key={volunteer.id} className="bg-gray-900 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-bold text-white text-lg">{volunteer.name}</div>
                <div className="text-gray-400 text-sm">{volunteer.email}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-400">
                  {volunteer.ticketCount}
                </div>
                <div className="text-gray-500 text-xs">tickets</div>
              </div>
            </div>

            {volunteer.pendingTickets > 0 && (
              <div className="flex items-center justify-between bg-yellow-900 border border-yellow-700 rounded-lg p-3 mt-2">
                <div className="text-yellow-300 text-sm">
                  {volunteer.pendingTickets} shift{volunteer.pendingTickets !== 1 ? 's' : ''} checked in, no ticket yet
                </div>
                <button
                  onClick={() => awardAllPending(volunteer)}
                  disabled={loading === volunteer.id}
                  className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  {loading === volunteer.id ? 'Awarding...' : 'Award all'}
                </button>
              </div>
            )}

            {volunteer.checkins.length === 0 && (
              <div className="text-gray-600 text-sm mt-2">No check-ins yet</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
