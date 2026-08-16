import { boundingBox, distanceToRoute } from './geo'

const OCM_URL = 'https://api.openchargemap.io/v3/poi'

function normalizeStation(poi) {
  const connections = (poi.Connections || []).map((c) => ({
    type: c.ConnectionType?.Title ?? 'Onbekend',
    powerKW: c.PowerKW ?? null,
    quantity: c.Quantity ?? 1,
    isOperational: c.StatusType?.IsOperational ?? null,
  }))

  // Overall status if OCM provides it; otherwise infer "operational" if any
  // connection is known-operational, "not operational" if all known
  // connections are down, else unknown.
  let isOperational = poi.StatusType?.IsOperational ?? null
  if (isOperational == null && connections.length) {
    const known = connections.filter((c) => c.isOperational != null)
    if (known.length) {
      isOperational = known.some((c) => c.isOperational)
    }
  }

  return {
    id: poi.ID,
    name: poi.AddressInfo?.Title || 'Laadpunt',
    lat: poi.AddressInfo?.Latitude,
    lng: poi.AddressInfo?.Longitude,
    address: poi.AddressInfo?.AddressLine1 || '',
    town: poi.AddressInfo?.Town || '',
    operator: poi.OperatorInfo?.Title || null,
    numberOfPoints: poi.NumberOfPoints ?? connections.length ?? null,
    connections,
    isOperational,
  }
}

// Fetches charging stations from OpenChargeMap within a bounding box around
// the given route points, then keeps only the ones within `bufferMeters` of
// the actual route line.
export async function fetchStationsAlongRoute(routeCoords, { bufferMeters = 2000, maxResults = 500 } = {}) {
  if (!routeCoords || routeCoords.length === 0) return []

  const bbox = boundingBox(routeCoords, bufferMeters)

  // OpenChargeMap expects "(top-left),(bottom-right)", i.e. (north,west),(south,east).
  const url = new URL(OCM_URL)
  url.searchParams.set('output', 'json')
  url.searchParams.set('boundingbox', `(${bbox.north},${bbox.west}),(${bbox.south},${bbox.east})`)
  url.searchParams.set('maxresults', String(maxResults))
  url.searchParams.set('compact', 'false')
  url.searchParams.set('verbose', 'true')

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`Laadpalen ophalen mislukt (${res.status})`)
  }

  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Onverwacht antwoord van OpenChargeMap')
  }

  return data
    .map(normalizeStation)
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .filter((s) => distanceToRoute([s.lat, s.lng], routeCoords) <= bufferMeters)
}
