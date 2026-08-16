import { useCallback, useMemo, useState } from 'react'
import MapView from './components/MapView'
import PointField from './components/PointField'
import WaypointsPanel from './components/WaypointsPanel'
import StationsSummary from './components/StationsSummary'
import FiltersPanel from './components/FiltersPanel'
import StationList from './components/StationList'
import { calculateRoute } from './lib/routing'
import { fetchStationsAlongRoute } from './lib/chargingStations'
import { fetchAmenitiesNearRoute, attachAmenityFlags } from './lib/amenities'
import './App.css'

let waypointId = 0

const EMPTY_FILTERS = { toilet: false, fuel: false, restaurant: false, mcdonalds: false }

function labelFor(point) {
  return point.label || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
}

export default function App() {
  const [startPoint, setStartPoint] = useState(null)
  const [endPoint, setEndPoint] = useState(null)
  const [waypoints, setWaypoints] = useState([])
  const [pendingAddMode, setPendingAddMode] = useState(null)

  const [route, setRoute] = useState(null)
  const [routeStatus, setRouteStatus] = useState('idle')
  const [routeError, setRouteError] = useState(null)

  const [stations, setStations] = useState([])
  const [stationsStatus, setStationsStatus] = useState('idle')
  const [stationsError, setStationsError] = useState(null)
  const [amenitiesWarning, setAmenitiesWarning] = useState(null)

  const [filters, setFilters] = useState(EMPTY_FILTERS)

  const handleMapClick = useCallback(
    (latlng) => {
      if (!pendingAddMode) return
      const point = { ...latlng, label: labelFor(latlng) }

      if (pendingAddMode === 'start') {
        setStartPoint(point)
        setPendingAddMode(null)
      } else if (pendingAddMode === 'end') {
        setEndPoint(point)
        setPendingAddMode(null)
      } else if (pendingAddMode === 'waypoint') {
        setWaypoints((prev) => [...prev, { ...point, id: `wp-${waypointId++}` }])
      }
    },
    [pendingAddMode]
  )

  const togglePending = (mode) => setPendingAddMode((cur) => (cur === mode ? null : mode))

  const removeWaypoint = (id) => setWaypoints((prev) => prev.filter((w) => w.id !== id))
  const addWaypoint = (point) => setWaypoints((prev) => [...prev, { ...point, id: `wp-${waypointId++}` }])
  const moveWaypoint = (index, dir) => {
    setWaypoints((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function loadStations(coords) {
    setStationsStatus('loading')
    setStationsError(null)
    setAmenitiesWarning(null)

    try {
      const stationList = await fetchStationsAlongRoute(coords)

      let amenityNodes = []
      try {
        amenityNodes = await fetchAmenitiesNearRoute(coords)
      } catch {
        setAmenitiesWarning(
          'Voorzieningen (toilet/tankstation/restaurant/McDonald’s) konden niet worden opgehaald; filters zijn nu niet betrouwbaar.'
        )
      }

      setStations(attachAmenityFlags(stationList, amenityNodes))
      setStationsStatus('ready')
    } catch (err) {
      setStationsError(err.message)
      setStationsStatus('error')
    }
  }

  async function handleCalculateRoute() {
    if (!startPoint || !endPoint) return
    setRouteStatus('loading')
    setRouteError(null)
    setStations([])
    setStationsStatus('idle')
    setFilters(EMPTY_FILTERS)

    try {
      const points = [startPoint, ...waypoints, endPoint]
      const result = await calculateRoute(points)
      setRoute(result)
      setRouteStatus('idle')
      loadStations(result.coords)
    } catch (err) {
      setRouteError(err.message)
      setRouteStatus('error')
    }
  }

  const toggleFilter = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  const filtersActive = Object.values(filters).some(Boolean)

  const filteredStations = useMemo(() => {
    if (!filtersActive) return stations
    const activeKeys = Object.keys(filters).filter((k) => filters[k])
    return stations.filter((s) => activeKeys.every((k) => s.amenities?.[k]))
  }, [stations, filters, filtersActive])

  const availableCount = useMemo(
    () => filteredStations.filter((s) => s.isOperational === true).length,
    [filteredStations]
  )

  const routeSummary = route
    ? `${(route.distanceM / 1000).toFixed(0)} km · ${Math.round(route.durationS / 60)} min`
    : null

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <header className="app-header">
          <h1>&#9889; Laadpaal Routeplanner</h1>
          <p className="muted">Plan een route en bekijk laadpalen onderweg</p>
        </header>

        <PointField
          label="Startpunt"
          colorClass="start-badge"
          letter="S"
          point={startPoint}
          pending={pendingAddMode === 'start'}
          onPick={(p) => { setStartPoint(p); setPendingAddMode(null) }}
          onClear={() => setStartPoint(null)}
          onTogglePending={() => togglePending('start')}
        />

        <WaypointsPanel
          waypoints={waypoints}
          pending={pendingAddMode === 'waypoint'}
          onTogglePending={() => togglePending('waypoint')}
          onRemove={removeWaypoint}
          onAdd={addWaypoint}
          onMove={moveWaypoint}
        />

        <PointField
          label="Eindpunt"
          colorClass="end-badge"
          letter="E"
          point={endPoint}
          pending={pendingAddMode === 'end'}
          onPick={(p) => { setEndPoint(p); setPendingAddMode(null) }}
          onClear={() => setEndPoint(null)}
          onTogglePending={() => togglePending('end')}
        />

        <button
          type="button"
          className="btn btn-primary"
          disabled={!startPoint || !endPoint || routeStatus === 'loading'}
          onClick={handleCalculateRoute}
        >
          {routeStatus === 'loading' ? 'Route berekenen…' : 'Bereken route'}
        </button>

        {routeError && <div className="search-hint error">{routeError}</div>}
        {routeSummary && <div className="route-summary">{routeSummary}</div>}

        <StationsSummary
          total={stations.length}
          available={availableCount}
          filteredTotal={filteredStations.length}
          filtersActive={filtersActive}
          status={stationsStatus}
        />
        {stationsError && <div className="search-hint error">{stationsError}</div>}

        {stationsStatus === 'ready' && stations.length > 0 && (
          <>
            <FiltersPanel filters={filters} onToggle={toggleFilter} amenitiesWarning={amenitiesWarning} />
            <StationList stations={filteredStations} />
          </>
        )}
      </aside>

      <main className="map-pane">
        <MapView
          startPoint={startPoint}
          endPoint={endPoint}
          waypoints={waypoints}
          routeCoords={route?.coords}
          stations={filteredStations}
          pendingAddMode={pendingAddMode}
          onMapClick={handleMapClick}
        />
      </main>
    </div>
  )
}
