import { supabase } from '@/src/lib/supabase'

export default async function SchedulePage() {
  const { data: shifts } = await supabase
    .from('shifts')
    .select(`*, shift_types(name), locations(name), departments(name)`)
    .order('start_time')

  const { data: schedEvents } = await supabase
    .from('sched_events')
    .select('*')
    .order('start_time')

  // Combine and sort by start time
  const allEvents = [
    ...(shifts ?? []).map(s => ({
      id: s.id,
      title: s.shift_types?.name ?? 'Volunteer Shift',
      location: s.locations?.name ?? '',
      department: s.departments?.name ?? '',
      start_time: s.start_time,
      end_time: s.end_time,
      type: 'shift' as const,
      volunteers_needed: s.volunteers_needed,
      url: `/shifts/${s.id}`
    })),
    ...(schedEvents ?? []).map(e => ({
      id: e.id,
      title: e.title,
      location: e.location ?? '',
      department: e.event_type ?? '',
      start_time: e.start_time,
      end_time: e.end_time,
      type: 'programming' as const,
      volunteers_needed: null,
      url: null
    }))
  ].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  // Group by day
  const days: Record<string, typeof allEvents> = {}
  allEvents.forEach(event => {
    const day = new Date(event.start_time).toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
    if (!days[day]) days[day] = []
    days[day].push(event)
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="mb-10">
          <a href="/" className="text-indigo-400 text-sm mb-4 block">
            ← Back
          </a>
          <h1 className="text-4xl font-bold text-white mb-2">Full Schedule</h1>
          <p className="text-gray-400">Volunteer shifts and programming in one view</p>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-gray-400 text-sm">Volunteer shift</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-400 text-sm">Programming</span>
          </div>
        </div>

        {/* Days */}
        {Object.entries(days).map(([day, events]) => (
          <div key={day} className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-800">
              {day}
            </h2>
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id}
                  className={`rounded-xl p-5 border ${
                    event.type === 'shift'
                      ? 'bg-indigo-950 border-indigo-800'
                      : 'bg-purple-950 border-purple-800'
                  }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          event.type === 'shift' ? 'bg-indigo-400' : 'bg-purple-400'
                        }`}/>
                        <span className={`text-xs font-medium uppercase tracking-wide ${
                          event.type === 'shift' ? 'text-indigo-400' : 'text-purple-400'
                        }`}>
                          {event.type === 'shift' ? `Volunteer — ${event.department}` : event.department}
                        </span>
                      </div>
                      <div className="font-bold text-white text-lg">{event.title}</div>
                      {event.location && (
                        <div className="text-gray-400 text-sm mt-1">{event.location}</div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-gray-300 text-sm">
                        {new Date(event.start_time).toLocaleTimeString('en-US', {
                          timeZone: 'America/New_York',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(event.end_time).toLocaleTimeString('en-US', {
                          timeZone: 'America/New_York',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                      {event.type === 'shift' && event.url && (
                        <a href={event.url}
                          className="mt-2 inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1 rounded-lg transition-colors">
                          Sign up
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </main>
  )
}
