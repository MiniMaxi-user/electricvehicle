import { AMENITY_TYPES } from '../lib/amenities'
import { stationStatus } from '../lib/icons'

export default function StationList({ stations }) {
  if (stations.length === 0) return null

  return (
    <ul className="station-list">
      {stations.map((station) => {
        const status = stationStatus(station)
        return (
          <li key={station.id} className="station-list-item">
            <div className="station-list-main">
              <span className={`status-dot status-${status}`} aria-hidden="true" />
              <div>
                <div className="station-name">{station.name}</div>
                <div className="muted">{[station.address, station.town].filter(Boolean).join(', ')}</div>
              </div>
            </div>
            <div className="amenity-badges">
              {Object.entries(AMENITY_TYPES).map(([key, meta]) =>
                station.amenities?.[key] ? (
                  <span key={key} className="amenity-badge" title={meta.label}>{meta.icon}</span>
                ) : null
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
