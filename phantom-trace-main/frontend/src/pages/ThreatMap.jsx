// ThreatSense — ThreatMap
// Geographic visualization of threat sources using MongoDB-backed threat events

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useThreatMap } from '../hooks/useThreatMap'
import { ComposableMap, Geographies, Geography, Graticule, Marker, Sphere } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export default function ThreatMap() {
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [timeFilter, setTimeFilter] = useState('7d')
  const [showCustomWindow, setShowCustomWindow] = useState(false)
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')
  const [customWindow, setCustomWindow] = useState(null)
  const { locations, threats, threadScope, windowStart, windowEnd, loading, error } = useThreatMap('all', timeFilter, customWindow)

  const visibleLocations = useMemo(
    () => locations.filter((location) => location.country !== 'Internal'),
    [locations]
  )
  const visibleThreats = useMemo(
    () => threats.filter((threat) => threat.country !== 'Internal'),
    [threats]
  )
  const markerLocations = useMemo(
    () => visibleLocations.filter((location) => location.country !== 'Unknown'),
    [visibleLocations]
  )

  const effectiveWindowLabel = useMemo(() => {
    if (!windowStart || !windowEnd) {
      return timeFilter
    }
    const start = new Date(windowStart)
    const end = new Date(windowEnd)
    return `${start.toLocaleString()} - ${end.toLocaleString()}`
  }, [windowStart, windowEnd, timeFilter])

  const mostActiveLocation = visibleLocations[0]
  const selectedThreats = visibleThreats.filter((threat) => threat.country === selectedMarker)

  useEffect(() => {
    if (selectedMarker === 'Internal') {
      setSelectedMarker(null)
      return
    }

    if (selectedMarker && !visibleLocations.some((location) => location.country === selectedMarker)) {
      setSelectedMarker(null)
    }
  }, [selectedMarker, visibleLocations])

  const severityCounts = visibleThreats.reduce(
    (acc, threat) => {
      const key = (threat.severity || 'MEDIUM').toLowerCase()
      if (Object.prototype.hasOwnProperty.call(acc, key)) {
        acc[key] += 1
      }
      return acc
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  )

  const mapMarkers = useMemo(
    () =>
      markerLocations.map((location) => ({
        ...location,
        coordinates: [location.lng || 0, location.lat || 0],
      })),
    [markerLocations]
  )

  const handlePresetFilter = (nextFilter) => {
    setTimeFilter(nextFilter)
    setCustomWindow(null)
    setShowCustomWindow(false)
  }

  const applyCustomWindow = () => {
    if (!customStartTime || !customEndTime) {
      return
    }
    setTimeFilter('custom')
    setCustomWindow({
      startTime: new Date(customStartTime).toISOString(),
      endTime: new Date(customEndTime).toISOString(),
    })
    setShowCustomWindow(false)
  }

  const resetCustomWindow = () => {
    setCustomStartTime('')
    setCustomEndTime('')
    setCustomWindow(null)
    setTimeFilter('7d')
    setShowCustomWindow(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-primary">Threat Map</h1>
        <p className="text-brown-secondary text-sm mt-1">
          Geographic origin of threats ({threadScope === 'all' ? 'all threads' : 'single thread'})
        </p>
        <p className="text-brown-secondary text-xs mt-1">
          Active window: {effectiveWindowLabel}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-DEFAULT rounded-full animate-spin mb-3"></div>
            <p className="text-brown-secondary">Loading threat map data...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="text-sm font-semibold">Error loading threat map</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3"
          >
            <div className="flex gap-2 flex-wrap">
              {['1h', '6h', '24h', '7d'].map((time) => (
                <button
                  key={time}
                  onClick={() => handlePresetFilter(time)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeFilter === time && !customWindow
                      ? 'bg-orange-DEFAULT text-white'
                      : 'bg-white border border-border text-brown-primary hover:bg-beige'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="w-full lg:w-[26rem]">
              <button
                type="button"
                onClick={() => setShowCustomWindow((value) => !value)}
                className={`w-full lg:w-auto px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  showCustomWindow || customWindow
                    ? 'bg-orange-50 border-orange-300 text-orange-700'
                    : 'bg-white border-border text-brown-primary hover:bg-beige'
                }`}
              >
                Custom Window
              </button>

              {customWindow && (
                <span className="ml-2 inline-block text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                  Custom window enabled
                </span>
              )}

              {showCustomWindow && (
                <div className="mt-2 p-3 bg-white border border-border rounded-lg shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="text-xs text-brown-primary">
                      Start
                      <input
                        type="datetime-local"
                        value={customStartTime}
                        onChange={(event) => setCustomStartTime(event.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-brown-primary"
                      />
                    </label>
                    <label className="text-xs text-brown-primary">
                      End
                      <input
                        type="datetime-local"
                        value={customEndTime}
                        onChange={(event) => setCustomEndTime(event.target.value)}
                        className="mt-1 w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs text-brown-primary"
                      />
                    </label>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={applyCustomWindow}
                      disabled={!customStartTime || !customEndTime}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-orange-DEFAULT text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={resetCustomWindow}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-border text-brown-primary hover:bg-beige"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-0 overflow-hidden rounded-card mb-6 h-[42rem] lg:h-[54rem] relative border border-slate-800/70 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />

            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 170 }}
              className="absolute inset-0 h-full w-full"
              style={{ width: '100%', height: '100%' }}
            >
              <Sphere stroke="#334155" strokeWidth={0.7} fill="#0f172a" />
              <Graticule stroke="rgba(148,163,184,0.16)" strokeWidth={0.4} />

              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1f2937"
                      stroke="#cbd5e1"
                      strokeWidth={0.35}
                      style={{
                        default: { outline: 'none', filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' },
                        hover: { outline: 'none', fill: '#243041' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {mapMarkers.map((loc, markerIndex) => {
                const isSelected = selectedMarker === loc.country
                const markerSize = Math.min(30, 12 + loc.count * 2)

                return (
                  <Marker key={loc.country} coordinates={loc.coordinates}>
                    <g onClick={() => setSelectedMarker(isSelected ? null : loc.country)} style={{ cursor: 'pointer' }}>
                      <circle r={Math.max(8, markerSize / 2 + 6)} fill="rgba(248,113,113,0.10)" />
                      <circle r={Math.max(6, markerSize / 2)} fill={isSelected ? '#7f1d1d' : '#ef4444'} stroke="#fff" strokeWidth={2.2} />
                      <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={800}>{markerIndex + 1}</text>
                    </g>
                  </Marker>
                )
              })}
            </ComposableMap>

            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/25 pointer-events-none" />

            <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3 pointer-events-none">
              <div className="max-w-[28rem] rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 backdrop-blur-md shadow-lg shadow-slate-950/30">
                <p className="text-slate-50 text-base font-semibold tracking-tight">World Threat Map</p>
                <p className="text-slate-300 text-sm mt-0.5">MongoDB events in {timeFilter === 'custom' ? 'custom calendar' : timeFilter} window</p>
                <p className="text-slate-400 text-xs mt-1">Unknown origins are listed below and not pinned on the map.</p>
              </div>

              {selectedMarker && (
                <div className="rounded-2xl border border-red-400/20 bg-red-950/80 px-4 py-3 backdrop-blur-md shadow-lg shadow-red-950/25 text-right">
                  <p className="text-red-100 text-xs uppercase tracking-[0.16em]">Selected Origin</p>
                  <p className="text-white text-lg font-semibold leading-tight">{selectedMarker}</p>
                </div>
              )}
            </div>

            {mapMarkers.length > 0 && (
              <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 backdrop-blur-md text-xs text-slate-300 pointer-events-none">
                Click a marker to inspect related events
              </div>
            )}

            {!locations.length && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md shadow-lg">
                  <p className="text-slate-200 text-sm">No geolocated threats for this filter.</p>
                </div>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <p className="text-brown-secondary text-xs mb-1">Source Countries</p>
              <p className="text-3xl font-bold text-orange-DEFAULT">{visibleLocations.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card"
            >
              <p className="text-brown-secondary text-xs mb-1">Total Flagged IPs</p>
              <p className="text-3xl font-bold text-orange-DEFAULT">{visibleThreats.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card col-span-2"
            >
              <p className="text-brown-secondary text-xs mb-1">Most Active Origin + Severity Mix</p>
              <p className="text-lg font-bold text-orange-DEFAULT mb-2">
                {mostActiveLocation ? `${mostActiveLocation.country} (${mostActiveLocation.count})` : 'N/A'}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-red-50 text-red-700">Critical: {severityCounts.critical}</span>
                <span className="px-2 py-1 rounded bg-orange-50 text-orange-700">High: {severityCounts.high}</span>
                <span className="px-2 py-1 rounded bg-amber-50 text-amber-700">Medium: {severityCounts.medium}</span>
                <span className="px-2 py-1 rounded bg-teal-50 text-teal-700">Low: {severityCounts.low}</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h3 className="font-semibold text-brown-primary mb-4">Threat Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleLocations.map((location) => (
                <motion.div
                  key={location.country}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedMarker(selectedMarker === location.country ? null : location.country)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-brown-primary text-lg">{location.country}</h4>
                      <p className="text-sm text-brown-secondary">Detected threats</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700">
                      {(location.lat ?? 0).toFixed(1)}, {(location.lng ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-brown-primary">
                    <span className="font-semibold text-orange-DEFAULT">{location.count}</span> threats
                  </p>

                  {selectedMarker === location.country && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <p className="text-xs text-brown-secondary mb-3 font-semibold">Related Events:</p>
                      {visibleThreats
                        .filter((threat) => threat.country === location.country)
                        .slice(0, 2)
                        .map((threat) => (
                          <div
                            key={threat._id}
                            className="text-xs text-brown-primary mb-2 p-2 bg-beige rounded"
                          >
                            <p className="font-semibold">{threat.log_type} - {threat.source_ip}</p>
                            <p className="text-brown-secondary mt-1">{threat.description}</p>
                          </div>
                        ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {selectedMarker && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card mt-6"
              >
                <h4 className="font-semibold text-brown-primary mb-3">Events from {selectedMarker}</h4>
                <div className="space-y-3">
                  {selectedThreats.length === 0 && (
                    <p className="text-sm text-brown-secondary">No events available for the selected marker.</p>
                  )}
                  {selectedThreats.map((threat) => (
                    <div key={threat._id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-brown-primary">{threat.log_type}</p>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{threat.severity}</span>
                      </div>
                      <p className="text-xs text-brown-secondary mt-1">{threat.source_ip}</p>
                      <p className="text-sm text-brown-primary mt-2">{threat.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
