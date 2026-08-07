'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_THEME,
  resolveThemeVars,
  THEME_KEYS,
  THEME_LABELS,
  THEME_PRESETS,
  type Theme,
} from '@/src/lib/theme'

/** Apply a theme's variables to the live document so the whole app previews it. */
function applyLive(theme: Theme) {
  const vars = resolveThemeVars(theme)
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
}

export default function AppearanceEditor({
  initialTheme,
  initiallyDefault,
}: {
  initialTheme: Theme
  initiallyDefault: boolean
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)
  const savedRef = useRef<Theme>(initialTheme)

  // Live-preview every change across the whole app chrome.
  useEffect(() => { applyLive(theme) }, [theme])

  // On unmount without saving, restore what was actually persisted so the
  // preview doesn't "stick" for this admin's session.
  useEffect(() => {
    return () => { applyLive(savedRef.current) }
  }, [])

  function set(key: keyof Theme, value: string) {
    setTheme(t => ({ ...t, [key]: value }))
    setDirty(true)
    setStatus('')
  }

  function applyPreset(preset: Theme) {
    setTheme(preset)
    setDirty(true)
    setStatus('')
  }

  async function save() {
    setSaving(true)
    setStatus('')
    const res = await fetch('/api/admin/appearance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
    setSaving(false)
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      setStatus(b.error || 'Could not save.')
      return
    }
    savedRef.current = theme
    setDirty(false)
    setStatus('Saved — this is now the live theme for everyone.')
  }

  async function reset() {
    setSaving(true)
    setStatus('')
    const res = await fetch('/api/admin/appearance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    })
    setSaving(false)
    if (!res.ok) { setStatus('Could not reset.'); return }
    savedRef.current = DEFAULT_THEME
    setTheme(DEFAULT_THEME)
    setDirty(false)
    setStatus('Reset to the built-in default.')
  }

  return (
    <div className="space-y-8">
      {/* Presets */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">Presets</h2>
        <div className="flex flex-wrap gap-3">
          {THEME_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.theme)}
              className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 transition-colors"
            >
              <span className="flex gap-1">
                <span className="w-4 h-4 rounded-full border border-gray-700" style={{ background: p.theme.primary }} />
                <span className="w-4 h-4 rounded-full border border-gray-700" style={{ background: p.theme.accent }} />
                <span className="w-4 h-4 rounded-full border border-gray-700" style={{ background: p.theme.bg }} />
              </span>
              <span className="text-sm font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Key colors */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">Key colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {THEME_KEYS.map(k => (
            <label key={k} className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-3 py-3">
              <input
                type="color"
                value={theme[k]}
                onChange={e => set(k, e.target.value)}
                className="w-10 h-10 rounded-lg bg-transparent border border-gray-700 cursor-pointer p-0"
                aria-label={THEME_LABELS[k]}
              />
              <span>
                <span className="block text-sm font-medium">{THEME_LABELS[k]}</span>
                <span className="block text-xs text-gray-500 font-mono tabular-nums">{theme[k]}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[var(--app-brand-ink)] font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : 'Save theme'}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={saving}
          className="text-gray-400 hover:text-[var(--app-text)] text-sm transition-colors"
        >
          Reset to default
        </button>
        {status && <span className="text-sm text-gray-400">{status}</span>}
        {dirty && !status && <span className="text-sm text-yellow-400">Previewing — not saved yet</span>}
      </section>

      <p className="text-xs text-gray-500">
        {initiallyDefault
          ? 'Currently using the built-in default theme.'
          : 'A custom theme is currently saved.'}{' '}
        Saving changes the theme for every visitor immediately.
      </p>
    </div>
  )
}
