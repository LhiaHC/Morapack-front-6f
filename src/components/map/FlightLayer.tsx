import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { parseAirports, parseFlightDefs, parseCancellations, parseOrders } from '../../sim/parsers'
import { allocateOrdersToFlights, buildSchedule, positionAt } from '../../sim/engine'
import { useSimulation } from '../../sim/SimContext'
import type { 
  Airport,
  FlightId,
  FlightMarkerState,
  ScheduledFlight
} from '../../sim/types'

interface FlightLayerProps {
  map: L.Map
}

// Icono personalizado para vuelos
const PLANE_ICON = L.icon({
  iconUrl: '/images/plane.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
})

// Estado del marcador y sus metadatos
type FlightMarker = {
  marker: L.Marker
  lastActive: boolean
  lastUpdate: number
  state: FlightMarkerState
}

// Colores para diferentes estados de carga
const LOAD_COLORS = {
  LOW: '#4CAF50',      // Verde: < 70%
  MEDIUM: '#FF9800',   // Naranja: 70-90%
  HIGH: '#F44336',     // Rojo: > 90%
  UNKNOWN: '#9E9E9E'   // Gris: sin datos
}

// Calcular el ángulo de rotación para el ícono del avión
function calculateRotation(from: Airport, to: Airport): number {
  const dLng = to.lng - from.lng
  const dLat = to.lat - from.lat
  return (Math.atan2(dLng, dLat) * 180) / Math.PI
}

export default function FlightLayer({ map }: FlightLayerProps) {
  const { simTime, config } = useSimulation()
  const layerRef = useRef<L.LayerGroup | null>(null)
  const markersRef = useRef<Record<FlightId, FlightMarker>>({})
  const scheduleRef = useRef<ScheduledFlight[]>([])
  const airportsRef = useRef<Record<string, Airport>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataState, setDataState] = useState<{
    airports: Record<string, Airport>,
    schedule: ScheduledFlight[],
  } | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    let mounted = true
    const group = L.layerGroup()
    layerRef.current = group
    group.addTo(map)
    
    async function loadData() {
      try {
        // Carga y procesa los datos
        const [airports, flights, cancels, orders] = await Promise.all([
          parseAirports('/data/aeropuertos.txt'),
          parseFlightDefs('/data/vuelos.txt'),
          parseCancellations('/data/cancelaciones.txt'),
          parseOrders('/data/pedidos.txt'),
        ]).catch(err => {
          throw new Error(`Failed to load data files: ${err.message}`)
        })

        if (!mounted) return

        // Programa vuelos por 7 días y aplica cancelaciones
        const sched = buildSchedule(config.startDateISO, config.days, flights, airports, cancels)
        
        // Asigna pedidos respetando capacidades
        allocateOrdersToFlights(orders, sched, airports)

        if (mounted) {
          setDataState({ airports, schedule: sched })
          setLoading(false)
        }

        if (mounted) setLoading(false)
      } catch (err) {
        console.error('Failed to load flight data:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load flight data')
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
      if (layerRef.current) {
        layerRef.current.remove()
      }
      // Limpia todos los markers
      Object.values(markersRef.current).forEach(m => m.marker.remove())
      markersRef.current = {}
    }
  }, [map, config.startDateISO, config.days])

  // Actualizar posiciones de vuelos según el tiempo de simulación
  useEffect(() => {
    if (loading || !layerRef.current) return

    const markers = markersRef.current
    const airports = airportsRef.current
    const sched = scheduleRef.current

    // Actualiza o crea markers activos
    for (const f of sched) {
      const pos = positionAt(f, simTime, airports)
      const flightMarker = markers[f.id]

      // Estado del marcador
      const state: FlightMarkerState = {
        id: f.id,
        position: { lat: pos.lat, lng: pos.lng },
        active: pos.active,
        progress: pos.active ? 
          (simTime.getTime() - f.dep.getTime()) / (f.arr.getTime() - f.dep.getTime()) : 
          undefined,
        loadFactor: pos.loadFactor
      }

      // Color basado en factor de carga
      const loadColor = pos.loadFactor ?
        pos.loadFactor > 0.9 ? LOAD_COLORS.HIGH :
        pos.loadFactor > 0.7 ? LOAD_COLORS.MEDIUM :
        LOAD_COLORS.LOW :
        LOAD_COLORS.UNKNOWN

      // Limpia markers inactivos después de 5 segundos
      if (!pos.active && flightMarker?.lastActive) {
        const now = Date.now()
        if (now - flightMarker.lastUpdate > 5000) {
          flightMarker.marker.remove()
          delete markers[f.id]
          continue
        }
      }

      if (!pos.active && !flightMarker) continue

      // Crea o actualiza el marker
      if (!flightMarker) {
        const marker = L.marker([pos.lat, pos.lng], {
          icon: PLANE_ICON,
          title: f.id
        })

        // Calcular rotación del avión
        const fromAirport = airports[f.from]
        const toAirport = airports[f.to]
        const rotation = calculateRotation(fromAirport, toAirport)
        
        marker.getElement()?.style.setProperty('transform', `rotate(${rotation}deg)`)
        
        const tooltipContent = `
          <strong>${f.id}</strong><br/>
          ${f.from} → ${f.to}<br/>
          <span style="color: ${loadColor}">
            ${pos.loadFactor ? 
              `Load: ${Math.round(pos.loadFactor * 100)}%` : 
              'No load data'}
          </span>
        `
        marker.bindTooltip(tooltipContent, { permanent: false })
        marker.addTo(layerRef.current)

        markers[f.id] = {
          marker,
          lastActive: pos.active,
          lastUpdate: Date.now(),
          state
        }
      } else {
        flightMarker.marker.setLatLng(L.latLng(pos.lat, pos.lng))
        flightMarker.lastActive = pos.active
        flightMarker.lastUpdate = Date.now()
        flightMarker.state = state

        // Actualiza el tooltip con la información actual
        const tooltipContent = `
          <strong>${f.id}</strong><br/>
          ${f.from} → ${f.to}<br/>
          <span style="color: ${loadColor}">
            ${pos.loadFactor ? 
              `Load: ${Math.round(pos.loadFactor * 100)}%` : 
              'No load data'}
          </span>
          ${pos.active ? 
            `<br/>Progress: ${Math.round(state.progress! * 100)}%` : 
            ''}
        `
        flightMarker.marker.setTooltipContent(tooltipContent)
      }
    }
  }, [simTime, loading])

  if (loading) {
    return (
      <div className="absolute bottom-4 right-4 bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded z-[1000]" role="alert">
        Loading flight data...
      </div>
    )
  }

  if (error) {
    return (
      <div className="absolute bottom-4 right-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded z-[1000]" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    )
  }

  return null // La capa se maneja a través de los refs
}


