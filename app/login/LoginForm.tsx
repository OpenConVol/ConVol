'use client'

import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Sign in failed.')
      setLoading(false)
      return
    }

    // Full navigation so the server re-reads the new session cookie.
    window.location.assign('/admin')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoFocus
        placeholder="you@example.com"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        placeholder="Password"
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
