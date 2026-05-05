import { useMemo, useState } from 'react'
import './App.css'

const repoUrl = 'https://github.com/nonstopdevelopment/vite-deploy'

const liveChecks = [
  {
    id: 'event',
    label: 'Function handler',
    description: 'Calls a same-origin server-side function with query params.',
    path: '/api/event-context-check?hello=world&hello=again',
    method: 'GET',
    successLabel: 'Event/context function answered',
  },
  {
    id: 'eventPost',
    label: 'Function POST body',
    description: 'Posts JSON to the same function and receives parsed data back.',
    path: '/api/event-context-check?mode=post',
    method: 'POST',
    body: { source: 'vite-demo', purpose: 'developer-docs' },
    successLabel: 'POST body parsed securely',
  },
  {
    id: 'database',
    label: 'Managed PostgreSQL',
    description: 'Checks private database access from the server-side function pod.',
    path: '/api/db-check',
    method: 'GET',
    successLabel: 'Database connected',
  },
  {
    id: 'blob',
    label: 'Managed Blob storage',
    description: 'Writes and reads an object through private server-side credentials.',
    path: '/api/blob-check',
    method: 'GET',
    successLabel: 'Blob storage connected',
  },
]

const deploySteps = [
  'Connect a public GitHub repository',
  'Detect Vite and the functions directory',
  'Build the static app and function runtime',
  'Publish the app and route /api/* to functions',
]

const functionExample = `export async function handler(event, context) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      method: event.httpMethod,
      query: event.queryStringParameters,
      functionName: context.functionName,
    }),
  }
}`

const browserExample = `const response = await fetch('/api/event-context-check', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ source: 'vite-demo' }),
})

const result = await response.json()`

async function runCheck(check) {
  const response = await fetch(check.path, {
    method: check.method,
    headers: {
      Accept: 'application/json',
      ...(check.body ? { 'content-type': 'application/json' } : {}),
    },
    body: check.body ? JSON.stringify(check.body) : undefined,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`)
  }

  return payload
}

function resultSummary(result) {
  if (!result) {
    return 'Not checked yet'
  }

  if (result.status === 'ready') {
    return result.label
  }

  return result.message
}

function App() {
  const [results, setResults] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const readyCount = useMemo(
    () => Object.values(results).filter((result) => result.status === 'ready').length,
    [results],
  )

  const headline = readyCount === liveChecks.length
    ? 'Public Vite deploy with live server-side functions'
    : 'Vite app deployed from GitHub to Nerdo.host'

  async function refreshChecks() {
    setIsRefreshing(true)

    const nextResults = {}

    await Promise.all(
      liveChecks.map(async (check) => {
        try {
          const payload = await runCheck(check)

          nextResults[check.id] = {
            status: 'ready',
            label: check.successLabel,
            payload,
          }
        } catch (error) {
          nextResults[check.id] = {
            status: 'missing',
            message: error.message,
          }
        }
      }),
    )

    setResults(nextResults)
    setIsRefreshing(false)
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Nerdo.host developer demo</p>
          <h1>{headline}</h1>
          <p className="lede">
            This app is a public Vite repository. The frontend is static and
            secret-free, while `/api/*` is served by a separate function runtime
            with managed PostgreSQL and Blob storage attached.
          </p>
          <div className="actions">
            <a href={repoUrl} className="primary-link" target="_blank" rel="noreferrer">
              View public repo
            </a>
            <button type="button" onClick={refreshChecks} disabled={isRefreshing}>
              {isRefreshing ? 'Running checks...' : 'Run live checks'}
            </button>
          </div>
        </div>

        <aside className="deploy-card" aria-label="Deployment source">
          <span className="status-dot">Live</span>
          <h2>GitHub to OKD</h2>
          <p>{repoUrl}</p>
          <dl>
            <div>
              <dt>Framework</dt>
              <dd>Vite / static</dd>
            </div>
            <div>
              <dt>Functions</dt>
              <dd>nerdo/functions</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>/api/*</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="flow" aria-label="Deploy flow">
        {deploySteps.map((step, index) => (
          <article className="flow-step" key={step}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{step}</p>
          </article>
        ))}
      </section>

      <section className="status-panel" aria-label="Live function checks">
        <div className="section-heading">
          <p className="eyebrow">Live endpoints</p>
          <h2>{readyCount} of {liveChecks.length} checks are ready</h2>
        </div>

        <div className="check-list">
          {liveChecks.map((check) => {
            const result = results[check.id]
            const isReady = result?.status === 'ready'

            return (
              <article className="check-row" key={check.id}>
                <div>
                  <h3>{check.label}</h3>
                  <p>{check.description}</p>
                  <code>{check.method} {check.path}</code>
                </div>
                <span className={isReady ? 'badge ready' : 'badge pending'}>
                  {resultSummary(result)}
                </span>
              </article>
            )
          })}
        </div>
      </section>

      <section className="docs-grid" aria-label="Developer examples">
        <article>
          <p className="eyebrow">Function file</p>
          <h2>Event/context handlers work server-side</h2>
          <pre>{functionExample}</pre>
        </article>

        <article>
          <p className="eyebrow">Browser app</p>
          <h2>The frontend calls same-origin APIs</h2>
          <pre>{browserExample}</pre>
        </article>
      </section>
    </main>
  )
}

export default App
