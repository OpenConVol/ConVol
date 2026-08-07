'use client'

import { useState } from 'react'

export default function SetupForm({ lockedEmail }: { lockedEmail: string }) {
  const [email, setEmail] = useState(lockedEmail)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Setup failed.')
      setLoading(false)
      return
    }

    window.location.assign('/admin')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        readOnly={Boolean(lockedEmail)}
        autoFocus={!lockedEmail}
        placeholder="you@example.com"
        className={`w-full border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
          lockedEmail ? 'bg-gray-800 text-gray-400' : 'bg-gray-900'
        }`}
      />
      {lockedEmail && (
        <p className="text-gray-500 text-xs -mt-2">
          This instance is configured to accept only this root admin email.
        </p>
      )}
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoFocus={Boolean(lockedEmail)}
        placeholder="Choose a password (min 8 chars)"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        required
        placeholder="Confirm password"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )
}
