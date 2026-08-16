export default function StationsSummary({ total, available, filteredTotal, filtersActive, status }) {
  if (status === 'loading') {
    return <div className="stations-summary loading">Laadpalen langs de route worden opgehaald…</div>
  }

  if (status === 'error') {
    return <div className="stations-summary error">Laadpalen konden niet worden opgehaald.</div>
  }

  if (status !== 'ready') {
    return null
  }

  if (total === 0) {
    return <div className="stations-summary">Geen laadpalen gevonden binnen 2 km van deze route.</div>
  }

  return (
    <div className="stations-summary">
      <div className="summary-tile">
        <span className="summary-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="#2563eb" /><path d="M12 4 L6 12 h4 l-1.5 6 6.5 -9 h-4 z" fill="#fff" /></svg>
        </span>
        <div>
          <div className="summary-number">{filtersActive ? filteredTotal : total}</div>
          <div className="summary-caption">{filtersActive ? `van ${total} laadpalen` : 'laadpalen langs route'}</div>
        </div>
      </div>

      <div className="summary-tile">
        <span className="summary-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="#16a34a" /><path d="M12 4 L6 12 h4 l-1.5 6 6.5 -9 h-4 z" fill="#fff" /></svg>
        </span>
        <div>
          <div className="summary-number">{available}</div>
          <div className="summary-caption">beschikbaar (operationeel)</div>
        </div>
      </div>
    </div>
  )
}
