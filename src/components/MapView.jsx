import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet'
import { pointIcon, stationIcon, stationStatus } from '../lib/icons'
import { AMENITY_TYPES } from '../lib/amenities'

const NL_CENTER = [52.1326, 5.2913]

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function FitToBounds({ points }) {
  const map = useMap()
  const lastKey = useRef('')

  useEffect(() => {
    if (!points || points.length === 0) return
    const key = JSON.stringify(points)
    if (key === lastKey.current) return
    lastKey.current = key

    if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      map.fitBounds(points, { padding: [40, 40] })
    }
  }, [points, map])

  return null
}

function formatKW(station) {
  const powers = station.connections.map((c) => c.powerKW).filter(Boolean)
  if (powers.length === 0) return null
  return `tot ${Math.max(...powers)} kW`
}

function StationPopup({ station }) {
  const status = stationStatus(station)
  const statusLabel = { available: 'Operationeel', unavailable: 'Buiten gebruik', unknown: 'Status onbekend' }[status]
  const kw = formatKW(station)

  return (
    <div className="station-popup">
      <h4>{station.name}</h4>
      {(station.address || station.town) && (
        <p className="muted">{[station.address, station.town].filter(Boolean).join(', ')}</p>
      )}
      <p className={`status-badge status-${status}`}>{statusLabel}</p>
      <p className="muted">
        {station.numberOfPoints ? `${station.numberOfPoints} laadpunt(en)` : ''}
        {kw ? ` · ${kw}` : ''}
      </p>
      {station.operator && <p className="muted">Operator: {station.operator}</p>}
      <div className="amenity-badges">
        {Object.entries(AMENITY_TYPES).map(([key, meta]) =>
          station.amenities?.[key] ? (
            <span key={key} className="amenity-badge" title={meta.label}>
              {meta.icon} {meta.label}
            </span>
          ) : null
        )}
      </div>
    </div>
  )
}

export default function MapView({ startPoint, endPoint, waypoints, routeCoords, stations, pendingAddMode, onMapClick }) {
  const fitPoints = routeCoords?.length
    ? routeCoords
    : [startPoint, ...waypoints, endPoint].filter(Boolean).map((p) => [p.lat, p.lng])

  return (
    <MapContainer center={NL_CENTER} zoom={7} className="map-container">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers'
      />
      <ClickHandler onMapClick={onMapClick} />
      <FitToBounds points={fitPoints} />

      {startPoint && (
        <Marker position={[startPoint.lat, startPoint.lng]} icon={pointIcon('start', 'S')}>
          <Popup>Startpunt<br />{startPoint.label}</Popup>
        </Marker>
      )}

      {waypoints.map((wp, i) => (
        <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={pointIcon('waypoint', String(i + 1))}>
          <Popup>Routepunt {i + 1}<br />{wp.label}</Popup>
        </Marker>
      ))}

      {endPoint && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={pointIcon('end', 'E')}>
          <Popup>Eindpunt<br />{endPoint.label}</Popup>
        </Marker>
      )}

      {routeCoords?.length > 0 && (
        <Polyline positions={routeCoords} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.75 }} />
      )}

      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.lat, station.lng]}
          icon={stationIcon(stationStatus(station))}
        >
          <Popup>
            <StationPopup station={station} />
          </Popup>
        </Marker>
      ))}

      {pendingAddMode && (
        <div className="map-hint">
          Klik op de kaart om {pendingAddMode === 'start' ? 'het startpunt' : pendingAddMode === 'end' ? 'het eindpunt' : 'een routepunt'} te plaatsen
        </div>
      )}
    </MapContainer>
  )
}
