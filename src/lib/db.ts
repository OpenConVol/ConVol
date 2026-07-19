import 'server-only'
import { Pool, type QueryResultRow } from 'pg'

if (typeof window !== 'undefined') {
  throw new Error('src/lib/db.ts must not be imported from client code')
}

/**
 * Shared Postgres connection pool, reading connection info from
 * `DATABASE_URL`. Reused across the process — do not instantiate `Pool`
 * anywhere else.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

/**
 * Tagged-template helper for parameterized queries.
 *
 * Usage: `` sql`SELECT * FROM shifts WHERE id = ${id}` ``
 *
 * Interpolated values are automatically converted to `$1, $2, ...`
 * placeholders and passed as parameters — never string-interpolated into
 * the query text.
 */
export async function sql<T extends QueryResultRow = any>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  let text = strings[0]
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}` + strings[i + 1]
  }
  const result = await pool.query<T>(text, values)
  return { rows: result.rows, rowCount: result.rowCount ?? 0 }
}

/**
 * Runs a parameterized query and returns exactly one row, or `null` if no
 * rows matched. Throws if more than one row is returned.
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await pool.query<T>(text, params)
  if (result.rows.length > 1) {
    throw new Error(`queryOne: expected at most 1 row, got ${result.rows.length}`)
  }
  return result.rows[0] ?? null
}

/**
 * Runs a parameterized query and returns all matching rows.
 */
export async function queryMany<T extends QueryResultRow = any>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params)
  return result.rows
}
