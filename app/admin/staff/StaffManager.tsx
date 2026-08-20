'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Staff = {
  id: string
  email: string
  role: string
  created_at: string
  last_login_at: string | null
}
type Invite = {
  id: string
  email: string
  created_at: string
  expires_at: string
  viewed_at: string | null
  view_count: number
}

function fmt(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function StaffManager({
  currentStaffId,
  initialStaff,
  initialInvites,
}: {
  currentStaffId: string
  initialStaff: Staff[]
  initialInvites: Invite[]
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInviteLink('')
    setCopied(false)

    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)

    if (!res.ok) {
      setError(data.error || 'Could not create the invite.')
      return
    }
    setInviteLink(`${window.location.origin}/invite/${data.token}`)
    setEmail('')
    router.refresh()
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function removeStaff(id: string, staffEmail: string) {
    if (!confirm(`Remove ${staffEmail}? They will no longer be able to sign in.`)) return
    const res = await fetch('/api/admin/staff/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: id }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Could not remove that account.')
      return
    }
    router.refresh()
  }

  async function revokeInvite(id: string) {
    const res = await fetch('/api/admin/staff/invite/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId: id }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-12">
      {/* Invite */}
      <section>
        <h2 className="text-lg font-bold text-[var(--app-text)] mb-4">Invite a coordinator</h2>
        <form onSubmit={createInvite} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="coordinator@example.com"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-[var(--app-text)] placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-[var(--app-brand-ink)] font-medium px-6 rounded-lg transition-colors"
          >
            {busy ? 'Creating…' : 'Create invite'}
          </button>
        </form>
        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}

        {inviteLink && (
          <div className="mt-4 bg-gray-900 border border-indigo-700 rounded-xl p-5">
            <div className="text-indigo-300 text-sm font-medium mb-2">
              Invite link — copy it now, it won&apos;t be shown again.
            </div>
            <div className="flex gap-3 items-center">
              <code className="flex-1 text-gray-300 text-sm break-all bg-gray-950 rounded-lg px-3 py-2">
                {inviteLink}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 bg-gray-800 hover:bg-gray-700 text-[var(--app-text)] text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="text-gray-500 text-xs mt-2">
              Emailed to them automatically. Here&apos;s the link too, in case you want to send it another way. They set their own password; it expires in 7 days.
            </div>
          </div>
        )}
      </section>

      {/* Pending invites */}
      {initialInvites.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[var(--app-text)] mb-4">Pending invites</h2>
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            {initialInvites.map(inv => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-5 py-4 border-b border-gray-800 last:border-0"
              >
                <div>
                  <div className="text-[var(--app-text)]">{inv.email}</div>
                  <div className="text-gray-500 text-xs">
                    invited {fmt(inv.created_at)} · expires {fmt(inv.expires_at)}
                  </div>
                  <div className="text-xs mt-0.5">
                    {inv.viewed_at ? (
                      <span className="text-green-400">
                        opened {fmt(inv.viewed_at)}
                        {inv.view_count > 1 ? ` (${inv.view_count}x)` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-600">not opened yet</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Current staff */}
      <section>
        <h2 className="text-lg font-bold text-[var(--app-text)] mb-4">Staff accounts</h2>
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          {initialStaff.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between px-5 py-4 border-b border-gray-800 last:border-0"
            >
              <div>
                <div className="text-[var(--app-text)]">
                  {s.email}
                  {s.id === currentStaffId && (
                    <span className="text-indigo-400 text-xs ml-2">(you)</span>
                  )}
                </div>
                <div className="text-gray-500 text-xs">
                  {s.role} · last sign-in {fmt(s.last_login_at)}
                </div>
              </div>
              {s.id === currentStaffId ? (
                <span className="text-gray-700 text-sm">—</span>
              ) : (
                <button
                  onClick={() => removeStaff(s.id, s.email)}
                  className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
