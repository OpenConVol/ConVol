'use client'

import { useState } from 'react'

type Shift = {
  id: string
  start_time: string
  end_time: string
  volunteers_needed: number
  shift_types: { name: string } | null
  locations: { name: string } | null
  departments: { id: string; name: string } | null
}

export default function ShiftsList({ shifts }: { shifts: Shift[] }) {
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedDept, setSelectedDept] = useState<string>('all')

  const days = Array.from(new Set(
    shifts.map(s => s.start_time.split('T')[0])
  ))

  const deptMap: Record<string, string> = {}
  shifts.forEach(s => {
    if (s.departments?.id) {
      deptMap[s.departments.id] = s.departments.name
    }
  })
  const departments = Object.entries(deptMap)
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const filtered = shifts.filter(shift => {
    const shiftDay = shift.start_time.split('T')[0]
    const dayMatch = selectedDay === 'all' || shiftDay === selectedDay
    const deptMatch = selectedDept === 'all' || shift.departments?.id === selectedDept
    return dayMatch && deptMatch
  })

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8">
        <div>
          <label className="text-gray-500 text-xs block mb-1">Day</label>
          <select
            value={selectedDay}
            onChange={e => setSelectedDay(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 
              text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All days</option>
            {days.map(day => (
              <option key={day} value={day}>
                {new Date(day + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'short', day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 
              text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <span className="text-gray-500 text-sm">
            {filtered.length} shift{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 text-center">
          <div className="text-gray-500 text-lg">No shifts found</div>
          <div className="text-gray-600 text-sm mt-2">
            Try changing your filters
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((shift) => (
            <div key={shift.id} className="bg-gray-900 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg">
                    {shift.shift_types?.name}
                  </div>
                  <div className="text-indigo-400 text-sm mt-1">
                    {shift.locations?.name}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    {shift.departments?.name}
                  </div>
                  <div className="text-gray-500 text-sm mt-2">
                    {/* TODO: pull timezone from convention settings */}
                    {new Date(shift.start_time).toLocaleString('en-US', { timeZone: 'America/New_York' })} —{' '}
                    {new Date(shift.end_time).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-3">
                    {shift.volunteers_needed} needed
                  </div>
                  <a href={`/shifts/${shift.id}`}
                    className="bg-indigo-600 hover:bg-indigo-500 
                    text-white text-sm px-4 py-2 rounded-lg transition-colors 
                    inline-block">
                    View & Sign up
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
