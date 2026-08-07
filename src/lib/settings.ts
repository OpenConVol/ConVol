import 'server-only'
import { pool, queryMany } from '@/src/lib/db'
import { isHexColor, THEME_KEYS, type Theme } from '@/src/lib/theme'

/**
 * Operator settings, backed by the `settings` key/value table. Pure theming
 * helpers (defaults, presets, resolveThemeVars) live in theme.ts so the client
 * appearance editor can share them; this module is the server/DB side.
 *
 * When no theme is saved, the app falls back to the defaults baked into
 * globals.css (the original dark look), so an unthemed install is unchanged.
 */

/** Returns the saved theme, or null if the operator has not set one. */
export async function getSavedTheme(): Promise<Theme | null> {
  const rows = await queryMany<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE key LIKE 'theme.%'"
  )
  if (rows.length === 0) return null
  const map = new Map(rows.map(r => [r.key, r.value]))
  const theme = {} as Theme
  for (const k of THEME_KEYS) {
    const v = map.get(`theme.${k}`)
    if (!isHexColor(v)) return null // incomplete/invalid -> fall back to defaults
    theme[k] = v
  }
  return theme
}

/** Persist a full theme (all six keys). Values must be #rrggbb. */
export async function saveTheme(theme: Theme, byEmail: string): Promise<void> {
  for (const k of THEME_KEYS) {
    if (!isHexColor(theme[k])) throw new Error(`Invalid color for ${k}: ${theme[k]}`)
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const k of THEME_KEYS) {
      await client.query(
        `INSERT INTO settings (key, value, updated_by) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [`theme.${k}`, theme[k], byEmail]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Reset to the built-in default by clearing saved theme rows. */
export async function clearTheme(): Promise<void> {
  await pool.query("DELETE FROM settings WHERE key LIKE 'theme.%'")
}
