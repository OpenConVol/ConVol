'use client'

import { useState } from 'react'

type Volunteer = {
  id: string
  name: string
  ticketCount: number
}

export default function RaffleLookup({ volunteers }: { volunteers: Volunteer[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Volunteer | null>(null)

  const filtered = search.length > 1
    ? volunteers.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase())
      )
    : []

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setSelected(null) }}
        placeholder="Type your name..."
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
        autoFocus
      />

      {/* Search results */}
      {!selected && filtered.length > 0 && (
        <div className="bg-gray-900 rounded-xl overflow-hidden mb-6">
          {filtered.map(v => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className="w-full text-left px-5 py-4 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
            >
              <span className="text-white">{v.name}</span>
              <span className="text-gray-500 text-sm ml-2">
                {v.ticketCount} ticket{v.ticketCount !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selected volunteer */}
      {selected && (
        <div className="bg-gray-900 rounded-xl p-10 text-center">
          <div className="text-gray-400 text-sm mb-2">{selected.name}</div>
          <div className="text-8xl font-bold text-indigo-400 mb-2">
            {selected.ticketCount}
          </div>
          <div className="text-gray-400 text-lg">
            raffle ticket{selected.ticketCount !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => { setSelected(null); setSearch('') }}
            className="mt-8 text-gray-500 hover:text-white text-sm transition-colors"
          >
            Look up someone else
          </button>
        </div>
      )}

      {search.length > 1 && filtered.length === 0 && !selected && (
        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">
          No volunteers found matching "{search}"
        </div>
      )}
    </div>
  )
}
