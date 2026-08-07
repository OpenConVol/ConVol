'use client'

import { useState } from 'react'

type Result = { name: string; ticketCount: number }

export default function RaffleLookup() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch(`/api/raffle/lookup?email=${encodeURIComponent(email)}`)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'No volunteer found with that email.')
      setLoading(false)
      return
    }

    setResult(await res.json())
    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={lookup} className="flex gap-3 mb-6">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setResult(null) }}
          required
          autoFocus
          placeholder="your@email.com"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-[var(--app-text)] text-lg placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-[var(--app-brand-ink)] font-medium px-6 rounded-xl transition-colors"
        >
          {loading ? '…' : 'Look up'}
        </button>
      </form>

      {error && (
        <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-500">{error}</div>
      )}

      {result && (
        <div className="bg-gray-900 rounded-xl p-10 text-center">
          <div className="text-gray-400 text-sm mb-2">{result.name}</div>
          <div className="text-8xl font-bold text-indigo-400 mb-2">{result.ticketCount}</div>
          <div className="text-gray-400 text-lg">
            raffle ticket{result.ticketCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
