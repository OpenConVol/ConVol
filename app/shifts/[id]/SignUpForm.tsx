'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpForm({ shiftId }: { shiftId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/signups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId, name, email }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (body.error === 'already_signed_up') {
        setError('You are already signed up for this shift.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  if (success) {
    return (
      <div className="bg-green-900 border border-green-700 rounded-xl p-8 text-center">
        <div className="text-2xl font-bold text-green-300 mb-2">You are signed up!</div>
        <div className="text-green-400 text-sm mb-6">See you at the shift. Thank you for volunteering!</div>
        <a href={`/api/ical?email=${encodeURIComponent(email)}`} className="inline-block bg-white text-green-900 font-medium px-6 py-3 rounded-lg text-sm">Download calendar (.ics)</a>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl p-8">
      <h2 className="text-xl font-bold mb-6">Sign up for this shift</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            placeholder="your@email.com"
          />
        </div>
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
    </div>
  )
}
