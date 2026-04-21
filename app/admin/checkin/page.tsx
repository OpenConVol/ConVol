import { supabase } from '@/src/lib/supabase'
import CheckinPanel from './CheckinPanel'
export const dynamic = 'force-dynamic'
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
          <a href="/" className="text-indigo-400 text-sm mb-1 block">← Home</a>
          <a href="/admin" className="text-indigo-400 text-sm mb-4 block">← Admin</a>
        </div>

        <CheckinPanel shifts={shifts ?? []} />

      </div>
    </main>
  )
}
