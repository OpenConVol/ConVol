import { redirect } from 'next/navigation'
import { staffCount } from '@/src/lib/auth'
import SetupForm from './SetupForm'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  // Once the instance is claimed, setup is closed for good.
  if ((await staffCount()) > 0) redirect('/login')

  const rootEmail = process.env.CONVOL_ROOT_ADMIN_EMAIL?.trim().toLowerCase() ?? ''

  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">Set up ConVol</h1>
        <p className="text-gray-400 text-sm mb-8">
          Create the first staff account. This page closes once an account exists.
        </p>
        <SetupForm lockedEmail={rootEmail} />
      </div>
    </main>
  )
}
