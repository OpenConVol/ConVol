import { getSavedTheme } from '@/src/lib/settings'
import { DEFAULT_THEME } from '@/src/lib/theme'
import AppearanceEditor from './AppearanceEditor'

export const dynamic = 'force-dynamic'

export default async function AppearancePage() {
  const saved = await getSavedTheme()

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">← Admin</a>
          <h1 className="text-4xl font-bold mb-2">Appearance</h1>
          <p className="text-gray-400">
            Match ConVol to your convention&apos;s brand. Pick a preset or set your own colors —
            changes preview live across the app, then Save to apply for everyone.
          </p>
        </div>
        <AppearanceEditor initialTheme={saved ?? DEFAULT_THEME} initiallyDefault={saved === null} />
      </div>
    </main>
  )
}
