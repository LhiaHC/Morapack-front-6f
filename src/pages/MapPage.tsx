import { useEffect, useState, useCallback } from 'react'
import MapView from "../components/map/MapView"
import SimControls from '../components/sim/SimControls'
import OrderPanel from '../components/OrderPanel'
import { SimProvider, useSimulation } from '../sim/SimContext'
import {
  loadAirports,
  loadInstances,
  loadAssignmentsSplit,
  loadTimeline
} from '../sim/staticSource'
import type {
  AirportICAO,
  FlightInstance,
  AssignmentByOrder,
  TimelineEvent
} from '../types'

function MapPageContent() {
  const [airports, setAirports] = useState<AirportICAO[]>([])
  const [instances, setInstances] = useState<FlightInstance[]>([])
  const [assignments, setAssignments] = useState<AssignmentByOrder[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { setMinTime, setMaxTime, setSimTime } = useSimulation()

  // Función para cargar/refrescar datos desde la API
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 MapPage: Cargando datos desde API...')

      const [airportsData, instancesData, assignmentsData, timelineData] = await Promise.all([
        loadAirports(),
        loadInstances(),
        loadAssignmentsSplit(),
        loadTimeline()
      ])

      console.log('📍 MapPage: Aeropuertos cargados:', airportsData.length)
      console.log('✈️ MapPage: Instancias cargadas:', instancesData.length)

      setAirports(airportsData)
      setInstances(instancesData)
      setAssignments(assignmentsData)
      setTimeline(timelineData)

      // Calcular rango de tiempo desde las instancias
      if (instancesData.length > 0) {
        const times = instancesData.flatMap(i => [
          new Date(i.depUtc).getTime(),
          new Date(i.arrUtc).getTime()
        ])
        const min = new Date(Math.min(...times))
        const max = new Date(Math.max(...times))

        setMinTime(min)
        setMaxTime(max)
        setSimTime(min)
      }

      setLoading(false)
    } catch (err) {
      console.error('❌ MapPage: Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load simulation data')
      setLoading(false)
    }
  }, [setMinTime, setMaxTime, setSimTime])

  // Cargar datos al montar (intentará API primero, fallback a JSON)
  useEffect(() => {
    loadData()
  }, [loadData])

  // Listener para refrescar SOLO cuando la carga completa termine
  useEffect(() => {
    const handleUploadComplete = () => {
      console.log('🎉 MapPage: Carga completa detectada, refrescando mapa...')
      loadData()
    }

    window.addEventListener('upload-complete', handleUploadComplete)

    return () => {
      window.removeEventListener('upload-complete', handleUploadComplete)
    }
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg mb-2">🔄 Cargando datos desde API backend...</div>
          <div className="text-sm text-gray-500">Conectando con http://localhost:8080</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-2">❌ Error: {error}</div>
          <button
            onClick={loadData}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      <MapView
        airports={airports}
        instances={instances}
        assignments={assignments}
        timeline={timeline}
        selectedOrderId={selectedOrderId}
      />
      <OrderPanel
        assignments={assignments}
        instances={instances}
        timeline={timeline}
        onOrderSelect={setSelectedOrderId}
        selectedOrderId={selectedOrderId}
      />
      <SimControls />

      {/* Botón de refresco */}
      <button
        onClick={loadData}
        disabled={loading}
        className="absolute top-20 right-4 z-[1000] bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Refrescar datos desde el backend"
      >
        <span className={loading ? 'animate-spin' : ''}>🔄</span>
        {loading ? 'Cargando...' : 'Refrescar Mapa'}
      </button>

      {/* Indicador de aeropuertos */}
      {airports.length > 0 ? (
        <div className="absolute top-20 left-4 z-[1000] bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="text-sm font-medium">
            📍 {airports.length} aeropuertos
            {airports.filter(a => a.infiniteSource).length > 0 && (
              <span className="ml-2 text-orange-600">
                ⭐ {airports.filter(a => a.infiniteSource).length} HUBs
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="absolute top-20 left-4 z-[1000] bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg shadow-lg border border-yellow-200">
          <div className="text-sm font-medium mb-1">⚠️ No hay aeropuertos cargados</div>
          <div className="text-xs">
            Use el botón "Cargar data" para subir archivos al backend
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <SimProvider>
      <MapPageContent />
    </SimProvider>
  )
}
