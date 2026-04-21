export const dynamic = 'force-dynamic'
import { supabase } from '@/src/lib/supabase'
import ShiftsList from './ShiftsList'

export default async function ShiftsPage() {
  const { data: shifts } = await supabase
    .from('shifts')
    .select(`*, shift_types(name), locations(name), departments(id, name)`)
    .order('start_time')

  const { data: signups } = await supabase
    .from('signups')
    .select('shift_id')

  const signupCounts: Record<string, number> = {}
  signups?.forEach(s => {
    signupCounts[s.shift_id] = (signupCounts[s.shift_id] ?? 0) + 1
  })

  const shiftsWithCounts = shifts?.map(s => ({
    ...s,
    signup_count: signupCounts[s.id] ?? 0
  })) ?? []

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-4 block">← Home</a>
          <h1 className="text-4xl font-bold text-white mb-2">Shifts</h1>
          <p className="text-gray-400">Browse and sign up for volunteer shifts</p>
        </div>
        <ShiftsList shifts={shiftsWithCounts} />
      </div>
    </main>
  )
}
