import { supabase } from '@/src/lib/supabase'
import CheckinPanel from './CheckinPanel'

export default async function CheckinPage() {
  const { data: shifts } = await supabase
    .from('shifts')
    .select(`
      *,
      shift_types(name),
      locations(name),
      departments(name)
    `)
    .order('start_time')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">
            ← Back to admin
          </a>
          <h1 className="text-4xl font-bold text-white mb-2">Check-in</h1>
          <p className="text-gray-400">Mark volunteers as checked in for their shifts</p>
        </div>

        <CheckinPanel shifts={shifts ?? []} />

      </div>
    </main>
  )
}
