import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ sessions: [] })
  }

  const apiKey = process.env.SCHED_API_KEY
  const eventUrl = process.env.SCHED_EVENT_URL

  if (!apiKey || !eventUrl) {
    return NextResponse.json({ sessions: [] })
  }

  try {
    const url = `https://${eventUrl}/api/going/list?api_key=${apiKey}&username=${encodeURIComponent(email)}&format=json`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ConVol/1.0' }
    })

    const text = await res.text()

    // Sched returns error strings like "ERR: ..." when user not found
    if (text.startsWith('ERR') || text.startsWith('err')) {
      return NextResponse.json({ sessions: [], error: text })
    }

    const data = JSON.parse(text)

    if (!Array.isArray(data)) {
      return NextResponse.json({ sessions: [] })
    }

    return NextResponse.json({ sessions: data })
  } catch {
    return NextResponse.json({ sessions: [] })
  }
}
