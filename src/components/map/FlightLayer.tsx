import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useSimulation } from '../../sim/SimContext'
import type { 
  AirportICAO,
  FlightInstance,
  AssignmentByOrder,
  TimelineEvent
} from '../../types'

interface FlightLayerProps {
  map: L.Map
  airports: AirportICAO[]
  instances: FlightInstance[]
  assignments: AssignmentByOrder[]
  timeline: TimelineEvent[]
}

// Icono personalizado para vuelos
const PLANE_ICON = L.divIcon({
  className: 'plane-marker',
  html: '<div style="font-size: 24px;">✈</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Iconos para aeropuertos
const AIRPORT_ICON = L.divIcon({
  className: 'airport-marker',
  html: `<div style="
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const INFINITE_SOURCE_ICON = L.divIcon({
  className: 'infinite-airport-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 3px 6px rgba(0,0,0,0.4), 0 0 0 4px rgba(245, 158, 11, 0.2);
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Estado del marcador
type FlightMarker = {
  marker: L.Marker
  instanceId: string
}

// Colores para diferentes estados de carga
const LOAD_COLORS = {
  LOW: '#4CAF50',      // Verde: < 70%
  MEDIUM: '#FF9800',   // Naranja: 70-90%
  HIGH: '#F44336',     // Rojo: > 90%
  UNKNOWN: '#9E9E9E'   // Gris: sin datos
}

// Utilidades
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

function calculateRotation(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  const dLng = toLon - fromLon
  const dLat = toLat - fromLat
  return (Math.atan2(dLng, dLat) * 180) / Math.PI
}

export default function FlightLayer({ map, airports, instances, assignments }: FlightLayerProps) {
  const { simTime } = useSimulation()
  const layerRef = useRef<L.LayerGroup | null>(null)
  const markersRef = useRef<Record<string, FlightMarker>>({})
  const airportMarkersRef = useRef<L.Marker[]>([])
  const selectedRouteRef = useRef<L.Polyline | null>(null)
  const selectedInstanceRef = useRef<string | null>(null)

  // Crear mapa de aeropuertos por ICAO
  const airportMap = useRef<Record<string, AirportICAO>>({})
  useEffect(() => {
    airportMap.current = airports.reduce((acc, airport) => {
      acc[airport.icao] = airport
      return acc
    }, {} as Record<string, AirportICAO>)
  }, [airports])

  // Calcular carga por instancia desde assignments
  const loadByInstance = useRef<Record<string, number>>({})
  useEffect(() => {
    const loads: Record<string, number> = {}
    
    assignments.forEach(orderAssignment => {
      orderAssignment.splits.forEach(split => {
        split.legs.forEach(leg => {
          if (!loads[leg.instanceId]) {
            loads[leg.instanceId] = 0
          }
          loads[leg.instanceId] += leg.qty
        })
      })
    })
    
    loadByInstance.current = loads
  }, [assignments])

  // Inicializar capa y pintar aeropuertos + rutas
  useEffect(() => {
    const group = L.layerGroup()
    layerRef.current = group
    group.addTo(map)

    // Pintar aeropuertos
    airports.forEach(airport => {
      // Usar icono especial para aeropuertos con infiniteSource
      const icon = airport.infiniteSource ? INFINITE_SOURCE_ICON : AIRPORT_ICON
      
      const marker = L.marker([airport.lat, airport.lon], {
        icon: icon,
        title: airport.icao
      })
      
      const sourceLabel = airport.infiniteSource 
        ? '<span style="color: #f59e0b; font-weight: bold;">⭐ FUENTE INFINITA</span><br/>' 
        : ''
      
      const tooltipContent = `
        ${sourceLabel}
        <strong>${airport.icao}</strong> ${airport.iata ? `(${airport.iata})` : ''}<br/>
        ${airport.name}<br/>
        ${airport.city ? `${airport.city}, ` : ''}${airport.country || ''}<br/>
        <small>Capacidad: ${airport.warehouseCapacity || 'N/A'}</small>
      `
      marker.bindTooltip(tooltipContent)
      marker.addTo(group)
      airportMarkersRef.current.push(marker)
    })

    return () => {
      if (layerRef.current) {
        layerRef.current.remove()
      }
      Object.values(markersRef.current).forEach(m => m.marker.remove())
      markersRef.current = {}
      airportMarkersRef.current = []
      if (selectedRouteRef.current) {
        selectedRouteRef.current.remove()
        selectedRouteRef.current = null
      }
    }
  }, [map, airports, instances])

  // Actualizar posiciones de aviones según tiempo de simulación
  useEffect(() => {
    if (!layerRef.current) return

    const now = simTime.getTime()
    const markers = markersRef.current

    // Actualizar o crear markers para cada instancia en vuelo
    instances.forEach(instance => {
      const depTime = new Date(instance.depUtc).getTime()
      const arrTime = new Date(instance.arrUtc).getTime()
      
      // Verificar si el vuelo está activo
      const isActive = now >= depTime && now <= arrTime
      
      if (!isActive) {
        // Remover marker si existe
        if (markers[instance.instanceId]) {
          markers[instance.instanceId].marker.remove()
          delete markers[instance.instanceId]
        }
        
        // Si este vuelo tenía la ruta seleccionada, removerla
        if (selectedInstanceRef.current === instance.instanceId && selectedRouteRef.current) {
          selectedRouteRef.current.remove()
          selectedRouteRef.current = null
          selectedInstanceRef.current = null
        }
        
        return
      }

      // Calcular posición interpolada
      const originAirport = airportMap.current[instance.origin]
      const destAirport = airportMap.current[instance.dest]
      
      if (!originAirport || !destAirport) return

      const progress = clamp((now - depTime) / (arrTime - depTime), 0, 1)
      const lat = lerp(originAirport.lat, destAirport.lat, progress)
      const lon = lerp(originAirport.lon, destAirport.lon, progress)

      // Calcular carga y factor de carga
      const loaded = loadByInstance.current[instance.instanceId] || 0
      const loadFactor = loaded / instance.capacity
      
      const loadColor = loadFactor > 0.9 ? LOAD_COLORS.HIGH :
                        loadFactor > 0.7 ? LOAD_COLORS.MEDIUM :
                        loadFactor > 0 ? LOAD_COLORS.LOW :
                        LOAD_COLORS.UNKNOWN

      // Crear o actualizar marker
      if (!markers[instance.instanceId]) {
        const marker = L.marker([lat, lon], {
          icon: PLANE_ICON,
          title: instance.instanceId
        })

        const rotation = calculateRotation(
          originAirport.lat, originAirport.lon,
          destAirport.lat, destAirport.lon
        )
        
        const element = marker.getElement()
        if (element) {
          element.style.transform = `rotate(${rotation}deg)`
        }

        const tooltipContent = `
          <strong>${instance.flightId || instance.instanceId}</strong><br/>
          ${instance.origin} → ${instance.dest}<br/>
          <span style="color: ${loadColor}">
            Carga: ${loaded} / ${instance.capacity} (${Math.round(loadFactor * 100)}%)
          </span><br/>
          Progreso: ${Math.round(progress * 100)}%<br/>
          <small style="color: #6b7280;">Clic para mostrar ruta</small>
        `
        marker.bindTooltip(tooltipContent, { permanent: false })
        
        // Agregar evento de clic para mostrar/ocultar ruta
        marker.on('click', () => {
          // Si hay una ruta seleccionada y es la misma, ocultarla
          if (selectedInstanceRef.current === instance.instanceId && selectedRouteRef.current) {
            selectedRouteRef.current.remove()
            selectedRouteRef.current = null
            selectedInstanceRef.current = null
            return
          }
          
          // Remover ruta anterior si existe
          if (selectedRouteRef.current) {
            selectedRouteRef.current.remove()
          }
          
          // Crear nueva ruta para esta instancia
          const polyline = L.polyline([
            [originAirport.lat, originAirport.lon],
            [destAirport.lat, destAirport.lon]
          ], {
            color: '#8b5cf6',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 5'
          })
          
          polyline.bindTooltip(`
            <strong>Ruta: ${instance.origin} → ${instance.dest}</strong><br/>
            Vuelo: ${instance.flightId || instance.instanceId}
          `)
          
          if (layerRef.current) {
            polyline.addTo(layerRef.current)
          }
          
          selectedRouteRef.current = polyline
          selectedInstanceRef.current = instance.instanceId
        })
        
        if (layerRef.current) {
          marker.addTo(layerRef.current)
        }

        markers[instance.instanceId] = {
          marker,
          instanceId: instance.instanceId
        }
      } else {
        // Actualizar posición existente
        const flightMarker = markers[instance.instanceId]
        flightMarker.marker.setLatLng(L.latLng(lat, lon))

        const tooltipContent = `
          <strong>${instance.flightId || instance.instanceId}</strong><br/>
          ${instance.origin} → ${instance.dest}<br/>
          <span style="color: ${loadColor}">
            Carga: ${loaded} / ${instance.capacity} (${Math.round(loadFactor * 100)}%)
          </span><br/>
          Progreso: ${Math.round(progress * 100)}%
        `
        flightMarker.marker.setTooltipContent(tooltipContent)
      }
    })
  }, [simTime, instances])

  return null // La capa se maneja a través de los refs
}
