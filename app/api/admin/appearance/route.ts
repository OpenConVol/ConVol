import { getSessionStaff } from '@/src/lib/auth'
import { clearTheme, getSavedTheme, saveTheme } from '@/src/lib/settings'
import { DEFAULT_THEME, isHexColor, THEME_KEYS, type Theme } from '@/src/lib/theme'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const theme = (await getSavedTheme()) ?? DEFAULT_THEME
  return NextResponse.json({ theme, isDefault: (await getSavedTheme()) === null })
}

export async function POST(request: NextRequest) {
  const staff = await getSessionStaff()
  if (!staff) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  if (body.reset === true) {
    await clearTheme()
    return NextResponse.json({ ok: true, theme: DEFAULT_THEME, isDefault: true })
  }

  const theme = {} as Theme
  for (const k of THEME_KEYS) {
    const v = body?.theme?.[k]
    if (!isHexColor(v)) {
      return NextResponse.json({ error: `Invalid or missing color: ${k}` }, { status: 400 })
    }
    theme[k] = v
  }

  await saveTheme(theme, staff.email)
  return NextResponse.json({ ok: true, theme, isDefault: false })
}
