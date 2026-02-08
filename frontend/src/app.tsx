import { useState, useCallback } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { searchEffects } from './utils/api'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<{ name: string; description?: string }[]>([])

  const runSearch = useCallback((q: string) => {
    setSearchQuery(q)
    console.log('[App] search on each letter:', q)
    searchEffects(q).then((res) => {
      setResults(res.effects)
      console.log('[App] search results count:', res.effects.length)
    }).catch((err) => console.error('[App] search error:', err))
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <label>
          Search effects (each letter refreshes):{' '}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="e.g. nausea"
          />
        </label>
        {results.length > 0 && (
          <ul style={{ textAlign: 'left', marginTop: 8 }}>
            {results.map((e) => (
              <li key={e.name}>{e.name}{e.description ? ` – ${e.description}` : ''}</li>
            ))}
          </ul>
        )}
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
