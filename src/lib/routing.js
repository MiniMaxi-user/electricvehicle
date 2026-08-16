const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

// points: array of { lat, lng } in travel order (start, ...waypoints, end).
// Returns { coords: [[lat,lng], ...], distanceM, durationS }.
export async function calculateRoute(points) {
  if (!points || points.length < 2) {
    throw new Error('Er zijn minstens een startpunt en eindpunt nodig')
  }

  const coordPath = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `${OSRM_URL}/${coordPath}?overview=full&geometries=geojson&steps=false`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Route berekenen mislukt (${res.status})`)
  }

  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('Geen route gevonden tussen deze punten')
  }

  const route = data.routes[0]
  const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])

  return {
    coords,
    distanceM: route.distance,
    durationS: route.duration,
  }
}
