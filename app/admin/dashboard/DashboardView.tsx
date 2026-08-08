'use client'

import { useState } from 'react'

type Status = 'critical' | 'warning' | 'active' | 'good' | 'past'

export type DashShift = {
  id: string
  shift_types: { name: string } | null
  locations: { name: string } | null
  departments: { name: string } | null
  start_time: string
  signed: number
  checked: number
  needed: number
  status: Status
  fillRate: number
  checkinRate: number
}

const statusColor: Record<Status, string> = {
  critical: 'bg-gray-900 border border-gray-800 border-l-4 border-l-red-500',
  warning: 'bg-gray-900 border border-gray-800 border-l-4 border-l-yellow-500',
  good: 'bg-gray-900 border border-gray-800 border-l-4 border-l-green-500',
  active: 'bg-gray-900 border border-gray-800 border-l-4 border-l-indigo-500',
  past: 'bg-gray-900 border border-gray-800 opacity-60',
}
const statusLabel: Record<Status, string> = {
  critical: 'text-red-400',
  warning: 'text-yellow-400',
  good: 'text-green-400',
  active: 'text-indigo-400',
  past: 'text-gray-500',
}

function ShiftCard({ shift }: { shift: DashShift }) {
  const isPast = shift.status === 'past'
  return (
    <div className={`rounded-xl p-5 ${statusColor[shift.status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className={`font-bold ${isPast ? 'text-gray-400' : 'text-[var(--app-text)]'}`}>
            {shift.shift_types?.name}
          </div>
          <div className="text-gray-600 text-sm mt-1">
            {shift.locations?.name} · {shift.departments?.name}
          </div>
          <div className="text-gray-600 text-xs mt-1">
            {new Date(shift.start_time).toLocaleString('en-US', {
              timeZone: 'America/New_York',
              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
            })}
          </div>
        </div>
        <div className="text-right">
          {isPast ? (
            <div>
              <div className="text-sm font-bold text-gray-400">{shift.checked}/{shift.needed} showed up</div>
              <div className="text-xs text-gray-600 mt-1">{shift.signed}/{shift.needed} signed up</div>
            </div>
          ) : (
            <div>
              <div className={`text-sm font-bold ${statusLabel[shift.status]}`}>
                {shift.signed}/{shift.needed} signed up
              </div>
              {shift.status === 'active' || shift.status === 'critical' ? (
                <div className="text-xs text-gray-400 mt-1">{shift.checked} checked in</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 bg-gray-800 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${
            isPast
              ? shift.checkinRate >= 1 ? 'bg-green-600' : shift.checkinRate >= 0.5 ? 'bg-yellow-600' : 'bg-red-600'
              : shift.status === 'critical' ? 'bg-red-500'
              : shift.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min((isPast ? shift.checkinRate : shift.fillRate) * 100, 100)}%` }}
        />
      </div>
    </div>
  )
}

const SECTIONS: { status: Status; heading: string }[] = [
  { status: 'critical', heading: '🚨 Critical' },
  { status: 'warning', heading: '⚠️ Understaffed' },
  { status: 'active', heading: '▶ Active now' },
  { status: 'good', heading: '✓ Fully staffed' },
  { status: 'past', heading: '🕐 Completed' },
]

const TILES: { status: Status; label: string; box: string; num: string; text: string }[] = [
  { status: 'critical', label: 'Critical', box: 'bg-red-900 border-red-700', num: 'text-red-300', text: 'text-red-400' },
  { status: 'warning', label: 'Understaffed', box: 'bg-yellow-900 border-yellow-700', num: 'text-yellow-300', text: 'text-yellow-400' },
  { status: 'active', label: 'Active now', box: 'bg-indigo-900 border-indigo-700', num: 'text-indigo-300', text: 'text-indigo-400' },
  { status: 'good', label: 'Fully staffed', box: 'bg-gray-900 border-gray-800', num: 'text-green-300', text: 'text-green-400' },
]

export default function DashboardView({ shifts }: { shifts: DashShift[] }) {
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const count = (s: Status) => shifts.filter(x => x.status === s).length

  return (
    <div>
      {/* Summary tiles — click to filter, click again to clear */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {TILES.map(t => {
          const selected = filter === t.status
          return (
            <button
              key={t.status}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(selected ? 'all' : t.status)}
              className={`text-left border rounded-xl p-5 transition-all cursor-pointer hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-brand-500)] ${t.box} ${
                selected ? 'ring-2 ring-offset-2 ring-offset-gray-950 ring-white/70' : ''
              } ${filter !== 'all' && !selected ? 'opacity-50' : ''}`}
            >
              <div className={`text-3xl font-bold ${t.num}`}>{count(t.status)}</div>
              <div className={`text-sm ${t.text}`}>{t.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filter status line */}
      <div className="flex items-center gap-3 mb-8 min-h-6">
        {filter === 'all' ? (
          <span className="text-gray-500 text-sm">Showing all shifts · tap a tile to filter</span>
        ) : (
          <>
            <span className="text-gray-400 text-sm">
              Showing {count(filter as Status)} {SECTIONS.find(s => s.status === filter)?.heading.replace(/^\S+\s/, '')}
            </span>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="text-indigo-400 hover:text-indigo-300 text-sm underline"
            >
              Show all
            </button>
          </>
        )}
        <span className="ml-auto text-gray-600 text-xs">
          {count('past')} completed
          {filter !== 'past' && (
            <button type="button" onClick={() => setFilter('past')} className="ml-2 text-indigo-400 hover:text-indigo-300 underline">
              view
            </button>
          )}
        </span>
      </div>

      {SECTIONS.map(sec => {
        if (filter !== 'all' && filter !== sec.status) return null
        const group = shifts.filter(s => s.status === sec.status)
        if (group.length === 0) return null
        return (
          <div key={sec.status} className="mb-10">
            <h2 className={`text-xl font-bold mb-4 ${statusLabel[sec.status]}`}>{sec.heading}</h2>
            <div className="space-y-3">
              {group.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
