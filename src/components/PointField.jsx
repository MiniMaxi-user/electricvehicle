import { useEffect, useRef, useState } from 'react'
import { searchAddress } from '../lib/geocode'

export default function PointField({ label, colorClass, letter, point, pending, onPick, onClear, onTogglePending }) {
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
    onPick({ lat: result.lat, lng: result.lng, label: result.label })
    setQuery('')
    setResults([])
  }

  return (
    <div className="point-field">
      <div className="point-field-header">
        <span className={`point-badge ${colorClass}`}>{letter}</span>
        <span className="point-label">{label}</span>
      </div>

      {point ? (
        <div className="point-value">
          <span className="point-value-text" title={point.label}>{point.label}</span>
          <button type="button" className="link-btn" onClick={onClear}>Wissen</button>
        </div>
      ) : (
        <div className="point-empty">Nog niet gekozen</div>
      )}

      <div className="point-actions">
        <button
          type="button"
          className={`btn btn-secondary ${pending ? 'btn-active' : ''}`}
          onClick={onTogglePending}
        >
          {pending ? 'Klikken op kaart…' : 'Kies op kaart'}
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
