import { Client } from 'pg'

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  })
}

export default async function handler(_request, { env }) {
  if (!env.DATABASE_URL) {
    return json(503, {
      ok: false,
      database: 'missing',
      message: 'DATABASE_URL is not available to the functions runtime.',
    })
  }

  const client = new Client({
    connectionString: env.DATABASE_URL,
  })

  try {
    await client.connect()

    const result = await client.query(
      'select current_database() as database_name, current_user as database_user, now() as checked_at',
    )
    const row = result.rows[0]

    return json(200, {
      ok: true,
      database: 'connected',
      databaseName: row.database_name,
      databaseUser: row.database_user,
      checkedAt: new Date(row.checked_at).toISOString(),
    })
  } catch (error) {
    return json(500, {
      ok: false,
      database: 'error',
      message: error?.message || 'Database check failed.',
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
