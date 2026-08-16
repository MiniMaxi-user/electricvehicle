const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

// Looks up an address / place name and returns the best matches.
// Uses the public Nominatim (OpenStreetMap) search API.
export async function searchAddress(query, { limit = 5, countrycodes = 'nl,be,de' } = {}) {
  if (!query || query.trim().length < 2) return []

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('countrycodes', countrycodes)
  url.searchParams.set('addressdetails', '0')

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Adres zoeken mislukt (${res.status})`)
  }

  const data = await res.json()
  return data.map((item) => ({
    id: `${item.place_id}`,
    label: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }))
}
