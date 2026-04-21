import MyShiftsLookup from './MyShiftsLookup'

export default function MyShiftsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-4 block">
            ← Back
          </a>
          <h1 className="text-4xl font-bold text-white mb-2">My Shifts</h1>
          <p className="text-gray-400">Enter your email to see your volunteer schedule</p>
        </div>
        <MyShiftsLookup />
      </div>
    </main>
  )
}
