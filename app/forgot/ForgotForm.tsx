'use client'

import { useState } from 'react'

export default function ForgotForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {})
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-sm text-gray-400">
        If an account exists for <span className="text-[var(--app-text)]">{email}</span>, a reset
        link is on its way. It expires in an hour. Check spam if you don&apos;t see it shortly.
      </div>
    )
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
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-[var(--app-text)] placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-[var(--app-brand-ink)] font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
