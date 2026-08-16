const EARTH_RADIUS_M = 6371000

export function toRad(deg) {
  return (deg * Math.PI) / 180
}

// Haversine distance between two [lat, lng] points, in meters.
export function haversineDistance([lat1, lng1], [lat2, lng2]) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

// Approximate distance (meters) from a point to a line segment, using an
// equirectangular projection local to the segment. Accurate enough for the
// short segments in a route polyline.
function distanceToSegmentMeters(point, segStart, segEnd) {
  const lat0 = toRad(segStart[0])
  const mPerDegLat = 111320
  const mPerDegLng = 111320 * Math.cos(lat0)

  const toXY = ([lat, lng]) => [
    (lng - segStart[1]) * mPerDegLng,
    (lat - segStart[0]) * mPerDegLat,
  ]

  const p = toXY(point)
  const a = [0, 0]
  const b = toXY(segEnd)

  const abx = b[0] - a[0]
  const aby = b[1] - a[1]
  const lenSq = abx * abx + aby * aby

  let t = lenSq === 0 ? 0 : ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / lenSq
  t = Math.max(0, Math.min(1, t))

  const closest = [a[0] + t * abx, a[1] + t * aby]
  const dx = p[0] - closest[0]
  const dy = p[1] - closest[1]
  return Math.sqrt(dx * dx + dy * dy)
}

// Shortest distance (meters) from a point to a polyline (array of [lat, lng]).
export function distanceToRoute(point, routeCoords) {
  if (!routeCoords || routeCoords.length === 0) return Infinity
  if (routeCoords.length === 1) return haversineDistance(point, routeCoords[0])

  let min = Infinity
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const d = distanceToSegmentMeters(point, routeCoords[i], routeCoords[i + 1])
    if (d < min) min = d
  }
  return min
}

// Thins out a route polyline to points spaced at least minSpacingMeters
// apart, always keeping the first and last point. Used to keep Overpass
// "around" queries (one circle per point) a reasonable size for long routes.
export function resampleRoute(routeCoords, minSpacingMeters = 1000) {
  if (!routeCoords || routeCoords.length === 0) return []
  const result = [routeCoords[0]]
  let last = routeCoords[0]

  for (let i = 1; i < routeCoords.length; i++) {
    const point = routeCoords[i]
    if (haversineDistance(last, point) >= minSpacingMeters) {
      result.push(point)
      last = point
    }
  }

  const lastPoint = routeCoords[routeCoords.length - 1]
  if (result[result.length - 1] !== lastPoint) {
    result.push(lastPoint)
  }

  return result
}

// Bounding box [south, west, north, east] around a set of [lat, lng] points,
// padded by paddingMeters on every side.
export function boundingBox(points, paddingMeters = 0) {
  let south = Infinity
  let west = Infinity
  let north = -Infinity
  let east = -Infinity

  for (const [lat, lng] of points) {
    if (lat < south) south = lat
    if (lat > north) north = lat
    if (lng < west) west = lng
    if (lng > east) east = lng
  }

  const latPad = paddingMeters / 111320
  const midLat = (south + north) / 2
  const lngPad = paddingMeters / (111320 * Math.cos(toRad(midLat)) || 1)

  return {
    south: south - latPad,
    west: west - lngPad,
    north: north + latPad,
    east: east + lngPad,
  }
}
