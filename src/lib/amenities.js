import { haversineDistance, resampleRoute } from './geo'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

export const AMENITY_TYPES = {
  toilet: { label: 'Toilet', icon: '🚻' },
  fuel: { label: 'Tankstation', icon: '⛽' },
  restaurant: { label: 'Restaurant', icon: '🍽️' },
  mcdonalds: { label: "McDonald's", icon: '🍔' },
}

function buildAroundList(points, radiusMeters) {
  const coordPairs = points.map(([lat, lng]) => `${lat},${lng}`).join(',')
  return `${radiusMeters},${coordPairs}`
}

function buildQuery(routePoints, radiusMeters) {
  const around = buildAroundList(routePoints, radiusMeters)
  return `
    [out:json][timeout:25];
    (
      node(around:${around})["amenity"="toilets"];
      node(around:${around})["amenity"="fuel"];
      node(around:${around})["amenity"="restaurant"];
      node(around:${around})["amenity"="fast_food"]["name"~"mcdonald",i];
      node(around:${around})["amenity"="fast_food"]["brand"~"mcdonald",i];
    );
    out body;
  `
}

function classify(tags) {
  if (tags.amenity === 'toilets') return 'toilet'
  if (tags.amenity === 'fuel') return 'fuel'
  if (tags.amenity === 'restaurant') return 'restaurant'
  if (
    tags.amenity === 'fast_food' &&
    (/mcdonald/i.test(tags.name || '') || /mcdonald/i.test(tags.brand || ''))
  ) {
    return 'mcdonalds'
  }
  return null
}

// Fetches nearby toilets / fuel stations / restaurants / McDonald's outlets
// in a corridor around the given route, via the public Overpass API
// (OpenStreetMap data).
export async function fetchAmenitiesNearRoute(routeCoords, { corridorRadius = 400, minSpacingMeters = 1200 } = {}) {
  if (!routeCoords || routeCoords.length === 0) return []

  const sampled = resampleRoute(routeCoords, minSpacingMeters)
  const query = buildQuery(sampled, corridorRadius)

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!res.ok) {
    throw new Error(`Voorzieningen ophalen mislukt (${res.status})`)
  }

  const data = await res.json()

  return (data.elements || [])
    .map((el) => {
      const type = classify(el.tags || {})
      if (!type) return null
      return { lat: el.lat, lng: el.lon, type, name: el.tags?.name || null }
    })
    .filter(Boolean)
}

// Returns a new array of stations, each annotated with an `amenities` object
// of booleans (toilet / fuel / restaurant / mcdonalds present within
// `radiusMeters` of the station).
export function attachAmenityFlags(stations, amenityNodes, { radiusMeters = 300 } = {}) {
  const byType = { toilet: [], fuel: [], restaurant: [], mcdonalds: [] }
  for (const node of amenityNodes) {
    byType[node.type]?.push(node)
  }

  return stations.map((station) => {
    const point = [station.lat, station.lng]
    const amenities = {}
    for (const type of Object.keys(byType)) {
      amenities[type] = byType[type].some((node) => haversineDistance(point, [node.lat, node.lng]) <= radiusMeters)
    }
    return { ...station, amenities }
  })
}
