import L from 'leaflet'

function pinSvg(fill, label) {
  return `
    <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12 17 27 17 27s17-15 17-27C34 7.6 26.4 0 17 0z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="17" cy="17" r="10" fill="#ffffff"/>
      <text x="17" y="22" font-size="12" font-weight="700" text-anchor="middle" fill="${fill}" font-family="system-ui, sans-serif">${label}</text>
    </svg>
  `
}

export function pointIcon(kind, label = '') {
  const colors = { start: '#16a34a', end: '#dc2626', waypoint: '#2563eb' }
  const fill = colors[kind] || '#2563eb'
  return L.divIcon({
    className: 'lp-marker',
    html: pinSvg(fill, label),
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  })
}

const STATUS_COLORS = {
  available: '#16a34a',
  unavailable: '#dc2626',
  unknown: '#6b7280',
}

function boltSvg(color) {
  return `
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="13" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
      <path d="M16.5 6 L9 17 h5 l-2 7 9 -12 h-5 z" fill="#ffffff"/>
    </svg>
  `
}

export function stationIcon(status) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.unknown
  return L.divIcon({
    className: 'lp-station-marker',
    html: boltSvg(color),
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  })
}

export function stationStatus(station) {
  if (station.isOperational === true) return 'available'
  if (station.isOperational === false) return 'unavailable'
  return 'unknown'
}
