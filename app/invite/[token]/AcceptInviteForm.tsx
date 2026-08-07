'use client'

import { useState } from 'react'

export default function AcceptInviteForm({ token, email }: { token: string; email: string }) {
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
    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Could not set up your account.')
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
        readOnly
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-400"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoFocus
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
        {loading ? 'Setting up…' : 'Create account'}
      </button>
    </form>
  )
}
