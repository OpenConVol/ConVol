import { redirect } from 'next/navigation'
import { getSessionStaff, staffCount } from '@/src/lib/auth'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  if (await getSessionStaff()) redirect('/admin')
  // No accounts yet — send the first user through setup instead.
  if ((await staffCount()) === 0) redirect('/setup')

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">Staff sign in</h1>
        <p className="text-gray-400 text-sm mb-8">ConVol admin access.</p>
        <LoginForm />
        <a href="/" className="text-gray-500 hover:text-white text-sm mt-8 block">
          ← Back to ConVol
        </a>
      </div>
    </main>
  )
}
