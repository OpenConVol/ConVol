'use client'

import { useState } from 'react'

type Shift = {
  id: string
  start_time: string
  end_time: string
  volunteers_needed: number
  shift_types: { name: string } | null
  locations: { name: string } | null
  departments: { name: string } | null
}

type Signup = {
  id: string
  volunteer_id: string
  volunteers: { id: string; name: string; email: string } | null
}

type Checkin = {
  volunteer_id: string
}

export default function CheckinPanel({ shifts }: { shifts: Shift[] }) {
  const [selectedShift, setSelectedShift] = useState<string>('')
  const [signups, setSignups] = useState<Signup[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(false)

  async function loadShift(shiftId: string) {
    setSelectedShift(shiftId)
    setLoading(true)

    const res = await fetch(`/api/admin/checkin/shift?shiftId=${encodeURIComponent(shiftId)}`)
    const data = await res.json()

    setSignups(data.signups ?? [])
    setCheckins(data.checkins ?? [])
    setLoading(false)
  }

  async function checkIn(volunteerId: string) {
    const res = await fetch('/api/admin/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId: selectedShift, volunteerId }),
    })

    if (res.ok) {
      setCheckins(prev => [...prev, { volunteer_id: volunteerId }])
    }
  }

  async function undoCheckin(volunteerId: string) {
    await fetch('/api/admin/checkin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId: selectedShift, volunteerId }),
    })

    setCheckins(prev => prev.filter(c => c.volunteer_id !== volunteerId))
  }

  const isCheckedIn = (volunteerId: string) =>
    checkins.some(c => c.volunteer_id === volunteerId)

  const shift = shifts.find(s => s.id === selectedShift)

  return (
    <div>
      {/* Shift selector */}
      <div className="mb-8">
        <label className="text-gray-500 text-xs block mb-2">Select shift</label>
        <select
          value={selectedShift}
          onChange={e => loadShift(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg 
            px-4 py-3 text-[var(--app-text)] focus:outline-none focus:border-indigo-500"
        >
          <option value="">Choose a shift...</option>
          {shifts.map(s => (
            <option key={s.id} value={s.id}>
              {s.shift_types?.name} — {s.locations?.name} —{' '}
              {new Date(s.start_time).toLocaleString('en-US', { 
                timeZone: 'America/New_York',
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit'
              })}
            </option>
          ))}
        </select>
      </div>

      {/* Shift summary */}
      {shift && (
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{shift.shift_types?.name}</div>
              <div className="text-indigo-400 text-sm">{shift.locations?.name}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--app-text)]">
                {checkins.length} / {signups.length}
              </div>
              <div className="text-gray-500 text-xs">checked in</div>
            </div>
          </div>
        </div>
      )}

      {/* Volunteers list */}
      {loading && (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      )}

      {!loading && selectedShift && signups.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
          No volunteers signed up for this shift
        </div>
      )}

      {!loading && signups.length > 0 && (
        <div className="space-y-3">
          <div className="text-gray-500 text-sm mb-4">
            {signups.length} signed up · {checkins.length} checked in
          </div>
          {signups.map(signup => (
            <div key={signup.id}
              className={`rounded-xl p-5 flex justify-between items-center bg-gray-900 border border-gray-800
                ${isCheckedIn(signup.volunteer_id) ? 'border-l-4 border-l-green-500' : ''}`}>
              <div>
                <div className="font-medium text-[var(--app-text)]">
                  {signup.volunteers?.name}
                </div>
                <div className="text-sm text-gray-400">
                  {signup.volunteers?.email}
                </div>
              </div>
              {isCheckedIn(signup.volunteer_id) ? (
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-sm font-medium">
                    ✓ Checked in
                  </span>
                  <button
                    onClick={() => undoCheckin(signup.volunteer_id)}
                    className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Undo
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => checkIn(signup.volunteer_id)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-[var(--app-brand-ink)] 
                    text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Check in
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
