'use client'

import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.assign('/login')
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="text-gray-400 hover:text-white text-sm transition-colors"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
