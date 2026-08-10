import ForgotForm from './ForgotForm'

export const dynamic = 'force-dynamic'

export default function ForgotPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-[var(--app-text)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-2">Reset your password</h1>
        <p className="text-gray-400 text-sm mb-8">
          Enter your staff email and we&apos;ll send you a link to set a new password.
        </p>
        <ForgotForm />
        <a href="/login" className="text-gray-500 hover:text-[var(--app-text)] text-sm mt-8 block">
          ← Back to sign in
        </a>
      </div>
    </main>
  )
}
