/**
 * Pure theming logic — safe to import from both server and client (no DB, no
 * 'server-only'). The database-backed persistence lives in settings.ts.
 *
 * A convention sets six "key colors"; resolveThemeVars expands them into the
 * full set of --app-* CSS variables that globals.css maps the Tailwind palette
 * onto. See docs/architecture/decisions.md.
 */

export type Theme = {
  primary: string
  accent: string
  bg: string
  surface: string
  text: string
  border: string
}

export const THEME_KEYS: (keyof Theme)[] = ['primary', 'accent', 'bg', 'surface', 'text', 'border']

export const THEME_LABELS: Record<keyof Theme, string> = {
  primary: 'Primary',
  accent: 'Accent',
  bg: 'Background',
  surface: 'Surface',
  text: 'Text',
  border: 'Border',
}

/** The built-in dark look — also the fallback baked into globals.css. */
export const DEFAULT_THEME: Theme = {
  primary: '#4f46e5',
  accent: '#6366f1',
  bg: '#030712',
  surface: '#111827',
  text: '#ffffff',
  border: '#374151',
}

export const THEME_PRESETS: { id: string; label: string; theme: Theme }[] = [
  { id: 'convol', label: 'ConVol (dark)', theme: DEFAULT_THEME },
  {
    id: 'jordancon',
    label: 'JordanCon',
    theme: {
      primary: '#198cae',
      accent: '#46c8c8',
      bg: '#ffffff',
      surface: '#f4f6f8',
      text: '#474747',
      border: '#dadfe4',
    },
  },
]

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
export const isHexColor = (v: unknown): v is string => typeof v === 'string' && HEX_COLOR.test(v)

/**
 * Resolve six key colors into the full --app-* variable set. Muted grays are
 * derived from a text/background mix so they stay legible in any theme.
 */
export function resolveThemeVars(t: Theme): Record<string, string> {
  const mix = (pct: number) => `color-mix(in srgb, ${t.text} ${pct}%, ${t.bg})`
  return {
    '--app-bg': t.bg,
    '--app-surface': t.surface,
    '--app-surface-2': `color-mix(in srgb, ${t.surface} 88%, ${t.text})`,
    '--app-gray-700': t.border,
    '--app-gray-600': mix(76),
    '--app-gray-500': mix(62),
    '--app-gray-400': mix(52),
    '--app-gray-300': mix(84),
    '--app-text': t.text,
    '--app-brand-600': t.primary,
    '--app-brand-500': t.accent,
    '--app-brand-400': t.primary,
    '--app-brand-300': t.accent,
    '--app-brand-ink': '#ffffff',
  }
}
