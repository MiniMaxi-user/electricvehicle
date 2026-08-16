import { useEffect, useRef, useState } from 'react'
import { searchAddress } from '../lib/geocode'

export default function WaypointsPanel({ waypoints, pending, onTogglePending, onRemove, onMove, onAdd }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 3) {
      setResults([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchAddress(query)
        setResults(found)
        setStatus('idle')
      } catch {
        setStatus('error')
      }
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function pickResult(result) {
    onAdd({ lat: result.lat, lng: result.lng, label: result.label })
    setQuery('')
    setResults([])
  }
  return (
    <div className="point-field">
      <div className="point-field-header">
        <span className="point-badge waypoint-badge">#</span>
        <span className="point-label">Routepunten (optioneel)</span>
      </div>

      {waypoints.length === 0 ? (
        <div className="point-empty">Geen routepunten toegevoegd</div>
      ) : (
        <ul className="waypoint-list">
          {waypoints.map((wp, i) => (
            <li key={wp.id}>
              <span className="waypoint-index">{i + 1}</span>
              <span className="waypoint-text" title={wp.label}>{wp.label}</span>
              <div className="waypoint-actions">
                <button type="button" disabled={i === 0} onClick={() => onMove(i, -1)} aria-label="Omhoog">↑</button>
                <button type="button" disabled={i === waypoints.length - 1} onClick={() => onMove(i, 1)} aria-label="Omlaag">↓</button>
                <button type="button" onClick={() => onRemove(wp.id)} aria-label="Verwijderen">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="point-actions">
        <button
          type="button"
          className={`btn btn-secondary ${pending ? 'btn-active' : ''}`}
          onClick={onTogglePending}
        >
          {pending ? 'Klik op de kaart om toe te voegen…' : '+ Routepunt toevoegen'}
        </button>
      </div>

      <div className="point-search">
        <input
          type="text"
          placeholder="Of zoek een adres/plaats…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {status === 'loading' && <div className="search-hint">Zoeken…</div>}
        {status === 'error' && <div className="search-hint error">Zoeken mislukt</div>}
        {results.length > 0 && (
          <ul className="search-results">
            {results.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => pickResult(r)}>{r.label}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
