import { useMemo, useState } from 'react'
import './App.css'

const checks = [
  {
    id: 'database',
    label: 'Managed database',
    path: '/api/db-check',
    readyMessage: 'Connected through a server-side API route.',
  },
  {
    id: 'blob',
    label: 'Managed Blob storage',
    path: '/api/blob-check',
    readyMessage: 'Private bucket access is brokered by a server-side API route.',
  },
]

async function runCheck(path) {
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
    },
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

function App() {
  const [results, setResults] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const summary = useMemo(() => {
    const values = Object.values(results)

    if (values.length === 0) {
      return 'Static app is live and ready to check backend readiness.'
    }

    if (values.some((result) => result.status === 'ready')) {
      return 'A server-side API is answering for this static app.'
    }

    if (values.some((result) => result.status === 'missing')) {
      return 'Static app is live. Backend functions are not attached yet.'
    }

    return 'Checking managed service access.'
  }, [results])

  async function refreshChecks() {
    setIsRefreshing(true)

    const nextResults = {}

    await Promise.all(
      checks.map(async (check) => {
        try {
          const payload = await runCheck(check.path)

          nextResults[check.id] = {
            status: 'ready',
            message: check.readyMessage,
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
        <p className="eyebrow">Nerdo.host static deploy</p>
        <h1>Vite app running on OKD</h1>
        <p className="lede">
          This frontend stays public and secret-free. Database and private Blob
          access should arrive through a server-side API or function runtime.
        </p>
        <div className="actions">
          <a href="/" className="primary-link">
            Open app
          </a>
          <button type="button" onClick={refreshChecks} disabled={isRefreshing}>
            {isRefreshing ? 'Checking...' : 'Refresh checks'}
          </button>
        </div>
      </section>

      <section className="status-panel" aria-label="Managed service checks">
        <div className="status-heading">
          <p className="eyebrow">Backend readiness</p>
          <h2>{summary}</h2>
        </div>
        <div className="check-list">
          {checks.map((check) => {
            const result = results[check.id]
            const isReady = result?.status === 'ready'

            return (
              <article className="check-row" key={check.id}>
                <div>
                  <h3>{check.label}</h3>
                  <p>{isReady ? result.message : 'Waiting for a server-side endpoint.'}</p>
                </div>
                <span className={isReady ? 'badge ready' : 'badge pending'}>
                  {isReady ? 'Ready' : 'Function needed'}
                </span>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

export default App
