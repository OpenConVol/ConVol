import RaffleLookup from './RaffleLookup'

export default function RafflePublicPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Raffle Lookup</h1>
          <p className="text-gray-400">Enter your email to see your raffle ticket count</p>
        </div>
        <RaffleLookup />
      </div>
    </main>
  )
}
