'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabase'

type Shift = {
  id: string
  start_time: string
  end_time: string
  shift_types: { name: string } | null
  locations: { name: string } | null
  departments: { name: string } | null
  volunteers_needed: number
  checked_in: boolean
}

type SchedSession = {
  id: string
  name: string
  venue: string
  event_start: string
  event_end: string
  event_type: string
}

export default function MyShiftsLookup() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [tickets, setTickets] = useState(0)
  const [mySched, setMySched] = useState<SchedSession[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  function getConflicts(shift: Shift): SchedSession[] {
    const shiftStart = new Date(shift.start_time).getTime()
    const shiftEnd = new Date(shift.end_time).getTime()
    return mySched.filter(e => {
      if (!e.event_start || !e.event_end) return false
      const eStart = new Date(e.event_start).getTime()
      const eEnd = new Date(e.event_end).getTime()
      return eStart < shiftEnd && eEnd > shiftStart
    })
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSearched(false)

    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, name')
      .eq('email', email)
      .single()

    if (!volunteer) {
      setError('No volunteer found with that email.')
      setLoading(false)
      return
    }

    setName(volunteer.name)

    const { data: signups } = await supabase
      .from('signups')
      .select(`shift_id, shifts(id, start_time, end_time, volunteers_needed, shift_types(name), locations(name), departments(name))`)
      .eq('volunteer_id', volunteer.id)

    const { data: checkins } = await supabase
      .from('checkins')
      .select('shift_id')
      .eq('volunteer_id', volunteer.id)

    const checkedInShifts = new Set(checkins?.map(c => c.shift_id))

    const shiftList = (signups ?? [])
      .map((s: any) => ({ ...s.shifts, checked_in: checkedInShifts.has(s.shifts?.id) }))
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    const { count } = await supabase
      .from('raffle_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('volunteer_id', volunteer.id)

    // Fetch their personal Sched schedule
    const schedRes = await fetch(`/api/sched/user?email=${encodeURIComponent(email)}`)
    const schedData = await schedRes.json()

    setShifts(shiftList)
    setTickets(count ?? 0)
    setMySched(schedData.sessions ?? [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={lookup} className="flex gap-3 mb-8">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {loading ? 'Looking up...' : 'Look up'}
        </button>
      </form>

      {error && <div className="text-red-400 text-sm mb-6">{error}</div>}

      {searched && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-2xl font-bold text-white">{name}</div>
              <div className="text-gray-400 text-sm">{shifts.length} shift{shifts.length !== 1 ? 's' : ''} signed up</div>
              {mySched.length > 0 && (
                <div className="text-purple-400 text-sm">{mySched.length} panels on your Sched schedule</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-400">{tickets}</div>
              <div className="text-gray-500 text-xs">raffle tickets</div>
            </div>
          </div>

          <a href={`/api/ical?email=${encodeURIComponent(email)}`} className="inline-block bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg mb-8 transition-colors">Download calendar (.ics)</a>

          {shifts.length === 0 ? (
            <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
              No shifts signed up yet.{' '}
              <a href="/shifts" className="text-indigo-400 hover:underline">Browse shifts</a>
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((shift: any) => {
                const conflicts = getConflicts(shift)
                return (
                  <div key={shift.id} className={`rounded-xl p-6 border ${shift.checked_in ? 'bg-green-900 border-green-700' : 'bg-gray-900 border-gray-800'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg">{shift.shift_types?.name}</div>
                        <div className="text-indigo-400 text-sm mt-1">{shift.locations?.name}</div>
                        <div className="text-gray-500 text-sm mt-1">{shift.departments?.name}</div>
                        <div className="text-gray-500 text-sm mt-2">
                          {new Date(shift.start_time).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} —{' '}
                          {new Date(shift.end_time).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })}
                        </div>

                        {conflicts.length > 0 && (
                          <div className="mt-3 bg-yellow-900 border border-yellow-700 rounded-lg p-3">
                            <div className="text-yellow-400 text-xs font-medium mb-2">
                              ⚠️ {conflicts.length} panel{conflicts.length !== 1 ? 's' : ''} from your Sched schedule overlap this shift
                            </div>
                            {conflicts.map(c => (
                              <div key={c.id} className="text-yellow-300 text-xs mt-1">
                                {c.name} — {c.venue} ({new Date(c.event_start).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {shift.checked_in ? (
                          <span className="text-green-400 text-sm font-medium">✓ Checked in</span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not checked in</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {mySched.length === 0 && searched && (
            <div className="mt-6 text-gray-600 text-sm text-center">
              No Sched schedule found for this email — conflict detection unavailable.{' '}
              <a href={`https://${process.env.NEXT_PUBLIC_SCHED_EVENT_URL ?? 'sched.com'}`} target="_blank" className="text-indigo-400 hover:underline">Add panels on Sched</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
